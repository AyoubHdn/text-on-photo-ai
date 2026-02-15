// src/server/credits/constants.ts
export const CREDIT_COSTS = {
  NAME_ART_GENERATION: 1,
  PRODUCT_PREVIEW: 0.1,
  BACKGROUND_REMOVAL: 1,
} as const;

export const PRODUCT_MARGINS = {
  poster: 6,   // $6 margin
  tshirt: 8,   // $8 margin
  mug: 7,       // $7 margin
} as const;
