import type { NextApiRequest, NextApiResponse } from "next";
import { isAuthorizedCronRequest } from "~/server/cron/authorizeCron";
import {
  PRICING_SYNC_SHARDS,
  isPricingSyncShard,
} from "~/server/cron/pricingShards";
import { runPricingSync } from "~/server/services/printfulPricingSync";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAuthorizedCronRequest(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const shardParam = Array.isArray(req.query.shard) ? req.query.shard[0] : req.query.shard;
  if (!shardParam || !isPricingSyncShard(shardParam)) {
    return res.status(400).json({ error: "Invalid pricing shard" });
  }

  const productTypes = [...PRICING_SYNC_SHARDS[shardParam]];

  try {
    await runPricingSync({ productTypes });

    return res.status(200).json({
      pricingSync: {
        ok: true,
        shard: shardParam,
        productTypes,
      },
    });
  } catch (error) {
    console.error(`[CRON_PRICING_SYNC:${shardParam}] Failed`, error);
    return res.status(500).json({
      error: "Failed to sync pricing shard",
      shard: shardParam,
      productTypes,
    });
  }
}
