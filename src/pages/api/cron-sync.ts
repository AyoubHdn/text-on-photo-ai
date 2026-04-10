// pages/api/cron-sync.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { processDueDeliveredEmailSchedules } from "~/server/mautic/deliveryScheduler";
import { syncAllContactsToMautic } from "~/server/mautic/syncContacts";
import { isAuthorizedCronRequest } from "~/server/cron/authorizeCron";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorizedCronRequest(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const deliveredResult = await processDueDeliveredEmailSchedules();
    const mauticSyncEnabled = req.query.mautic_sync === "1";
    const limitRaw = Array.isArray(req.query.mautic_limit)
      ? req.query.mautic_limit[0]
      : req.query.mautic_limit;
    const cursorRaw = Array.isArray(req.query.mautic_cursor)
      ? req.query.mautic_cursor[0]
      : req.query.mautic_cursor;
    const limit = limitRaw ? Number(limitRaw) : 100;

    const result = mauticSyncEnabled
      ? await syncAllContactsToMautic({
          limit: Number.isFinite(limit) ? limit : 100,
          cursor: cursorRaw ?? null,
        })
      : null;

    return res.status(200).json({
      pricingSync: {
        skipped: true,
        reason: "Pricing sync runs in dedicated cron shards.",
      },
      deliveredEmails: deliveredResult,
      mauticSync: result ?? {
        skipped: true,
        reason: "Pass mautic_sync=1 to run contact sync in paginated mode",
      },
    });
  } catch (error) {
    console.error("Error syncing contacts via cron:", error);
    return res.status(500).json({ error: "Failed to sync contacts" });
  }
}
