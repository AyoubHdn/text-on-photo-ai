type DbErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "INSUFFICIENT_CREDITS"
  | "DEPENDENCY_UNAVAILABLE"
  | "INTERNAL_DB_ERROR";

export type PricingAvailabilityResult =
  | { available: boolean }
  | { ok: false; code: DbErrorCode };

export type PricingCachedCostsResult =
  | { found: true; baseCost: string; shippingCost: string }
  | { found: false }
  | { ok: false; code: DbErrorCode };

export type PricingVariantFilterResult =
  | { allowedVariantIds: number[]; allowedSizeKeys: string[] }
  | { ok: false; code: DbErrorCode };

export type OrdersTrackingResult =
  | {
      found: true;
      trackingUrl: string | null;
      trackingNumber: string | null;
      trackingCarrier: string | null;
    }
  | { found: false }
  | { ok: false; code: DbErrorCode };

export type AuthUserResult =
  | {
      found: true;
      user: {
        id: string;
        name: string | null;
        email: string | null;
        emailVerified: string | null;
        image: string | null;
      };
    }
  | { found: false }
  | { ok: false; code: DbErrorCode };

export type AuthSessionAndUserResult =
  | {
      found: true;
      session: { sessionToken: string; userId: string; expires: string };
      user: {
        id: string;
        name: string | null;
        email: string | null;
        emailVerified: string | null;
        image: string | null;
      };
    }
  | { found: false }
  | { ok: false; code: DbErrorCode };

export type AuthUserByAccountResult = AuthUserResult;
type AuthWriteResult = { ok: false; code: DbErrorCode };
type AuthUserWriteResult = { user: NonNullable<Extract<AuthUserResult, { found: true }>['user']> } | AuthWriteResult;
type AuthAccountWriteResult = { account: Record<string, unknown> } | AuthWriteResult;
type AuthSessionWriteResult = { session: { sessionToken: string; userId: string; expires: string } } | AuthWriteResult;
type AuthVerificationWriteResult = { token: { identifier: string; token: string; expires: string } | null } | AuthWriteResult;
export type AuthEventSyncState = {
  email: string | null;
  name: string | null;
  credits: string;
  plan: "None" | "Starter" | "Pro" | "Elite";
  paidTrafficUser: boolean;
  hasGeneratedDesign: boolean;
  hasVisitedCheckout: boolean;
  firstDigitalArtInterest: "name_art" | "arabic_name_art" | "couples_art" | null;
  latestDigitalArtInterest: "name_art" | "arabic_name_art" | "couples_art" | null;
};
export type GenerationJobResult = { generationRequestId: string; userId: string; status: "started" | "processing" | "completed" | "failed"; model: string; sourcePage: string | null; numberOfImages: number; aspectRatio: string; creditsCharged: string | null; remainingCredits: string | null; imageUrls: string[]; errorMessage: string | null; createdAt: string; updatedAt: string; processingStartedAt: string | null; leaseExpiresAt: string | null; outputIconIds: string[] };
export type GenerationStartResult = { outcome: "CREATED" | "EXISTING"; job: GenerationJobResult } | { ok: false; code: DbErrorCode };
export type GenerationClaimResult = { outcome: "CLAIMED" | "ALREADY_CLAIMED" | "TERMINAL"; job: GenerationJobResult } | { ok: false; code: DbErrorCode };
export type GenerationStatusResult = { found: true; job: GenerationJobResult } | { found: false } | { ok: false; code: DbErrorCode };
export type GenerationTransitionResult = { outcome: "COMPLETED" | "FAILED" | "TERMINAL_NOOP"; job: GenerationJobResult } | { ok: false; code: DbErrorCode };
type AuthFinalizeEventResult = { found: true; syncState: AuthEventSyncState } | { found: false } | AuthWriteResult;

  type DbServiceBinding = {
  iconGetIconsForUser(input: { userId: string }): Promise<IconUserReadResult>;
  iconGetCommunityIcons(): Promise<IconListResult>;
  iconGetPopularPaidIcons(input: { limit: number }): Promise<PopularIconListResult>;
  iconUpdateVisibility(input: { userId: string; iconId: string; isPublic: boolean }): Promise<IconWriteResult>;
  userGetCredits(input: { userId: string }): Promise<UserCreditsResult>;
  userGetCreditUpgradeState(input: { userId: string }): Promise<UserCreditUpgradeStateResult>;
  userGetPaidTrafficFunnelState(input: { userId: string }): Promise<UserPaidTrafficFunnelStateResult>;
  authGetUser(input: { userId: string }): Promise<AuthUserResult>;
  authGetSessionAndUser(input: { sessionToken: string }): Promise<AuthSessionAndUserResult>;
  authGetUserByEmail(input: { email: string }): Promise<AuthUserResult>;
  authGetUserByAccount(input: { provider: string; providerAccountId: string }): Promise<AuthUserByAccountResult>;
  authCreateUser(input: { name: string | null; email: string; emailVerified: string | null; image: string | null }): Promise<AuthUserWriteResult>;
  authUpdateUser(input: { id: string; name?: string | null; email?: string; emailVerified?: string | null; image?: string | null }): Promise<AuthUserWriteResult>;
  authDeleteUser(input: { userId: string }): Promise<AuthUserWriteResult>;
  authLinkAccount(input: Record<string, unknown>): Promise<AuthAccountWriteResult>;
  authUnlinkAccount(input: { provider: string; providerAccountId: string }): Promise<AuthAccountWriteResult>;
  authCreateSession(input: { sessionToken: string; userId: string; expires: string }): Promise<AuthSessionWriteResult>;
  authUpdateSession(input: { sessionToken: string; userId?: string; expires?: string }): Promise<AuthSessionWriteResult>;
  authDeleteSession(input: { sessionToken: string }): Promise<AuthSessionWriteResult>;
  authCreateVerificationToken(input: { identifier: string; token: string; expires: string }): Promise<AuthVerificationWriteResult>;
  authUseVerificationToken(input: { identifier: string; token: string }): Promise<AuthVerificationWriteResult>;
  authFinalizeSignIn(input: { userId: string; markPaidTraffic: boolean; digitalArtInterest: "name_art" | "arabic_name_art" | "couples_art" | null }): Promise<AuthFinalizeEventResult>;
  authFinalizeNewUser(input: { userId: string; markPaidTraffic: boolean; digitalArtInterest: "name_art" | "arabic_name_art" | "couples_art" | null }): Promise<AuthFinalizeEventResult>;
  generationStartOrGetAndReserve(input: Record<string, unknown>): Promise<GenerationStartResult>;
  generationClaimExecution(input: { generationRequestId: string; processingAttemptId: string; leaseSeconds: number }): Promise<GenerationClaimResult>;
  generationSetPredictionId(input: { generationRequestId: string; processingAttemptId: string; predictionId: string }): Promise<{ outcome: "UPDATED" | "NOOP" } | { ok: false; code: DbErrorCode }>;
  generationGetStatus(input: { generationRequestId: string; userId: string }): Promise<GenerationStatusResult>;
  generationFinalizeSuccess(input: Record<string, unknown>): Promise<GenerationTransitionResult>;
  generationFinalizeFailure(input: { generationRequestId: string; processingAttemptId: string; errorMessage: string }): Promise<GenerationTransitionResult>;
  generationFailIfUnclaimed(input: { generationRequestId: string; errorMessage: string }): Promise<GenerationTransitionResult>;
  generationFailIfStale(input: { generationRequestId: string; errorMessage: string }): Promise<GenerationTransitionResult>;
};

type IconDto = { id: string; prompt: string | null; userId: string | null; createdAt: string; isPublic: boolean; metadata: unknown; transparentImageUrl: string | null; backgroundRemovedAt: string | null };
type IconUserReadResult = { found: true; plan: "None" | "Starter" | "Pro" | "Elite"; icons: IconDto[] } | { found: false } | { ok: false; code: DbErrorCode };
type IconListResult = { icons: IconDto[] } | { ok: false; code: DbErrorCode };
type PopularIconListResult = { icons: Array<{ id: string; prompt: string | null; metadata: unknown }> } | { ok: false; code: DbErrorCode };
type IconWriteResult = { icon: IconDto } | { ok: false; code: DbErrorCode };

type UserCreditsResult = { found: true; credits: string } | { found: false } | { ok: false; code: DbErrorCode };
type UserCreditUpgradeStateResult = { found: true; plan: "None" | "Starter" | "Pro" | "Elite"; hasGeneratedDesign: boolean } | { found: false } | { ok: false; code: DbErrorCode };
type UserPaidTrafficFunnelStateResult = { found: true; paidTrafficUser: boolean; paidTrafficFreeCreditsGranted: boolean; paidTrafficFreePreviewUsed: boolean; hasGeneratedDesign: boolean; hasVisitedCheckout: boolean } | { found: false } | { ok: false; code: DbErrorCode };

export class DbServiceConfigurationError extends Error {
  constructor() {
    super("Database service is not configured.");
    this.name = "DbServiceConfigurationError";
  }
}

export class DbServiceRequestError extends Error {
  readonly code: DbErrorCode;

  constructor(
    code: DbErrorCode,
    operation: "availability" | "pricing" | "orders" | "auth" = "availability",
  ) {
    super(
      operation === "pricing"
        ? "Unable to load product pricing."
        : operation === "orders"
          ? "Unable to load order tracking."
          : operation === "auth"
            ? "Unable to load authentication data."
          : "Unable to check product availability.",
    );
    this.name = "DbServiceRequestError";
    this.code = code;
  }
}

async function userReadService(): Promise<DbServiceBinding> {
  return getDbService();
}

function restoreIcon(icon: IconDto) {
  return { ...icon, createdAt: new Date(icon.createdAt), backgroundRemovedAt: icon.backgroundRemovedAt ? new Date(icon.backgroundRemovedAt) : null };
}
export async function iconGetIconsForUserFromService(input: { userId: string }) {
  const result = await (await getDbService()).iconGetIconsForUser(input);
  if ("found" in result) return result.found ? { ...result, icons: result.icons.map(restoreIcon) } : null;
  throw new DbServiceRequestError(result.code, "auth");
}
export async function iconGetCommunityIconsFromService() {
  const result = await (await getDbService()).iconGetCommunityIcons();
  if ("icons" in result) return result.icons.map(restoreIcon);
  throw new DbServiceRequestError(result.code, "auth");
}
export async function iconGetPopularPaidIconsFromService(input: { limit: number }) {
  const result = await (await getDbService()).iconGetPopularPaidIcons(input);
  if ("icons" in result) return result.icons;
  throw new DbServiceRequestError(result.code, "auth");
}
export async function iconUpdateVisibilityFromService(input: { userId: string; iconId: string; isPublic: boolean }) {
  const result = await (await getDbService()).iconUpdateVisibility(input);
  if ("icon" in result) return restoreIcon(result.icon);
  throw new DbServiceRequestError(result.code, "auth");
}
export async function userGetCreditsFromService(input: { userId: string }): Promise<number> {
  const result = await (await userReadService()).userGetCredits(input);
  if ("found" in result) return result.found ? Number(result.credits) : 0;
  throw new DbServiceRequestError(result.code, "auth");
}

export async function userGetCreditUpgradeStateFromService(input: { userId: string }) {
  const result = await (await userReadService()).userGetCreditUpgradeState(input);
  if ("found" in result) return result.found ? result : null;
  throw new DbServiceRequestError(result.code, "auth");
}

export async function userGetPaidTrafficFunnelStateFromService(input: { userId: string }) {
  const result = await (await userReadService()).userGetPaidTrafficFunnelState(input);
  if ("found" in result) return result.found ? result : null;
  throw new DbServiceRequestError(result.code, "auth");
}

/* Abandoned physical-commerce DB helpers retained only in history.
export async function pricingGetAvailabilityFromService(input: {
  productType: ProductType;
  variantId: number;
  countryCode: string;
}): Promise<boolean> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  const dbService = (env as unknown as { DB_SERVICE?: DbServiceBinding })
    .DB_SERVICE;

  if (!dbService) {
    throw new DbServiceConfigurationError();
  }

  const result = await dbService.pricingGetAvailability(input);
  if ("available" in result) {
    return result.available;
  }

  console.error("DB service availability lookup failed", result.code);
  throw new DbServiceRequestError(result.code, "availability");
}

export async function pricingGetCachedCostsFromService(input: {
  productType: ProductType;
  sizeKey: string;
  countryCode: string;
}): Promise<{ baseCost: string; shippingCost: string } | null> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  const dbService = (env as unknown as { DB_SERVICE?: DbServiceBinding })
    .DB_SERVICE;

  if (!dbService) throw new DbServiceConfigurationError();

  const result = await dbService.pricingGetCachedCosts(input);
  if ("found" in result) {
    return result.found
      ? { baseCost: result.baseCost, shippingCost: result.shippingCost }
      : null;
  }

  console.error("DB service pricing lookup failed", result.code);
  throw new DbServiceRequestError(result.code, "pricing");
}

export async function pricingGetVariantFilterDataFromService(input: {
  productType: ProductType;
  countryCode: string;
}): Promise<{ allowedVariantIds: number[]; allowedSizeKeys: string[] }> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  const dbService = (env as unknown as { DB_SERVICE?: DbServiceBinding })
    .DB_SERVICE;

  if (!dbService) throw new DbServiceConfigurationError();

  const result = await dbService.pricingGetVariantFilterData(input);
  if ("allowedVariantIds" in result) return result;

  console.error("DB service variant filter lookup failed", result.code);
  throw new DbServiceRequestError(result.code, "pricing");
}

export async function ordersGetTrackingFromService(input: {
  orderId: string;
}): Promise<{
  trackingUrl: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
} | null> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  const dbService = (env as unknown as { DB_SERVICE?: DbServiceBinding })
    .DB_SERVICE;

  if (!dbService) throw new DbServiceConfigurationError();

  const result = await dbService.ordersGetTracking(input);
  if ("found" in result) {
    return result.found
      ? {
          trackingUrl: result.trackingUrl,
          trackingNumber: result.trackingNumber,
          trackingCarrier: result.trackingCarrier,
        }
      : null;
  }

  console.error("DB service order tracking lookup failed", result.code);
  throw new DbServiceRequestError(result.code, "orders");
}

*/
export async function authGetUserFromService(input: { userId: string }) {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  const dbService = (env as unknown as { DB_SERVICE?: DbServiceBinding }).DB_SERVICE;
  if (!dbService) throw new DbServiceConfigurationError();
  const result = await dbService.authGetUser(input);
  if ("found" in result) return result.found ? result.user : null;
  console.error("DB service auth user lookup failed", result.code);
  throw new DbServiceRequestError(result.code, "auth");
}

export async function authGetSessionAndUserFromService(input: { sessionToken: string }) {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  const dbService = (env as unknown as { DB_SERVICE?: DbServiceBinding }).DB_SERVICE;
  if (!dbService) throw new DbServiceConfigurationError();
  const result = await dbService.authGetSessionAndUser(input);
  if ("found" in result) {
    return result.found ? { session: result.session, user: result.user } : null;
  }
  console.error("DB service auth session lookup failed", result.code);
  throw new DbServiceRequestError(result.code, "auth");
}

export async function authGetUserByEmailFromService(input: { email: string }) {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  const dbService = (env as unknown as { DB_SERVICE?: DbServiceBinding }).DB_SERVICE;
  if (!dbService) throw new DbServiceConfigurationError();
  const result = await dbService.authGetUserByEmail(input);
  if ("found" in result) return result.found ? result.user : null;
  console.error("DB service auth email lookup failed", result.code);
  throw new DbServiceRequestError(result.code, "auth");
}

export async function authGetUserByAccountFromService(input: {
  provider: string;
  providerAccountId: string;
}) {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  const dbService = (env as unknown as { DB_SERVICE?: DbServiceBinding }).DB_SERVICE;
  if (!dbService) throw new DbServiceConfigurationError();
  const result = await dbService.authGetUserByAccount(input);
  if ("found" in result) return result.found ? result.user : null;
  console.error("DB service auth account lookup failed", result.code);
  throw new DbServiceRequestError(result.code, "auth");
}

async function getDbService(): Promise<DbServiceBinding> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = await getCloudflareContext({ async: true });
  const dbService = (env as unknown as { DB_SERVICE?: DbServiceBinding }).DB_SERVICE;
  if (!dbService) throw new DbServiceConfigurationError();
  return dbService;
}

function throwAuthWriteError(result: { ok: false; code: DbErrorCode }): never {
  console.error("DB service auth write failed", result.code);
  throw new DbServiceRequestError(result.code, "auth");
}

export async function authCreateUserFromService(input: { name: string | null; email: string; emailVerified: string | null; image: string | null }) {
  const result = await (await getDbService()).authCreateUser(input);
  if ("user" in result) return result.user;
  return throwAuthWriteError(result);
}
export async function authUpdateUserFromService(input: { id: string; name?: string | null; email?: string; emailVerified?: string | null; image?: string | null }) {
  const result = await (await getDbService()).authUpdateUser(input);
  if ("user" in result) return result.user;
  return throwAuthWriteError(result);
}
export async function authDeleteUserFromService(input: { userId: string }) {
  const result = await (await getDbService()).authDeleteUser(input);
  if ("user" in result) return result.user;
  return throwAuthWriteError(result);
}
export async function authLinkAccountFromService(input: Record<string, unknown>) {
  const result = await (await getDbService()).authLinkAccount(input);
  if ("account" in result) return result.account;
  return throwAuthWriteError(result);
}
export async function authUnlinkAccountFromService(input: { provider: string; providerAccountId: string }) {
  const result = await (await getDbService()).authUnlinkAccount(input);
  if ("account" in result) return result.account;
  return throwAuthWriteError(result);
}
export async function authCreateSessionFromService(input: { sessionToken: string; userId: string; expires: Date }) {
  const result = await (await getDbService()).authCreateSession({ ...input, expires: input.expires.toISOString() });
  if ("session" in result) return { ...result.session, expires: new Date(result.session.expires) };
  return throwAuthWriteError(result);
}
export async function authUpdateSessionFromService(input: { sessionToken: string; userId?: string; expires?: Date }) {
  const result = await (await getDbService()).authUpdateSession({ ...input, expires: input.expires?.toISOString() });
  if ("session" in result) return { ...result.session, expires: new Date(result.session.expires) };
  return throwAuthWriteError(result);
}
export async function authDeleteSessionFromService(input: { sessionToken: string }) {
  const result = await (await getDbService()).authDeleteSession(input);
  if ("session" in result) return { ...result.session, expires: new Date(result.session.expires) };
  return throwAuthWriteError(result);
}
export async function authCreateVerificationTokenFromService(input: { identifier: string; token: string; expires: Date }) {
  const result = await (await getDbService()).authCreateVerificationToken({ ...input, expires: input.expires.toISOString() });
  if ("token" in result) return result.token ? { ...result.token, expires: new Date(result.token.expires) } : null;
  return throwAuthWriteError(result);
}
export async function authUseVerificationTokenFromService(input: { identifier: string; token: string }) {
  const result = await (await getDbService()).authUseVerificationToken(input);
  if ("token" in result) return result.token ? { ...result.token, expires: new Date(result.token.expires) } : null;
  if (result.code === "NOT_FOUND") return null;
  return throwAuthWriteError(result);
}

async function finalizeAuthEventFromService(method: "authFinalizeSignIn" | "authFinalizeNewUser", input: { userId: string; markPaidTraffic: boolean; digitalArtInterest: "name_art" | "arabic_name_art" | "couples_art" | null }) {
  const result = await (await getDbService())[method](input);
  if ("found" in result) return result;
  return throwAuthWriteError(result);
}

export function authFinalizeSignInFromService(input: { userId: string; markPaidTraffic: boolean; digitalArtInterest: "name_art" | "arabic_name_art" | "couples_art" | null }) {
  return finalizeAuthEventFromService("authFinalizeSignIn", input);
}

export function authFinalizeNewUserFromService(input: { userId: string; markPaidTraffic: boolean; digitalArtInterest: "name_art" | "arabic_name_art" | "couples_art" | null }) {
  return finalizeAuthEventFromService("authFinalizeNewUser", input);
}
