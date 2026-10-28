/**
 * The public gate is build-time configurable and defaults to disabled. The
 * server gate remains authoritative even if a client build enables this flag.
 */
export const ASYNC_GENERATION_FEATURE_ENABLED =
  String(process.env.NEXT_PUBLIC_ASYNC_GENERATION_FEATURE_ENABLED ?? "") === "true";

const PENDING_ASYNC_GENERATION_STORAGE_PREFIX =
  "name-art:pending-async-generation:v1";

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getPendingAsyncGenerationStorageKey(
  userId: string,
  sourcePage: string,
) {
  return `${PENDING_ASYNC_GENERATION_STORAGE_PREFIX}:${encodeURIComponent(userId)}:${encodeURIComponent(sourcePage)}`;
}

export function readPendingAsyncGeneration(
  userId: string | null,
  sourcePage: string,
) {
  if (!userId) return null;
  const storage = getStorage();
  if (!storage) return null;

  try {
    const key = getPendingAsyncGenerationStorageKey(userId, sourcePage);
    const value = storage.getItem(key);
    if (!value) return null;
    const parsed: unknown = JSON.parse(value);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as { requestId?: unknown }).requestId !== "string"
    ) {
      storage.removeItem(key);
      return null;
    }
    const record = parsed as { requestId: string; input?: unknown };
    return { requestId: record.requestId, input: record.input };
  } catch {
    return null;
  }
}

export function writePendingAsyncGeneration(
  userId: string | null,
  sourcePage: string,
  requestId: string,
  input?: unknown,
) {
  if (!userId) return;
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(
      getPendingAsyncGenerationStorageKey(userId, sourcePage),
      JSON.stringify({ requestId, input }),
    );
  } catch {
    // Persistence is best effort; in-memory polling still works.
  }
}

export function clearPendingAsyncGeneration(
  userId: string | null,
  sourcePage: string,
) {
  if (!userId) return;
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(getPendingAsyncGenerationStorageKey(userId, sourcePage));
  } catch {
    // Ignore storage failures.
  }
}

/**
 * A typed tRPC error means the server answered the submission. Errors without
 * a response may mean the mutation committed but its response was lost.
 */
export function isAmbiguousAsyncSubmissionError(error: unknown) {
  if (!error || typeof error !== "object") return true;
  const value = error as {
    data?: { code?: unknown; httpStatus?: unknown };
    shape?: { data?: { code?: unknown; httpStatus?: unknown } };
    message?: unknown;
  };
  const code = value.data?.code ?? value.shape?.data?.code;
  const httpStatus = value.data?.httpStatus ?? value.shape?.data?.httpStatus;
  if (typeof code === "string" || typeof httpStatus === "number") return false;
  if (error instanceof TypeError) return true;
  return (
    typeof value.message !== "string" ||
    /network|fetch|timeout|abort/i.test(value.message)
  );
}

export class ObsoleteAsyncGenerationOperationError extends Error {
  constructor() {
    super("Async generation operation is obsolete.");
    this.name = "ObsoleteAsyncGenerationOperationError";
  }
}

export function isObsoleteAsyncGenerationOperationError(error: unknown) {
  return error instanceof ObsoleteAsyncGenerationOperationError;
}

export function isAsyncGenerationEnabledForUser(isAuthenticated: boolean) {
  return ASYNC_GENERATION_FEATURE_ENABLED && isAuthenticated;
}

export function asyncGenerationImages(imageUrls: readonly string[]) {
  return imageUrls.map((imageUrl) => ({ imageUrl }));
}

export function isNewAsyncTerminalStatus(
  requestId: string | null,
  status: "completed" | "failed" | string | undefined,
  handledRequestId: string | null,
) {
  return Boolean(
    requestId &&
      (status === "completed" || status === "failed") &&
      requestId !== handledRequestId,
  );
}
