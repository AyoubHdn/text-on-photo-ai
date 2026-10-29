/// <reference path="../workers/db/worker-configuration.d.ts" />
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { runLegacyGenerationAfterReservation } from "../src/server/generation/legacyGenerationLifecycle.ts";

const databaseUrl = process.env.RECOVERY_TEST_DATABASE_URL;
const integration = databaseUrl ? test : test.skip;
const require = createRequire(import.meta.url);

if (databaseUrl && !["127.0.0.1", "localhost", "postgres"].includes(new URL(databaseUrl).hostname)) {
  throw new Error("Active DB-service integration tests require an isolated local PostgreSQL host");
}

globalThis.WorkerEntrypoint = class {
  /** @param {unknown} env @param {unknown} ctx */
  constructor(env, ctx) { this.env = env; this.ctx = ctx; }
};

async function loadDbService() {
  const stub = "cloudflare-workers-stub";
  const bundle = await build({
    entryPoints: ["workers/db/src/index.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node22",
    write: false,
    plugins: [{
      name: "cloudflare-workers-test-stub",
      setup(buildContext) {
        buildContext.onResolve({ filter: /^cloudflare:workers$/ }, () => ({ path: stub, namespace: "test-stub" }));
        buildContext.onLoad({ filter: /.*/, namespace: "test-stub" }, () => ({ contents: "export class WorkerEntrypoint { constructor(env, ctx) { this.env = env; this.ctx = ctx; } }", loader: "js" }));
        buildContext.onResolve({ filter: /generated[\\/]prisma[\\/]client$/ }, () => ({ path: require.resolve("@prisma/client") }));
      },
    }],
  });
  const output = bundle.outputFiles[0];
  if (!output) throw new Error("DB Worker bundle was empty");
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "namedesignai-db-service-"));
  const bundlePath = path.join(tempDir, "db-worker.cjs");
  await writeFile(bundlePath, output.contents);
  try {
    const module = await import(pathToFileURL(bundlePath).href);
    return module.default?.default ?? module.default ?? module;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

integration("active DB-service operations preserve ownership, idempotency and atomic credit behavior", async () => {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  const DbService = await loadDbService();
  const suffix = `active-db-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({ data: { email: `${suffix}@example.invalid`, credits: 10 } });
  const icon = await prisma.icon.create({ data: { id: `${suffix}-icon`, userId: user.id, prompt: "background", metadata: { sourcePage: "name-art-generator" } } });
  const service = Object.create(DbService.prototype);
  service.env = { HYPERDRIVE: { connectionString: databaseUrl } };
  service.ctx = {
    /** @param {Promise<unknown>} promise */
    waitUntil: (promise) => promise,
  };
  try {
    const [leadA, leadB] = await Promise.all([
      service.userCapturePaidTrafficLead({ email: `${suffix}-lead@example.invalid`, name: "Lead", hasGeneratedDesign: false, hasVisitedCheckout: true }),
      service.userCapturePaidTrafficLead({ email: `${suffix}-lead@example.invalid`, name: "Lead", hasGeneratedDesign: true, hasVisitedCheckout: false }),
    ]);
    assert.equal(leadA.found, true);
    assert.equal(leadB.found, true);
    assert.equal(await prisma.user.count({ where: { email: `${suffix}-lead@example.invalid` } }), 1);

    const interest = await service.userRecordDigitalArtInterest({ userId: user.id, interest: "name_art" });
    assert.equal(interest.found, true);
    const contacts = await service.mauticListContacts({ limit: 10, cursor: null });
    assert.equal(contacts.contacts.some(/** @param {{id: string}} contact */ (contact) => contact.id === user.id), true);
    const resolved = await service.backgroundResolveIcon({ imageId: icon.id, userId: user.id, paidTrafficUser: false });
    assert.equal(resolved.found, true);
    const claims = await Promise.all([
      service.backgroundClaimCharge({ imageId: icon.id, userId: user.id, creditCost: "1" }),
      service.backgroundClaimCharge({ imageId: icon.id, userId: user.id, creditCost: "1" }),
    ]);
    assert.deepEqual(claims.map((item) => "outcome" in item ? item.outcome : item.code).sort(), ["ALREADY_CLAIMED", "CLAIMED"]);
    const charged = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { credits: true } });
    assert.equal(charged.credits.toString(), "9");
    const finalized = await service.backgroundFinalize({ imageId: icon.id, userId: user.id, transparentImageUrl: "https://cdn.invalid/transparent.png", backgroundRemovedAt: new Date().toISOString() });
    assert.deepEqual(finalized, { updated: true, transparentImageUrl: "https://cdn.invalid/transparent.png" });

    const [unlockA, unlockB] = await Promise.all([
      service.cpaStartUnlock({ userId: user.id, token: `${suffix}-cpa-a`, now: new Date().toISOString(), leadIp: null }),
      service.cpaStartUnlock({ userId: user.id, token: `${suffix}-cpa-b`, now: new Date().toISOString(), leadIp: null }),
    ]);
    assert.deepEqual([unlockA.outcome, unlockB.outcome].sort(), ["CREATED", "PENDING"]);
    const applied = await Promise.all([
      service.cpaProcessPostback({ userId: user.id, transactionId: `${suffix}-tx`, payout: 1, requestedApproved: true, result: "complete", leadIp: null, now: new Date().toISOString(), rewardCredits: "1" }),
      service.cpaProcessPostback({ userId: user.id, transactionId: `${suffix}-tx`, payout: 1, requestedApproved: true, result: "complete", leadIp: null, now: new Date().toISOString(), rewardCredits: "1" }),
    ]);
    assert.deepEqual(applied.map((item) => item.outcome).sort(), ["APPLIED", "DUPLICATE"]);
    const finalUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { credits: true, firstDigitalArtInterest: true, latestDigitalArtInterest: true } });
    assert.equal(finalUser.credits.toString(), "10");
    assert.equal(finalUser.firstDigitalArtInterest, "name_art");
    assert.equal(finalUser.latestDigitalArtInterest, "name_art");
  } finally {
    await prisma.cpaUnlock.deleteMany({ where: { userId: user.id } });
    await prisma.icon.deleteMany({ where: { id: icon.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.user.deleteMany({ where: { email: `${suffix}-lead@example.invalid` } });
    await prisma.$disconnect();
  }
});

integration("active DB-service operations preserve charge state, guest ownership and monotone lead flags", async () => {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  const DbService = await loadDbService();
  const suffix = `active-db-race-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const makeService = () => {
    const service = Object.create(DbService.prototype);
    service.env = { HYPERDRIVE: { connectionString: databaseUrl } };
    /** @param {Promise<unknown>} promise */
    const waitUntil = (promise) => promise;
    service.ctx = { waitUntil };
    return service;
  };
  const service = makeService();
  const userA = await prisma.user.create({ data: { email: `${suffix}-a@example.invalid`, credits: 5 } });
  const userB = await prisma.user.create({ data: { email: `${suffix}-b@example.invalid`, credits: 5 } });
  const lowCreditUser = await prisma.user.create({ data: { email: `${suffix}-low@example.invalid`, credits: 0.5 } });
  const lowCreditIcon = await prisma.icon.create({ data: { id: `${suffix}-low-icon`, userId: lowCreditUser.id, prompt: "low-credit" } });
  const guestIcon = await prisma.icon.create({ data: { id: `${suffix}-guest-icon`, userId: null, prompt: "guest" } });
  try {
    const lowClaims = await Promise.all([
      service.backgroundClaimCharge({ imageId: lowCreditIcon.id, userId: lowCreditUser.id, creditCost: "1" }),
      service.backgroundClaimCharge({ imageId: lowCreditIcon.id, userId: lowCreditUser.id, creditCost: "1" }),
    ]);
    assert.deepEqual(lowClaims.map((item) => "outcome" in item ? item.outcome : item.code).sort(), ["INSUFFICIENT_CREDITS", "INSUFFICIENT_CREDITS"]);
    const lowState = await prisma.user.findUniqueOrThrow({ where: { id: lowCreditUser.id }, select: { credits: true } });
    const lowIconState = await prisma.icon.findUniqueOrThrow({ where: { id: lowCreditIcon.id }, select: { backgroundRemovedAt: true } });
    assert.equal(lowState.credits.toString(), "0.5");
    assert.equal(lowIconState.backgroundRemovedAt, null);

    const sharedUser = await prisma.user.create({ data: { email: `${suffix}-shared@example.invalid`, credits: 1 } });
    const sharedIconA = await prisma.icon.create({ data: { id: `${suffix}-shared-a`, userId: sharedUser.id, prompt: "shared-a" } });
    const sharedIconB = await prisma.icon.create({ data: { id: `${suffix}-shared-b`, userId: sharedUser.id, prompt: "shared-b" } });
    const sharedClaims = await Promise.all([
      service.backgroundClaimCharge({ imageId: sharedIconA.id, userId: sharedUser.id, creditCost: "1" }),
      service.backgroundClaimCharge({ imageId: sharedIconB.id, userId: sharedUser.id, creditCost: "1" }),
    ]);
    assert.deepEqual(sharedClaims.map((item) => "outcome" in item ? item.outcome : item.code).sort(), ["CLAIMED", "INSUFFICIENT_CREDITS"]);
    const sharedState = await prisma.user.findUniqueOrThrow({ where: { id: sharedUser.id }, select: { credits: true } });
    assert.equal(sharedState.credits.toString(), "0");
    const sharedIcons = await prisma.icon.findMany({ where: { id: { in: [sharedIconA.id, sharedIconB.id] } }, select: { id: true, backgroundRemovedAt: true } });
    assert.equal(sharedIcons.filter((item) => item.backgroundRemovedAt !== null).length, 1);

    const guestClaims = await Promise.all([
      service.backgroundResolveIcon({ imageId: guestIcon.id, userId: userA.id, paidTrafficUser: true }),
      service.backgroundResolveIcon({ imageId: guestIcon.id, userId: userB.id, paidTrafficUser: true }),
    ]);
    assert.equal(guestClaims.filter((item) => item.found).length, 1);
    const guestState = await prisma.icon.findUniqueOrThrow({ where: { id: guestIcon.id }, select: { userId: true } });
    assert.ok(guestState.userId === userA.id || guestState.userId === userB.id);

    const requestId = `${suffix}-generation`;
    const started = await service.generationStartLegacy({ generationRequestId: requestId, userId: userA.id, sourcePage: "name-art-generator", requestType: "generateIcon", model: "flux-schnell", promptHash: `${suffix}-prompt`, inputHash: `${suffix}-input`, numberOfImages: 1, aspectRatio: "1:1", creditsCharged: "1" });
    assert.equal(started.outcome, "CREATED");
    const charges = await Promise.all([
      service.generationLegacyCharge({ generationRequestId: requestId, userId: userA.id, creditsCharged: "1" }),
      service.generationLegacyCharge({ generationRequestId: requestId, userId: userA.id, creditsCharged: "1" }),
    ]);
    assert.deepEqual(charges.map((item) => "charged" in item && item.charged ? "CHARGED" : "alreadyCharged" in item ? "ALREADY_CHARGED" : item.code).sort(), ["ALREADY_CHARGED", "CHARGED"]);
    const failed = await Promise.all([
      service.generationLegacyFinalizeFailure({ generationRequestId: requestId, errorMessage: "provider failed" }),
      service.generationLegacyFinalizeFailure({ generationRequestId: requestId, errorMessage: "provider failed" }),
    ]);
    assert.deepEqual(failed.map((item) => "outcome" in item ? item.outcome : item.code).sort(), ["FAILED", "TERMINAL_NOOP"]);
    const refundedUser = await prisma.user.findUniqueOrThrow({ where: { id: userA.id }, select: { credits: true } });
    const failedRequest = await prisma.generationRequest.findUniqueOrThrow({ where: { generationRequestId: requestId }, select: { status: true, chargeState: true } });
    assert.equal(refundedUser.credits.toString(), "5");
    assert.deepEqual(failedRequest, { status: "failed", chargeState: "refunded" });

    const lostResponseId = `${suffix}-lost-response`;
    const lostResponseStart = await service.generationStartLegacy({ generationRequestId: lostResponseId, userId: userA.id, sourcePage: "name-art-generator", requestType: "generateIcon", model: "flux-schnell", promptHash: `${suffix}-lost-prompt`, inputHash: `${suffix}-lost-input`, numberOfImages: 1, aspectRatio: "1:1", creditsCharged: "1" });
    assert.equal(lostResponseStart.outcome, "CREATED");
    let providerCalls = 0;
    await assert.rejects(runLegacyGenerationAfterReservation({
      charge: async () => {
        const committedCharge = await service.generationLegacyCharge({ generationRequestId: lostResponseId, userId: userA.id, creditsCharged: "1" });
        assert.equal("charged" in committedCharge && committedCharge.charged, true);
        throw new Error("charge response lost");
      },
      execute: async () => { providerCalls += 1; return []; },
      finalizeFailure: ({ errorMessage }) => service.generationLegacyFinalizeFailure({ generationRequestId: lostResponseId, errorMessage }),
      getErrorMessage: (error) => error instanceof Error ? error.message : "unknown",
    }), /charge response lost/);
    assert.equal(providerCalls, 0);
    const afterLostResponse = await prisma.user.findUniqueOrThrow({ where: { id: userA.id }, select: { credits: true } });
    assert.equal(afterLostResponse.credits.toString(), "5");
    const duplicateRecovery = await service.generationLegacyFinalizeFailure({ generationRequestId: lostResponseId, errorMessage: "duplicate" });
    assert.equal("outcome" in duplicateRecovery && duplicateRecovery.outcome, "TERMINAL_NOOP");
    const afterDuplicateRecovery = await prisma.user.findUniqueOrThrow({ where: { id: userA.id }, select: { credits: true } });
    assert.equal(afterDuplicateRecovery.credits.toString(), "5");

    const unlockA = await service.cpaStartUnlock({ userId: userA.id, token: `${suffix}-unlock-a`, now: new Date().toISOString(), leadIp: null });
    const unlockB = await service.cpaStartUnlock({ userId: userB.id, token: `${suffix}-unlock-b`, now: new Date().toISOString(), leadIp: null });
    assert.equal(unlockA.outcome, "CREATED");
    assert.equal(unlockB.outcome, "CREATED");
    const postbacks = await Promise.all([
      service.cpaProcessPostback({ userId: userA.id, transactionId: `${suffix}-reused-tx`, payout: 1, requestedApproved: true, result: "complete", leadIp: null, now: new Date().toISOString(), rewardCredits: "1" }),
      service.cpaProcessPostback({ userId: userB.id, transactionId: `${suffix}-reused-tx`, payout: 1, requestedApproved: true, result: "complete", leadIp: null, now: new Date().toISOString(), rewardCredits: "1" }),
    ]);
    assert.deepEqual(postbacks.map((item) => item.outcome).sort(), ["APPLIED", "DUPLICATE"]);
    const winnerUserId = postbacks[0].outcome === "APPLIED" ? userA.id : userB.id;
    const loserUserId = winnerUserId === userA.id ? userB.id : userA.id;
    const winnerState = await prisma.user.findUniqueOrThrow({ where: { id: winnerUserId }, select: { credits: true } });
    const loserState = await prisma.user.findUniqueOrThrow({ where: { id: loserUserId }, select: { credits: true } });
    const loserUnlock = await prisma.cpaUnlock.findFirst({ where: { userId: loserUserId, token: { startsWith: `${suffix}-unlock-` } }, select: { status: true, transactionId: true } });
    assert.equal(winnerState.credits.toString(), "6");
    assert.equal(loserState.credits.toString(), "5");
    assert.deepEqual(loserUnlock, { status: "pending", transactionId: null });

    await Promise.all([
      service.userCapturePaidTrafficLead({ email: `${suffix}-lead@example.invalid`, name: "Lead", hasGeneratedDesign: true, hasVisitedCheckout: false }),
      service.userCapturePaidTrafficLead({ email: `${suffix}-lead@example.invalid`, name: "Lead", hasGeneratedDesign: false, hasVisitedCheckout: true }),
    ]);
    const lead = await prisma.user.findUniqueOrThrow({ where: { email: `${suffix}-lead@example.invalid` }, select: { hasGeneratedDesign: true, hasVisitedCheckout: true } });
    assert.deepEqual(lead, { hasGeneratedDesign: true, hasVisitedCheckout: true });
  } finally {
    await prisma.generationRequest.deleteMany({ where: { generationRequestId: { startsWith: suffix } } });
    await prisma.cpaUnlock.deleteMany({ where: { token: { startsWith: suffix } } });
    await prisma.icon.deleteMany({ where: { id: { startsWith: suffix } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: suffix } } });
    await prisma.user.deleteMany({ where: { email: `${suffix}-shared@example.invalid` } });
    await prisma.$disconnect();
  }
});

