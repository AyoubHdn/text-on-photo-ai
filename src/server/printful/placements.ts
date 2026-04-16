export type PrintfulPlacement =
  | "default"
  | "front"
  | "front_large";

export const PRODUCT_PLACEMENT = {
  poster: "default",
  framedPoster: "default",
  canvas: "default",
  postcard: "default",
  candle: "front",
  journal: "front",
  mug: "default",
  mugBlackGlossy: "default",
  mugColorInside: "default",
  coaster: "default",
  tshirt: "front_large",
} as const;
