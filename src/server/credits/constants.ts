// src/server/credits/constants.ts
export const CREDIT_COSTS = {
  NAME_ART_GENERATION: 1,
  PRODUCT_PREVIEW: 0.1,
  BACKGROUND_REMOVAL: 1,
} as const;

export const PRODUCT_MARGINS = {
  poster: 12,   // $12 margin
  tshirt: 12,   // $12 margin
  mug: 12,       // $12 margin
} as const;
