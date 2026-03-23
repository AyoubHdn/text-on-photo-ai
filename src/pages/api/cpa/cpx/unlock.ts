// src/pages/api/cpa/cpx/unlock.ts
export const config = {
  runtime: "nodejs",
};

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { getServerSession } from "next-auth/next";
import { env } from "~/env.mjs";
import { authOptions } from "~/server/auth";
import { prisma } from "~/server/db";

function getUtcDayRange(date: Date) {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

async function isVpnOrProxy(ip: string | null): Promise<boolean> {
  if (!ip) return false;

  try {
    const res = await fetch(
      `https://api.ipapi.is/?q=${ip}&key=${env.IPAPI_KEY}`,
      { method: "GET" },
    );

    const data = await res.json();
    return Boolean(
      data?.is_vpn === true ||
        data?.is_proxy === true ||
        data?.is_tor === true ||
        data?.is_datacenter === true ||
        data?.company?.type === "hosting",
    );
  } catch {
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).end("Method not allowed");
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ??
    req.socket.remoteAddress ??
    null;

  if (await isVpnOrProxy(ip)) {
    return res.status(403).json({
      error:
        "Please disable VPN or proxy to access surveys. This helps ensure survey availability for your region.",
    });
  }

  const now = new Date();
  const { start, end } = getUtcDayRange(now);

  const claimedToday = await prisma.cpaUnlock.findFirst({
    where: {
      userId: session.user.id,
      network: "cpx",
      status: "approved",
      approvedAt: {
        gte: start,
        lt: end,
      },
    },
    select: { id: true },
  });

  if (claimedToday) {
    return res.status(400).json({
      code: "DAILY_LIMIT",
      error: "You already claimed free credits today. Try again tomorrow or buy credits.",
    });
  }

  const expireBefore = new Date(now.getTime() - 30 * 60 * 1000);

  await prisma.cpaUnlock.updateMany({
    where: {
      userId: session.user.id,
      network: "cpx",
      status: "pending",
      createdAt: { lt: expireBefore },
    },
    data: { status: "rejected", expiredAt: now },
  });

  const pendingCutoff = new Date(now.getTime() - 30 * 60 * 1000);

  const existing = await prisma.cpaUnlock.findFirst({
    where: {
      userId: session.user.id,
      network: "cpx",
      status: "pending",
      createdAt: { gt: pendingCutoff },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const elapsedMs = now.getTime() - existing.createdAt.getTime();
    const remainingMs = Math.max(0, 30 * 60 * 1000 - elapsedMs);
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    return res.status(400).json({
      error: "You already have a pending survey",
      retryAfterMinutes: remainingMinutes,
    });
  }

  const token = crypto.randomUUID();

  await prisma.cpaUnlock.create({
    data: {
      userId: session.user.id,
      token,
      network: "cpx",
      status: "pending",
    },
  });

  const redirectUrl =
    `https://offers.cpx-research.com/index.php` +
    `?app_id=${env.CPX_APP_ID}` +
    `&ext_user_id=${session.user.id}` +
    `&subid_1=namedesignai`;

  return res.status(200).json({ redirectUrl });
}
