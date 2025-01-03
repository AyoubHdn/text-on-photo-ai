import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import Stripe from "stripe";
import { env } from "~/env.mjs";
import { z } from "zod";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
});
const plans = {
  starter: env.PRICE_ID_STARTER,
  pro: env.PRICE_ID_PRO,
  elite: env.PRICE_ID_ELITE,
};

export const checkoutRouter = createTRPCRouter({
  createCheckout: protectedProcedure
  .input(
    z.object({
      plan: z.enum(["starter", "pro", "elite"]), // Accept only specific plan names
    })
  )
  .mutation(async ({ ctx, input }) => {
    const priceId = plans[input.plan];

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        metadata: {
          userId: ctx.session.user.id,
        },
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${env.HOST_NAME}/success`,
        cancel_url: `${env.HOST_NAME}/cancel`,
      });

      return session;
    } catch (error) {
      console.error("Stripe session creation error:", error);
      throw new Error("Failed to create Stripe session.");
    }
  }),
});
