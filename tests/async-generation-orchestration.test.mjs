// @ts-nocheck
import assert from "node:assert/strict";
import test from "node:test";

import {
  isValidGenerationRequestId,
  reserveAndDispatchGeneration,
  toPublicGenerationStatus,
} from "../src/server/generation/asyncOrchestration.ts";

const job = (status = "started") => ({
  generationRequestId: "req_123",
  status,
  imageUrls: status === "completed" ? ["https://s3.example/req_123-0"] : [],
  outputIconIds: status === "completed" ? ["req_123-0"] : [],
});

function options(overrides = {}) {
  return {
    reserve: async () => ({ outcome: "CREATED", job: job() }),
    reserveInput: { generationRequestId: "req_123" },
    payloadBase: { generationRequestId: "req_123", model: "test-model" },
    createProcessingAttemptId: () => "attempt_1",
    dispatch: async () => {},
    failIfUnclaimed: async () => {},
    ...overrides,
  };
}

test("first reservation dispatches once with a processing attempt", async () => {
  const dispatched = [];
  const result = await reserveAndDispatchGeneration(
    options({ dispatch: async (payload) => dispatched.push(payload) }),
  );

  assert.equal(result.kind, "started");
  assert.equal(dispatched.length, 1);
  assert.equal(dispatched[0].processingAttemptId, "attempt_1");
});

test("duplicate request returns existing state without dispatch", async () => {
  let dispatches = 0;
  const result = await reserveAndDispatchGeneration(
    options({
      reserve: async () => ({ outcome: "EXISTING", job: job("processing") }),
      dispatch: async () => { dispatches += 1; },
    }),
  );

  assert.equal(result.kind, "existing");
  assert.equal(result.job.status, "processing");
  assert.equal(dispatches, 0);
});

test("completed requests return their existing result without dispatch", async () => {
  let dispatches = 0;
  const result = await reserveAndDispatchGeneration(
    options({
      reserve: async () => ({ outcome: "EXISTING", job: job("completed") }),
      dispatch: async () => { dispatches += 1; },
    }),
  );

  assert.equal(result.kind, "existing");
  assert.deepEqual(result.job.outputIconIds, ["req_123-0"]);
  assert.equal(dispatches, 0);
});

test("Lambda dispatch failure compensates an unclaimed reservation", async () => {
  const compensations = [];
  await assert.rejects(
    reserveAndDispatchGeneration(
      options({
        dispatch: async () => { throw new Error("dispatch failed"); },
        failIfUnclaimed: async (input) => compensations.push(input),
      }),
    ),
    /dispatch failed/,
  );

  assert.deepEqual(compensations, [{
    generationRequestId: "req_123",
    errorMessage: "GENERATION_LAMBDA_DISPATCH_FAILED",
  }]);
});

test("reservation failure never dispatches", async () => {
  let dispatches = 0;
  const result = await reserveAndDispatchGeneration(
    options({
      reserve: async () => ({ ok: false, code: "INSUFFICIENT_CREDITS" }),
      dispatch: async () => { dispatches += 1; },
    }),
  );

  assert.deepEqual(result, { kind: "error", code: "INSUFFICIENT_CREDITS" });
  assert.equal(dispatches, 0);
});

test("public polling states expose only UI-safe fields", () => {
  const sequence = ["started", "processing", "completed"].map((status) =>
    toPublicGenerationStatus(job(status)),
  );
  const [started, processing, completed] = sequence;
  const failed = toPublicGenerationStatus(job("failed"));

  assert.equal(started.status, "started");
  assert.equal(processing.status, "processing");
  assert.equal(sequence.map((item) => item.status).join(" -> "), "started -> processing -> completed");
  assert.deepEqual(completed.imageUrls, ["https://s3.example/req_123-0"]);
  assert.equal(failed.errorMessage, "Generation failed. Your credits were refunded.");
  assert.equal("userId" in completed, false);
  assert.equal("leaseExpiresAt" in completed, false);
});

test("generation request IDs use the state-machine restriction", () => {
  assert.equal(isValidGenerationRequestId("A_b-123"), true);
  assert.equal(isValidGenerationRequestId(""), false);
  assert.equal(isValidGenerationRequestId("bad value"), false);
  assert.equal(isValidGenerationRequestId("a".repeat(121)), false);
});
