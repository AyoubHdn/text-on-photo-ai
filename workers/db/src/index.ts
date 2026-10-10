import { WorkerEntrypoint } from "cloudflare:workers";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DbServiceError, toSafeErrorResponse } from "./errors";
import type {
  DiagnosticResponse,
  Env,
  HealthResponse,
  PricingAvailabilityInput,
  PricingAvailabilityErrorResponse,
  PricingAvailabilityResponse,
  PricingCachedCostsInput,
  PricingCachedCostsResponse,
  PricingCachedCostsNotFoundResponse,
  PricingCachedCostsErrorResponse,
  PricingVariantFilterInput,
  PricingVariantFilterResponse,
  PricingVariantFilterErrorResponse,
  OrdersTrackingInput,
  OrdersTrackingResponse,
  OrdersTrackingNotFoundResponse,
  OrdersTrackingErrorResponse,
  AuthGetUserInput,
  AuthGetUserResponse,
  AuthGetUserNotFoundResponse,
  AuthGetUserErrorResponse,
  AuthGetSessionAndUserInput,
  AuthGetSessionAndUserResponse,
  AuthGetSessionAndUserNotFoundResponse,
  AuthGetSessionAndUserErrorResponse,
} from "./types";

export default class DbService extends WorkerEntrypoint<Env> {
  // The service is intended for RPC bindings; direct HTTP access is disabled.
  async fetch(): Promise<Response> {
    return new Response("Not Found", { status: 404 });
  }

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
      throw new DbServiceError("DEPENDENCY_UNAVAILABLE");
    } finally {
      await prisma.$disconnect();
    }
  }

  async pricingGetAvailability(
    input: PricingAvailabilityInput,
  ): Promise<PricingAvailabilityResponse | PricingAvailabilityErrorResponse> {
    const productType = input?.productType?.trim();
    const countryCode = input?.countryCode?.trim().toUpperCase();
    const variantId = input?.variantId;

    if (
      !productType ||
      productType.length > 100 ||
      !Number.isInteger(variantId) ||
      variantId <= 0 ||
      !/^[A-Z]{2}$/.test(countryCode)
    ) {
      return { ok: false, code: "INVALID_INPUT" };
    }

    const prisma = this.createPrisma();
    try {
      const record = await prisma.productVariantAvailabilityCache.findUnique({
        where: {
          productType_variantId_countryCode: {
            productType,
            variantId,
            countryCode,
          },
        },
        select: { id: true },
      });
      return { available: Boolean(record) };
    } catch (error) {
      console.error("Pricing availability lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally {
      await prisma.$disconnect();
    }
  }

  async pricingGetCachedCosts(
    input: PricingCachedCostsInput,
  ): Promise<
    | PricingCachedCostsResponse
    | PricingCachedCostsNotFoundResponse
    | PricingCachedCostsErrorResponse
  > {
    const productType = input?.productType?.trim();
    const sizeKey = input?.sizeKey?.trim();
    const countryCode = input?.countryCode?.trim().toUpperCase();

    if (
      !productType ||
      productType.length > 100 ||
      !sizeKey ||
      sizeKey.length > 150 ||
      !/^[A-Z]{2}$/.test(countryCode)
    ) {
      return { ok: false, code: "INVALID_INPUT" };
    }

    const prisma = this.createPrisma();
    try {
      const record = await prisma.productPricingCache.findUnique({
        where: {
          productType_sizeKey_countryCode: {
            productType,
            sizeKey,
            countryCode,
          },
        },
        select: { baseCost: true, shippingCost: true },
      });

      if (!record) return { found: false };
      return {
        found: true,
        baseCost: record.baseCost.toString(),
        shippingCost: record.shippingCost.toString(),
      };
    } catch (error) {
      console.error("Pricing cost lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally {
      await prisma.$disconnect();
    }
  }

  async pricingGetVariantFilterData(
    input: PricingVariantFilterInput,
  ): Promise<PricingVariantFilterResponse | PricingVariantFilterErrorResponse> {
    const productType = input?.productType?.trim();
    const countryCode = input?.countryCode?.trim().toUpperCase();

    if (
      !productType ||
      productType.length > 100 ||
      !/^[A-Z]{2}$/.test(countryCode)
    ) {
      return { ok: false, code: "INVALID_INPUT" };
    }

    const prisma = this.createPrisma();
    try {
      const [cachedPricing, cachedAvailability] = await Promise.all([
        prisma.productPricingCache.findMany({
          where: { productType, countryCode },
          select: { sizeKey: true },
        }),
        prisma.productVariantAvailabilityCache.findMany({
          where: { productType, countryCode },
          select: { variantId: true },
        }),
      ]);

      return {
        allowedSizeKeys: cachedPricing.map((entry) => entry.sizeKey),
        allowedVariantIds: cachedAvailability.map((entry) => entry.variantId),
      };
    } catch (error) {
      console.error("Variant filter lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally {
      await prisma.$disconnect();
    }
  }

  async ordersGetTracking(
    input: OrdersTrackingInput,
  ): Promise<OrdersTrackingResponse | OrdersTrackingNotFoundResponse | OrdersTrackingErrorResponse> {
    const orderId = input?.orderId?.trim();
    if (!orderId || orderId.length > 128) {
      return { ok: false, code: "INVALID_INPUT" };
    }

    const prisma = this.createPrisma();
    try {
      const order = await prisma.productOrder.findUnique({
        where: { id: orderId },
        select: {
          printfulOrder: {
            select: {
              trackingUrl: true,
              trackingNumber: true,
              trackingCarrier: true,
            },
          },
        },
      });

      if (!order) return { found: false };
      return {
        found: true,
        trackingUrl: order.printfulOrder?.trackingUrl ?? null,
        trackingNumber: order.printfulOrder?.trackingNumber ?? null,
        trackingCarrier: order.printfulOrder?.trackingCarrier ?? null,
      };
    } catch (error) {
      console.error("Order tracking lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally {
      await prisma.$disconnect();
    }
  }

  async authGetUser(
    input: AuthGetUserInput,
  ): Promise<AuthGetUserResponse | AuthGetUserNotFoundResponse | AuthGetUserErrorResponse> {
    const userId = input?.userId?.trim();
    if (!userId || userId.length > 128) {
      return { ok: false, code: "INVALID_INPUT" };
    }

    const prisma = this.createPrisma();
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
        },
      });
      if (!user) return { found: false };
      return {
        found: true,
        user: {
          ...user,
          emailVerified: user.emailVerified?.toISOString() ?? null,
        },
      };
    } catch (error) {
      console.error("Auth user lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally {
      await prisma.$disconnect();
    }
  }

  async authGetSessionAndUser(
    input: AuthGetSessionAndUserInput,
  ): Promise<
    | AuthGetSessionAndUserResponse
    | AuthGetSessionAndUserNotFoundResponse
    | AuthGetSessionAndUserErrorResponse
  > {
    const sessionToken = input?.sessionToken?.trim();
    if (!sessionToken || sessionToken.length > 512) {
      return { ok: false, code: "INVALID_INPUT" };
    }

    const prisma = this.createPrisma();
    try {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        select: {
          sessionToken: true,
          userId: true,
          expires: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              emailVerified: true,
              image: true,
            },
          },
        },
      });
      if (!session) return { found: false };
      return {
        found: true,
        session: {
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires.toISOString(),
        },
        user: {
          ...session.user,
          emailVerified: session.user.emailVerified?.toISOString() ?? null,
        },
      };
    } catch (error) {
      console.error("Auth session lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
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
