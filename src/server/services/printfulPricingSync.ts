import { prisma } from "~/server/db";
import { printfulRequest, printfulRequestV2 } from "~/server/printful/client";
import { SHIPPING_COUNTRY_OPTIONS } from "~/config/shippingCountries";
import {
  normalizePricingSizeKey,
  type PricedProductType,
} from "~/server/services/productPricingSizeKeys";
import { SELLING_REGION_BY_COUNTRY } from "~/server/printful/catalogVariants";

type SyncProductType = PricedProductType;

type RawVariant = {
  id?: number;
  variant_id?: number;
  name?: string;
  size?: string;
  color?: string;
  color_code?: string;
  retail_price?: string;
  price?: string;
  availability_status?: Array<{
    region?: string;
    status?: string;
  }>;
};

type NormalizedSyncVariant = {
  variantId: number;
  sizeKey: string;
  color?: string;
  fallbackBaseCost: number;
};

type CachedPricingRow = {
  baseCost: number;
  shippingCost: number;
};

type ProductAvailabilityResponse = {
  data?: Array<{
    catalog_variant_id?: number;
    techniques?: Array<{
      selling_regions?: Array<{
        name?: string;
        availability?: string;
      }>;
    }>;
  }>;
  paging?: {
    next?: string | null;
  };
};

const PRODUCT_TECHNIQUE_BY_TYPE: Record<SyncProductType, string> = {
  tshirt: "dtg",
  mug: "sublimation",
  poster: "digital",
};

const LEGACY_AVAILABILITY_REGION_BY_COUNTRY: Record<string, string> = {
  US: "US",
  CA: "CA",
  GB: "UK",
  AU: "AU",
  NZ: "AU",
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

function isPrintfulRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("429") || message.includes("rate limit");
}

function isSellableAvailability(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return false;
  return !["out of stock", "out_of_stock", "not available", "unavailable"].includes(
    normalized,
  );
}

async function fetchAvailableVariantIdsForCountry(
  productType: SyncProductType,
  printfulProductId: number,
  sellingRegionName: string,
): Promise<Set<number>> {
  const availableVariantIds = new Set<number>();
  const normalizedRequestedRegion = sellingRegionName.trim().toLowerCase();
  const params = new URLSearchParams({
    selling_region_name: sellingRegionName,
    limit: "100",
    techniques: PRODUCT_TECHNIQUE_BY_TYPE[productType],
  });
  let nextPath = `/catalog-products/${printfulProductId}/availability?${params.toString()}`;

  while (nextPath) {
    const response = await printfulRequestV2<ProductAvailabilityResponse>(nextPath);

    for (const item of response.data ?? []) {
      const variantId = Number(item.catalog_variant_id);
      if (!Number.isFinite(variantId)) continue;

      const hasSellableTechnique = (item.techniques ?? []).some((technique) =>
        (technique.selling_regions ?? []).some(
          (region) =>
            region.name?.trim().toLowerCase() === normalizedRequestedRegion &&
            isSellableAvailability(region.availability),
        ),
      );

      if (hasSellableTechnique) {
        availableVariantIds.add(variantId);
      }
    }

    const nextHref = response.paging?.next?.trim();
    if (!nextHref) {
      nextPath = "";
      continue;
    }

    try {
      const nextUrl = new URL(nextHref);
      nextPath = `${nextUrl.pathname}${nextUrl.search}`.replace(/^\/v2/, "");
    } catch {
      nextPath = nextHref.replace(/^https:\/\/api\.printful\.com\/v2/, "");
    }
  }

  return availableVariantIds;
}

function getAvailableVariantIdsFromLegacyAvailability(
  variants: RawVariant[],
  countryCode: string,
): Set<number> | null {
  const availabilityRegion = LEGACY_AVAILABILITY_REGION_BY_COUNTRY[countryCode];
  if (!availabilityRegion) {
    return null;
  }

  const hasLegacyAvailability = variants.some(
    (variant) =>
      Array.isArray(variant.availability_status) &&
      variant.availability_status.length > 0,
  );
  if (!hasLegacyAvailability) {
    return null;
  }

  const availableVariantIds = new Set<number>();

  for (const variant of variants) {
    const variantId = Number(variant.variant_id ?? variant.id);
    if (!Number.isFinite(variantId)) continue;

    const isAvailableForCountry = (variant.availability_status ?? []).some(
      (entry) =>
        entry.region?.trim().toUpperCase() === availabilityRegion &&
        isSellableAvailability(entry.status),
    );

    if (isAvailableForCountry) {
      availableVariantIds.add(variantId);
    }
  }

  return availableVariantIds;
}

async function fetchLegacyProductVariants(printfulProductId: number): Promise<RawVariant[]> {
  const data = await printfulRequest<{
    result: {
      variants?: RawVariant[];
      sync_variants?: RawVariant[];
    };
  }>(`/products/${printfulProductId}`);

  return Array.isArray(data.result.variants) && data.result.variants.length > 0
    ? data.result.variants
    : Array.isArray(data.result.sync_variants)
      ? data.result.sync_variants
      : [];
}

async function fetchProductVariants(
  productType: SyncProductType,
  printfulProductId: number,
): Promise<RawVariant[]> {
  const source = await fetchLegacyProductVariants(printfulProductId);
  return source.map((variant) => ({
    id: variant.variant_id ?? variant.id,
    name: variant.name,
    size: variant.size ?? undefined,
    color: variant.color ?? undefined,
    color_code: variant.color_code ?? undefined,
    retail_price: variant.retail_price ?? undefined,
    price: variant.price ?? undefined,
    availability_status: variant.availability_status,
  }));
}

function getConfiguredVariantIds(productType: SyncProductType): Set<number> | null {
  if (productType !== "tshirt") {
    return null;
  }

  // T-shirt colors/sizes have country-specific availability. Restricting the
  // sync to a tiny static subset causes valid color variants to disappear when
  // the UI relies on cached availability.
  return null;
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
    const configuredVariantIds = getConfiguredVariantIds(productType);
    const variants = (await fetchProductVariants(productType, printfulProductId)).filter((variant) => {
      if (!configuredVariantIds) return true;
      const variantId = Number(variant.id);
      return Number.isFinite(variantId) && configuredVariantIds.has(variantId);
    });
    const normalizedVariants: NormalizedSyncVariant[] = [];

    for (const variant of variants) {
      const sizeKey = normalizePricingSizeKey(productType, variant);
      if (!sizeKey) continue;

      const baseCost = parsePrice(variant.retail_price ?? variant.price);
      const variantId = Number(variant.id);
      if (!Number.isFinite(variantId) || baseCost === null) continue;

      normalizedVariants.push({
        variantId,
        sizeKey,
        color: variant.color?.trim() || undefined,
        fallbackBaseCost: Number(baseCost.toFixed(2)),
      });
    }

    if (normalizedVariants.length === 0) {
      throw new Error(`No normalized variants found for ${productType}`);
    }

    for (const countryCode of SYNC_COUNTRIES) {
      const legacyAvailableVariantIds = getAvailableVariantIdsFromLegacyAvailability(
        variants,
        countryCode,
      );
      const sellableRegion = SELLING_REGION_BY_COUNTRY[countryCode];
      const availableVariantIds =
        legacyAvailableVariantIds ??
        (sellableRegion
          ? await fetchAvailableVariantIdsForCountry(
              productType,
              printfulProductId,
              sellableRegion,
            )
          : new Set<number>());
      const existingPricingRows = await prisma.productPricingCache.findMany({
        where: {
          productType,
          countryCode,
        },
        select: {
          sizeKey: true,
          baseCost: true,
          shippingCost: true,
        },
      });
      const existingPricingBySize = new Map<string, CachedPricingRow>(
        existingPricingRows.map((row) => [
          row.sizeKey,
          {
            baseCost: Number(row.baseCost),
            shippingCost: Number(row.shippingCost),
          },
        ]),
      );
      const syncedSizeKeys = new Set<string>();
      const syncedVariantIds = new Set<number>();
      const bestPricingBySize = new Map<string, { baseCost: number; shippingCost: number }>();
      const tshirtPricingCandidates = new Map<string, NormalizedSyncVariant>();
      let hadRateLimitError = false;

      for (const record of normalizedVariants) {
        if (!availableVariantIds.has(record.variantId)) {
          continue;
        }

        if (productType === "tshirt") {
          await prisma.productVariantAvailabilityCache.upsert({
            where: {
              productType_variantId_countryCode: {
                productType,
                variantId: record.variantId,
                countryCode,
              },
            },
            create: {
              productType,
              variantId: record.variantId,
              sizeKey: record.sizeKey,
              color: record.color,
              countryCode,
              lastSyncedAt: new Date(),
            },
            update: {
              sizeKey: record.sizeKey,
              color: record.color,
              lastSyncedAt: new Date(),
            },
          });
          syncedVariantIds.add(record.variantId);

          const currentCandidate = tshirtPricingCandidates.get(record.sizeKey);
          if (
            !currentCandidate ||
            record.fallbackBaseCost > currentCandidate.fallbackBaseCost
          ) {
            tshirtPricingCandidates.set(record.sizeKey, record);
          }
          continue;
        }

        try {
          const pricing = await fetchVariantPricingByCountry(
            record.variantId,
            countryCode,
            record.fallbackBaseCost,
          );
          await prisma.productVariantAvailabilityCache.upsert({
            where: {
              productType_variantId_countryCode: {
                productType,
                variantId: record.variantId,
                countryCode,
              },
            },
            create: {
              productType,
              variantId: record.variantId,
              sizeKey: record.sizeKey,
              color: record.color,
              countryCode,
              lastSyncedAt: new Date(),
            },
            update: {
              sizeKey: record.sizeKey,
              color: record.color,
              lastSyncedAt: new Date(),
            },
          });
          syncedVariantIds.add(record.variantId);

          const nextSupplierSubtotal = pricing.baseCost + pricing.shippingCost;
          const currentBest = bestPricingBySize.get(record.sizeKey);
          const currentSupplierSubtotal = currentBest
            ? currentBest.baseCost + currentBest.shippingCost
            : Number.NEGATIVE_INFINITY;

          if (!currentBest || nextSupplierSubtotal > currentSupplierSubtotal) {
            bestPricingBySize.set(record.sizeKey, pricing);
          }
        } catch (error) {
          console.warn(
            `[PRICING_SYNC] Variant ${record.variantId} unavailable for ${productType}/${record.sizeKey} in ${countryCode}`,
            error,
          );
        }
      }

      if (productType === "tshirt") {
        for (const [sizeKey, record] of tshirtPricingCandidates.entries()) {
          try {
            const pricing = await fetchVariantPricingByCountry(
              record.variantId,
              countryCode,
              record.fallbackBaseCost,
            );
            bestPricingBySize.set(sizeKey, pricing);
            syncedSizeKeys.add(sizeKey);
          } catch (error) {
            if (isPrintfulRateLimitError(error)) {
              hadRateLimitError = true;
              const existingPricing = existingPricingBySize.get(sizeKey);
              if (existingPricing) {
                bestPricingBySize.set(sizeKey, existingPricing);
                syncedSizeKeys.add(sizeKey);
              }
              console.warn(
                `[PRICING_SYNC] Rate limited while refreshing ${productType}/${sizeKey} in ${countryCode}; preserving cached pricing`,
                error,
              );
              continue;
            }

            console.warn(
              `[PRICING_SYNC] Failed pricing representative variant ${record.variantId} for ${productType}/${sizeKey} in ${countryCode}`,
              error,
            );
          }
        }
      }

      for (const [sizeKey, pricing] of bestPricingBySize.entries()) {
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
      }

      await prisma.productVariantAvailabilityCache.deleteMany({
        where: {
          productType,
          countryCode,
          ...(syncedVariantIds.size > 0
            ? { variantId: { notIn: Array.from(syncedVariantIds) } }
            : {}),
        },
      });

      if (!hadRateLimitError) {
        await prisma.productPricingCache.deleteMany({
          where: {
            productType,
            countryCode,
            ...(syncedSizeKeys.size > 0
              ? { sizeKey: { notIn: Array.from(syncedSizeKeys) } }
              : {}),
          },
        });
      }

      if (hadRateLimitError) {
        console.warn(
          `[PRICING_SYNC] Printful rate limit hit for ${productType} in ${countryCode}; preserved existing pricing rows where possible`,
        );
      }

      if (syncedSizeKeys.size === 0) {
        console.error(
          `[PRICING_SYNC] No shippable variants found for ${productType} in ${countryCode}`,
        );
      }
    }
  }
}
