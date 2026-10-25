export const GENERATION_ASYNC_REQUEST_TYPE = "generateIconAsync" as const;
export const UNCLAIMED_RECOVERY_AFTER_SECONDS = 15 * 60;
export const DEFAULT_PROCESSING_GRACE_SECONDS = 120;
export const DEFAULT_RECOVERY_BATCH_SIZE = 25;
export const DEFAULT_RECOVERY_MAX_MS = 2500;
export const DEFAULT_RECOVERY_DB_TIMEOUT_MS = 1000;
export const DEFAULT_RECOVERY_DB_LOCK_TIMEOUT_MS = 250;
export const DEFAULT_RECOVERY_DB_MAX_WAIT_MS = 250;
export const DEFAULT_RECOVERY_BACKOFF_SECONDS = 60;
export const MAX_RECOVERY_BACKOFF_SECONDS = 15 * 60;

export type RecoveryCandidate = {
  generationRequestId: string;
  requestType: string;
  executionScope: string | null;
  status: string;
  processingAttemptId: string | null;
  createdAt: Date | string;
  leaseExpiresAt: Date | string | null;
  recoveryNextAttemptAt: Date | string | null;
};

export type RecoveryOutcome = "FAILED" | "TERMINAL_NOOP" | "SKIPPED";

export type RecoveryDbTimeouts = {
  statementTimeoutMs: number;
  lockTimeoutMs: number;
  maxWaitMs: number;
};

export function recoveryDbTimeouts(statementTimeoutMs = DEFAULT_RECOVERY_DB_TIMEOUT_MS, lockTimeoutMs = DEFAULT_RECOVERY_DB_LOCK_TIMEOUT_MS, maxWaitMs = DEFAULT_RECOVERY_DB_MAX_WAIT_MS): RecoveryDbTimeouts {
  const bounded = (value: number, fallback: number, minimum: number, maximum: number) =>
    Number.isFinite(value) && value > 0 ? Math.min(maximum, Math.max(minimum, Math.floor(value))) : fallback;
  return {
    statementTimeoutMs: bounded(statementTimeoutMs, DEFAULT_RECOVERY_DB_TIMEOUT_MS, 100, 2000),
    lockTimeoutMs: bounded(lockTimeoutMs, DEFAULT_RECOVERY_DB_LOCK_TIMEOUT_MS, 50, 1000),
    maxWaitMs: bounded(maxWaitMs, DEFAULT_RECOVERY_DB_MAX_WAIT_MS, 50, 1000),
  };
}

export function isValidOptionalExecutionScope(value: unknown) {
  return value === undefined || value === null ||
    (typeof value === "string" && /^[A-Za-z0-9._-]{1,100}$/.test(value.trim()));
}

export function normalizeOptionalExecutionScope(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : null;
}

export function recoveryBackoffSeconds(attempt: number) {
  const exponent = Math.max(0, Math.min(4, attempt - 1));
  return Math.min(MAX_RECOVERY_BACKOFF_SECONDS, DEFAULT_RECOVERY_BACKOFF_SECONDS * (2 ** exponent));
}

export function isStaleGenerationRequest(
  request: RecoveryCandidate,
  now: Date,
  executionScope: string,
  processingGraceSeconds = DEFAULT_PROCESSING_GRACE_SECONDS,
) {
  if (request.requestType !== GENERATION_ASYNC_REQUEST_TYPE) return false;
  if (!executionScope || request.executionScope !== executionScope) return false;

  const createdAt = new Date(request.createdAt).getTime();
  if (request.status === "started") {
    return Number.isFinite(createdAt) &&
      createdAt < now.getTime() - UNCLAIMED_RECOVERY_AFTER_SECONDS * 1000;
  }

  if (request.status !== "processing" || request.leaseExpiresAt === null) return false;
  const leaseExpiresAt = new Date(request.leaseExpiresAt).getTime();
  return Number.isFinite(leaseExpiresAt) &&
    leaseExpiresAt < now.getTime() - processingGraceSeconds * 1000;
}

export function recoveryCandidateWhere(now: Date, executionScope: string, processingGraceSeconds = DEFAULT_PROCESSING_GRACE_SECONDS) {
  return {
    requestType: GENERATION_ASYNC_REQUEST_TYPE,
    executionScope,
    AND: [
      {
        OR: [
          {
            status: "started",
            createdAt: { lt: new Date(now.getTime() - UNCLAIMED_RECOVERY_AFTER_SECONDS * 1000) },
          },
          {
            status: "processing",
            leaseExpiresAt: { lt: new Date(now.getTime() - processingGraceSeconds * 1000) },
          },
        ],
      },
      {
        OR: [
          { recoveryNextAttemptAt: null },
          { recoveryNextAttemptAt: { lte: now } },
        ],
      },
    ],
  } as const;
}

export function parseRecoveryPositiveInt(value: string | undefined, fallback: number, maximum: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

export async function runBoundedRecovery(options: {
  listCandidates: (limit: number) => Promise<RecoveryCandidate[]>;
  reconcileOne: (candidate: RecoveryCandidate) => Promise<RecoveryOutcome>;
  batchSize: number;
  maxDurationMs: number;
  onError?: (candidate: RecoveryCandidate, error: unknown) => Promise<void>;
  now?: () => number;
}) {
  const now = options.now ?? Date.now;
  const batchSize = Math.max(1, Math.floor(options.batchSize));
  const deadline = now() + Math.max(1, Math.floor(options.maxDurationMs));
  const candidates = await options.listCandidates(batchSize);
  const result = { examined: 0, failed: 0, terminalNoop: 0, skipped: 0, errors: 0, stoppedForDeadline: false };

  for (const candidate of candidates.slice(0, batchSize)) {
    if (now() >= deadline) {
      result.stoppedForDeadline = true;
      break;
    }
    result.examined += 1;
    try {
      const outcome = await options.reconcileOne(candidate);
      if (outcome === "FAILED") result.failed += 1;
      else if (outcome === "TERMINAL_NOOP") result.terminalNoop += 1;
      else result.skipped += 1;
    } catch (error) {
      result.errors += 1;
      try {
        await options.onError?.(candidate, error);
      } catch (retryError) {
        console.error("Generation recovery retry marker failed", {
          generationRequestId: candidate.generationRequestId,
          error: retryError instanceof Error ? retryError.message : "unknown_error",
        });
      }
      console.error("Generation recovery candidate failed", {
        generationRequestId: candidate.generationRequestId,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }
  return result;
}
