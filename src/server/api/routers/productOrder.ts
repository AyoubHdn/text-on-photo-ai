/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { prisma } from "~/server/db";
import { PRODUCT_MARGINS } from "~/server/credits/constants";

export const productOrderRouter = createTRPCRouter({
  createPendingOrder: protectedProcedure
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
        price: z.number(), // FINAL price incl. margin (no shipping yet)
        currency: z.string().default("USD"),
      })
    )
    .mutation(async ({ ctx, input }) => {
        const BASE_PRICE = input.price - PRODUCT_MARGINS[input.productKey]; // computed earlier
        const order = await prisma.productOrder.create({
        data: {
            userId: ctx.session.user.id,
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
            basePrice: BASE_PRICE,
            margin: input.price - BASE_PRICE,
            totalPrice: input.price,
            currency: input.currency,
            status: "pending",
        },
        });

      return { orderId: order.id };
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

    getOrder: protectedProcedure
        .input(
            z.object({
            orderId: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const order = await prisma.productOrder.findFirst({
            where: {
                id: input.orderId,
                userId: ctx.session.user.id,
            },
            });

            if (!order) throw new Error("Order not found");

            return order;
        }),

});
