import { prisma } from "~/server/db";
import { printfulRequest } from "~/server/printful/client";

type SyncProductType = "mug" | "tshirt" | "poster";

type RawVariant = {
  id?: number;
  variant_id?: number;
  name?: string;
  size?: string;
  color?: string;
  price?: string;
};

const SYNC_COUNTRIES = ["US"] as const;

const PRODUCT_SYNC_CONFIG: Array<{ productType: SyncProductType; printfulProductId: number }> = [
  { productType: "mug", printfulProductId: 19 },
  { productType: "tshirt", printfulProductId: 71 },
  { productType: "poster", printfulProductId: 1 },
];

function parsePrice(value?: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePosterSize(value?: string): string | null {
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

function normalizeMugSize(value?: string): string | null {
  if (!value) return null;
  const match = value.match(/(11|15|20)\s*oz/i);
  return match ? `${match[1]} oz` : null;
}

function normalizeTshirtSize(value?: string): string | null {
  if (!value) return null;
  return value.trim().toUpperCase();
}

function normalizeSizeKey(productType: SyncProductType, variant: RawVariant): string | null {
  const composite = `${variant.size ?? ""} ${variant.name ?? ""}`.trim();

  if (productType === "mug") {
    return normalizeMugSize(composite);
  }
  if (productType === "tshirt") {
    return normalizeTshirtSize(variant.size);
  }
  return normalizePosterSize(variant.size) ?? normalizePosterSize(variant.name);
}

async function fetchProductVariants(printfulProductId: number): Promise<RawVariant[]> {
  const data = await printfulRequest<{
    result: {
      variants?: RawVariant[];
      sync_variants?: RawVariant[];
    };
  }>(`/products/${printfulProductId}`);

  const source =
    Array.isArray(data.result.sync_variants) && data.result.sync_variants.length > 0
      ? data.result.sync_variants
      : Array.isArray(data.result.variants)
      ? data.result.variants
      : [];

  return source;
}

async function fetchShippingCostByProductType(
  representativeVariantId: number,
  countryCode: string
): Promise<number> {
  const shipping = await printfulRequest<{
    result: Array<{ rate: string }>;
  }>("/shipping/rates", "POST", {
    recipient: {
      country_code: countryCode,
      city: "Los Angeles",
      zip: "90001",
      state_code: countryCode === "US" ? "CA" : undefined,
    },
    items: [
      {
        variant_id: representativeVariantId,
        quantity: 1,
      },
    ],
  });

  const firstRate = shipping.result?.[0]?.rate;
  const parsed = firstRate ? Number.parseFloat(firstRate) : Number.NaN;
  if (!Number.isFinite(parsed)) {
    throw new Error(`Missing shipping rate for variant ${representativeVariantId} in ${countryCode}`);
  }
  return Number(parsed.toFixed(2));
}

export async function runPricingSync() {
  for (const { productType, printfulProductId } of PRODUCT_SYNC_CONFIG) {
    const variants = await fetchProductVariants(printfulProductId);
    const bySize = new Map<string, { baseCost: number; variantId: number }>();

    for (const variant of variants) {
      const sizeKey = normalizeSizeKey(productType, variant);
      if (!sizeKey || bySize.has(sizeKey)) continue;

      const baseCost = parsePrice(variant.price);
      const variantId = Number(variant.variant_id ?? variant.id);
      if (!Number.isFinite(variantId) || baseCost === null) continue;

      bySize.set(sizeKey, { baseCost: Number(baseCost.toFixed(2)), variantId });
    }

    if (bySize.size === 0) {
      throw new Error(`No normalized variants found for ${productType}`);
    }

    for (const countryCode of SYNC_COUNTRIES) {
      const firstVariant = Array.from(bySize.values())[0];
      if (!firstVariant) {
        throw new Error(`No representative variant found for ${productType}`);
      }

      const shippingCost = await fetchShippingCostByProductType(firstVariant.variantId, countryCode);

      for (const [sizeKey, record] of bySize.entries()) {
        await prisma.productPricingCache.upsert({
          where: {
            productType_sizeKey_countryCode: {
              productType,
              sizeKey,
              countryCode,
            },
          },
          create: {
            productType,
            sizeKey,
            countryCode,
            baseCost: record.baseCost,
            shippingCost,
            lastSyncedAt: new Date(),
          },
          update: {
            baseCost: record.baseCost,
            shippingCost,
            lastSyncedAt: new Date(),
          },
        });
      }
    }
  }
}
