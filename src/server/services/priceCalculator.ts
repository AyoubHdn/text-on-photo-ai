import { prisma } from "~/server/db";
import { PRODUCT_MARGINS } from "~/server/credits/constants";

const SAFETY_BUFFER_RATE = 0.2;

export type ProductType = keyof typeof PRODUCT_MARGINS;

export async function calculateProductPriceFromCache({
  productType,
  sizeKey,
  countryCode,
  quantity = 1,
}: {
  productType: ProductType;
  sizeKey: string;
  countryCode: string;
  quantity?: number;
}) {
  const normalizedCountry = countryCode.trim().toUpperCase();
  const normalizedSizeKey = sizeKey.trim();
  const normalizedQuantity = Number.isFinite(quantity)
    ? Math.max(1, Math.floor(quantity))
    : 1;

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
  const unitBaseCost = Number(cached.baseCost);
  const unitShippingCost = Number(cached.shippingCost);
  const unitSupplierSubtotal = unitBaseCost + unitShippingCost;
  const unitSafetyBuffer = unitSupplierSubtotal * SAFETY_BUFFER_RATE;
  const unitTotal = unitSupplierSubtotal + unitSafetyBuffer + margin;
  const baseCost = Number((unitBaseCost * normalizedQuantity).toFixed(2));
  const shippingCost = Number((unitShippingCost * normalizedQuantity).toFixed(2));
  const totalMargin = Number((margin * normalizedQuantity).toFixed(2));
  const total = Number((unitTotal * normalizedQuantity).toFixed(2));

  return {
    quantity: normalizedQuantity,
    unitBaseCost,
    unitShippingCost,
    unitMargin: margin,
    unitTotalPrice: Number(unitTotal.toFixed(2)),
    baseCost,
    margin: totalMargin,
    shippingCost,
    currency: "USD",
    totalPrice: total,
    shippingIncluded: true,
    shippingCountry: normalizedCountry,
  };
}
