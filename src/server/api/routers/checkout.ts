import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import Stripe from "stripe";
import { env } from "~/env.mjs";
import { z } from "zod";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
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
      returnPath: z.string().optional(),
      purchaseContext: z.enum(["generate", "preview", "remove_background"]).optional(),
      tracking: z
        .object({
          fbp: z.string().optional(),
          fbc: z.string().optional(),
        })
        .optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const priceId = plans[input.plan];
    const safeReturnPath =
      input.returnPath && input.returnPath.startsWith("/")
        ? input.returnPath
        : null;
    const hasQuery = safeReturnPath?.includes("?") ?? false;
    const successUrl = safeReturnPath
      ? `${env.HOST_NAME}${safeReturnPath}${hasQuery ? "&" : "?"}credits_success=1${input.purchaseContext ? `&credits_context=${input.purchaseContext}` : ""}`
      : `${env.HOST_NAME}/success`;
    const cancelUrl = safeReturnPath
      ? `${env.HOST_NAME}${safeReturnPath}`
      : `${env.HOST_NAME}/cancel`;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        locale: "auto",
        metadata: {
          userId: ctx.session.user.id,
          purchaseContext: input.purchaseContext ?? "generate",
          fbp: input.tracking?.fbp ?? "",
          fbc: input.tracking?.fbc ?? "",
        },
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return session;
    } catch (error) {
      console.error("Stripe session creation error:", error);
      throw new Error("Failed to create Stripe session.");
    }
  }),
});
