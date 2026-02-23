import { Prisma } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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
  getRamadanFunnelState: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        ramadanAdUser: true,
        ramadanFreeCreditsGranted: true,
        ramadanMugFreePreviewUsed: true,
      },
    });

    return {
      isRamadanAdUser: Boolean(user?.ramadanAdUser),
      ramadanFreeCreditsGranted: Boolean(user?.ramadanFreeCreditsGranted),
      ramadanMugFreePreviewUsed: Boolean(user?.ramadanMugFreePreviewUsed),
    };
  }),
  grantRamadanFreeCredits: protectedProcedure.mutation(async ({ ctx }) => {
    const updated = await ctx.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          credits: true,
          ramadanFreeCreditsGranted: true,
          ramadanAdUser: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.ramadanFreeCreditsGranted) {
        const patched = user.ramadanAdUser
          ? user
          : await tx.user.update({
              where: { id: ctx.session.user.id },
              data: { ramadanAdUser: true },
              select: {
                credits: true,
                ramadanFreeCreditsGranted: true,
                ramadanAdUser: true,
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
          ramadanFreeCreditsGranted: true,
          ramadanAdUser: true,
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
});
