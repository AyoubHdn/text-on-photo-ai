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
    console.log("PAID_TRAFFIC_DEBUG grantPaidTrafficFreeCredits called", {
      userId: ctx.session.user.id,
    });
    const updated = await ctx.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          credits: true,
          email: true,
          name: true,
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
                email: true,
                name: true,
                paidTrafficFreeCreditsGranted: true,
                paidTrafficUser: true,
              },
            });

        return {
          granted: false,
          credits: Number(patched.credits),
          paidTrafficUser: Boolean(patched.paidTrafficUser),
          email: patched.email,
          name: patched.name,
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
          email: true,
          name: true,
          paidTrafficUser: true,
        },
      });

      return {
        granted: true,
        credits: Number(patched.credits),
        paidTrafficUser: Boolean(patched.paidTrafficUser),
        email: patched.email,
        name: patched.name,
      };
    });

    if (updated.paidTrafficUser && updated.email) {
      try {
        await updateMauticContact(
          {
            email: updated.email,
            name: updated.name,
            brand_specific_credits: updated.credits,
            customFields: {
              is_paid_traffic_user: 1,
            },
          },
          "namedesignai",
        );
      } catch (err) {
        console.error("Error updating Mautic on grantPaidTrafficFreeCredits:", err);
      }
    }

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
    console.log("PAID_TRAFFIC_DEBUG markPaidTrafficUser called", {
      userId: ctx.session.user.id,
      sourcePage: input?.sourcePage,
      promotedProduct: input?.promotedProduct,
    });

    const existingUser = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { email: true, name: true, credits: true, paidTrafficUser: true },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    const user = existingUser.paidTrafficUser
      ? existingUser
      : await ctx.prisma.user.update({
          where: { id: ctx.session.user.id },
          data: { paidTrafficUser: true },
          select: { email: true, name: true, credits: true, paidTrafficUser: true },
        });

    if (user.email) {
      try {
        await updateMauticContact(
          {
            email: user.email,
            name: user.name,
            brand_specific_credits: user.credits,
            customFields: {
              is_paid_traffic_user: 1,
              paid_traffic_source_page: input?.sourcePage,
              paid_traffic_promoted_pro: input?.promotedProduct,
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
