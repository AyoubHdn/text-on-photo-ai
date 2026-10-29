/// <reference path="../workers/db/worker-configuration.d.ts" />
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

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
    assert.deepEqual(applied.map((item) => item.outcome).sort(), ["APPLIED", "NO_PENDING"]);
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

