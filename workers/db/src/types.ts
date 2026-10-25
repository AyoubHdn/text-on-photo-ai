export interface Env {
  HYPERDRIVE: Hyperdrive;
  GENERATION_RECOVERY_ENABLED?: string;
  GENERATION_RECOVERY_SCOPE?: string;
  GENERATION_RECOVERY_BATCH_SIZE?: string;
  GENERATION_RECOVERY_DB_TIMEOUT_MS?: string;
  GENERATION_RECOVERY_DB_LOCK_TIMEOUT_MS?: string;
  GENERATION_RECOVERY_DB_MAX_WAIT_MS?: string;
  GENERATION_RECOVERY_MAX_MS?: string;
  GENERATION_RECOVERY_PROCESSING_GRACE_SECONDS?: string;
}

export interface GenerationStartInput {
  generationRequestId: string;
  userId: string;
  sourcePage: string | null;
  requestType: string;
  executionScope?: string | null;
  model: string;
  promptHash: string;
  inputHash: string;
  numberOfImages: number;
  aspectRatio: string;
  creditsCharged: string;
}

export interface GenerationJobDto {
  generationRequestId: string;
  userId: string;
  status: "started" | "processing" | "completed" | "failed";
  model: string;
  sourcePage: string | null;
  numberOfImages: number;
  aspectRatio: string;
  creditsCharged: string | null;
  remainingCredits: string | null;
  imageUrls: string[];
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  processingStartedAt: string | null;
  leaseExpiresAt: string | null;
  outputIconIds: string[];
}

export type GenerationStartResult =
  | { outcome: "CREATED"; job: GenerationJobDto }
  | { outcome: "EXISTING"; job: GenerationJobDto }
  | { ok: false; code: DbErrorCode };

export interface GenerationClaimInput {
  generationRequestId: string;
  processingAttemptId: string;
  leaseSeconds: number;
}
export type GenerationClaimResult =
  | { outcome: "CLAIMED"; job: GenerationJobDto }
  | { outcome: "ALREADY_CLAIMED"; job: GenerationJobDto }
  | { outcome: "TERMINAL"; job: GenerationJobDto }
  | { ok: false; code: DbErrorCode };

export interface GenerationPredictionInput {
  generationRequestId: string;
  processingAttemptId: string;
  predictionId: string;
}
export type GenerationPredictionResult =
  | { outcome: "UPDATED" | "NOOP" }
  | { ok: false; code: DbErrorCode };

export interface GenerationStatusInput {
  generationRequestId: string;
  userId: string;
}
export type GenerationStatusResult =
  | { found: true; job: GenerationJobDto }
  | { found: false }
  | { ok: false; code: DbErrorCode };

export interface GenerationOutputDescriptor {
  iconId: string;
  s3Key: string;
  imageUrl: string;
  prompt: string | null;
  metadata: unknown;
  isPublic?: boolean;
}
export interface GenerationFinalizeSuccessInput {
  generationRequestId: string;
  processingAttemptId: string;
  predictionId?: string | null;
  outputs: GenerationOutputDescriptor[];
  digitalArtInterest?: DigitalArtInterest | null;
}
export type GenerationFinalizeSuccessResult =
  | { outcome: "COMPLETED" | "TERMINAL_NOOP"; job: GenerationJobDto }
  | { ok: false; code: DbErrorCode };

export interface GenerationMauticSyncInput {
  userId: string;
}
export interface GenerationMauticSyncState {
  email: string | null;
  name: string | null;
  credits: string;
  hasGeneratedDesign: boolean;
  firstDigitalArtInterest: DigitalArtInterest | null;
  latestDigitalArtInterest: DigitalArtInterest | null;
}
export type GenerationMauticSyncStateResult =
  | { found: true; state: GenerationMauticSyncState }
  | { found: false }
  | { ok: false; code: DbErrorCode };

export interface GenerationFinalizeFailureInput {
  generationRequestId: string;
  processingAttemptId: string;
  errorMessage: string;
}
export type GenerationFinalizeFailureResult =
  | { outcome: "FAILED" | "TERMINAL_NOOP"; job: GenerationJobDto }
  | { ok: false; code: DbErrorCode };

export interface GenerationFailIfUnclaimedInput {
  generationRequestId: string;
  errorMessage: string;
}
export interface GenerationFailIfStaleInput {
  generationRequestId: string;
  executionScope: string;
  processingGraceSeconds?: number;
  databaseTimeoutMs?: number;
  databaseLockTimeoutMs?: number;
  databaseMaxWaitMs?: number;
  errorMessage: string;
}
export type GenerationFailureTransitionResult = GenerationFinalizeFailureResult;

export interface HealthResponse {
  ok: true;
  service: "namedesignai-db";
}

export interface DiagnosticResponse {
  ok: true;
}

export interface IconDto {
  id: string; prompt: string | null; userId: string | null; createdAt: string;
  isPublic: boolean; metadata: unknown; transparentImageUrl: string | null; backgroundRemovedAt: string | null;
}
export type IconUserReadResult = { found: true; plan: "None" | "Starter" | "Pro" | "Elite"; icons: IconDto[] } | { found: false } | { ok: false; code: DbErrorCode };
export type IconListResult = { icons: IconDto[] } | { ok: false; code: DbErrorCode };
export type PopularIconListResult = { icons: Array<{ id: string; prompt: string | null; metadata: unknown }> } | { ok: false; code: DbErrorCode };
export type IconWriteResult = { icon: IconDto } | { ok: false; code: DbErrorCode };

export interface UserReadInput { userId: string }
export type UserCreditsResult =
  | { found: true; credits: string }
  | { found: false }
  | { ok: false; code: DbErrorCode };
export type UserCreditUpgradeStateResult =
  | { found: true; plan: "None" | "Starter" | "Pro" | "Elite"; hasGeneratedDesign: boolean }
  | { found: false }
  | { ok: false; code: DbErrorCode };
export type UserPaidTrafficFunnelStateResult =
  | { found: true; paidTrafficUser: boolean; paidTrafficFreeCreditsGranted: boolean; paidTrafficFreePreviewUsed: boolean; hasGeneratedDesign: boolean; hasVisitedCheckout: boolean }
  | { found: false }
  | { ok: false; code: DbErrorCode };

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

export type DigitalArtInterest = "name_art" | "arabic_name_art" | "couples_art";
export interface AuthFinalizeEventInput {
  userId: string;
  markPaidTraffic: boolean;
  digitalArtInterest: DigitalArtInterest | null;
}
export interface AuthEventSyncState {
  email: string | null;
  name: string | null;
  credits: string;
  plan: "None" | "Starter" | "Pro" | "Elite";
  paidTrafficUser: boolean;
  hasGeneratedDesign: boolean;
  hasVisitedCheckout: boolean;
  firstDigitalArtInterest: DigitalArtInterest | null;
  latestDigitalArtInterest: DigitalArtInterest | null;
}
export interface AuthFinalizeEventResponse {
  found: true;
  syncState: AuthEventSyncState;
}
export interface AuthFinalizeEventNotFoundResponse { found: false }
export type AuthFinalizeEventResult = AuthFinalizeEventResponse | AuthFinalizeEventNotFoundResponse | AuthWriteErrorResponse;

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
  | "INSUFFICIENT_CREDITS"
  | "DEPENDENCY_UNAVAILABLE"
  | "INTERNAL_DB_ERROR";

export interface DbErrorResponse {
  ok: false;
  code: DbErrorCode;
}
