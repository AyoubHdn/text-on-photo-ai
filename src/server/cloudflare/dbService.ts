import type { ProductType } from "~/server/services/priceCalculator";

type DbErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
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

type DbServiceBinding = {
  pricingGetAvailability(input: {
    productType: ProductType;
    variantId: number;
    countryCode: string;
  }): Promise<PricingAvailabilityResult>;
  pricingGetCachedCosts(input: {
    productType: ProductType;
    sizeKey: string;
    countryCode: string;
  }): Promise<PricingCachedCostsResult>;
  pricingGetVariantFilterData(input: {
    productType: ProductType;
    countryCode: string;
  }): Promise<PricingVariantFilterResult>;
  ordersGetTracking(input: { orderId: string }): Promise<OrdersTrackingResult>;
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
};

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
