import { prisma } from "~/server/db";

const MARGIN_CONFIG = {
  mug: 5,
  tshirt: 7,
  poster: 6,
} as const;

const SAFETY_BUFFER = 1;

export type ProductType = keyof typeof MARGIN_CONFIG;

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

  const margin = MARGIN_CONFIG[productType] ?? 5;
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
