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
