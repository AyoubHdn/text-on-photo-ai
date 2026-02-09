// src/pages/api/printful/shipping.ts
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env.mjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { variantId, countryCode, stateCode, quantity } = req.body;

  if (!variantId || !countryCode) {
    return res.status(400).json({ error: "Missing params" });
  }

  try {
    const response = await fetch(
      "https://api.printful.com/shipping/rates",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.PRINTFUL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: {
            country_code: countryCode,
            ...(countryCode === "US" && {
                state_code: stateCode,
            }),
            },
          items: [
            {
              variant_id: variantId,
              quantity: 1,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("Shipping response:", data);

    if (!response.ok) {
      return res.status(400).json({ error: data });
    }

    // Take the cheapest available rate
    const rate = data.result[0];

    return res.json({
      price: Number(rate.rate),
      currency: rate.currency,
      minDays: rate.minDeliveryDays,
      maxDays: rate.maxDeliveryDays,
    });
  } catch (error) {
    return res.status(500).json({ error: "Shipping calculation failed" });
  }
}
