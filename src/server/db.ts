import { PrismaClient, type Prisma } from "@prisma/client";

import { env } from "~/env.mjs";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prismaClientLogLevels: Prisma.LogLevel[] =
  env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

const prismaClientOptions = {
  log: prismaClientLogLevels,
};

function createPrismaClient() {
  return new PrismaClient(prismaClientOptions);
}

function hasGenerationRequestDelegate(client: PrismaClient | undefined) {
  return Boolean(
    (client as (PrismaClient & { generationRequest?: unknown }) | undefined)
      ?.generationRequest,
  );
}

const cachedPrisma = globalForPrisma.prisma;

if (cachedPrisma && !hasGenerationRequestDelegate(cachedPrisma)) {
  void cachedPrisma.$disconnect().catch(() => undefined);
}

export const prisma =
  cachedPrisma && hasGenerationRequestDelegate(cachedPrisma)
    ? cachedPrisma
    : createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
