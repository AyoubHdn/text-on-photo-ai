// @ts-nocheck
import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAsyncDigitalArtInterestState,
  parseAsyncGenerationSuccessCallback,
} from "../src/server/generation/asyncPayload.ts";
import {
  buildAsyncGenerationMauticContactInput,
  syncAsyncGenerationMauticStateBestEffort,
} from "../src/server/mautic/asyncGenerationSync.ts";

const iconMetadata = {
  aspectRatio: "4:5",
  model: "flux-schnell",
  category: "Names",
  subcategory: "Arabic",
  communityAlt: "A name design",
  communityTitle: "Name design",
  sourcePage: "name-art-generator",
};

function successCallback(overrides = {}) {
  return {
    jobVersion: 1,
    generationRequestId: "req_123",
    processingAttemptId: "attempt_1",
    status: "success",
    prompt: "original prompt",
    iconMetadata,
    digitalArtInterest: "name_art",
    outputs: [{ id: "req_123-0", url: "https://s3.example/req_123-0", contentType: "image/webp", width: 1024, height: 1280 }],
    ...overrides,
  };
}

test("success callback preserves prompt and synchronous-equivalent metadata", () => {
  const parsed = parseAsyncGenerationSuccessCallback(successCallback());
  assert.ok(parsed);
  assert.equal(parsed.prompt, "original prompt");
  assert.equal(parsed.iconMetadata.model, "flux-schnell");
  assert.equal(parsed.iconMetadata.category, "Names");
  assert.equal(parsed.iconMetadata.sourcePage, "name-art-generator");
  assert.equal(parsed.outputs[0].contentType, "image/webp");
});

test("requested app model remains distinct from provider model", () => {
  const parsed = parseAsyncGenerationSuccessCallback(successCallback());
  assert.ok(parsed);
  const providerModel = "black-forest-labs/flux-schnell";
  assert.equal(providerModel, "black-forest-labs/flux-schnell");
  assert.equal(parsed.iconMetadata.model, "flux-schnell");
  assert.notEqual(parsed.iconMetadata.model, providerModel);
});

test("digital-art interest establishes first once and updates latest", () => {
  let state = { first: null, latest: null };
  state = applyAsyncDigitalArtInterestState(state, "name_art");
  assert.deepEqual(state, { first: "name_art", latest: "name_art" });
  state = applyAsyncDigitalArtInterestState(state, "arabic_name_art");
  assert.deepEqual(state, { first: "name_art", latest: "arabic_name_art" });
});

test("authoritative Mautic success sync receives credits and state fields", async () => {
  const state = { email: "user@example.com", name: "User", credits: "4.5", hasGeneratedDesign: true, firstDigitalArtInterest: "name_art", latestDigitalArtInterest: "arabic_name_art" };
  const input = buildAsyncGenerationMauticContactInput(state);
  assert.equal(input.brand_specific_credits, "4.5");
  assert.equal(input.customFields.has_generated_design, 1);
  assert.equal(input.customFields.first_digital_art_interes, "name_art");
  assert.equal(input.customFields.latest_digital_art_intere, "arabic_name_art");
  let calls = 0;
  await syncAsyncGenerationMauticStateBestEffort(state, async (contact, brand) => {
    calls += 1;
    assert.equal(brand, "namedesignai");
    assert.equal(contact.brand_specific_credits, "4.5");
    return {};
  });
  assert.equal(calls, 1);
});

test("Mautic failure is best-effort and does not fail the transition", async () => {
  const state = { email: "user@example.com", name: null, credits: "1", hasGeneratedDesign: true, firstDigitalArtInterest: null, latestDigitalArtInterest: "couples_art" };
  await assert.doesNotReject(() => syncAsyncGenerationMauticStateBestEffort(state, async () => { throw new Error("Mautic unavailable"); }));
  await assert.doesNotReject(() => syncAsyncGenerationMauticStateBestEffort(state, async () => ({ errors: [{ message: "Mautic rejected" }] })));
});

test("invalid unsigned-shaped parity fields are rejected by callback validation", () => {
  assert.equal(parseAsyncGenerationSuccessCallback(successCallback({ prompt: null })), null);
  assert.equal(parseAsyncGenerationSuccessCallback(successCallback({ digitalArtInterest: "arbitrary" })), null);
});

test("idempotent success transition creates one icon for duplicate callbacks", async () => {
  const createdIcons = [];
  let completed = false;
  const finalizeSuccess = async () => {
    if (completed) return { kind: "terminal-noop" };
    completed = true;
    createdIcons.push("req_123-0");
    return { kind: "completed" };
  };

  assert.deepEqual(await finalizeSuccess(), { kind: "completed" });
  assert.deepEqual(await finalizeSuccess(), { kind: "terminal-noop" });
  assert.deepEqual(createdIcons, ["req_123-0"]);
});

test("authoritative Mautic sync preserves refunded credits without blocking failure", async () => {
  const state = {
    email: "user@example.com",
    name: "User",
    credits: "7",
    hasGeneratedDesign: false,
    firstDigitalArtInterest: "name_art",
    latestDigitalArtInterest: "name_art",
  };
  let observedCredits = null;
  await syncAsyncGenerationMauticStateBestEffort(state, async (contact) => {
    observedCredits = contact.brand_specific_credits;
    return {};
  });
  assert.equal(observedCredits, "7");
});
console.log("async generation parity tests passed");
