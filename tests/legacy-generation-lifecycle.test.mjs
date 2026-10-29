import assert from "node:assert/strict";
import test from "node:test";
import { runLegacyGenerationAfterReservation } from "../src/server/generation/legacyGenerationLifecycle.ts";

test("successful synchronous generation does not finalize failure", async () => {
  /** @type {string[]} */
  const calls = [];
  const value = await runLegacyGenerationAfterReservation({
    charge: async () => { calls.push("charged"); },
    execute: async () => { calls.push("provider"); return ["image-url"]; },
    finalizeFailure: async () => calls.push("failure"),
    getErrorMessage: () => "unexpected",
  });
  assert.deepEqual(value, ["image-url"]);
  assert.deepEqual(calls, ["charged", "provider"]);
});

test("provider failure refunds after a successful or recovered charge", async () => {
  /** @type {{errorMessage: string, refund: boolean}[]} */
  const refunds = [];
  await assert.rejects(
    runLegacyGenerationAfterReservation({
      charge: async () => {},
      execute: async () => { throw new Error("provider failed"); },
      finalizeFailure: async (input) => refunds.push(input),
      getErrorMessage: (error) => error instanceof Error ? error.message : "unknown",
    }),
    /provider failed/,
  );
  assert.deepEqual(refunds, [{ errorMessage: "provider failed", refund: true }]);
});

test("charge rejection never calls the provider and never refunds", async () => {
  let providerCalls = 0;
  /** @type {{errorMessage: string, refund: boolean}[]} */
  const refunds = [];
  await assert.rejects(
    runLegacyGenerationAfterReservation({
      charge: async () => { throw new Error("insufficient credits"); },
      execute: async () => { providerCalls += 1; return []; },
      finalizeFailure: async (input) => refunds.push(input),
      getErrorMessage: (error) => error instanceof Error ? error.message : "unknown",
    }),
    /insufficient credits/,
  );
  assert.equal(providerCalls, 0);
  assert.deepEqual(refunds, [{ errorMessage: "insufficient credits", refund: false }]);
});

