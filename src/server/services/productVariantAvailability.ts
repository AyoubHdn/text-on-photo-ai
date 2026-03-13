import { prisma } from "~/server/db";
import type { ProductType } from "~/server/services/priceCalculator";

export async function isVariantAvailableInCountry({
  productType,
  variantId,
  countryCode,
}: {
  productType: ProductType;
  variantId: number;
  countryCode: string;
}) {
  const normalizedCountryCode = countryCode.trim().toUpperCase();

  const cached = await prisma.productVariantAvailabilityCache.findUnique({
    where: {
      productType_variantId_countryCode: {
        productType,
        variantId,
        countryCode: normalizedCountryCode,
      },
    },
    select: { id: true },
  });

  return Boolean(cached);
}

export async function assertVariantAvailableInCountry(input: {
  productType: ProductType;
  variantId: number;
  countryCode: string;
}) {
  const available = await isVariantAvailableInCountry(input);
  if (!available) {
    throw new Error("This product variant is not available in this country.");
  }
}
