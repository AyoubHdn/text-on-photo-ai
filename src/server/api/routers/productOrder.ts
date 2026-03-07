/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { z } from "zod";
import { prisma } from "~/server/db";
import { TRPCError } from "@trpc/server";
import { calculateProductPriceFromCache } from "~/server/services/priceCalculator";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";
import {
  createGuestOrderToken,
  verifyGuestOrderToken,
} from "~/server/guestOrderToken";

export const productOrderRouter = createTRPCRouter({
  createPendingOrder: publicProcedure
    .input(
      z.object({
        productKey: z.enum(["poster", "tshirt", "mug"]),
        variantId: z.number(),
        variantName: z.string().optional(),
        size: z.string().optional(),
        color: z.string().optional(),
        colorHex: z.string().optional(),
        aspect: z.string().optional(),
        previewMode: z.string().optional(),
        previewVariantId: z.number().optional(),
        isBackgroundRemoved: z.boolean().optional(),
        snapshotVariantId: z.number().optional(),
        snapshotSize: z.string().optional(),
        snapshotColor: z.string().optional(),
        snapshotPrintPosition: z.string().optional(),
        snapshotBackgroundRemoved: z.boolean().optional(),
        imageUrl: z.string(),
        mockupUrl: z.string(),
        pricingVariant: z.string(),
        shippingCountry: z.string().default("US"),
        price: z.number().optional(),
        currency: z.string().default("USD"),
        funnelSource: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
        const isGuest = !ctx.session?.user?.id;
        if (isGuest) {
          const isPaidOffer =
            input.funnelSource === "paid-traffic-offer" ||
            input.funnelSource === "ramadan-mug-ad";
          if (!isPaidOffer || input.productKey !== "mug") {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Guest checkout is only available for this ad offer.",
            });
          }
        }
        const ownerUserId = ctx.session?.user?.id
          ? ctx.session.user.id
          : (
              await prisma.user.create({
                data: {
                  paidTrafficUser:
                    input.funnelSource === "paid-traffic-offer" ||
                    input.funnelSource === "ramadan-mug-ad",
                },
                select: { id: true },
              })
            ).id;
        const pricing = await calculateProductPriceFromCache({
          productType: input.productKey,
          sizeKey: input.pricingVariant,
          countryCode: input.shippingCountry,
        });

        if (
          typeof input.price === "number" &&
          Math.abs(input.price - pricing.totalPrice) > 0.01
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Price mismatch. Please refresh and try again.",
          });
        }

        const order = await prisma.productOrder.create({
        data: {
            userId: ownerUserId,
            productKey: input.productKey,
            variantId: input.variantId,
            variantName: input.variantName,
            size: input.size,
            color: input.color,
            colorHex: input.colorHex,
            aspect: input.aspect,
            previewMode: input.previewMode,
            previewVariantId: input.previewVariantId,
            isBackgroundRemoved: input.isBackgroundRemoved ?? false,
            snapshotVariantId: input.snapshotVariantId,
            snapshotSize: input.snapshotSize,
            snapshotColor: input.snapshotColor,
            snapshotPrintPosition: input.snapshotPrintPosition,
            snapshotBackgroundRemoved: input.snapshotBackgroundRemoved ?? false,
            imageUrl: input.imageUrl,
            mockupUrl: input.mockupUrl,
            basePrice: pricing.baseCost,
            margin: pricing.margin,
            shippingPrice: pricing.shippingCost,
            shippingCurrency: pricing.currency,
            totalPrice: pricing.totalPrice,
            currency: pricing.currency,
            funnelSource: input.funnelSource,
            status: "pending",
        },
        });

        if (ctx.session?.user?.id) {
          const user = await prisma.user.update({
            where: { id: ctx.session.user.id },
            data: { hasVisitedCheckout: true },
            select: { email: true, name: true, credits: true },
          });

          if (user.email) {
            try {
              await updateMauticContact(
                {
                  email: user.email,
                  name: user.name,
                  brand_specific_credits: user.credits,
                  customFields: {
                    has_visited_checkout: 1,
                  },
                },
                "namedesignai",
              );
            } catch (err) {
              console.error("Error updating Mautic on checkout visit:", err);
            }
          }
        }

      return {
        orderId: order.id,
        accessToken: isGuest ? createGuestOrderToken(order.id) : null,
      };
    }),
    // productOrderRouter.ts
    updateShipping: protectedProcedure
    .input(
        z.object({
        orderId: z.string(),
        shippingPrice: z.number(),
        currency: z.string(),
        })
    )
    .mutation(async ({ ctx, input }) => {
        const order = await prisma.productOrder.findUnique({
        where: { id: input.orderId },
        });

        if (!order) throw new Error("Order not found");

        const totalPrice = order.basePrice + order.margin + input.shippingPrice;

        await prisma.productOrder.update({
        where: { id: input.orderId },
        data: {
            shippingPrice: input.shippingPrice,
            shippingCurrency: input.currency,
            totalPrice,
        },
        });

        return { success: true };
    }),

    getOrder: publicProcedure
        .input(
            z.object({
            orderId: z.string(),
            accessToken: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const order = await prisma.productOrder.findUnique({
              where: { id: input.orderId },
            });

            if (!order) throw new Error("Order not found");
            if (ctx.session?.user?.id) {
              if (order.userId !== ctx.session.user.id) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
              }
              return order;
            }

            const isValidGuestToken = verifyGuestOrderToken(
              input.accessToken,
              input.orderId,
            );
            if (!isValidGuestToken) {
              throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            return order;
        }),

});
