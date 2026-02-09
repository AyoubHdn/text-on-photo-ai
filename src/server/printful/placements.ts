export type PrintfulPlacement =
  | "default"
  | "front"
  | "front_large";

export const PRODUCT_PLACEMENT = {
  poster: "default",
  mug: "default",
  tshirt: "front_large",
} as const;
