import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import Stripe from "stripe";
import { env } from "~/env.mjs";
import { z } from "zod";
import { prisma } from "~/server/db";
import { PRINTFUL_PRODUCTS } from "~/server/printful/products";
import { createMockupTask } from "~/server/printful/mockup";
import { pollMockupTask } from "~/server/printful/pollMockup";
import { convertWebpToPngAndUpload } from "~/server/image/convertWebpToPng";
import { generateTshirtPrintImage } from "~/server/printful/generateTshirtPrintImage";

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
    })
  )
  .mutation(async ({ ctx, input }) => {
    const priceId = plans[input.plan];
    const safeReturnPath =
      input.returnPath && input.returnPath.startsWith("/")
        ? input.returnPath
        : "/success";
    const hasQuery = safeReturnPath.includes("?");
    const successUrl =
      safeReturnPath === "/success"
        ? `${env.HOST_NAME}/success`
        : `${env.HOST_NAME}${safeReturnPath}${hasQuery ? "&" : "?"}credits_success=1${input.purchaseContext ? `&credits_context=${input.purchaseContext}` : ""}`;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        metadata: {
          userId: ctx.session.user.id,
          purchaseContext: input.purchaseContext ?? "generate",
        },
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: `${env.HOST_NAME}/cancel`,
      });

      return session;
    } catch (error) {
      console.error("Stripe session creation error:", error);
      throw new Error("Failed to create Stripe session.");
    }
  }),
  ensureFinalPreview: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const order = await prisma.productOrder.findFirst({
        where: {
          id: input.orderId,
          userId: ctx.session.user.id,
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      if (order.productKey !== "tshirt") {
        return {
          status: "ready" as const,
          mockupUrl: order.mockupUrl,
          previewVariantId: order.previewVariantId ?? null,
        };
      }

      if (!order.variantId || !order.size || !order.color) {
        return { status: "invalid" as const };
      }

      const snapshotMissing =
        !order.snapshotVariantId ||
        !order.snapshotSize ||
        !order.snapshotColor;
      const snapshotMismatch =
        order.snapshotVariantId !== order.variantId ||
        order.snapshotSize !== order.size ||
        order.snapshotColor !== order.color ||
        (order.snapshotBackgroundRemoved ?? false) !==
          (order.isBackgroundRemoved ?? false);

      if (
        !snapshotMissing &&
        !snapshotMismatch &&
        order.previewVariantId === order.snapshotVariantId &&
        order.mockupUrl
      ) {
        return {
          status: "ready" as const,
          mockupUrl: order.mockupUrl,
          previewVariantId: order.previewVariantId,
        };
      }

      const product = PRINTFUL_PRODUCTS.find((p) => p.key === "tshirt");
      if (!product) {
        throw new Error("Invalid product");
      }

      try {
        const imageRes = await fetch(order.imageUrl);
        if (!imageRes.ok) {
          throw new Error("Failed to fetch image for Printful");
        }

        const buffer = Buffer.from(await imageRes.arrayBuffer());
        const tshirtBuffer = await generateTshirtPrintImage({
          inputBuffer: buffer,
          printWidth: 3810,
          printHeight: 4572,
          aspect: (order.aspect ?? "1:1") as "1:1" | "4:5" | "3:2" | "16:9",
        });

        const printImageUrl = await convertWebpToPngAndUpload(
          tshirtBuffer,
          ctx.session.user.id
        );

        const task = await createMockupTask(
          product,
          printImageUrl,
          order.variantId,
          undefined
        );

        if (!task?.result?.task_key) {
          throw new Error("Printful did not return task_key");
        }

        const mockupUrl = await pollMockupTask(task.result.task_key);
        if (!mockupUrl) {
          throw new Error("Mockup not generated");
        }

        await prisma.productOrder.update({
          where: { id: order.id },
          data: {
            mockupUrl,
            previewVariantId: order.variantId,
            snapshotVariantId: order.variantId,
            snapshotSize: order.size,
            snapshotColor: order.color,
            snapshotBackgroundRemoved: order.isBackgroundRemoved ?? false,
          },
        });

        return {
          status: "ready" as const,
          mockupUrl,
          previewVariantId: order.variantId,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Preview error";
        const retryMatch = message.match(/after (\d+) seconds/);
        const retryAfter = retryMatch ? Number(retryMatch[1]) : null;
        const isRateLimit = message.toLowerCase().includes("rate limit");

        if (isRateLimit) {
          return {
            status: "rate_limit" as const,
            retryAfter,
          };
        }

        throw new Error(message);
      }
    }),
});
