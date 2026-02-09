// src/pages/api/printful/variants.ts
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { NextApiRequest, NextApiResponse } from "next";
import { PRINTFUL_PRODUCTS } from "~/server/printful/products";
import { printfulRequest } from "~/server/printful/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { productKey } = req.query;

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
    const data = await printfulRequest<{
      result: {
        variants: any;
        sync_variants: Array<{
          variant_id: number;
          name: string;
          color?: string;
          size?: string;
          color_code?: string;
          price?: string;
        }>;
      };
    }>(`/products/${product.printfulProductId}`);

    const sourceVariants =
      Array.isArray(data.result.sync_variants) && data.result.sync_variants.length
        ? data.result.sync_variants
        : data.result.variants;

    const variants = sourceVariants.map((v: any) => ({
        id: Number(v.variant_id ?? v.id),
        name: v.name,
        size: v.size,
        color: v.color,
        color_code: v.color_code,
        price: v.price,
        }));


    return res.status(200).json({ variants });
  } catch (error) {
    console.error("[PRINTFUL_VARIANTS_ERROR]", error);
    return res.status(500).json({ error: "Failed to fetch variants" });
  }
}
