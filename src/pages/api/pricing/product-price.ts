import type { NextApiRequest, NextApiResponse } from "next";
import {
  calculateProductPriceFromCache,
  type ProductType,
} from "~/server/services/priceCalculator";

type PriceResponse =
  | {
      totalPrice: number;
      shippingIncluded: true;
      shippingCountry: string;
      country: string;
    }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PriceResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { productType, variant, countryCode } = req.body as {
    productType?: ProductType;
    variant?: string;
    countryCode?: string;
  };

  if (!productType || !variant || !countryCode) {
    return res.status(400).json({ error: "Missing required pricing fields." });
  }

  try {
    const pricing = await calculateProductPriceFromCache({
      productType,
      sizeKey: variant,
      countryCode,
    });

    return res.status(200).json({
      totalPrice: pricing.totalPrice,
      shippingIncluded: true,
      shippingCountry: pricing.shippingCountry,
      country: pricing.shippingCountry,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pricing failed";
    if (message === "Pricing not available for this variant.") {
      return res.status(400).json({ error: "Shipping not available for this country" });
    }
    return res.status(400).json({ error: message });
  }
}
