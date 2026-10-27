/**
 * Explicitly disabled until the async path is deliberately enabled by a later
 * rollout decision. The server gate remains authoritative even if this value
 * is changed in a future client build.
 */
export const ASYNC_GENERATION_FEATURE_ENABLED = false as const;

export function isAsyncGenerationEnabledForUser(isAuthenticated: boolean) {
  return ASYNC_GENERATION_FEATURE_ENABLED && isAuthenticated;
}

export function asyncGenerationImages(imageUrls: readonly string[]) {
  return imageUrls.map((imageUrl) => ({ imageUrl }));
}

export function isNewAsyncTerminalStatus(
  requestId: string | null,
  status: "completed" | "failed" | string | undefined,
  handledRequestId: string | null
) {
  return Boolean(
    requestId &&
      (status === "completed" || status === "failed") &&
      requestId !== handledRequestId
  );
}
