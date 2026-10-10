export interface Env {
  HYPERDRIVE: Hyperdrive;
}

export interface HealthResponse {
  ok: true;
  service: "namedesignai-db";
}

export interface DiagnosticResponse {
  ok: true;
}

export interface PricingAvailabilityInput {
  productType: string;
  variantId: number;
  countryCode: string;
}

export interface PricingAvailabilityResponse {
  available: boolean;
}

export interface PricingAvailabilityErrorResponse {
  ok: false;
  code: DbErrorCode;
}

export interface PricingCachedCostsInput {
  productType: string;
  sizeKey: string;
  countryCode: string;
}

export interface PricingCachedCostsResponse {
  found: true;
  baseCost: string;
  shippingCost: string;
}

export interface PricingCachedCostsNotFoundResponse {
  found: false;
}

export interface PricingCachedCostsErrorResponse {
  ok: false;
  code: DbErrorCode;
}

export interface PricingVariantFilterInput {
  productType: string;
  countryCode: string;
}

export interface PricingVariantFilterResponse {
  allowedVariantIds: number[];
  allowedSizeKeys: string[];
}

export interface PricingVariantFilterErrorResponse {
  ok: false;
  code: DbErrorCode;
}

export interface OrdersTrackingInput {
  orderId: string;
}

export interface OrdersTrackingResponse {
  found: true;
  trackingUrl: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
}

export interface OrdersTrackingNotFoundResponse {
  found: false;
}

export interface OrdersTrackingErrorResponse {
  ok: false;
  code: DbErrorCode;
}

export interface AuthGetUserInput {
  userId: string;
}

export interface AuthUserDto {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: string | null;
  image: string | null;
}

export interface AuthGetUserResponse {
  found: true;
  user: AuthUserDto;
}

export interface AuthGetUserNotFoundResponse {
  found: false;
}

export interface AuthGetUserErrorResponse {
  ok: false;
  code: DbErrorCode;
}

export interface AuthGetSessionAndUserInput {
  sessionToken: string;
}

export interface AuthSessionDto {
  sessionToken: string;
  userId: string;
  expires: string;
}

export interface AuthGetSessionAndUserResponse {
  found: true;
  session: AuthSessionDto;
  user: AuthUserDto;
}

export interface AuthGetSessionAndUserNotFoundResponse {
  found: false;
}

export interface AuthGetSessionAndUserErrorResponse {
  ok: false;
  code: DbErrorCode;
}

export type DbErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "DEPENDENCY_UNAVAILABLE"
  | "INTERNAL_DB_ERROR";

export interface DbErrorResponse {
  ok: false;
  code: DbErrorCode;
}
