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
import { assertVariantAvailableInCountry } from "~/server/services/productVariantAvailability";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";
import {
  createGuestOrderToken,
  verifyGuestOrderToken,
} from "~/server/guestOrderToken";
import { env } from "~/env.mjs";
import { resolveCheckoutUser } from "~/server/checkout/resolveCheckoutUser";
import {
  getProductOrderQuantity,
  setProductOrderQuantity,
} from "~/server/orders/quantity";

const TRUSTED_S3_HOST = `${env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com`;

function isTrustedAssetUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === TRUSTED_S3_HOST;
  } catch {
    return false;
  }
}

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
    const posterSize =
      normalizePosterSize(order.size) ?? normalizePosterSize(order.variantName);
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

function buildCheckoutResumeUrl(
  orderId: string,
  accessToken?: string,
  sourcePage?: string,
): string {
  const checkoutUrl = new URL(`${env.HOST_NAME}/checkout`);
  checkoutUrl.searchParams.set("orderId", orderId);
  if (accessToken) {
    checkoutUrl.searchParams.set("accessToken", accessToken);
  }
  if (sourcePage) {
    checkoutUrl.searchParams.set("sourcePage", sourcePage);
    checkoutUrl.searchParams.set("generator", sourcePage);
  }
  return checkoutUrl.toString();
}

export const productOrderRouter = createTRPCRouter({
  createPendingOrder: publicProcedure
    .input(
      z.object({
        productKey: z.enum(["poster", "tshirt", "mug"]),
        variantId: z.number(),
        quantity: z.number().int().min(1).max(10).optional(),
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
        if (!isTrustedAssetUrl(input.imageUrl) || !isTrustedAssetUrl(input.mockupUrl)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only generated Name Design AI assets can be used for checkout.",
          });
        }
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
        if (input.productKey !== "tshirt") {
          try {
            await assertVariantAvailableInCountry({
              productType: input.productKey,
              variantId: input.variantId,
              countryCode: input.shippingCountry,
            });
          } catch (error) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                error instanceof Error
                  ? error.message
                  : "This product variant is not available in this country.",
            });
          }
        }
        const pricing = await calculateProductPriceFromCache({
          productType: input.productKey,
          sizeKey: input.pricingVariant,
          countryCode: input.shippingCountry,
          quantity: input.quantity ?? 1,
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

      if ((input.quantity ?? 1) !== 1) {
        await setProductOrderQuantity(order.id, input.quantity ?? 1);
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
    updateQuantity: publicProcedure
      .input(
        z.object({
          orderId: z.string(),
          accessToken: z.string().optional(),
          quantity: z.number().int().min(1).max(6),
          countryCode: z.string().default("US"),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const order = await prisma.productOrder.findUnique({
          where: { id: input.orderId },
        });

        if (!order) throw new Error("Order not found");

        const hasOwnerSession = ctx.session?.user?.id === order.userId;
        const hasGuestAccess = verifyGuestOrderToken(
          input.accessToken,
          input.orderId,
        );

        if (!hasOwnerSession && !hasGuestAccess) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const pricingVariant = resolvePricingVariant(order);
        const productType = order.productKey as "poster" | "tshirt" | "mug";

        let pricing;
        try {
          if (productType !== "tshirt") {
            await assertVariantAvailableInCountry({
              productType,
              variantId: order.variantId,
              countryCode: input.countryCode,
            });
          }

          pricing = await calculateProductPriceFromCache({
            productType,
            sizeKey: pricingVariant,
            countryCode: input.countryCode,
            quantity: input.quantity,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to update quantity.";
          if (
            message === "Pricing not available for this variant." ||
            message === "This product variant is not available in this country."
          ) {
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

        await setProductOrderQuantity(order.id, input.quantity);

        await prisma.productOrder.update({
          where: { id: order.id },
          data: {
            basePrice: pricing.baseCost,
            margin: pricing.margin,
            shippingPrice: pricing.shippingCost,
            shippingCurrency: pricing.currency,
            totalPrice: pricing.totalPrice,
          },
        });

        return {
          success: true,
          quantity: pricing.quantity,
          totalPrice: pricing.totalPrice,
          unitTotalPrice: pricing.unitTotalPrice,
          discountedUnitTotalPrice: pricing.discountedUnitTotalPrice,
          shippingPrice: pricing.shippingCost,
          basePrice: pricing.baseCost,
          fullPriceTotal: pricing.fullPriceTotal,
          discountAmount: pricing.discountAmount,
          discountedQuantity: pricing.discountedQuantity,
          discountLabel: pricing.discountLabel,
          currency: pricing.currency,
        };
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
            const isValidGuestToken = verifyGuestOrderToken(
              input.accessToken,
              input.orderId,
            );
            if (ctx.session?.user?.id) {
              if (order.userId !== ctx.session.user.id && !isValidGuestToken) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
              }
              return {
                ...order,
                quantity: await getProductOrderQuantity(order.id),
              };
            }

            if (!isValidGuestToken) {
              throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            return {
              ...order,
              quantity: await getProductOrderQuantity(order.id),
            };
        }),
    getCheckoutPricing: publicProcedure
      .input(
        z.object({
          orderId: z.string(),
          accessToken: z.string().optional(),
          countryCode: z.string(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const order = await prisma.productOrder.findUnique({
          where: { id: input.orderId },
        });

        if (!order) throw new Error("Order not found");

        const hasOwnerSession = ctx.session?.user?.id === order.userId;
        const hasGuestAccess = verifyGuestOrderToken(
          input.accessToken,
          input.orderId,
        );

        if (!hasOwnerSession && !hasGuestAccess) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const pricingVariant = resolvePricingVariant(order);
        const productType = order.productKey as "poster" | "tshirt" | "mug";
        const orderQuantity = await getProductOrderQuantity(order.id);
        let pricing;
        try {
          if (productType !== "tshirt") {
            await assertVariantAvailableInCountry({
              productType,
              variantId: order.variantId,
              countryCode: input.countryCode,
            });
          }

          pricing = await calculateProductPriceFromCache({
            productType,
            sizeKey: pricingVariant,
            countryCode: input.countryCode,
            quantity: orderQuantity,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Pricing unavailable";
          if (
            message === "Pricing not available for this variant." ||
            message === "This product variant is not available in this country."
          ) {
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

        return {
          totalPrice: pricing.totalPrice,
          quantity: pricing.quantity,
          unitTotalPrice: pricing.unitTotalPrice,
          discountedUnitTotalPrice: pricing.discountedUnitTotalPrice,
          shippingPrice: pricing.shippingCost,
          basePrice: pricing.baseCost,
          fullPriceTotal: pricing.fullPriceTotal,
          discountAmount: pricing.discountAmount,
          discountedQuantity: pricing.discountedQuantity,
          discountLabel: pricing.discountLabel,
          currency: pricing.currency,
          shippingCountry: pricing.shippingCountry,
        };
      }),
    captureCheckoutEmail: publicProcedure
      .input(
        z.object({
          orderId: z.string(),
          accessToken: z.string().optional(),
          email: z.string().email(),
          sourcePage: z.string().optional(),
          promotedProduct: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const order = await prisma.productOrder.findUnique({
          where: { id: input.orderId },
        });

        if (!order) throw new Error("Order not found");

        const hasOwnerSession = ctx.session?.user?.id === order.userId;
        const hasGuestAccess = verifyGuestOrderToken(
          input.accessToken,
          input.orderId,
        );

        if (!hasOwnerSession && !hasGuestAccess) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        const normalizedEmail = input.email.trim().toLowerCase();
        const isPaidTrafficOrder =
          order.funnelSource === "paid-traffic-offer" ||
          order.funnelSource === "ramadan-mug-ad";
        const checkoutResumeUrl =
          isPaidTrafficOrder
            ? buildCheckoutResumeUrl(order.id, input.accessToken, input.sourcePage)
            : undefined;

        const resolvedUser = await resolveCheckoutUser({
          prisma,
          orderUserId: order.userId,
          normalizedEmail,
          isPaidTrafficOrder,
        });

        const updatedUser = await prisma.user.update({
          where: { id: resolvedUser.id },
          data: {
            hasVisitedCheckout: true,
            hasGeneratedDesign: true,
            paidTrafficUser: isPaidTrafficOrder || resolvedUser.paidTrafficUser,
          },
          select: {
            id: true,
            email: true,
            name: true,
            credits: true,
            paidTrafficUser: true,
          },
        });

        if (order.userId !== updatedUser.id) {
          await prisma.productOrder.update({
            where: { id: order.id },
            data: { userId: updatedUser.id },
          });
        }

        if (updatedUser.email) {
          try {
            await updateMauticContact(
              {
                email: updatedUser.email,
                name: updatedUser.name,
                brand_specific_credits: updatedUser.credits,
                customFields: {
                  has_visited_checkout: 1,
                  has_generated_design: 1,
                  is_paid_traffic_user:
                    isPaidTrafficOrder || updatedUser.paidTrafficUser ? 1 : 0,
                  paid_traffic_source_page: input.sourcePage,
                  paid_traffic_promoted_pro:
                    input.promotedProduct ?? order.productKey,
                  checkout_resume_url: checkoutResumeUrl,
                },
              },
              "namedesignai",
            );
          } catch (err) {
            console.error("Error updating Mautic on checkout email capture:", err);
          }
        }

        return { success: true };
      }),

});
