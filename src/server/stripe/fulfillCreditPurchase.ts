import * as PrismaClientRuntime from "@prisma/client";
import type { Prisma, PrismaClient } from "@prisma/client";

const PrismaRuntime = PrismaClientRuntime.Prisma;

export type CreditPurchasePlan = "Starter" | "Pro" | "Elite";

export type CreditPurchaseInput = {
  eventId: string;
  eventType: string;
  stripeSessionId: string | null;
  userId: string;
  credits: number;
  plan: CreditPurchasePlan;
};

export type CreditPurchaseResult =
  | { outcome: "APPLIED"; updatedUser: { email: string | null; name: string | null; credits: Prisma.Decimal; plan: CreditPurchasePlan } }
  | { outcome: "DUPLICATE" };

function persistedPlan(value: string): CreditPurchasePlan {
  if (value === "Starter" || value === "Pro" || value === "Elite") return value;
  throw new Error("Stripe purchase plan was not persisted");
}

/**
 * Atomically records a Stripe event and increments the user's balance.
 * A duplicate event is a successful no-op; any other error aborts the
 * transaction so Stripe can retry without leaving a deduplication marker.
 */
export async function fulfillCreditPurchase(
  prisma: PrismaClient,
  input: CreditPurchaseInput,
): Promise<CreditPurchaseResult> {
  const credits = new PrismaRuntime.Decimal(input.credits);

  return prisma.$transaction(async (tx) => {
    try {
      await tx.stripeWebhookEvent.create({
        data: {
          id: input.eventId,
          type: input.eventType,
          stripeSessionId: input.stripeSessionId,
          userId: input.userId,
        },
      });
    } catch (error) {
      if (error instanceof PrismaRuntime.PrismaClientKnownRequestError && error.code === "P2002") {
        return { outcome: "DUPLICATE" as const };
      }
      throw error;
    }

    const updatedUser = await tx.user.update({
      where: { id: input.userId },
      data: {
        credits: { increment: credits },
        plan: input.plan,
      },
      select: { email: true, name: true, credits: true, plan: true },
    });

    return {
      outcome: "APPLIED" as const,
      updatedUser: {
        email: updatedUser.email,
        name: updatedUser.name,
        credits: updatedUser.credits,
        plan: persistedPlan(updatedUser.plan),
      },
    };
  });
}
