import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PROCESSING_GRACE_SECONDS,
  GENERATION_ASYNC_REQUEST_TYPE,
  isValidOptionalExecutionScope,
  isStaleGenerationRequest,
  normalizeOptionalExecutionScope,
  recoveryBackoffSeconds,
  recoveryCandidateWhere,
  recoveryDbTimeouts,
  runBoundedRecovery,
  scheduleGenerationRecovery,
} from "../workers/db/src/recovery.ts";

const scope = "cloudflare-staging";
const now = new Date("2026-10-24T12:00:00.000Z");

/**
 * @param {Partial<import("../workers/db/src/recovery.ts").RecoveryCandidate>} [overrides]
 * @returns {import("../workers/db/src/recovery.ts").RecoveryCandidate}
 */
function candidate(overrides = {}) {
  return {
    generationRequestId: "recovery-test-001",
    requestType: GENERATION_ASYNC_REQUEST_TYPE,
    executionScope: scope,
    status: "started",
    processingAttemptId: null,
    createdAt: new Date(now.getTime() - 16 * 60 * 1000),
    leaseExpiresAt: null,
    recoveryNextAttemptAt: null,
    ...overrides,
  };
}

test("legacy async callers may omit scope, while invalid scopes are rejected", () => {
  assert.equal(isValidOptionalExecutionScope(undefined), true);
  assert.equal(isValidOptionalExecutionScope(null), true);
  assert.equal(isValidOptionalExecutionScope("cloudflare-staging"), true);
  assert.equal(isValidOptionalExecutionScope(""), false);
  assert.equal(isValidOptionalExecutionScope("scope with spaces"), false);
  assert.equal(normalizeOptionalExecutionScope(undefined), null);
  assert.equal(normalizeOptionalExecutionScope(null), null);
  assert.equal(normalizeOptionalExecutionScope(" cloudflare-staging "), "cloudflare-staging");
});

test("recovers only an async request older than the 15-minute unclaimed threshold", () => {
  assert.equal(isStaleGenerationRequest(candidate(), now, scope), true);
  assert.equal(
    isStaleGenerationRequest(
      candidate({ createdAt: new Date(now.getTime() - 14 * 60 * 1000) }),
      now,
      scope,
    ),
    false,
  );
});

test("requires the full processing grace period after lease expiry", () => {
  assert.equal(
    isStaleGenerationRequest(
      candidate({
        status: "processing",
        processingAttemptId: "attempt-1",
        leaseExpiresAt: new Date(now.getTime() - 60 * 1000),
      }),
      now,
      scope,
    ),
    false,
  );
  assert.equal(
    isStaleGenerationRequest(
      candidate({
        status: "processing",
        processingAttemptId: "attempt-1",
        leaseExpiresAt: new Date(now.getTime() - 121 * 1000),
      }),
      now,
      scope,
    ),
    true,
  );
  assert.equal(DEFAULT_PROCESSING_GRACE_SECONDS, 120);
});

test("excludes active, terminal, synchronous, and differently scoped requests", () => {
  assert.equal(isStaleGenerationRequest(candidate({ createdAt: now }), now, scope), false);
  assert.equal(isStaleGenerationRequest(candidate({ status: "completed" }), now, scope), false);
  assert.equal(isStaleGenerationRequest(candidate({ status: "failed" }), now, scope), false);
  assert.equal(
    isStaleGenerationRequest(candidate({ requestType: "generateIcon" }), now, scope),
    false,
  );
  assert.equal(
    isStaleGenerationRequest(candidate({ executionScope: "other-deployment" }), now, scope),
    false,
  );
});

test("candidate query is explicitly scoped and uses both stale branches", () => {
  const where = recoveryCandidateWhere(now, scope);
  assert.deepEqual(where.requestType, GENERATION_ASYNC_REQUEST_TYPE);
  assert.deepEqual(where.executionScope, scope);

  const clauses = where.AND;
  assert.ok(Array.isArray(clauses));
  assert.equal(clauses.length, 2);
  const staleClause = clauses[0];
  const retryClause = clauses[1];
  assert.ok(staleClause);
  assert.ok(retryClause);
  const staleBranches = staleClause.OR;
  const retryBranches = retryClause.OR;
  assert.ok(Array.isArray(staleBranches));
  assert.ok(Array.isArray(retryBranches));
  assert.equal(staleBranches.length, 2);
  assert.equal(staleBranches[0]?.status, "started");
  assert.equal(staleBranches[1]?.status, "processing");
  assert.deepEqual(staleBranches[0], {
    status: "started",
    createdAt: {
      lt: new Date(now.getTime() - 15 * 60 * 1000),
    },
  });
  assert.deepEqual(staleBranches[1], {
    status: "processing",
    leaseExpiresAt: {
      lt: new Date(now.getTime() - 120 * 1000),
    },
  });
  assert.equal(retryBranches[0]?.recoveryNextAttemptAt, null);
});

test("recovery database timeouts are bounded and recovery-only", () => {
  assert.deepEqual(recoveryDbTimeouts(1000, 250, 250), {
    statementTimeoutMs: 1000,
    lockTimeoutMs: 250,
    maxWaitMs: 250,
  });
  assert.deepEqual(recoveryDbTimeouts(99999, 0, -1), {
    statementTimeoutMs: 2000,
    lockTimeoutMs: 250,
    maxWaitMs: 250,
  });
});

test("persistent backoff increases and caps retry delay", () => {
  assert.equal(recoveryBackoffSeconds(1), 60);
  assert.equal(recoveryBackoffSeconds(2), 120);
  assert.equal(recoveryBackoffSeconds(5), 900);
  assert.equal(recoveryBackoffSeconds(6), 900);
  assert.equal(recoveryBackoffSeconds(20), 900);
});

test("reconciliation is bounded, continues after an individual failure, and counts outcomes", async () => {
  /** @type {string[]} */
  const seen = [];
  const result = await runBoundedRecovery({
    batchSize: 2,
    maxDurationMs: 1000,
    listCandidates: async (limit) => {
      assert.equal(limit, 2);
      return [candidate({ generationRequestId: "one" }), candidate({ generationRequestId: "two" }), candidate({ generationRequestId: "three" })];
    },
    /**
     * @param {import("../workers/db/src/recovery.ts").RecoveryCandidate} item
     * @returns {Promise<import("../workers/db/src/recovery.ts").RecoveryOutcome>}
     */
    reconcileOne: async (item) => {
      seen.push(item.generationRequestId);
      if (item.generationRequestId === "one") throw new Error("simulated candidate failure");
      return "FAILED";
    },
    onError: async () => {},
  });
  assert.deepEqual(seen, ["one", "two"]);
  assert.deepEqual(result, {
    examined: 2,
    failed: 1,
    terminalNoop: 0,
    skipped: 0,
    errors: 1,
    stoppedForDeadline: false,
  });
});

test("reconciliation stops when its execution budget is exhausted", async () => {
  let clock = 0;
  let calls = 0;
  const result = await runBoundedRecovery({
    batchSize: 25,
    maxDurationMs: 10,
    now: () => clock,
    listCandidates: async () => [candidate({ generationRequestId: "one" }), candidate({ generationRequestId: "two" })],
    /** @returns {Promise<import("../workers/db/src/recovery.ts").RecoveryOutcome>} */
    reconcileOne: async () => {
      calls += 1;
      clock = 11;
      return "FAILED";
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.examined, 1);
  assert.equal(result.stoppedForDeadline, true);
});

test("overlapping runs are safe when the authoritative transition is idempotent", async () => {
  let transitionCount = 0;
  let terminal = false;
  /** @returns {Promise<import("../workers/db/src/recovery.ts").RecoveryOutcome>} */
  const reconcileOne = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (terminal) return "TERMINAL_NOOP";
    terminal = true;
    transitionCount += 1;
    return "FAILED";
  };
  const [first, second] = await Promise.all([
    runBoundedRecovery({
      batchSize: 1,
      maxDurationMs: 1000,
      listCandidates: async () => [candidate()],
      reconcileOne,
    }),
    runBoundedRecovery({
      batchSize: 1,
      maxDurationMs: 1000,
      listCandidates: async () => [candidate()],
      reconcileOne,
    }),
  ]);
  assert.equal(transitionCount, 1);
  assert.equal(first.failed + second.failed, 1);
  assert.equal(first.terminalNoop + second.terminalNoop, 1);
});

test("success-versus-recovery and late callback races are modeled as terminal wins", () => {
  for (const firstAction of ["success", "recovery"]) {
    let status = "processing";
    let refundCount = 0;
    const commitSuccess = () => {
      if (status !== "processing") return "TERMINAL_NOOP";
      status = "completed";
      return "COMPLETED";
    };
    const recover = () => {
      if (status !== "processing") return "TERMINAL_NOOP";
      status = "failed";
      refundCount += 1;
      return "FAILED";
    };
    const first = firstAction === "success" ? commitSuccess() : recover();
    const second = first === "COMPLETED" ? recover() : commitSuccess();
    assert.ok(["COMPLETED", "FAILED"].includes(first));
    assert.equal(second, "TERMINAL_NOOP");
    assert.equal(refundCount, first === "FAILED" ? 1 : 0);
    assert.equal(status === "completed" || status === "failed", true);
  }
});

test("scheduled handler skips disabled mode and uses the WorkerEntrypoint context", async () => {
  let waitCount = 0;
  /** @type {Promise<void> | undefined} */
  let scheduledPromise;
  /** @type {unknown[] | undefined} */
  let receivedArgs;
  /** @param {Promise<void>} promise */
  const waitUntil = (promise) => {
    waitCount += 1;
    scheduledPromise = promise;
  };
  /** @param {...unknown} args */
  const runRecovery = async (...args) => {
    receivedArgs = args;
  };

  scheduleGenerationRecovery(
    { GENERATION_RECOVERY_ENABLED: "false", GENERATION_RECOVERY_SCOPE: scope },
    waitUntil,
    runRecovery,
  );
  assert.equal(waitCount, 0);
  assert.equal(receivedArgs, undefined);

  scheduleGenerationRecovery(
    {
      GENERATION_RECOVERY_ENABLED: "true",
      GENERATION_RECOVERY_SCOPE: scope,
      GENERATION_RECOVERY_BATCH_SIZE: "3",
      GENERATION_RECOVERY_MAX_MS: "2500",
      GENERATION_RECOVERY_PROCESSING_GRACE_SECONDS: "120",
      GENERATION_RECOVERY_DB_TIMEOUT_MS: "1000",
      GENERATION_RECOVERY_DB_LOCK_TIMEOUT_MS: "250",
      GENERATION_RECOVERY_DB_MAX_WAIT_MS: "250",
    },
    waitUntil,
    runRecovery,
  );
  assert.equal(waitCount, 1);
  assert.ok(scheduledPromise);
  await scheduledPromise;
  assert.deepEqual(receivedArgs, [scope, 3, 2500, 120, {
    statementTimeoutMs: 1000,
    lockTimeoutMs: 250,
    maxWaitMs: 250,
  }]);
});

test("persistent retry state lets later five-minute runs pass a permanently failing candidate", async () => {
  /** @type {Map<string, { nextAttemptAt: number | null }>} */
  const state = new Map([
    ["one", { nextAttemptAt: now.getTime() }],
    ["two", { nextAttemptAt: now.getTime() }],
  ]);
  /** @type {string[]} */
  const processed = [];
  let runNow = now.getTime();
  const listCandidates = async () => [...state.entries()]
    .filter(([, item]) => item.nextAttemptAt === null || item.nextAttemptAt <= runNow)
    .sort(([, left], [, right]) => Number(left.nextAttemptAt === null) - Number(right.nextAttemptAt === null) || (left.nextAttemptAt ?? 0) - (right.nextAttemptAt ?? 0))
    .map(([generationRequestId]) => candidate({ generationRequestId }));
  /** @param {import("../workers/db/src/recovery.ts").RecoveryCandidate} item */
  const markRetry = async (item) => {
    const entry = state.get(item.generationRequestId);
    assert.ok(entry);
    entry.nextAttemptAt = runNow + 60_000;
  };
  /**
   * @param {import("../workers/db/src/recovery.ts").RecoveryCandidate} item
   * @returns {Promise<import("../workers/db/src/recovery.ts").RecoveryOutcome>}
   */
  const reconcileOne = async (item) => {
    processed.push(item.generationRequestId);
    if (item.generationRequestId === "one") throw new Error("persistent simulated failure");
    state.delete(item.generationRequestId);
    return "FAILED";
  };

  const first = await runBoundedRecovery({
    batchSize: 1,
    maxDurationMs: 1000,
    listCandidates,
    reconcileOne,
    onError: markRetry,
  });
  assert.equal(first.errors, 1);
  assert.deepEqual(processed, ["one"]);

  // The real cron cadence is five minutes. Candidate one is retryable again,
  // but the NULL retry timestamp on candidate two sorts first and makes progress.
  runNow += 5 * 60_000;
  const second = await runBoundedRecovery({
    batchSize: 1,
    maxDurationMs: 1000,
    listCandidates,
    reconcileOne,
    onError: markRetry,
  });
  assert.equal(second.failed, 1);
  assert.deepEqual(processed, ["one", "two"]);
  assert.equal(state.has("one"), true);
  assert.equal(state.has("two"), false);
});
