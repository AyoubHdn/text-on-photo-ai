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
} from "../workers/db/src/recovery.ts";

const scope = "cloudflare-staging";
const now = new Date("2026-10-24T12:00:00.000Z");

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
  assert.equal(where.AND.length, 2);
  assert.equal(where.AND[0].OR.length, 2);
  assert.equal(where.AND[0].OR[0].status, "started");
  assert.equal(where.AND[0].OR[1].status, "processing");
  assert.equal(
    where.AND[0].OR[0].createdAt.lt.toISOString(),
    new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
  );
  assert.equal(
    where.AND[0].OR[1].leaseExpiresAt.lt.toISOString(),
    new Date(now.getTime() - 120 * 1000).toISOString(),
  );
  assert.equal(where.AND[1].OR[0].recoveryNextAttemptAt, null);
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
  const seen = [];
  const result = await runBoundedRecovery({
    batchSize: 2,
    maxDurationMs: 1000,
    listCandidates: async (limit) => {
      assert.equal(limit, 2);
      return [candidate({ generationRequestId: "one" }), candidate({ generationRequestId: "two" }), candidate({ generationRequestId: "three" })];
    },
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

test("persistent retry state lets later scheduled runs progress past a failing candidate", async () => {
  const state = new Map([
    ["one", { nextAttemptAt: now.getTime() }],
    ["two", { nextAttemptAt: now.getTime() }],
  ]);
  let runNow = now.getTime();
  const listCandidates = async () => [...state.entries()]
    .filter(([, item]) => item.nextAttemptAt <= runNow)
    .map(([generationRequestId]) => candidate({ generationRequestId }));
  const markRetry = async (item) => {
    state.get(item.generationRequestId).nextAttemptAt = runNow + 60_000;
  };
  const first = await runBoundedRecovery({
    batchSize: 1,
    maxDurationMs: 1000,
    listCandidates,
    reconcileOne: async () => { throw new Error("persistent simulated failure"); },
    onError: markRetry,
  });
  assert.equal(first.errors, 1);
  runNow += 60_000;
  const second = await runBoundedRecovery({
    batchSize: 1,
    maxDurationMs: 1000,
    listCandidates,
    reconcileOne: async (item) => {
      assert.equal(item.generationRequestId, "one");
      state.delete(item.generationRequestId);
      return "FAILED";
    },
    onError: markRetry,
  });
  assert.equal(second.failed, 1);
  assert.equal(state.has("two"), true);
});
