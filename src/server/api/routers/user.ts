import { z } from "zod";
import { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";
import {
  getDigitalArtInterestFromSourcePage,
  recordDigitalArtInterest,
} from "~/server/mautic/digitalArtInterest";

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
  recordDigitalArtInterestIntent: protectedProcedure
    .input(
      z.object({
        sourcePage: z.enum([
          "name-art-generator",
          "arabic-name-art-generator",
          "couples-art-generator",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const interest = getDigitalArtInterestFromSourcePage(input.sourcePage);

      if (!interest) {
        return { success: false };
      }

      await recordDigitalArtInterest({
        prisma: ctx.prisma,
        userId: ctx.session.user.id,
        interest,
      });

      return { success: true };
    }),
  capturePaidTrafficLead: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        sourcePage: z.string().optional(),
        promotedProduct: z.string().optional(),
        checkoutResumeUrl: z.string().url().optional(),
        hasGeneratedDesign: z.boolean().optional(),
        hasVisitedCheckout: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const normalizedEmail = input.email.trim().toLowerCase();
      const paidTrafficLeadSelect = {
        id: true,
        email: true,
        name: true,
        credits: true,
        paidTrafficUser: true,
        hasGeneratedDesign: true,
        hasVisitedCheckout: true,
      } as const;
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: paidTrafficLeadSelect,
      });

      const updateExistingLead = (userId: string, current?: {
        name: string | null;
        hasGeneratedDesign: boolean;
        hasVisitedCheckout: boolean;
      }) =>
        ctx.prisma.user.update({
          where: { id: userId },
          data: {
            name: current?.name ?? input.name,
            paidTrafficUser: true,
            hasGeneratedDesign:
              Boolean(input.hasGeneratedDesign) || Boolean(current?.hasGeneratedDesign),
            hasVisitedCheckout:
              Boolean(input.hasVisitedCheckout) || Boolean(current?.hasVisitedCheckout),
          },
          select: paidTrafficLeadSelect,
        });

      let resolvedUser;
      if (existingUser) {
        resolvedUser = await updateExistingLead(existingUser.id, existingUser);
      } else {
        try {
          resolvedUser = await ctx.prisma.user.create({
            data: {
              email: normalizedEmail,
              name: input.name,
              paidTrafficUser: true,
              hasGeneratedDesign: Boolean(input.hasGeneratedDesign),
              hasVisitedCheckout: Boolean(input.hasVisitedCheckout),
            },
            select: paidTrafficLeadSelect,
          });
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            const racedUser = await ctx.prisma.user.findUnique({
              where: { email: normalizedEmail },
              select: paidTrafficLeadSelect,
            });
            if (racedUser) {
              resolvedUser = await updateExistingLead(racedUser.id, racedUser);
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }

      try {
        await updateMauticContact(
          {
            email: resolvedUser.email ?? normalizedEmail,
            name: resolvedUser.name,
            brand_specific_credits: resolvedUser.credits,
            customFields: {
              is_paid_traffic_user: 1,
              has_generated_design: resolvedUser.hasGeneratedDesign ? 1 : 0,
              has_visited_checkout: resolvedUser.hasVisitedCheckout ? 1 : 0,
              paid_traffic_source_page: input.sourcePage,
              paid_traffic_promoted_pro: input.promotedProduct,
              checkout_resume_url: input.checkoutResumeUrl,
            },
          },
          "namedesignai",
        );
      } catch (err) {
        console.error("Error updating Mautic on capturePaidTrafficLead:", err);
      }

      return { success: true };
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
