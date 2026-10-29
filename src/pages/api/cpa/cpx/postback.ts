// src/pages/api/cpa/cpx/postback.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { Prisma, type CpaResult } from "@prisma/client";
import { CPX_DAILY_REWARD_CREDITS } from "~/config/cpa";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { cpaProcessPostbackFromService } from "~/server/cloudflare/dbService";

const CPX_SECRET = env.CPX_SECURITY_HASH;
const shouldUseServiceCpa = () => process.env.DB_CPA_BACKEND === "service";

const getParam = (p: string | string[] | undefined) =>
  Array.isArray(p) ? p[0] : p;

function getUtcDayRange(date: Date) {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function mapCpxType(type: string | undefined, payout: number): CpaResult {
  if (type === "complete") return "complete";
  if (type === "out") return payout > 0 ? "screenout_bonus" : "screenout_no_bonus";
  return "screenout_no_bonus";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const status = getParam(req.query.status);
    const transId = getParam(req.query.trans_id);
    const userId = getParam(req.query.user_id);
    const amountUsd = getParam(req.query.amount_usd);
    const ipClick = getParam(req.query.ip_click);
    const type = getParam(req.query.type);
    const hash = getParam(req.query.hash);

    if (!transId || !userId || !hash) {
      return res.status(400).json({ error: "Missing params" });
    }

    const expectedHash = crypto
      .createHash("md5")
      .update(`${transId}-${CPX_SECRET}`)
      .digest("hex");

    if (hash !== expectedHash) {
      return res.status(403).json({ error: "Invalid hash" });
    }

    const payout = Number(amountUsd ?? 0);
    const result = mapCpxType(type, payout);
    const serviceResult = result === "reversed" ? "screenout_no_bonus" : result;
    const requestedApproved = status !== "2";
    const now = new Date();
    if (shouldUseServiceCpa()) {
      const outcome = await cpaProcessPostbackFromService({
        userId,
        transactionId: transId,
        payout,
        requestedApproved,
        result: serviceResult,
        leadIp: ipClick ?? null,
        now,
        rewardCredits: String(CPX_DAILY_REWARD_CREDITS),
      });
      if ("ok" in outcome) return res.status(500).json({ error: "Survey fulfillment unavailable" });
      return outcome.outcome === "NO_PENDING"
        ? res.status(200).json({ message: "No pending unlock" })
        : res.status(200).json({ success: true });
    }

    const unlock = await prisma.cpaUnlock.findFirst({
      where: { userId, network: "cpx", status: "pending" },
      orderBy: { createdAt: "desc" },
    });

    if (!unlock) {
      return res.status(200).json({ message: "No pending unlock" });
    }

    const requestedApprovedLegacy = status === "2" ? false : true;
    const { start, end } = getUtcDayRange(now);

    let finalStatus: "approved" | "rejected" = requestedApprovedLegacy
      ? "approved"
      : "rejected";
    let finalResult: CpaResult = result;

    if (requestedApproved && result !== "screenout_no_bonus") {
      const approvedToday = await prisma.cpaUnlock.findFirst({
        where: {
          userId,
          network: "cpx",
          status: "approved",
          approvedAt: {
            gte: start,
            lt: end,
          },
          id: { not: unlock.id },
        },
        select: { id: true },
      });

      if (approvedToday) {
        finalStatus = "rejected";
        finalResult = "reversed";
      }
    }

    await prisma.cpaUnlock.update({
      where: { id: unlock.id },
      data: {
        status: finalStatus,
        transactionId: transId,
        payout,
        currency: "USD",
        leadIp: ipClick,
        approvedAt: finalStatus === "approved" ? now : null,
        result: finalResult,
      },
    });

    if (finalStatus === "approved" && finalResult !== "screenout_no_bonus") {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });

      if (user) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            credits: new Prisma.Decimal(user.credits).plus(
              new Prisma.Decimal(CPX_DAILY_REWARD_CREDITS),
            ),
          },
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("CPX postback error", error);
    return res.status(500).json({ error: "Server error" });
  }
}

