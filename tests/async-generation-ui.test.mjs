import assert from "node:assert/strict";
import test from "node:test";

import {
  asyncGenerationImages,
  isAsyncGenerationEnabledForUser,
  isNewAsyncTerminalStatus,
  ASYNC_GENERATION_FEATURE_ENABLED,
} from "../src/lib/asyncGeneration.ts";

test("normal generator routing requires authentication and the disabled rollout flag", () => {
  assert.equal(ASYNC_GENERATION_FEATURE_ENABLED, false);
  assert.equal(isAsyncGenerationEnabledForUser(false), false);
  assert.equal(isAsyncGenerationEnabledForUser(true), false);
});

test("terminal async status is handled once per request and maps images for the UI", () => {
  const handled = [];
  let handledRequestId = null;
  const statuses = [
    { requestId: "req-1", status: "processing" },
    { requestId: "req-1", status: "completed" },
    { requestId: "req-1", status: "completed" },
    { requestId: "req-2", status: "failed" },
  ];
  for (const item of statuses) {
    if (!isNewAsyncTerminalStatus(item.requestId, item.status, handledRequestId)) continue;
    handledRequestId = item.requestId;
    handled.push(item.status);
  }
  assert.deepEqual(handled, ["completed", "failed"]);
  assert.deepEqual(
    asyncGenerationImages(["https://example.test/one", "https://example.test/two"]),
    [{ imageUrl: "https://example.test/one" }, { imageUrl: "https://example.test/two" }],
  );
});

test("request identity is preserved across a non-terminal retry", () => {
  const requestId = "async-retry-1";
  assert.equal(isNewAsyncTerminalStatus(requestId, "processing", null), false);
  assert.equal(isNewAsyncTerminalStatus(requestId, "completed", null), true);
  assert.equal(isNewAsyncTerminalStatus(requestId, "completed", requestId), false);
});
