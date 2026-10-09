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

type DbServiceBinding = {
  pricingGetAvailability(input: {
    productType: ProductType;
    variantId: number;
    countryCode: string;
  }): Promise<PricingAvailabilityResult>;
};

export class DbServiceConfigurationError extends Error {
  constructor() {
    super("Database service is not configured.");
    this.name = "DbServiceConfigurationError";
  }
}

export class DbServiceRequestError extends Error {
  readonly code: DbErrorCode;

  constructor(code: DbErrorCode) {
    super("Unable to check product availability.");
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
  throw new DbServiceRequestError(result.code);
}
