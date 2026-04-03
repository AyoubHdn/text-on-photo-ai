import { prisma } from "~/server/db";

function isMissingQuantityColumnError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("column") &&
    message.includes("quantity") &&
    message.includes("does not exist")
  );
}

function normalizeQuantity(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value));
  }
  if (typeof value === "bigint") {
    return Math.max(1, Number(value));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.floor(parsed));
    }
  }
  return 1;
}

export async function getProductOrderQuantity(orderId: string) {
  try {
    const rows = await prisma.$queryRaw<Array<{ quantity: unknown }>>`
      SELECT "quantity"
      FROM "ProductOrder"
      WHERE "id" = ${orderId}
      LIMIT 1
    `;

    return normalizeQuantity(rows[0]?.quantity);
  } catch (error) {
    if (isMissingQuantityColumnError(error)) {
      return 1;
    }
    throw error;
  }
}

export async function setProductOrderQuantity(orderId: string, quantity: number) {
  const normalizedQuantity = normalizeQuantity(quantity);
  try {
    await prisma.$executeRaw`
      UPDATE "ProductOrder"
      SET "quantity" = ${normalizedQuantity}
      WHERE "id" = ${orderId}
    `;
  } catch (error) {
    if (isMissingQuantityColumnError(error)) {
      throw new Error(
        "Order quantity needs the latest database migration before it can be used.",
      );
    }
    throw error;
  }

  return normalizedQuantity;
}
