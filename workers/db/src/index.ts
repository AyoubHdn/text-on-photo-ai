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
  AuthGetUserByEmailInput,
  AuthGetUserByEmailResponse,
  AuthGetUserByEmailNotFoundResponse,
  AuthGetUserByEmailErrorResponse,
  AuthGetUserByAccountInput,
  AuthGetUserByAccountResponse,
  AuthGetUserByAccountNotFoundResponse,
  AuthGetUserByAccountErrorResponse,
  AuthGetSessionAndUserInput,
  AuthGetSessionAndUserResponse,
  AuthGetSessionAndUserNotFoundResponse,
  AuthGetSessionAndUserErrorResponse,
  AuthCreateUserInput,
  AuthUpdateUserInput,
  AuthAccountInput,
  AuthSessionInput,
  AuthUpdateSessionInput,
  AuthVerificationTokenInput,
  AuthUseVerificationTokenInput,
  AuthWriteErrorResponse,
  AuthUserWriteResponse,
  AuthAccountWriteResponse,
  AuthSessionWriteResponse,
  AuthVerificationTokenWriteResponse,
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

  async authGetUserByEmail(
    input: AuthGetUserByEmailInput,
  ): Promise<AuthGetUserByEmailResponse | AuthGetUserByEmailNotFoundResponse | AuthGetUserByEmailErrorResponse> {
    const email = input?.email?.trim();
    if (!email || email.length > 320) {
      return { ok: false, code: "INVALID_INPUT" };
    }

    const prisma = this.createPrisma();
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, emailVerified: true, image: true },
      });
      if (!user) return { found: false };
      return {
        found: true,
        user: { ...user, emailVerified: user.emailVerified?.toISOString() ?? null },
      };
    } catch (error) {
      console.error("Auth email lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally {
      await prisma.$disconnect();
    }
  }

  async authGetUserByAccount(
    input: AuthGetUserByAccountInput,
  ): Promise<AuthGetUserByAccountResponse | AuthGetUserByAccountNotFoundResponse | AuthGetUserByAccountErrorResponse> {
    const provider = input?.provider?.trim();
    const providerAccountId = input?.providerAccountId?.trim();
    if (!provider || provider.length > 100 || !providerAccountId || providerAccountId.length > 512) {
      return { ok: false, code: "INVALID_INPUT" };
    }

    const prisma = this.createPrisma();
    try {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        select: {
          user: {
            select: { id: true, name: true, email: true, emailVerified: true, image: true },
          },
        },
      });
      if (!account) return { found: false };
      return {
        found: true,
        user: { ...account.user, emailVerified: account.user.emailVerified?.toISOString() ?? null },
      };
    } catch (error) {
      console.error("Auth account lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally {
      await prisma.$disconnect();
    }
  }

  async authCreateUser(input: AuthCreateUserInput): Promise<AuthUserWriteResponse | AuthWriteErrorResponse> {
    if (!input || typeof input.email !== "string" || !input.email.trim()) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try {
      const user = await prisma.user.create({ data: {
        name: input.name ?? null, email: input.email, emailVerified: input.emailVerified ? new Date(input.emailVerified) : null, image: input.image ?? null,
      }, select: { id: true, name: true, email: true, emailVerified: true, image: true } });
      return { user: { ...user, emailVerified: user.emailVerified?.toISOString() ?? null } };
    } catch (error) { return this.mapWriteError(error, "Auth user create failed"); }
    finally { await prisma.$disconnect(); }
  }

  async authUpdateUser(input: AuthUpdateUserInput): Promise<AuthUserWriteResponse | AuthWriteErrorResponse> {
    if (!input?.id?.trim()) return { ok: false, code: "INVALID_INPUT" };
    const data: Record<string, unknown> = {};
    for (const key of ["name", "email", "emailVerified", "image"] as const) {
      if (Object.prototype.hasOwnProperty.call(input, key)) data[key] = key === "emailVerified" && input[key] ? new Date(input[key] as string) : input[key];
    }
    const prisma = this.createPrisma();
    try {
      const user = await prisma.user.update({ where: { id: input.id }, data, select: { id: true, name: true, email: true, emailVerified: true, image: true } });
      return { user: { ...user, emailVerified: user.emailVerified?.toISOString() ?? null } };
    } catch (error) { return this.mapWriteError(error, "Auth user update failed"); }
    finally { await prisma.$disconnect(); }
  }

  async authDeleteUser(input: { userId: string }): Promise<AuthUserWriteResponse | AuthWriteErrorResponse> {
    if (!input?.userId?.trim()) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try {
      const user = await prisma.user.delete({ where: { id: input.userId }, select: { id: true, name: true, email: true, emailVerified: true, image: true } });
      return { user: { ...user, emailVerified: user.emailVerified?.toISOString() ?? null } };
    } catch (error) { return this.mapWriteError(error, "Auth user delete failed"); }
    finally { await prisma.$disconnect(); }
  }

  async authLinkAccount(input: AuthAccountInput): Promise<AuthAccountWriteResponse | AuthWriteErrorResponse> {
    if (!input?.userId || !input.type || !input.provider || !input.providerAccountId) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try {
      const account = await prisma.account.create({ data: input });
      return { account: { ...account } };
    } catch (error) { return this.mapWriteError(error, "Auth account link failed"); }
    finally { await prisma.$disconnect(); }
  }

  async authUnlinkAccount(input: { provider: string; providerAccountId: string }): Promise<AuthAccountWriteResponse | AuthWriteErrorResponse> {
    if (!input?.provider || !input.providerAccountId) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try { return { account: await prisma.account.delete({ where: { provider_providerAccountId: input } }) }; }
    catch (error) { return this.mapWriteError(error, "Auth account unlink failed"); }
    finally { await prisma.$disconnect(); }
  }

  async authCreateSession(input: AuthSessionInput): Promise<AuthSessionWriteResponse | AuthWriteErrorResponse> {
    if (!input?.sessionToken || !input.userId || !input.expires) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try { const session = await prisma.session.create({ data: { sessionToken: input.sessionToken, userId: input.userId, expires: new Date(input.expires) } }); return { session: { ...session, expires: session.expires.toISOString() } }; }
    catch (error) { return this.mapWriteError(error, "Auth session create failed"); }
    finally { await prisma.$disconnect(); }
  }

  async authUpdateSession(input: AuthUpdateSessionInput): Promise<AuthSessionWriteResponse | AuthWriteErrorResponse> {
    if (!input?.sessionToken) return { ok: false, code: "INVALID_INPUT" };
    const data: Record<string, unknown> = {};
    if (Object.prototype.hasOwnProperty.call(input, "userId")) data.userId = input.userId;
    if (Object.prototype.hasOwnProperty.call(input, "expires")) data.expires = input.expires ? new Date(input.expires) : input.expires;
    const prisma = this.createPrisma();
    try { const session = await prisma.session.update({ where: { sessionToken: input.sessionToken }, data }); return { session: { ...session, expires: session.expires.toISOString() } }; }
    catch (error) { return this.mapWriteError(error, "Auth session update failed"); }
    finally { await prisma.$disconnect(); }
  }

  async authDeleteSession(input: { sessionToken: string }): Promise<AuthSessionWriteResponse | AuthWriteErrorResponse> {
    if (!input?.sessionToken) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try { const session = await prisma.session.delete({ where: { sessionToken: input.sessionToken } }); return { session: { ...session, expires: session.expires.toISOString() } }; }
    catch (error) { return this.mapWriteError(error, "Auth session delete failed"); }
    finally { await prisma.$disconnect(); }
  }

  async authCreateVerificationToken(input: AuthVerificationTokenInput): Promise<AuthVerificationTokenWriteResponse | AuthWriteErrorResponse> {
    if (!input?.identifier || !input.token || !input.expires) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try { const token = await prisma.verificationToken.create({ data: { identifier: input.identifier, token: input.token, expires: new Date(input.expires) } }); return { token: { ...token, expires: token.expires.toISOString() } }; }
    catch (error) { return this.mapWriteError(error, "Auth verification token create failed"); }
    finally { await prisma.$disconnect(); }
  }

  async authUseVerificationToken(input: AuthUseVerificationTokenInput): Promise<AuthVerificationTokenWriteResponse | AuthWriteErrorResponse> {
    if (!input?.identifier || !input.token) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try { const token = await prisma.verificationToken.delete({ where: { identifier_token: input } }); return { token: { ...token, expires: token.expires.toISOString() } }; }
    catch (error) { const code = (error as { code?: string }).code === "P2025" ? "NOT_FOUND" : "INTERNAL_DB_ERROR"; return { ok: false, code }; }
    finally { await prisma.$disconnect(); }
  }

  private createPrisma() {
    const adapter = new PrismaPg({
      connectionString: this.env.HYPERDRIVE.connectionString,
      maxUses: 1,
    });
    return new PrismaClient({ adapter });
  }

  private mapWriteError(error: unknown, message: string): AuthWriteErrorResponse {
    console.error(message, toSafeErrorResponse(error));
    const code = (error as { code?: string }).code;
    return { ok: false, code: code === "P2002" ? "CONFLICT" : code === "P2025" ? "NOT_FOUND" : "INTERNAL_DB_ERROR" };
  }
}
