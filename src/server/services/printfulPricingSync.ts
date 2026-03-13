import { prisma } from "~/server/db";
import { printfulRequest } from "~/server/printful/client";
import { SHIPPING_COUNTRY_OPTIONS } from "~/config/shippingCountries";
import {
  normalizePricingSizeKey,
  type PricedProductType,
} from "~/server/services/productPricingSizeKeys";

type SyncProductType = PricedProductType;

type RawVariant = {
  id?: number;
  variant_id?: number;
  name?: string;
  size?: string;
  color?: string;
  price?: string;
};

const SYNC_COUNTRIES = SHIPPING_COUNTRY_OPTIONS.map((country) => country.code);

const SHIPPING_RECIPIENT_BY_COUNTRY: Record<
  string,
  { name: string; address1: string; city: string; zip: string; stateCode?: string }
> = {
  US: {
    name: "Pricing Sync",
    address1: "100 Main St",
    city: "Los Angeles",
    zip: "90001",
    stateCode: "CA",
  },
  GB: {
    name: "Pricing Sync",
    address1: "221B Baker Street",
    city: "London",
    zip: "SW1A1AA",
  },
  CA: {
    name: "Pricing Sync",
    address1: "100 King Street W",
    city: "Toronto",
    zip: "M5V2T6",
    stateCode: "ON",
  },
  AU: {
    name: "Pricing Sync",
    address1: "200 George Street",
    city: "Sydney",
    zip: "2000",
    stateCode: "NSW",
  },
  NZ: {
    name: "Pricing Sync",
    address1: "1 Queen Street",
    city: "Auckland",
    zip: "1010",
  },
};

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

function getRecipientSeed(countryCode: string) {
  const recipientSeed = SHIPPING_RECIPIENT_BY_COUNTRY[countryCode];
  if (!recipientSeed) {
    throw new Error(`Missing shipping recipient seed for ${countryCode}`);
  }

  return recipientSeed;
}

type PrintfulCostEstimateResponse = {
  result?: {
    costs?: {
      subtotal?: string | number;
      shipping?: string | number;
    };
    retail_costs?: {
      subtotal?: string | number;
      shipping?: string | number;
    };
  };
};

function parseAmount(value?: string | number): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Number(value.toFixed(2)) : null;
  }

  if (typeof value === "string") {
    return parsePrice(value);
  }

  return null;
}

async function fetchShippingCostByVariant(
  variantId: number,
  countryCode: string
): Promise<number> {
  const recipientSeed = getRecipientSeed(countryCode);

  const shipping = await printfulRequest<{
    result: Array<{ rate: string }>;
  }>("/shipping/rates", "POST", {
    recipient: {
      country_code: countryCode,
      city: recipientSeed.city,
      zip: recipientSeed.zip,
      state_code: recipientSeed.stateCode,
    },
    items: [
      {
        variant_id: variantId,
        quantity: 1,
      },
    ],
  });

  const firstRate = shipping.result?.[0]?.rate;
  const parsed = firstRate ? Number.parseFloat(firstRate) : Number.NaN;
  if (!Number.isFinite(parsed)) {
    throw new Error(`Missing shipping rate for variant ${variantId} in ${countryCode}`);
  }
  return Number(parsed.toFixed(2));
}

async function fetchVariantPricingByCountry(
  variantId: number,
  countryCode: string,
  fallbackBaseCost: number,
): Promise<{ baseCost: number; shippingCost: number }> {
  const recipientSeed = getRecipientSeed(countryCode);

  try {
    const estimate = await printfulRequest<PrintfulCostEstimateResponse>(
      "/orders/estimate-costs",
      "POST",
      {
        recipient: {
          name: recipientSeed.name,
          address1: recipientSeed.address1,
          country_code: countryCode,
          city: recipientSeed.city,
          zip: recipientSeed.zip,
          state_code: recipientSeed.stateCode,
        },
        items: [
          {
            variant_id: variantId,
            quantity: 1,
          },
        ],
      },
    );

    const estimatedBaseCost =
      parseAmount(estimate.result?.costs?.subtotal) ??
      parseAmount(estimate.result?.retail_costs?.subtotal);
    const estimatedShippingCost =
      parseAmount(estimate.result?.costs?.shipping) ??
      parseAmount(estimate.result?.retail_costs?.shipping);

    if (estimatedBaseCost !== null && estimatedShippingCost !== null) {
      return {
        baseCost: estimatedBaseCost,
        shippingCost: estimatedShippingCost,
      };
    }

    console.warn(
      `[PRICING_SYNC] Missing estimate fields for variant ${variantId} in ${countryCode}; falling back to product price + shipping rates`,
    );
  } catch (error) {
    console.warn(
      `[PRICING_SYNC] Estimate failed for variant ${variantId} in ${countryCode}; falling back to product price + shipping rates`,
      error,
    );
  }

  return {
    baseCost: fallbackBaseCost,
    shippingCost: await fetchShippingCostByVariant(variantId, countryCode),
  };
}

export async function runPricingSync() {
  for (const { productType, printfulProductId } of PRODUCT_SYNC_CONFIG) {
    const variants = await fetchProductVariants(printfulProductId);
    const bySize = new Map<string, { fallbackBaseCost: number; variantId: number }>();

    for (const variant of variants) {
      const sizeKey = normalizePricingSizeKey(productType, variant);
      if (!sizeKey || bySize.has(sizeKey)) continue;

      const baseCost = parsePrice(variant.price);
      const variantId = Number(variant.variant_id ?? variant.id);
      if (!Number.isFinite(variantId) || baseCost === null) continue;

      bySize.set(sizeKey, {
        fallbackBaseCost: Number(baseCost.toFixed(2)),
        variantId,
      });
    }

    if (bySize.size === 0) {
      throw new Error(`No normalized variants found for ${productType}`);
    }

    for (const countryCode of SYNC_COUNTRIES) {
      const syncedSizeKeys = new Set<string>();

      for (const [sizeKey, record] of bySize.entries()) {
        try {
          const pricing = await fetchVariantPricingByCountry(
            record.variantId,
            countryCode,
            record.fallbackBaseCost,
          );
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
              baseCost: pricing.baseCost,
              shippingCost: pricing.shippingCost,
              lastSyncedAt: new Date(),
            },
            update: {
              baseCost: pricing.baseCost,
              shippingCost: pricing.shippingCost,
              lastSyncedAt: new Date(),
            },
          });
          syncedSizeKeys.add(sizeKey);
        } catch (error) {
          console.warn(
            `[PRICING_SYNC] Variant ${record.variantId} unavailable for ${productType}/${sizeKey} in ${countryCode}`,
            error,
          );
        }
      }

      await prisma.productPricingCache.deleteMany({
        where: {
          productType,
          countryCode,
          ...(syncedSizeKeys.size > 0
            ? { sizeKey: { notIn: Array.from(syncedSizeKeys) } }
            : {}),
        },
      });

      if (syncedSizeKeys.size === 0) {
        console.error(
          `[PRICING_SYNC] No shippable variants found for ${productType} in ${countryCode}`,
        );
      }
    }
  }
}
