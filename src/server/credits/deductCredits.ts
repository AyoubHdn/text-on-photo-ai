// src/server/credits/deductCredits.ts
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { prisma } from "~/server/db";
import { Prisma } from "@prisma/client";

export async function deductCreditsOrThrow(
  userId: string,
  amount: number,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const amountDecimal = new Prisma.Decimal(amount);
  const creditsDecimal = new Prisma.Decimal(user.credits);

  // ✅ Decimal-safe comparison
  if (creditsDecimal.lessThan(amountDecimal)) {
    throw new Error("Not enough credits");
  }

  const updatedCredits = creditsDecimal.minus(amountDecimal);

  // ✅ Decimal-safe decrement
  return prisma.user.update({
    where: { id: userId },
    data: {
      credits: updatedCredits,
    },
    select: {
      credits: true,
      email: true,
      name: true,
    },
  });

  // (Optional) If you later add a credit log table, log here
}
