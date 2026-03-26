import { Prisma, type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const checkoutUserSelect = {
  id: true,
  email: true,
  name: true,
  credits: true,
  paidTrafficUser: true,
} satisfies Prisma.UserSelect;

type CheckoutUserRecord = Prisma.UserGetPayload<{
  select: typeof checkoutUserSelect;
}>;

function isUniqueEmailConstraint(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function findUserByEmail(
  prisma: PrismaClient,
  normalizedEmail: string,
): Promise<CheckoutUserRecord | null> {
  return prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: checkoutUserSelect,
  });
}

export async function resolveCheckoutUser(params: {
  prisma: PrismaClient;
  orderUserId: string;
  normalizedEmail: string;
  fallbackName?: string;
  isPaidTrafficOrder: boolean;
}): Promise<CheckoutUserRecord> {
  const currentOrderUser = await params.prisma.user.findUnique({
    where: { id: params.orderUserId },
    select: checkoutUserSelect,
  });

  if (!currentOrderUser) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Order owner not found.",
    });
  }

  const existingUser = await findUserByEmail(params.prisma, params.normalizedEmail);
  if (existingUser) {
    return existingUser;
  }

  if (!currentOrderUser.email) {
    try {
      return await params.prisma.user.update({
        where: { id: currentOrderUser.id },
        data: {
          email: params.normalizedEmail,
          name: currentOrderUser.name ?? params.fallbackName,
          paidTrafficUser:
            params.isPaidTrafficOrder || currentOrderUser.paidTrafficUser,
        },
        select: checkoutUserSelect,
      });
    } catch (error) {
      if (isUniqueEmailConstraint(error)) {
        const racedUser = await findUserByEmail(params.prisma, params.normalizedEmail);
        if (racedUser) {
          return racedUser;
        }
      }

      throw error;
    }
  }

  if (currentOrderUser.email.toLowerCase() === params.normalizedEmail) {
    return currentOrderUser;
  }

  try {
    return await params.prisma.user.create({
      data: {
        email: params.normalizedEmail,
        name: params.fallbackName,
        paidTrafficUser: params.isPaidTrafficOrder,
      },
      select: checkoutUserSelect,
    });
  } catch (error) {
    if (isUniqueEmailConstraint(error)) {
      const racedUser = await findUserByEmail(params.prisma, params.normalizedEmail);
      if (racedUser) {
        return racedUser;
      }
    }

    throw error;
  }
}
