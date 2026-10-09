import { WorkerEntrypoint } from "cloudflare:workers";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { toSafeErrorResponse } from "./errors";
import type { DiagnosticResponse, Env, HealthResponse } from "./types";

export default class DbService extends WorkerEntrypoint<Env> {
  async health(): Promise<HealthResponse> {
    return { ok: true, service: "namedesignai-db" };
  }

  async diagnosticSelectOne(): Promise<DiagnosticResponse> {
    const prisma = this.createPrisma();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { ok: true };
    } catch (error) {
      console.error("DB diagnostic failed", toSafeErrorResponse(error));
      throw new Error("DB diagnostic failed");
    } finally {
      await prisma.$disconnect();
    }
  }

  private createPrisma() {
    const adapter = new PrismaPg({
      connectionString: this.env.HYPERDRIVE.connectionString,
      maxUses: 1,
    });
    return new PrismaClient({ adapter });
  }
}
