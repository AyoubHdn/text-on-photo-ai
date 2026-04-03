// ~/server/api/routers/icon.ts
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { Plan } from "@prisma/client";

const EXCLUDED_COMMUNITY_SOURCE_PAGES = [
  "couple-name-mug-v1",
  "couple-avatar-name-mug-v1",
  "couple-names-only-mug-v1",
] as const;

export const iconRouter = createTRPCRouter({
  // --- START: UPGRADED PROCEDURE ---
  // Renamed from getIcons to be more specific. It now also fetches the user's plan.
  getIconsForUser: protectedProcedure
    .query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        
        // Fetch both the icons and the user's subscription plan in one efficient database call
        const userWithIcons = await ctx.prisma.user.findUnique({
          where: { id: userId },
          select: {
            plan: true,
            icons: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });

        if (!userWithIcons) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
        }
        
        // Return a structured object with all the data the frontend needs
        return {
          icons: userWithIcons.icons,
          userPlan: userWithIcons.plan,
          isSubscriber: userWithIcons.plan !== Plan.None, // A helpful boolean for the frontend
        };
    }),
  // --- END: UPGRADED PROCEDURE ---

  getCommunityIcons: publicProcedure.query(async({ctx}) => {
      const icons = await ctx.prisma.icon.findMany({
        where: {
          isPublic: true,
          NOT: EXCLUDED_COMMUNITY_SOURCE_PAGES.map((sourcePage) => ({
            metadata: {
              path: ["sourcePage"],
              equals: sourcePage,
            },
          })),
        },
        take: 50,
        orderBy: {
          createdAt: "desc"
        }
      });
      return icons;
    }),

  // --- START: NEW PROCEDURE ---
  // This procedure allows a user to update the visibility of their own icons.
  updateIconVisibility: protectedProcedure
    .input(
      z.object({
        iconId: z.string(),
        isPublic: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Find the user first to check their subscription status
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true }
      });

      // Security Check: Only allow subscribers to make icons private
      if (user?.plan === Plan.None && input.isPublic === false) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You must have a subscription to make designs private." });
      }

      // Security Check: Find the icon and ensure it belongs to the current user
      const iconToUpdate = await ctx.prisma.icon.findFirst({
        where: {
          id: input.iconId,
          userId: userId,
        },
      });

      if (!iconToUpdate) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorized to edit this icon." });
      }

      // If all checks pass, update the icon's visibility
      const updatedIcon = await ctx.prisma.icon.update({
        where: {
          id: input.iconId,
        },
        data: {
          isPublic: input.isPublic,
        },
      });

      return updatedIcon;
    }),
    // --- END: NEW PROCEDURE ---

    getPopularPaidIcons: publicProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(30).default(12),
    })
  )
  .query(async ({ ctx, input }) => {
    const icons = await ctx.prisma.icon.findMany({
      where: {
        isPublic: true,
        NOT: EXCLUDED_COMMUNITY_SOURCE_PAGES.map((sourcePage) => ({
          metadata: {
            path: ["sourcePage"],
            equals: sourcePage,
          },
        })),
        User: {
          plan: {
            not: Plan.None, // Starter | Pro | Elite only
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: input.limit,
      select: {
        id: true,
        prompt: true,
        metadata: true,
      },
    });

    return icons;
  }),

  claimGuestRamadanMugV2Design: protectedProcedure
    .input(
      z.object({
        iconId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const icon = await ctx.prisma.icon.findUnique({
        where: { id: input.iconId },
        select: {
          id: true,
          userId: true,
          metadata: true,
        },
      });

      if (!icon) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Design not found." });
      }

      if (icon.userId === ctx.session.user.id) {
        return { success: true, claimed: false };
      }

      const sourcePage =
        icon.metadata &&
        typeof icon.metadata === "object" &&
        "sourcePage" in icon.metadata
          ? (icon.metadata as { sourcePage?: string }).sourcePage
          : undefined;

      if (icon.userId !== null || sourcePage !== "ramadan-mug-v2") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This design cannot be claimed.",
        });
      }

      await ctx.prisma.icon.update({
        where: { id: input.iconId },
        data: {
          userId: ctx.session.user.id,
        },
      });

      return { success: true, claimed: true };
    }),
});
