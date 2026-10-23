// @ts-nocheck
import assert from "node:assert/strict";
import test from "node:test";

import { assertAsyncGenerationEnabled } from "../src/server/generation/asyncGate.ts";

test("server async gate rejects disabled and missing values", () => {
  for (const value of [undefined, "false", "TRUE", "1"]) {
    assert.throws(
      () => assertAsyncGenerationEnabled(value),
      (error) =>
        error?.code === "PRECONDITION_FAILED" &&
        error?.message === "Async generation is disabled.",
    );
  }
});

test("disabled server async generation has no reservation, dispatch, or compensation side effects", async () => {
  let reservations = 0;
  let dispatches = 0;
  let compensations = 0;

  await assert.rejects(
    (async () => {
      assertAsyncGenerationEnabled("false");
      reservations += 1;
      dispatches += 1;
      compensations += 1;
    })(),
    (error) =>
      error?.code === "PRECONDITION_FAILED" &&
      error?.message === "Async generation is disabled.",
  );

  assert.equal(reservations, 0);
  assert.equal(dispatches, 0);
  assert.equal(compensations, 0);
});

test("enabled server async generation passes the gate", () => {
  assert.doesNotThrow(() => assertAsyncGenerationEnabled("true"));
});
