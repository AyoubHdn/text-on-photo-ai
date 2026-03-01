import { Prisma } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";

export const userRouter = createTRPCRouter({
  getCredits: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
      });
      return user?.credits ? Number(user.credits) : 0;
    }),
  getPaidTrafficFunnelState: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        paidTrafficUser: true,
        paidTrafficFreeCreditsGranted: true,
        paidTrafficFreePreviewUsed: true,
        hasGeneratedDesign: true,
        hasVisitedCheckout: true,
      },
    });

    return {
      isPaidTrafficUser: Boolean(user?.paidTrafficUser),
      paidTrafficFreeCreditsGranted: Boolean(user?.paidTrafficFreeCreditsGranted),
      paidTrafficFreePreviewUsed: Boolean(user?.paidTrafficFreePreviewUsed),
      hasGeneratedDesign: Boolean(user?.hasGeneratedDesign),
      hasVisitedCheckout: Boolean(user?.hasVisitedCheckout),
    };
  }),
  grantPaidTrafficFreeCredits: protectedProcedure.mutation(async ({ ctx }) => {
    const updated = await ctx.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          credits: true,
          paidTrafficFreeCreditsGranted: true,
          paidTrafficUser: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.paidTrafficFreeCreditsGranted) {
        const patched = user.paidTrafficUser
          ? user
          : await tx.user.update({
              where: { id: ctx.session.user.id },
              data: { paidTrafficUser: true },
              select: {
                credits: true,
                paidTrafficFreeCreditsGranted: true,
                paidTrafficUser: true,
              },
            });

        return {
          granted: false,
          credits: Number(patched.credits),
        };
      }

      const nextCredits = new Prisma.Decimal(user.credits).plus(
        new Prisma.Decimal("5.1"),
      );

      const patched = await tx.user.update({
        where: { id: ctx.session.user.id },
        data: {
          credits: nextCredits,
          paidTrafficFreeCreditsGranted: true,
          paidTrafficUser: true,
        },
        select: {
          credits: true,
        },
      });

      return {
        granted: true,
        credits: Number(patched.credits),
      };
    });

    return updated;
  }),
  markPaidTrafficUser: protectedProcedure
    .input(
      z
        .object({
          sourcePage: z.string().optional(),
          promotedProduct: z.string().optional(),
        })
        .optional(),
    )
    .mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.update({
      where: { id: ctx.session.user.id },
      data: { paidTrafficUser: true },
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
              paid_traffic_user: 1,
              paid_traffic_source_page: input?.sourcePage,
              paid_traffic_promoted_product: input?.promotedProduct,
            },
          },
          "namedesignai",
        );
      } catch (err) {
        console.error("Error updating Mautic on markPaidTrafficUser:", err);
      }
    }

    return { success: true };
    }),
});
