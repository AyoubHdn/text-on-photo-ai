/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/server/api/routers/printfulCheckout.ts

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { env } from "~/env.mjs";
import { z } from "zod";
import { prisma } from "~/server/db";
import {
  calculateProductPriceFromCache,
  type ProductType,
} from "~/server/services/priceCalculator";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

function normalizePosterSize(value?: string | null): string | null {
  if (!value) return null;

  const normalized = value
    .replace(/\u2033/g, "")
    .replace(/"/g, "")
    .replace(/\u00d7/g, "x")
    .replace(/\s+/g, "")
    .trim();

  const match = normalized.match(/(\d+)x(\d+)/i);
  if (!match) return null;
  return `${match[1]}x${match[2]}`;
}

function resolvePricingVariant(order: {
  productKey: string;
  size: string | null;
  variantName: string | null;
}): string {
  if (order.productKey === "tshirt") {
    const size = order.size?.trim().toUpperCase();
    if (!size) throw new Error("Missing t-shirt size for pricing.");
    return size;
  }

  if (order.productKey === "poster") {
    const posterSize = normalizePosterSize(order.size) ?? normalizePosterSize(order.variantName);
    if (!posterSize) throw new Error("Missing poster size for pricing.");
    return posterSize;
  }

  if (order.productKey === "mug") {
    const source = `${order.size ?? ""} ${order.variantName ?? ""}`.trim();
    const match = source.match(/(11|15|20)\s*oz/i);
    if (!match) throw new Error("Missing mug size for pricing.");
    return `${match[1]} oz`;
  }

  throw new Error("Unsupported product for pricing.");
}

export const printfulCheckoutRouter = createTRPCRouter({
  createCheckout: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        submittedTotalPrice: z.number(),
        address: z
          .object({
            name: z.string(),
            address1: z.string(),
            country: z.string(),
            city: z.string(),
            zip: z.string(),
            state: z.string().optional(),
          })
          .refine(
            (address) =>
              address.country !== "US" ||
              (typeof address.state === "string" && address.state.length > 0),
            {
              message: "State is required for US addresses",
              path: ["state"],
            }
          ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const order = await prisma.productOrder.findUnique({
        where: { id: input.orderId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      const countryCode = input.address.country.trim().toUpperCase();
      const stateCode = input.address.state?.trim().toUpperCase();
      const rawZip = input.address.zip.trim();
      const zip =
        countryCode === "US"
          ? rawZip.replace(/\s+/g, "").split("-")[0] ?? ""
          : rawZip;

      if (countryCode === "US") {
        if (!/^\d{5}$/.test(zip)) {
          throw new Error("US ZIP must be 5 digits");
        }
        if (!stateCode || !/^[A-Z]{2}$/.test(stateCode)) {
          throw new Error("State must be a 2-letter code");
        }

        try {
          const zipRes = await fetch(`https://api.zippopotam.us/us/${zip}`);
          if (!zipRes.ok) {
            throw new Error("Invalid US ZIP code");
          }
          const zipData = (await zipRes.json()) as {
            places?: Array<{ "state abbreviation"?: string }>;
          };
          const zipState = zipData.places?.[0]?.["state abbreviation"];
          if (zipState && zipState !== stateCode) {
            throw new Error("Recipient: Shipping address state and ZIP code don't match.");
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "State/ZIP validation failed";
          throw new TRPCError({
            code: "BAD_REQUEST",
            message,
          });
        }
      }

      const pricingVariant = resolvePricingVariant(order);
      const productType = order.productKey as ProductType;
      if (!["poster", "tshirt", "mug"].includes(productType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unsupported product type for pricing.",
        });
      }

      let pricing;
      try {
        pricing = await calculateProductPriceFromCache({
          productType,
          sizeKey: pricingVariant,
          countryCode,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Pricing unavailable";
        if (message === "Pricing not available for this variant.") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Physical shipping is not available in this country yet.",
          });
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message,
        });
      }

      if (Math.abs(input.submittedTotalPrice - pricing.totalPrice) > 0.01) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Price mismatch. Please refresh and try again.",
        });
      }

      if (Math.abs((order.totalPrice ?? 0) - pricing.totalPrice) > 0.01) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Price mismatch. Please refresh and try again.",
        });
      }

      await prisma.productOrder.update({
        where: { id: order.id },
        data: {
          name: input.address.name,
          address1: input.address.address1,
          city: input.address.city,
          zip,
          country: countryCode,
          state: stateCode,
          shippingPrice: pricing.shippingCost,
          shippingCurrency: pricing.currency,
          totalPrice: pricing.totalPrice,
        },
      });

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        metadata: {
          type: "printful_order",
          orderId: order.id,
          userId: ctx.session.user.id,
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: Math.round(pricing.totalPrice * 100),
              product_data: {
                name: "Custom Printed Product",
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${env.HOST_NAME}/order/success?orderId=${order.id}`,
        cancel_url: `${env.HOST_NAME}/order/cancel?orderId=${order.id}`,
      });

      await prisma.productOrder.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });

      return { url: session.url };
    }),
});
