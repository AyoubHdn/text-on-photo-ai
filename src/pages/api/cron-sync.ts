// pages/api/cron-sync.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env.mjs";
import { processDueDeliveredEmailSchedules } from "~/server/mautic/deliveryScheduler";
import { runPricingSync } from "~/server/services/printfulPricingSync";
import { syncAllContactsToMautic } from "~/server/mautic/syncContacts";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check the Authorization header (Vercel will include CRON_SECRET as a Bearer token)
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await runPricingSync();
    const deliveredResult = await processDueDeliveredEmailSchedules();
    const result = await syncAllContactsToMautic();
    return res.status(200).json({
      pricingSync: { ok: true },
      deliveredEmails: deliveredResult,
      mauticSync: result,
    });
  } catch (error) {
    console.error("Error syncing contacts via cron:", error);
    return res.status(500).json({ error: "Failed to sync contacts" });
  }
}
