import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env.mjs";
import {
  resendPhysicalOrderEmails,
  type ResendEmailMode,
} from "~/server/mautic/resendPhysicalOrderEmails";

function readQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseMode(value: string | undefined): ResendEmailMode {
  if (value === "shipped" || value === "delivered" || value === "both") {
    return value;
  }
  return "both";
}

function parseBooleanFlag(value: string | undefined) {
  return value === "1" || value === "true";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const mode = parseMode(readQueryValue(req.query.mode));
  const orderId = readQueryValue(req.query.orderId)?.trim() || null;
  const dryRun = parseBooleanFlag(readQueryValue(req.query.dry_run));
  const force = parseBooleanFlag(readQueryValue(req.query.force));
  const limitRaw = Number(readQueryValue(req.query.limit) ?? "20");
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(200, Math.floor(limitRaw)))
    : 20;

  try {
    const result = await resendPhysicalOrderEmails({
      mode,
      limit,
      orderId,
      dryRun,
      force,
    });

    return res.status(200).json({
      ok: true,
      dryRun,
      force,
      orderId,
      result,
    });
  } catch (error) {
    console.error("Failed to resend physical order emails", {
      mode,
      orderId,
      dryRun,
      force,
      error,
    });
    return res.status(500).json({ error: "Failed to resend physical order emails" });
  }
}

