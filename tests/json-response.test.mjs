import test from "node:test";
import assert from "node:assert/strict";

import { getJsonNumber, getJsonString, isJsonRecord } from "../src/lib/jsonResponse.ts";

test("JSON response guards reject null, arrays, and primitives", () => {
  assert.equal(isJsonRecord(null), false);
  assert.equal(isJsonRecord([]), false);
  assert.equal(isJsonRecord("invalid"), false);
  assert.equal(isJsonRecord({ error: "failed" }), true);
});

test("JSON response accessors narrow optional fields", () => {
  const payload = { error: "failed", retryAfterMinutes: 3, invalid: null };
  assert.equal(getJsonString(payload, "error"), "failed");
  assert.equal(getJsonNumber(payload, "retryAfterMinutes"), 3);
  assert.equal(getJsonString(payload, "invalid"), undefined);
  assert.equal(getJsonNumber(payload, "error"), undefined);
});
