// src/pages/api/cpa/cpx/postback.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { prisma } from "~/server/db";
import { env } from "~/env.mjs";

const CPX_SECRET = env.CPX_SECURITY_HASH;

const getParam = (p: string | string[] | undefined) =>
  Array.isArray(p) ? p[0] : p;

function mapCpxType(type: string | undefined, payout: number) {
  // Completed survey
  if (type === "complete") {
    return "complete";
  }

  // Screenout cases (CPX sends type=out)
  if (type === "out") {
    if (payout > 0) {
      return "screenout_bonus";
    }
    return "screenout_no_bonus";
  }

  // Fallback safety
  return "screenout_no_bonus";
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const status = getParam(req.query.status);
    const trans_id = getParam(req.query.trans_id);
    const user_id = getParam(req.query.user_id);
    const amount_usd = getParam(req.query.amount_usd);
    const ip_click = getParam(req.query.ip_click);
    const type = getParam(req.query.type);
    const hash = getParam(req.query.hash);

    if (!trans_id || !user_id || !hash) {
      return res.status(400).json({ error: "Missing params" });
    }

    const expectedHash = crypto
      .createHash("md5")
      .update(`${trans_id}-${CPX_SECRET}`)
      .digest("hex");

    if (hash !== expectedHash) {
      return res.status(403).json({ error: "Invalid hash" });
    }

    console.log("CPX hash:", hash);
    console.log("Expected:", expectedHash);

    const unlock = await prisma.cpaUnlock.findFirst({
      where: { userId: user_id, network: "cpx", status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    if (!unlock) {
      return res.status(200).json({ message: "No pending unlock" });
    }

    const payout = Number(amount_usd ?? 0);
    const result = mapCpxType(type, payout);

    const finalStatus = status === "2" ? "rejected" : "approved";

    await prisma.cpaUnlock.update({
      where: { id: unlock.id },
      data: {
        status: finalStatus,
        transactionId: trans_id,
        payout,
        currency: "USD",
        leadIp: ip_click,
        approvedAt: finalStatus === "approved" ? new Date() : null,
        result,
      },
    });

    if (finalStatus === "approved" && result !== "screenout_no_bonus") {
      await prisma.user.update({
        where: { id: user_id },
        data: { credits: { increment: 1 } },
      });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error("CPX postback error", e);
    return res.status(500).json({ error: "Server error" });
  }
}
