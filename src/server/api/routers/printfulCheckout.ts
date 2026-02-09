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
import { printfulRequest } from "~/server/printful/client";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

type PrintfulShippingResponse = {
  result: {
    rate: string;
    currency: string;
    minDeliveryDays: number;
    maxDeliveryDays: number;
  }[];
};

export const printfulCheckoutRouter = createTRPCRouter({
  createCheckout: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
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
          ? rawZip.replace(/\s+/g, "").split("-")[0]
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

      // 1️⃣ Get shipping from Printful
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const shipping = await printfulRequest(
      "/shipping/rates",
      "POST",
      {
        recipient: {
          country_code: countryCode,
          city: input.address.city,
          zip,
          state_code:
            countryCode === "US" ? stateCode : undefined,
        },
        items: [
          {
            variant_id: order.variantId,
            quantity: 1,
          },
        ],
      }
    ) as PrintfulShippingResponse;

      if (!shipping?.result?.[0]?.rate) {
        throw new Error("Failed to calculate shipping");
      }

      const shippingPrice = Number(shipping.result[0].rate);

      // 2️⃣ Update order totals (SOURCE OF TRUTH)
      const totalPrice =
        order.basePrice + order.margin + shippingPrice;

      await prisma.productOrder.update({
        where: { id: order.id },
        data: {
          name: input.address.name,
          address1: input.address.address1,
          city: input.address.city,
          zip,
          country: countryCode,
          state: stateCode,
          shippingPrice,
          shippingCurrency: "USD",
          totalPrice,
        },
      });

      // 3️⃣ Create Stripe session
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
              unit_amount: Math.round(totalPrice * 100),
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
