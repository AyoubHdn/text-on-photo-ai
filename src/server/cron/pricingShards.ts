import type { PricedProductType } from "~/server/services/productPricingSizeKeys";

export const PRICING_SYNC_SHARDS = {
  "standard-mugs": ["mug", "mugBlackGlossy"],
  "color-mugs": ["mugColorInside"],
  "wall-art": ["poster", "framedPoster", "canvas"],
  apparel: ["tshirt"],
  misc: ["coaster", "journal"],
} as const satisfies Record<string, readonly PricedProductType[]>;

export type PricingSyncShard = keyof typeof PRICING_SYNC_SHARDS;

export function isPricingSyncShard(value: string): value is PricingSyncShard {
  return value in PRICING_SYNC_SHARDS;
}
