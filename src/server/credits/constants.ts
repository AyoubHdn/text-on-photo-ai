// src/server/credits/constants.ts
export const CREDIT_COSTS = {
  NAME_ART_GENERATION: 1,
  PRODUCT_PREVIEW: 0,
  BACKGROUND_REMOVAL: 1,
} as const;

export const PRODUCT_MARGINS = {
  poster: 10,   // $10 margin
  framedPoster: 12, // $12 margin
  tshirt: 10,   // $10 margin
  mug: 8,       // $8 margin
  mugBlackGlossy: 8, // $8 margin
  mugColorInside: 8, // $8 margin
  coaster: 8, // $8 margin
} as const;
