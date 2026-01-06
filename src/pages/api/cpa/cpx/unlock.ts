// src/pages/api/cpa/cpx/unlock.ts
export const config = {
  runtime: "nodejs",
};

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "~/server/auth";
import { prisma } from "~/server/db";
import crypto from "crypto";
import { env } from "~/env.mjs";

async function isVpnOrProxy(ip: string | null): Promise<boolean> {
  if (!ip) return false;

  try {
    const res = await fetch(
      `https://api.ipapi.is/?q=${ip}&key=${env.IPAPI_KEY}`,
      { method: "GET" }
    );

    const data = await res.json();
    console.log("IPAPI response:", data);
    return Boolean(
      data?.is_vpn === true ||
      data?.is_proxy === true ||
      data?.is_tor === true ||
      data?.is_datacenter === true ||
      data?.company?.type === "hosting"
    );

  } catch {
    // Fail-open (CPX prefers availability over false blocks)
    return false;
  }
  
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end("Method not allowed");
  }

  // 1️⃣ Require login
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 🔐 VPN / Proxy protection (CPX requirement)
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ??
    req.socket.remoteAddress ??
    null;

  const vpnDetected = await isVpnOrProxy(ip);

  if (vpnDetected) {
    return res.status(403).json({
      error:
        "Please disable VPN or proxy to access surveys. This helps ensure survey availability for your region.",
    });
  }


  const now = new Date();

  // 🔹 Expire old pending surveys (30 minutes TTL)
  const expireBefore = new Date(now.getTime() - 30 * 60 * 1000);

  await prisma.cpaUnlock.updateMany({
    where: {
      userId: session.user.id,
      network: "cpx",
      status: "pending",
      createdAt: { lt: expireBefore },
    },
    data: { status: "rejected", expiredAt: new Date() },
  });

  // 2️⃣ Check for still-valid pending survey
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

  // 3️⃣ Create unlock record
  const token = crypto.randomUUID();

  await prisma.cpaUnlock.create({
    data: {
      userId: session.user.id,
      token,
      network: "cpx",
      status: "pending",
    },
  });

  // 4️⃣ Build CPX redirect URL
  const redirectUrl =
    `https://offers.cpx-research.com/index.php` +
    `?app_id=${env.CPX_APP_ID}` +
    `&ext_user_id=${session.user.id}` +
    `&subid_1=namedesignai`;

  return res.status(200).json({ redirectUrl });
}
