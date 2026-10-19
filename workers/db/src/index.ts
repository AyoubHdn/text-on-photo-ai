import { WorkerEntrypoint } from "cloudflare:workers";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DbServiceError, toSafeErrorResponse } from "./errors";
import type {
  DiagnosticResponse,
  Env,
  HealthResponse,
  IconDto,
  IconUserReadResult,
  IconListResult,
  IconWriteResult,
  PopularIconListResult,
  UserReadInput,
  UserCreditsResult,
  UserCreditUpgradeStateResult,
  UserPaidTrafficFunnelStateResult,
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
  AuthFinalizeEventInput,
  AuthFinalizeEventResult,
  AuthEventSyncState,
  DigitalArtInterest,
} from "./types";

const AUTH_INTERESTS = new Set<DigitalArtInterest>(["name_art", "arabic_name_art", "couples_art"]);
const SOURCE_PAGE_INTEREST: Record<string, DigitalArtInterest> = {
  "name-art-generator": "name_art",
  "arabic-calligraphy-generator": "arabic_name_art",
  "couples-art-generator": "couples_art",
};

function normalizeAuthInterest(value: unknown): DigitalArtInterest | null {
  return typeof value === "string" && AUTH_INTERESTS.has(value as DigitalArtInterest) ? value as DigitalArtInterest : null;
}

function interestFromMetadata(metadata: unknown): DigitalArtInterest | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const sourcePage = (metadata as { sourcePage?: unknown }).sourcePage;
  if (typeof sourcePage !== "string") return null;
  return SOURCE_PAGE_INTEREST[sourcePage.trim().toLowerCase()] ?? null;
}

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

  async iconGetIconsForUser(input: { userId: string }): Promise<IconUserReadResult> {
    const userId = input?.userId?.trim();
    if (!userId || userId.length > 128) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, icons: { orderBy: { createdAt: "desc" } } } });
      if (!user) return { found: false };
      return { found: true, plan: user.plan, icons: user.icons.map((icon) => ({ ...icon, createdAt: icon.createdAt.toISOString(), backgroundRemovedAt: icon.backgroundRemovedAt?.toISOString() ?? null })) };
    } catch (error) {
      console.error("User icon lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally { await prisma.$disconnect(); }
  }

  async iconGetCommunityIcons(): Promise<IconListResult> {
    const prisma = this.createPrisma();
    try {
      const icons = await prisma.icon.findMany({ where: { isPublic: true, NOT: ["couple-name-mug-v1", "couple-avatar-name-mug-v1", "couple-names-only-mug-v1"].map((sourcePage) => ({ metadata: { path: ["sourcePage"], equals: sourcePage } })) }, take: 50, orderBy: { createdAt: "desc" } });
      return { icons: icons.map((icon) => ({ ...icon, createdAt: icon.createdAt.toISOString(), backgroundRemovedAt: icon.backgroundRemovedAt?.toISOString() ?? null })) };
    } catch (error) {
      console.error("Community icon lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally { await prisma.$disconnect(); }
  }

  async iconGetPopularPaidIcons(input: { limit: number }): Promise<PopularIconListResult> {
    const limit = input?.limit;
    if (!Number.isInteger(limit) || limit < 1 || limit > 30) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try {
      const icons = await prisma.icon.findMany({ where: { isPublic: true, NOT: ["couple-name-mug-v1", "couple-avatar-name-mug-v1", "couple-names-only-mug-v1"].map((sourcePage) => ({ metadata: { path: ["sourcePage"], equals: sourcePage } })), User: { plan: { not: "None" } } }, orderBy: { createdAt: "desc" }, take: limit, select: { id: true, prompt: true, metadata: true } });
      return { icons };
    } catch (error) {
      console.error("Popular icon lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally { await prisma.$disconnect(); }
  }

  async iconUpdateVisibility(input: { userId: string; iconId: string; isPublic: boolean }): Promise<IconWriteResult> {
    const userId = input?.userId?.trim();
    const iconId = input?.iconId?.trim();
    if (!userId || userId.length > 128 || !iconId || iconId.length > 128 || typeof input?.isPublic !== "boolean") {
      return { ok: false, code: "INVALID_INPUT" };
    }
    const prisma = this.createPrisma();
    try {
      const icon = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { plan: true } });
        if (user?.plan === "None" && input.isPublic === false) return { error: "FORBIDDEN" as const };
        const owned = await tx.icon.findFirst({ where: { id: iconId, userId } });
        if (!owned) return { error: "FORBIDDEN" as const };
        return { value: await tx.icon.update({ where: { id: iconId }, data: { isPublic: input.isPublic } }) };
      });
      if ("error" in icon) return { ok: false, code: "FORBIDDEN" };
      return { icon: { ...icon.value, createdAt: icon.value.createdAt.toISOString(), backgroundRemovedAt: icon.value.backgroundRemovedAt?.toISOString() ?? null } };
    } catch (error) {
      console.error("Icon visibility update failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally { await prisma.$disconnect(); }
  }

  async userGetCredits(input: UserReadInput): Promise<UserCreditsResult> {
    const userId = input?.userId?.trim();
    if (!userId || userId.length > 128) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
      return user ? { found: true, credits: user.credits.toString() } : { found: false };
    } catch (error) {
      console.error("User credits lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally { await prisma.$disconnect(); }
  }

  async userGetCreditUpgradeState(input: UserReadInput): Promise<UserCreditUpgradeStateResult> {
    const userId = input?.userId?.trim();
    if (!userId || userId.length > 128) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true, hasGeneratedDesign: true } });
      return user ? { found: true, plan: user.plan, hasGeneratedDesign: Boolean(user.hasGeneratedDesign) } : { found: false };
    } catch (error) {
      console.error("User credit upgrade lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally { await prisma.$disconnect(); }
  }

  async userGetPaidTrafficFunnelState(input: UserReadInput): Promise<UserPaidTrafficFunnelStateResult> {
    const userId = input?.userId?.trim();
    if (!userId || userId.length > 128) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { paidTrafficUser: true, paidTrafficFreeCreditsGranted: true, paidTrafficFreePreviewUsed: true, hasGeneratedDesign: true, hasVisitedCheckout: true } });
      return user ? { found: true, paidTrafficUser: Boolean(user.paidTrafficUser), paidTrafficFreeCreditsGranted: Boolean(user.paidTrafficFreeCreditsGranted), paidTrafficFreePreviewUsed: Boolean(user.paidTrafficFreePreviewUsed), hasGeneratedDesign: Boolean(user.hasGeneratedDesign), hasVisitedCheckout: Boolean(user.hasVisitedCheckout) } : { found: false };
    } catch (error) {
      console.error("Paid traffic funnel lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally { await prisma.$disconnect(); }
  }

  /* Abandoned physical-commerce RPCs retained only in history.
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

  */
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

  async authFinalizeSignIn(input: AuthFinalizeEventInput): Promise<AuthFinalizeEventResult> {
    return this.finalizeAuthEventState(input);
  }

  async authFinalizeNewUser(input: AuthFinalizeEventInput): Promise<AuthFinalizeEventResult> {
    return this.finalizeAuthEventState(input);
  }

  private async finalizeAuthEventState(input: AuthFinalizeEventInput): Promise<AuthFinalizeEventResult> {
    if (!input || typeof input.userId !== "string" || !input.userId.trim() || input.userId.length > 128 || typeof input.markPaidTraffic !== "boolean" || (input.digitalArtInterest !== null && !AUTH_INTERESTS.has(input.digitalArtInterest))) {
      return { ok: false, code: "INVALID_INPUT" };
    }
    const prisma = this.createPrisma();
    try {
      return await prisma.$transaction(async (tx) => {
        const current = await tx.user.findUnique({
          where: { id: input.userId.trim() },
          select: {
            email: true,
            name: true,
            credits: true,
            plan: true,
            paidTrafficUser: true,
            hasGeneratedDesign: true,
            hasVisitedCheckout: true,
            firstDigitalArtInterest: true,
            latestDigitalArtInterest: true,
          },
        });
        if (!current) return { found: false };

        let firstInterest = normalizeAuthInterest(current.firstDigitalArtInterest);
        let latestInterest = normalizeAuthInterest(current.latestDigitalArtInterest);
        if (!firstInterest && !latestInterest && input.digitalArtInterest) {
          const icons = await tx.icon.findMany({
            where: { userId: input.userId.trim() },
            orderBy: { createdAt: "asc" },
            select: { metadata: true },
          });
          for (const icon of icons) {
            const interest = interestFromMetadata(icon.metadata);
            if (!interest) continue;
            if (!firstInterest) firstInterest = interest;
            latestInterest = interest;
          }
        }

        const shouldUpdate = input.markPaidTraffic || Boolean(input.digitalArtInterest);
        const finalUser = shouldUpdate
          ? await tx.user.update({
              where: { id: input.userId.trim() },
              data: {
                ...(input.markPaidTraffic ? { paidTrafficUser: true } : {}),
                ...(input.digitalArtInterest ? {
                  firstDigitalArtInterest: firstInterest ?? input.digitalArtInterest,
                  latestDigitalArtInterest: input.digitalArtInterest,
                } : {}),
              },
              select: {
                email: true,
                name: true,
                credits: true,
                plan: true,
                paidTrafficUser: true,
                hasGeneratedDesign: true,
                hasVisitedCheckout: true,
                firstDigitalArtInterest: true,
                latestDigitalArtInterest: true,
              },
            })
          : current;

        const syncState: AuthEventSyncState = {
          email: finalUser.email,
          name: finalUser.name,
          credits: finalUser.credits.toString(),
          plan: finalUser.plan,
          paidTrafficUser: finalUser.paidTrafficUser,
          hasGeneratedDesign: finalUser.hasGeneratedDesign,
          hasVisitedCheckout: finalUser.hasVisitedCheckout,
          firstDigitalArtInterest: input.digitalArtInterest ? (normalizeAuthInterest(finalUser.firstDigitalArtInterest) ?? firstInterest ?? input.digitalArtInterest) : (normalizeAuthInterest(finalUser.firstDigitalArtInterest) ?? firstInterest),
          latestDigitalArtInterest: input.digitalArtInterest ? input.digitalArtInterest : (normalizeAuthInterest(finalUser.latestDigitalArtInterest) ?? latestInterest),
        };
        return { found: true, syncState };
      });
    } catch (error) {
      return this.mapWriteError(error, "Auth event state finalization failed");
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

  private mapWriteError(error: unknown, message: string): AuthWriteErrorResponse {
    console.error(message, toSafeErrorResponse(error));
    const code = (error as { code?: string }).code;
    return { ok: false, code: code === "P2002" ? "CONFLICT" : code === "P2025" ? "NOT_FOUND" : "INTERNAL_DB_ERROR" };
  }
}
