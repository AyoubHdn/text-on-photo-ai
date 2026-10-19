// ~/server/api/routers/icon.ts
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { Plan } from "@prisma/client";
import { DbServiceRequestError, iconGetIconsForUserFromService, iconGetCommunityIconsFromService, iconGetPopularPaidIconsFromService, iconUpdateVisibilityFromService } from "~/server/cloudflare/dbService";

const shouldUseServiceIconReads = () => process.env.DB_ICON_READS_BACKEND === "service";
const shouldUseServiceIconWrites = () => process.env.DB_ICON_WRITES_BACKEND === "service";

function throwIconServiceError(error: unknown, message = "This design cannot be claimed."): never {
  if (error instanceof DbServiceRequestError) {
    if (error.code === "NOT_FOUND") throw new TRPCError({ code: "NOT_FOUND", message: "Design not found." });
    if (error.code === "FORBIDDEN") throw new TRPCError({ code: "FORBIDDEN", message });
  }
  throw error;
}

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
        if (shouldUseServiceIconReads()) {
          const userWithIcons = await iconGetIconsForUserFromService({ userId });
          if (!userWithIcons) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
          return { icons: userWithIcons.icons, userPlan: userWithIcons.plan, isSubscriber: userWithIcons.plan !== Plan.None };
        }
        
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
      if (shouldUseServiceIconReads()) return iconGetCommunityIconsFromService();
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
      if (shouldUseServiceIconWrites()) {
        try { return await iconUpdateVisibilityFromService({ ...input, userId }); }
        catch (error) { return throwIconServiceError(error, input.isPublic ? "You are not authorized to edit this icon." : "You must have a subscription to make designs private."); }
      }

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
    if (shouldUseServiceIconReads()) return iconGetPopularPaidIconsFromService({ limit: input.limit });
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

});
