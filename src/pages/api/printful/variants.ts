// src/pages/api/printful/variants.ts
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { NextApiRequest, NextApiResponse } from "next";
import { PRINTFUL_PRODUCTS } from "~/server/printful/products";
import { prisma } from "~/server/db";
import { normalizePricingSizeKey } from "~/server/services/productPricingSizeKeys";
import { printfulRequest } from "~/server/printful/client";

async function fetchLegacyProductVariants(printfulProductId: number) {
  const data = await printfulRequest<{
    result: {
      variants?: Array<{
        id?: number;
        variant_id?: number;
        name: string;
        color?: string;
        size?: string;
        color_code?: string;
        price?: string;
      }>;
      sync_variants?: Array<{
        id?: number;
        variant_id?: number;
        name: string;
        color?: string;
        size?: string;
        color_code?: string;
        price?: string;
      }>;
    };
  }>(`/products/${printfulProductId}`);

  return Array.isArray(data.result.variants) && data.result.variants.length > 0
    ? data.result.variants
    : Array.isArray(data.result.sync_variants)
      ? data.result.sync_variants
      : [];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { productKey, countryCode } = req.query;

  if (!productKey || typeof productKey !== "string") {
    return res.status(400).json({ error: "Missing productKey" });
  }

  const product = PRINTFUL_PRODUCTS.find(
    (p) => p.key === productKey
  );

  if (!product) {
    return res.status(400).json({ error: "Invalid productKey" });
  }

  try {
    const normalizedCountry =
      typeof countryCode === "string" && countryCode.trim().length > 0
        ? countryCode.trim().toUpperCase()
        : null;
    const sourceVariants = await fetchLegacyProductVariants(product.printfulProductId);

    let allowedVariantIds: Set<number> | null = null;
    let allowedSizeKeys: Set<string> | null = null;
    if (normalizedCountry) {
      const [cachedPricing, cachedAvailability] = await Promise.all([
        prisma.productPricingCache.findMany({
          where: {
            productType: productKey,
            countryCode: normalizedCountry,
          },
          select: {
            sizeKey: true,
          },
        }),
        prisma.productVariantAvailabilityCache.findMany({
          where: {
            productType: productKey,
            countryCode: normalizedCountry,
          },
          select: {
            variantId: true,
          },
        }),
      ]);

      allowedSizeKeys = new Set(cachedPricing.map((entry) => entry.sizeKey));
      allowedVariantIds = new Set(cachedAvailability.map((entry) => entry.variantId));
    }

    const variants = sourceVariants
      .map((v: any) => ({
        id: Number(v.variant_id ?? v.id),
        name: v.name,
        size: v.size,
        color: v.color,
        color_code: v.color_code,
        price: v.retail_price ?? v.price,
      }))
      .filter((variant: {
        id: number;
        name: string;
        size?: string;
        color?: string;
        color_code?: string;
        price?: string;
      }) => {
        if (allowedVariantIds && !allowedVariantIds.has(variant.id)) {
          return false;
        }

        if (allowedSizeKeys) {
          const sizeKey = normalizePricingSizeKey("tshirt", {
            name: variant.name,
            size: variant.size,
            color: variant.color,
          });
          if (productKey === "tshirt") {
            return sizeKey ? allowedSizeKeys.has(sizeKey) : false;
          }

          const normalizedSizeKey = normalizePricingSizeKey(product.key, {
            name: variant.name,
            size: variant.size,
            color: variant.color,
          });
          return normalizedSizeKey ? allowedSizeKeys.has(normalizedSizeKey) : false;
        }

        return true;
      });


    return res.status(200).json({ variants });
  } catch (error) {
    console.error("[PRINTFUL_VARIANTS_ERROR]", error);
    return res.status(500).json({ error: "Failed to fetch variants" });
  }
}
