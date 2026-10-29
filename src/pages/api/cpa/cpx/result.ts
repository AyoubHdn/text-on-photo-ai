// /pages/api/cpa/cpx/result.ts
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { prisma } from "~/server/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { cpaGetResultFromService } from "~/server/cloudflare/dbService";

const shouldUseServiceCpa = () => process.env.DB_CPA_BACKEND === "service";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (shouldUseServiceCpa()) {
    return res.json(await cpaGetResultFromService({ userId: session.user.id }));
  }

  const unlock = await prisma.cpaUnlock.findFirst({
    where: {
      userId: session.user.id,
      network: "cpx",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!unlock) {
    return res.json({ status: "pending" });
  }

  if (unlock.status === "approved" && unlock.payout && unlock.payout > 0) {
    return res.json({
      status: "approved",
      payout: unlock.payout,
    });
  }

  if (unlock.status === "approved" && (!unlock.payout || unlock.payout === 0)) {
    return res.json({
      status: "screenout",
    });
  }

  if (unlock.status === "rejected") {
    return res.json({
      status: "rejected",
    });
  }

  return res.json({ status: "pending" });
}

