import { isMugProductKey } from "~/config/physicalProducts";

export type PricedProductType =
  | "mug"
  | "mugBlackGlossy"
  | "mugColorInside"
  | "coaster"
  | "framedPoster"
  | "poster"
  | "tshirt";

export type RawPricingVariant = {
  name?: string;
  size?: string;
  color?: string;
};

export function normalizePosterSizeKey(value?: string): string | null {
  if (!value) return null;

  const normalized = value
    .replace(/\u2033/g, "")
    .replace(/"/g, "")
    .replace(/\u00d7/g, "x")
    .replace(/\s+/g, "")
    .trim();

  const match = normalized.match(/(\d+)x(\d+)/i);
  return match ? `${match[1]}x${match[2]}` : null;
}

export function normalizeMugSizeKey(value?: string): string | null {
  if (!value) return null;

  const match = value.match(/(11|15|20)\s*oz/i);
  return match ? `${match[1]} oz` : null;
}

export function normalizeTshirtSizeKey(value?: string): string | null {
  if (!value) return null;
  return value.trim().toUpperCase();
}

export function normalizeCoasterSizeKey(value?: string): string | null {
  if (!value) return null;

  const normalized = value
    .replace(/\u2033/g, "")
    .replace(/"/g, "")
    .replace(/\u00d7/g, "x")
    .replace(/×/g, "x")
    .replace(/\s+/g, "")
    .trim();

  const match = normalized.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/i);
  return match ? `${match[1]}x${match[2]}` : null;
}

export function normalizePricingSizeKey(
  productType: PricedProductType,
  variant: RawPricingVariant,
): string | null {
  const composite = `${variant.size ?? ""} ${variant.name ?? ""}`.trim();

  if (isMugProductKey(productType)) {
    return normalizeMugSizeKey(composite);
  }

  if (productType === "tshirt") {
    return normalizeTshirtSizeKey(variant.size);
  }

  if (productType === "coaster") {
    return normalizeCoasterSizeKey(variant.size) ?? normalizeCoasterSizeKey(variant.name);
  }

  return normalizePosterSizeKey(variant.size) ?? normalizePosterSizeKey(variant.name);
}
