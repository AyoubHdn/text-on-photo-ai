import { WorkerEntrypoint } from "cloudflare:workers";
import { PrismaClient, Prisma } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DbServiceError, toSafeErrorResponse } from "./errors";
import {
  DEFAULT_PROCESSING_GRACE_SECONDS,
  DEFAULT_RECOVERY_BATCH_SIZE,
  DEFAULT_RECOVERY_MAX_MS,
  GENERATION_ASYNC_REQUEST_TYPE,
  DEFAULT_RECOVERY_DB_LOCK_TIMEOUT_MS,
  DEFAULT_RECOVERY_DB_MAX_WAIT_MS,
  DEFAULT_RECOVERY_DB_TIMEOUT_MS,
  isStaleGenerationRequest,
  isValidOptionalExecutionScope,
  normalizeOptionalExecutionScope,
  parseRecoveryPositiveInt,
  recoveryBackoffSeconds,
  recoveryDbTimeouts,
  recoveryCandidateWhere,
  runBoundedRecovery,
  scheduleGenerationRecovery,
} from "./recovery";
import type { RecoveryDbTimeouts } from "./recovery";
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
  GenerationStartInput,
  GenerationStartResult,
  GenerationClaimInput,
  GenerationClaimResult,
  GenerationPredictionInput,
  GenerationPredictionResult,
  GenerationStatusInput,
  GenerationStatusResult,
  GenerationFinalizeSuccessInput,
  GenerationFinalizeSuccessResult,
  GenerationMauticSyncInput,
  GenerationMauticSyncStateResult,
  GenerationFinalizeFailureInput,
  GenerationFinalizeFailureResult,
  GenerationFailIfUnclaimedInput,
  GenerationFailIfStaleInput,
  StripePurchaseInput,
  StripePurchaseResult,
} from "./types";

const AUTH_INTERESTS = new Set<DigitalArtInterest>(["name_art", "arabic_name_art", "couples_art"]);
const SOURCE_PAGE_INTEREST: Record<string, DigitalArtInterest> = {
  "name-art-generator": "name_art",
  "arabic-calligraphy-generator": "arabic_name_art",
  "couples-art-generator": "couples_art",
};

function persistedStripePlan(value: string): "Starter" | "Pro" | "Elite" {
  if (value === "Starter" || value === "Pro" || value === "Elite") return value;
  throw new DbServiceError("INTERNAL_DB_ERROR", "Stripe purchase plan was not persisted");
}

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

  async scheduled(_controller: ScheduledController): Promise<void> {
    scheduleGenerationRecovery(
      this.env,
      (promise) => this.ctx.waitUntil(promise),
      (scope, batchSize, maxDurationMs, processingGraceSeconds, dbTimeouts) =>
        this.runGenerationRecovery(scope, batchSize, maxDurationMs, processingGraceSeconds, dbTimeouts),
    );
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

  async stripeFulfillPurchase(input: StripePurchaseInput): Promise<StripePurchaseResult> {
    if (!input || !/^[A-Za-z0-9_:-]{1,255}$/.test(input.eventId) || !input.eventType || !input.userId || !Number.isInteger(input.credits) || input.credits <= 0 || !["Starter", "Pro", "Elite"].includes(input.plan)) {
      return { ok: false, code: "INVALID_INPUT" };
    }
    const prisma = this.createPrisma();
    try {
      const result = await prisma.$transaction(async (tx) => {
        try {
          await tx.stripeWebhookEvent.create({ data: { id: input.eventId, type: input.eventType, stripeSessionId: input.stripeSessionId, userId: input.userId } });
        } catch (error) {
          if ((error as { code?: string }).code === "P2002") return { outcome: "DUPLICATE" as const };
          throw error;
        }
        const updatedUser = await tx.user.update({
          where: { id: input.userId },
          data: { credits: { increment: input.credits }, plan: input.plan },
          select: { email: true, name: true, credits: true, plan: true },
        });
        return { outcome: "APPLIED" as const, updatedUser: { ...updatedUser, plan: persistedStripePlan(updatedUser.plan) } };
      });
      if (result.outcome === "DUPLICATE") return result;
      return { outcome: "APPLIED", updatedUser: { ...result.updatedUser, credits: result.updatedUser.credits.toString() } };
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === "P2025") return { ok: false, code: "NOT_FOUND" };
      console.error("Stripe purchase fulfillment failed", toSafeErrorResponse(error));
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

  async generationStartOrGetAndReserve(input: GenerationStartInput): Promise<GenerationStartResult> {
    if (!this.validGenerationInput(input)) return { ok: false, code: "INVALID_INPUT" };
    let charged: Prisma.Decimal;
    try { charged = new Prisma.Decimal(input.creditsCharged); } catch { return { ok: false, code: "INVALID_INPUT" }; }
    if (charged.lessThan(0) || !Number.isFinite(Number(charged.toString()))) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try {
      const existing = await prisma.generationRequest.findUnique({ where: { generationRequestId: input.generationRequestId } });
      if (existing) return await this.generationExistingResult(prisma, existing, input);
      try {
        const result = await prisma.$transaction(async (tx) => {
          const again = await tx.generationRequest.findUnique({ where: { generationRequestId: input.generationRequestId } });
          if (again) return { existing: again };
          const updated = await tx.user.updateMany({ where: { id: input.userId, credits: { gte: charged } }, data: { credits: { decrement: charged }, hasGeneratedDesign: true } });
          if (updated.count !== 1) {
            const user = await tx.user.findUnique({ where: { id: input.userId }, select: { id: true } });
            throw new DbServiceError(user ? "INSUFFICIENT_CREDITS" : "NOT_FOUND");
          }
          const created = await tx.generationRequest.create({ data: { generationRequestId: input.generationRequestId, userId: input.userId, sourcePage: input.sourcePage, requestType: input.requestType, executionScope: normalizeOptionalExecutionScope(input.executionScope), model: input.model, promptHash: input.promptHash, inputHash: input.inputHash, status: "started", numberOfImages: input.numberOfImages, aspectRatio: input.aspectRatio, creditsCharged: charged } });
          return { created };
        });
        if ("existing" in result) return await this.generationExistingResult(prisma, result.existing, input);
        const balance = await prisma.user.findUnique({ where: { id: input.userId }, select: { credits: true } });
        return { outcome: "CREATED", job: this.generationJob(result.created, balance?.credits ?? null) };
      } catch (error) {
        if ((error as { code?: string }).code === "P2002") {
          const raced = await prisma.generationRequest.findUnique({ where: { generationRequestId: input.generationRequestId } });
          if (raced) return await this.generationExistingResult(prisma, raced, input);
        }
        if (error instanceof DbServiceError) return { ok: false, code: error.code as any };
        throw error;
      }
    } catch (error) { console.error("Generation reservation failed", error, toSafeErrorResponse(error)); return { ok: false, code: "INTERNAL_DB_ERROR" }; }
    finally { await prisma.$disconnect(); }
  }

  async generationClaimExecution(input: GenerationClaimInput): Promise<GenerationClaimResult> {
    if (!input?.generationRequestId || !input.processingAttemptId || !Number.isInteger(input.leaseSeconds) || input.leaseSeconds < 30 || input.leaseSeconds > 900) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try {
      const now = new Date(); const leaseExpiresAt = new Date(now.getTime() + input.leaseSeconds * 1000);
      const claimed = await prisma.generationRequest.updateMany({ where: { generationRequestId: input.generationRequestId, status: "started" }, data: { status: "processing", processingAttemptId: input.processingAttemptId, processingStartedAt: now, leaseExpiresAt } });
      const request = await prisma.generationRequest.findUnique({ where: { generationRequestId: input.generationRequestId } });
      if (!request) return { ok: false, code: "NOT_FOUND" };
      if (claimed.count === 1) return { outcome: "CLAIMED", job: this.generationJob(request, null) };
      if (request.status === "processing") return { outcome: "ALREADY_CLAIMED", job: this.generationJob(request, null) };
      return { outcome: "TERMINAL", job: this.generationJob(request, null) };
    } catch (error) { console.error("Generation claim failed", toSafeErrorResponse(error)); return { ok: false, code: "INTERNAL_DB_ERROR" }; }
    finally { await prisma.$disconnect(); }
  }

  async generationSetPredictionId(input: GenerationPredictionInput): Promise<GenerationPredictionResult> {
    if (!input?.generationRequestId || !input.processingAttemptId || !input.predictionId) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try { const updated = await prisma.generationRequest.updateMany({ where: { generationRequestId: input.generationRequestId, status: "processing", processingAttemptId: input.processingAttemptId }, data: { predictionId: input.predictionId } }); return { outcome: updated.count === 1 ? "UPDATED" : "NOOP" }; }
    catch (error) { console.error("Generation prediction update failed", toSafeErrorResponse(error)); return { ok: false, code: "INTERNAL_DB_ERROR" }; }
    finally { await prisma.$disconnect(); }
  }

  async generationGetStatus(input: GenerationStatusInput): Promise<GenerationStatusResult> {
    if (!input?.generationRequestId || !input.userId) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try { const request = await prisma.generationRequest.findFirst({ where: { generationRequestId: input.generationRequestId, userId: input.userId } }); return request ? { found: true, job: this.generationJob(request, null) } : { found: false }; }
    catch (error) { console.error("Generation status lookup failed", toSafeErrorResponse(error)); return { ok: false, code: "INTERNAL_DB_ERROR" }; }
    finally { await prisma.$disconnect(); }
  }

  async generationGetMauticSyncState(input: GenerationMauticSyncInput): Promise<GenerationMauticSyncStateResult> {
    if (!input?.userId) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          email: true,
          name: true,
          credits: true,
          hasGeneratedDesign: true,
          firstDigitalArtInterest: true,
          latestDigitalArtInterest: true,
        },
      });
      if (!user) return { found: false };
      return {
        found: true,
        state: {
          email: user.email,
          name: user.name,
          credits: user.credits.toString(),
          hasGeneratedDesign: user.hasGeneratedDesign,
          firstDigitalArtInterest: normalizeAuthInterest(user.firstDigitalArtInterest),
          latestDigitalArtInterest: normalizeAuthInterest(user.latestDigitalArtInterest),
        },
      };
    } catch (error) {
      console.error("Generation Mautic sync state lookup failed", toSafeErrorResponse(error));
      return { ok: false, code: "INTERNAL_DB_ERROR" };
    } finally {
      await prisma.$disconnect();
    }
  }

  async generationFinalizeSuccess(input: GenerationFinalizeSuccessInput): Promise<GenerationFinalizeSuccessResult> {
    if (!input?.generationRequestId || !input.processingAttemptId || !Array.isArray(input.outputs) || input.outputs.length === 0) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "GenerationRequest" WHERE "generationRequestId" = ${input.generationRequestId} FOR UPDATE`;
        const request = await tx.generationRequest.findUnique({ where: { generationRequestId: input.generationRequestId } });
        if (!request) throw new DbServiceError("NOT_FOUND");
        if (request.status === "completed" || request.status === "failed") return { outcome: "TERMINAL_NOOP" as const, request };
        if (request.status !== "processing" || request.processingAttemptId !== input.processingAttemptId) throw new DbServiceError("CONFLICT");
        const expected = request.numberOfImages ?? input.outputs.length; if (input.outputs.length !== expected) throw new DbServiceError("INVALID_INPUT");
        for (const [index, output] of input.outputs.entries()) {
          const expectedId = `${request.generationRequestId}-${index}`;
          if (output.iconId !== expectedId || output.s3Key !== expectedId || !output.imageUrl) throw new DbServiceError("INVALID_INPUT");
          await tx.icon.create({ data: { id: output.iconId, userId: request.userId, prompt: output.prompt, isPublic: output.isPublic ?? true, metadata: (output.metadata ?? {}) as Prisma.InputJsonValue } });
        }
        const explicitInterest = input.digitalArtInterest ? normalizeAuthInterest(input.digitalArtInterest) : null;
        if (input.digitalArtInterest && !explicitInterest) throw new DbServiceError("INVALID_INPUT");
        const interest = explicitInterest ?? SOURCE_PAGE_INTEREST[request.sourcePage ?? ""];
        if (request.userId && interest) {
          await tx.$executeRaw`
            UPDATE "User"
            SET
              "firstDigitalArtInterest" = COALESCE("firstDigitalArtInterest", ${interest}),
              "latestDigitalArtInterest" = ${interest}
            WHERE "id" = ${request.userId}
          `;
        }
        const updated = await tx.generationRequest.update({ where: { generationRequestId: input.generationRequestId }, data: { status: "completed", resultImageUrls: input.outputs.map((o) => o.imageUrl), predictionId: input.predictionId ?? undefined, completedAt: new Date(), processingAttemptId: null, processingStartedAt: null, leaseExpiresAt: null } });
        return { outcome: "COMPLETED" as const, request: updated };
      });
      return { outcome: result.outcome, job: this.generationJob(result.request, null) };
    } catch (error) { if (error instanceof DbServiceError) return { ok: false, code: error.code as any }; console.error("Generation success finalization failed", toSafeErrorResponse(error)); return { ok: false, code: "INTERNAL_DB_ERROR" }; }
    finally { await prisma.$disconnect(); }
  }

  async generationFinalizeFailure(input: GenerationFinalizeFailureInput): Promise<GenerationFinalizeFailureResult> { return this.failGeneration(input.generationRequestId, input.errorMessage, "processing", input.processingAttemptId); }
  async generationFailIfUnclaimed(input: GenerationFailIfUnclaimedInput): Promise<GenerationFinalizeFailureResult> { return this.failGeneration(input.generationRequestId, input.errorMessage, "started"); }

  async generationFailIfStale(input: GenerationFailIfStaleInput): Promise<GenerationFinalizeFailureResult> {
    if (!input?.generationRequestId || !input.executionScope || !input.errorMessage) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    const dbTimeouts = recoveryDbTimeouts(input.databaseTimeoutMs, input.databaseLockTimeoutMs, input.databaseMaxWaitMs);
    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT set_config('statement_timeout', ${`${dbTimeouts.statementTimeoutMs}ms`}, true), set_config('lock_timeout', ${`${dbTimeouts.lockTimeoutMs}ms`}, true)`;
        await tx.$queryRaw`SELECT "id" FROM "GenerationRequest" WHERE "generationRequestId" = ${input.generationRequestId} FOR UPDATE`;
        const request = await tx.generationRequest.findUnique({ where: { generationRequestId: input.generationRequestId } });
        if (!request) throw new DbServiceError("NOT_FOUND");
        const now = new Date();
        const stale = (!request.recoveryNextAttemptAt || request.recoveryNextAttemptAt <= now) && isStaleGenerationRequest(request, now, input.executionScope, input.processingGraceSeconds ?? DEFAULT_PROCESSING_GRACE_SECONDS);
        if (!stale || request.status === "completed" || request.status === "failed") return { outcome: "TERMINAL_NOOP" as const, request };
        const transition = await tx.generationRequest.updateMany({ where: { generationRequestId: input.generationRequestId, requestType: GENERATION_ASYNC_REQUEST_TYPE, executionScope: input.executionScope, status: request.status, processingAttemptId: request.processingAttemptId }, data: { status: "failed", errorMessage: input.errorMessage.slice(0, 1000), failedAt: new Date(), processingAttemptId: null, processingStartedAt: null, leaseExpiresAt: null } });
        if (transition.count !== 1) return { outcome: "TERMINAL_NOOP" as const, request };
        const updated = await tx.generationRequest.findUniqueOrThrow({ where: { generationRequestId: input.generationRequestId } });
        if (request.userId && request.creditsCharged) await tx.user.update({ where: { id: request.userId }, data: { credits: { increment: request.creditsCharged } } });
        return { outcome: "FAILED" as const, request: updated };
      }, { maxWait: dbTimeouts.maxWaitMs, timeout: dbTimeouts.statementTimeoutMs });
      return { outcome: result.outcome, job: this.generationJob(result.request, null) };
    } catch (error) { if (error instanceof DbServiceError) return { ok: false, code: error.code as any }; console.error("Stale generation reconciliation failed", toSafeErrorResponse(error)); return { ok: false, code: "INTERNAL_DB_ERROR" }; }
    finally { await prisma.$disconnect(); }
  }


  private async runGenerationRecovery(scope: string, batchSize: number, maxDurationMs: number, processingGraceSeconds: number, dbTimeouts: RecoveryDbTimeouts) {
    const prisma = this.createPrisma();
    try {
      const candidateTime = new Date();
      const result = await runBoundedRecovery({
        batchSize,
        maxDurationMs,
        listCandidates: async (limit) => prisma.$transaction(async (tx) => {
          await this.setRecoveryDbTimeouts(tx, dbTimeouts);
          return tx.generationRequest.findMany({
            where: recoveryCandidateWhere(candidateTime, scope, processingGraceSeconds),
            // Fresh candidates must progress before retryable failures; keep the secondary key deterministic.
            orderBy: [{ recoveryNextAttemptAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
            take: limit,
            select: {
              generationRequestId: true,
              requestType: true,
              executionScope: true,
              status: true,
              processingAttemptId: true,
              createdAt: true,
              leaseExpiresAt: true,
              recoveryNextAttemptAt: true,
            },
          });
        }, { maxWait: dbTimeouts.maxWaitMs, timeout: dbTimeouts.statementTimeoutMs }),
        reconcileOne: async (candidate) => {
          const transition = await this.generationFailIfStale({
            generationRequestId: candidate.generationRequestId,
            executionScope: scope,
            processingGraceSeconds,
            databaseTimeoutMs: dbTimeouts.statementTimeoutMs,
            databaseLockTimeoutMs: dbTimeouts.lockTimeoutMs,
            databaseMaxWaitMs: dbTimeouts.maxWaitMs,
            errorMessage: "GENERATION_RECOVERY_STALE",
          });
          if ("ok" in transition) throw new Error(`RECOVERY_${transition.code}`);
          return transition.outcome;
        },
        onError: async (candidate) => {
          await this.markGenerationRecoveryFailure(candidate, scope, dbTimeouts);
        },
      });
      if (result.examined > 0 || result.errors > 0) console.log("Generation recovery run complete", result);
    } catch (error) {
      console.error("Generation recovery run failed", toSafeErrorResponse(error));
    } finally {
      await prisma.$disconnect();
    }
  }

  private async setRecoveryDbTimeouts(tx: any, dbTimeouts: RecoveryDbTimeouts) {
    await tx.$queryRaw`SELECT set_config('statement_timeout', ${`${dbTimeouts.statementTimeoutMs}ms`}, true), set_config('lock_timeout', ${`${dbTimeouts.lockTimeoutMs}ms`}, true)`;
  }

  private async markGenerationRecoveryFailure(candidate: any, scope: string, dbTimeouts: RecoveryDbTimeouts): Promise<void> {
    const prisma = this.createPrisma();
    try {
      await prisma.$transaction(async (tx) => {
        await this.setRecoveryDbTimeouts(tx, dbTimeouts);
        await tx.$queryRaw`SELECT "id" FROM "GenerationRequest" WHERE "generationRequestId" = ${candidate.generationRequestId} FOR UPDATE`;
        const request = await tx.generationRequest.findUnique({ where: { generationRequestId: candidate.generationRequestId } });
        if (!request || request.requestType !== GENERATION_ASYNC_REQUEST_TYPE || request.executionScope !== scope) return;
        if (request.status === "completed" || request.status === "failed") return;
        if (request.status !== candidate.status || request.processingAttemptId !== candidate.processingAttemptId) return;
        const attempt = (request.recoveryAttemptCount ?? 0) + 1;
        const nextAttemptAt = new Date(Date.now() + recoveryBackoffSeconds(attempt) * 1000);
        await tx.generationRequest.updateMany({
          where: {
            generationRequestId: candidate.generationRequestId,
            requestType: GENERATION_ASYNC_REQUEST_TYPE,
            executionScope: scope,
            status: candidate.status,
            processingAttemptId: candidate.processingAttemptId,
          },
          data: {
            recoveryAttemptCount: attempt,
            recoveryNextAttemptAt: nextAttemptAt,
            recoveryLastError: "GENERATION_RECOVERY_RETRY",
          },
        });
      }, { maxWait: dbTimeouts.maxWaitMs, timeout: dbTimeouts.statementTimeoutMs });
    } catch (error) {
      console.error("Generation recovery retry marker failed", {
        generationRequestId: candidate.generationRequestId,
        error: toSafeErrorResponse(error),
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  private async failGeneration(generationRequestId: string, errorMessage: string, status: "started" | "processing", attemptId?: string): Promise<GenerationFinalizeFailureResult> {
    if (!generationRequestId || !errorMessage || (status === "processing" && !attemptId)) return { ok: false, code: "INVALID_INPUT" };
    const prisma = this.createPrisma();
    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "GenerationRequest" WHERE "generationRequestId" = ${generationRequestId} FOR UPDATE`;
        const request = await tx.generationRequest.findUnique({ where: { generationRequestId } });
        if (!request) throw new DbServiceError("NOT_FOUND");
        if (request.status === "completed" || request.status === "failed") return { outcome: "TERMINAL_NOOP" as const, request };
        if (request.status !== status || (status === "processing" && request.processingAttemptId !== attemptId)) throw new DbServiceError("CONFLICT");
        const transition = await tx.generationRequest.updateMany({ where: { generationRequestId, status, ...(status === "processing" ? { processingAttemptId: attemptId } : {}) }, data: { status: "failed", errorMessage: errorMessage.slice(0, 1000), failedAt: new Date(), processingAttemptId: null, processingStartedAt: null, leaseExpiresAt: null } });
        if (transition.count !== 1) return { outcome: "TERMINAL_NOOP" as const, request };
        const updated = await tx.generationRequest.findUniqueOrThrow({ where: { generationRequestId } });
        if (request.userId && request.creditsCharged) await tx.user.update({ where: { id: request.userId }, data: { credits: { increment: request.creditsCharged } } });
        return { outcome: "FAILED" as const, request: updated };
      });
      return { outcome: result.outcome, job: this.generationJob(result.request, null) };
    } catch (error) { if (error instanceof DbServiceError) return { ok: false, code: error.code as any }; console.error("Generation failure finalization failed", toSafeErrorResponse(error)); return { ok: false, code: "INTERNAL_DB_ERROR" }; }
    finally { await prisma.$disconnect(); }
  }

  private validGenerationInput(input: GenerationStartInput): boolean { return !!input && /^[A-Za-z0-9_-]{1,120}$/.test(input.generationRequestId) && !!input.userId && (input.sourcePage === null || typeof input.sourcePage === "string") && input.requestType === GENERATION_ASYNC_REQUEST_TYPE && isValidOptionalExecutionScope(input.executionScope) && !!input.model && !!input.promptHash && !!input.inputHash && Number.isInteger(input.numberOfImages) && input.numberOfImages > 0 && input.numberOfImages <= 10 && !!input.aspectRatio; }
  private async generationExistingResult(prisma: PrismaClient, request: any, input: GenerationStartInput): Promise<GenerationStartResult> { if (request.userId !== input.userId || request.promptHash !== input.promptHash || request.inputHash !== input.inputHash || request.requestType !== input.requestType) return { ok: false, code: "CONFLICT" }; const balance = await prisma.user.findUnique({ where: { id: input.userId }, select: { credits: true } }); return { outcome: "EXISTING", job: this.generationJob(request, balance?.credits ?? null) }; }
  private generationJob(request: any, remainingCredits: Prisma.Decimal | null): any { const count = request.numberOfImages ?? 0; return { generationRequestId: request.generationRequestId, userId: request.userId, status: request.status, model: request.model, sourcePage: request.sourcePage ?? null, numberOfImages: count, aspectRatio: request.aspectRatio ?? "", creditsCharged: request.creditsCharged?.toString() ?? null, remainingCredits: remainingCredits?.toString() ?? null, imageUrls: Array.isArray(request.resultImageUrls) ? request.resultImageUrls as string[] : [], errorMessage: request.errorMessage ?? null, createdAt: request.createdAt.toISOString(), updatedAt: request.updatedAt.toISOString(), processingStartedAt: request.processingStartedAt?.toISOString() ?? null, leaseExpiresAt: request.leaseExpiresAt?.toISOString() ?? null, outputIconIds: Array.from({ length: count }, (_, index) => `${request.generationRequestId}-${index}`) }; }

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
