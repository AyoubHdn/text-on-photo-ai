import { prisma } from "~/server/db";
import { PRODUCT_MARGINS } from "~/server/credits/constants";

const SAFETY_BUFFER = 1;

export type ProductType = keyof typeof PRODUCT_MARGINS;

export async function calculateProductPriceFromCache({
  productType,
  sizeKey,
  countryCode,
}: {
  productType: ProductType;
  sizeKey: string;
  countryCode: string;
}) {
  const normalizedCountry = countryCode.trim().toUpperCase();
  const normalizedSizeKey = sizeKey.trim();

  const cached = await prisma.productPricingCache.findUnique({
    where: {
      productType_sizeKey_countryCode: {
        productType,
        sizeKey: normalizedSizeKey,
        countryCode: normalizedCountry,
      },
    },
  });

  if (!cached) {
    throw new Error("Pricing not available for this variant.");
  }

  const margin = PRODUCT_MARGINS[productType];
  const total =
    Number(cached.baseCost) +
    Number(cached.shippingCost) +
    margin +
    SAFETY_BUFFER;

  return {
    baseCost: Number(cached.baseCost),
    margin,
    shippingCost: Number(cached.shippingCost),
    currency: "USD",
    totalPrice: Number(total.toFixed(2)),
    shippingIncluded: true,
    shippingCountry: normalizedCountry,
  };
}
