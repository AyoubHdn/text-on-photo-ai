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

export interface AuthGetUserByEmailInput {
  email: string;
}

export type AuthGetUserByEmailResponse = AuthGetUserResponse;
export type AuthGetUserByEmailNotFoundResponse = AuthGetUserNotFoundResponse;
export type AuthGetUserByEmailErrorResponse = AuthGetUserErrorResponse;

export interface AuthGetUserByAccountInput {
  provider: string;
  providerAccountId: string;
}

export type AuthGetUserByAccountResponse = AuthGetUserResponse;
export type AuthGetUserByAccountNotFoundResponse = AuthGetUserNotFoundResponse;
export type AuthGetUserByAccountErrorResponse = AuthGetUserErrorResponse;

export interface AuthCreateUserInput {
  name: string | null;
  email: string;
  emailVerified: string | null;
  image: string | null;
}
export interface AuthUpdateUserInput {
  id: string;
  name?: string | null;
  email?: string;
  emailVerified?: string | null;
  image?: string | null;
}
export interface AuthAccountInput {
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
}
export interface AuthSessionInput {
  sessionToken: string;
  userId: string;
  expires: string;
}
export interface AuthUpdateSessionInput {
  sessionToken: string;
  userId?: string;
  expires?: string;
}
export interface AuthVerificationTokenInput {
  identifier: string;
  token: string;
  expires: string;
}
export interface AuthUseVerificationTokenInput {
  identifier: string;
  token: string;
}
export interface AuthWriteErrorResponse { ok: false; code: DbErrorCode }
export interface AuthUserWriteResponse { user: AuthUserDto }
export interface AuthAccountWriteResponse { account: AuthAccountInput }
export interface AuthSessionWriteResponse { session: AuthSessionDto }
export interface AuthVerificationTokenDto { identifier: string; token: string; expires: string }
export interface AuthVerificationTokenWriteResponse { token: AuthVerificationTokenDto | null }

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
