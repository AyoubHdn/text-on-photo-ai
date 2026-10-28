/// <reference path="../workers/db/worker-configuration.d.ts" />
import assert from "node:assert/strict";
import { after, mock, test } from "node:test";
import { createRequire } from "node:module";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const require = createRequire(import.meta.url);

const TEST_DATABASE_URL = process.env.RECOVERY_TEST_DATABASE_URL;
if (typeof TEST_DATABASE_URL !== "string" || !TEST_DATABASE_URL.trim()) {
  throw new Error("RECOVERY_TEST_DATABASE_URL is required");
}

const parsedDatabaseUrl = new URL(TEST_DATABASE_URL);
if (
  parsedDatabaseUrl.protocol !== "postgresql:" ||
  !["127.0.0.1", "localhost", "postgres"].includes(parsedDatabaseUrl.hostname)
) {
  throw new Error(
    "Recovery integration tests require an isolated local PostgreSQL host"
  );
}

const TEST_SCOPE = "cloudflare-staging";
/**
 * Node 22 supports Date controls at runtime; the installed Node typings only
 * declare timer APIs, so keep the compatibility surface explicit and narrow.
 * @type {{ enable(options: { apis: string[]; now: number }): void; setTime(time: number): void; reset(): void }}
 */
const recoveryClock = /** @type {{ enable(options: { apis: string[]; now: number }): void; setTime(time: number): void; reset(): void }} */ (/** @type {unknown} */ (mock.timers));
const OTHER_SCOPE = "other-deployment";
const prefix = "recovery-integration-" + Date.now();
/** @type {string[]} */
const createdRequestIds = [];
/** @type {string[]} */
const createdUserIds = [];

globalThis.WorkerEntrypoint = class {
  /** @param {unknown} env @param {unknown} ctx */
  constructor(env, ctx) {
    this.env = env;
    this.ctx = ctx;
  }
};

/**
 * @typedef {{outcome: string, job?: object} | {ok: false, code: string}} DbResult
 * @typedef {{generationRequestId: string, executionScope: string, processingGraceSeconds?: number, databaseTimeoutMs?: number, databaseLockTimeoutMs?: number, databaseMaxWaitMs?: number, errorMessage: string}} RecoveryTestInput
 * @typedef {import("../workers/db/src/recovery.ts").RecoveryCandidate} RecoveryCandidate
 * @typedef {import("../workers/db/src/recovery.ts").RecoveryDbTimeouts} RecoveryDbTimeouts
 */

/** @typedef {DbResult} GenerationStartResult */
/** @typedef {DbResult} GenerationClaimResult */
/** @typedef {DbResult} GenerationFinalizeSuccessResult */
/** @typedef {DbResult} GenerationFinalizeFailureResult */

/**
 * @typedef {object} DbServiceLike
 * @property {object} env
 * @property {object} ctx
 * @property {(input: object) => Promise<GenerationStartResult>} generationStartOrGetAndReserve
 * @property {(input: object) => Promise<GenerationClaimResult>} generationClaimExecution
 * @property {(input: object) => Promise<GenerationFinalizeSuccessResult>} generationFinalizeSuccess
 * @property {(input: object) => Promise<GenerationFinalizeFailureResult>} generationFinalizeFailure
 * @property {(input: RecoveryTestInput) => Promise<GenerationFinalizeFailureResult>} generationFailIfStale
 * @property {(input: import("../workers/db/src/types.ts").StripePurchaseInput) => Promise<import("../workers/db/src/types.ts").StripePurchaseResult>} stripeFulfillPurchase
 * @property {(scope: string, batchSize: number, maxDurationMs: number, processingGraceSeconds: number, dbTimeouts: RecoveryDbTimeouts) => Promise<void>} runGenerationRecovery
 * @property {(candidate: RecoveryCandidate, scope: string, dbTimeouts: RecoveryDbTimeouts) => Promise<void>} markGenerationRecoveryFailure
 */

async function loadDbService() {
  const cloudflareWorkersStub = "cloudflare-workers-stub";
  const bundle = await build({
    entryPoints: ["workers/db/src/index.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node22",
    write: false,
    plugins: [
      {
        name: "cloudflare-workers-test-stub",
        setup(buildContext) {
          buildContext.onResolve({ filter: /^cloudflare:workers$/ }, () => ({
            path: cloudflareWorkersStub,
            namespace: "test-stub",
          }));
          buildContext.onLoad({ filter: /.*/, namespace: "test-stub" }, () => ({
            contents:
              "export class WorkerEntrypoint { constructor(env, ctx) { this.env = env; this.ctx = ctx; } }",
            loader: "js",
          }));
          buildContext.onResolve(
            { filter: /generated[\\/]prisma[\\/]client$/ },
            () => ({ path: require.resolve("@prisma/client") })
          );
        },
      },
    ],
  });
  const output = bundle.outputFiles[0];
  if (!output) throw new Error("DB Worker test bundle was empty");
  const tempDir = await mkdtemp(
    path.join(os.tmpdir(), "namedesignai-recovery-")
  );
  const bundlePath = path.join(tempDir, "db-worker.cjs");
  try {
    await writeFile(bundlePath, output.contents);
    const module = await import(pathToFileURL(bundlePath).href);
    const exported = module.default;
    return exported?.default ?? exported ?? module;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

const DbService = await loadDbService();

/** @param {unknown} result @returns {string} */
function outcomeOf(result) {
  if (
    typeof result !== "object" ||
    result === null ||
    !("outcome" in result) ||
    typeof result.outcome !== "string"
  ) {
    throw new Error("Expected a DB transition outcome");
  }
  return result.outcome;
}
const { recoveryBackoffSeconds, recoveryDbTimeouts, runBoundedRecovery } =
  await import("../workers/db/src/recovery.ts");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL, maxUses: 1 }),
});

/** @param {string} label */
function nextRequestId(label) {
  const id = prefix + "-" + label + "-" + createdRequestIds.length;
  createdRequestIds.push(id);
  return id;
}

/** @param {string} label @param {number} [credits=10] */
async function createUser(label, credits = 10) {
  const user = await prisma.user.create({
    data: {
      email: prefix + "-" + label + "@example.invalid",
      credits,
    },
    select: { id: true },
  });
  createdUserIds.push(user.id);
  return user.id;
}

/** @returns {DbServiceLike} */
function service() {
  const instance = Object.create(DbService.prototype);
  instance.env = {
    HYPERDRIVE: { connectionString: TEST_DATABASE_URL },
    GENERATION_RECOVERY_ENABLED: "false",
    GENERATION_RECOVERY_SCOPE: TEST_SCOPE,
  };
  instance.ctx = {
    /** @param {Promise<unknown>} promise */
    waitUntil: (promise) => promise,
  };
  return instance;
}

/** @param {DbServiceLike} instance @param {string} generationRequestId @param {string} userId @param {string} [executionScope=TEST_SCOPE] */
async function reserve(
  instance,
  generationRequestId,
  userId,
  executionScope = TEST_SCOPE
) {
  const result = await instance.generationStartOrGetAndReserve({
    generationRequestId,
    userId,
    sourcePage: "name-art-generator",
    requestType: "generateIconAsync",
    executionScope,
    model: "flux-schnell",
    promptHash: generationRequestId + "-prompt",
    inputHash: generationRequestId + "-input",
    numberOfImages: 1,
    aspectRatio: "1:1",
    creditsCharged: "1",
  });
  assert.equal(outcomeOf(result), "CREATED");
  return result;
}

/** @param {string} generationRequestId @param {Date} createdAt */
async function ageRequest(generationRequestId, createdAt) {
  await prisma.generationRequest.update({
    where: { generationRequestId },
    data: { createdAt },
  });
}

/** @param {string} generationRequestId */
async function requestRow(generationRequestId) {
  return prisma.generationRequest.findUnique({
    where: { generationRequestId },
    select: {
      status: true,
      executionScope: true,
      requestType: true,
      processingAttemptId: true,
      processingStartedAt: true,
      leaseExpiresAt: true,
      recoveryAttemptCount: true,
      recoveryNextAttemptAt: true,
      recoveryLastError: true,
    },
  });
}

/** @param {string} userId */
async function credits(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return user?.credits.toString();
}

/** @param {DbServiceLike} instance @param {string} generationRequestId @param {number} [processingGraceSeconds=120] */
async function runDirectRecovery(
  instance,
  generationRequestId,
  processingGraceSeconds = 120
) {
  return instance.generationFailIfStale({
    generationRequestId,
    executionScope: TEST_SCOPE,
    processingGraceSeconds,
    databaseTimeoutMs: 1000,
    databaseLockTimeoutMs: 250,
    databaseMaxWaitMs: 250,
    errorMessage: "GENERATION_RECOVERY_STALE",
  });
}

async function cleanup() {
  await prisma.icon.deleteMany({ where: { id: { startsWith: prefix } } });
  await prisma.stripeWebhookEvent.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.generationRequest.deleteMany({
    where: { generationRequestId: { in: createdRequestIds } },
  });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.$disconnect();
}

after(cleanup);

test("actual DB Worker purchase RPC deduplicates, rolls back, and atomically increments", async () => {
  const instance = service();
  const userId = await createUser("stripe-rpc", 1);
  const eventId = nextRequestId("stripe-event");
  /** @type {import("../workers/db/src/types.ts").StripePurchaseInput} */
  const purchase = { eventId, eventType: "checkout.session.completed", stripeSessionId: "cs-rpc", userId, credits: 20, plan: "Starter" };
  const [first, duplicate] = await Promise.all([instance.stripeFulfillPurchase(purchase), instance.stripeFulfillPurchase(purchase)]);
  assert.ok("outcome" in first);
  assert.ok("outcome" in duplicate);
  assert.deepEqual([first.outcome, duplicate.outcome].sort(), ["APPLIED", "DUPLICATE"]);
  assert.equal(await credits(userId), "21");

  const missingEventId = nextRequestId("stripe-rollback");
  const rollback = await instance.stripeFulfillPurchase({ ...purchase, eventId: missingEventId, stripeSessionId: "cs-missing", userId: "missing-user" });
  assert.deepEqual(rollback, { ok: false, code: "INTERNAL_DB_ERROR" });
  assert.equal(await prisma.stripeWebhookEvent.findUnique({ where: { id: missingEventId } }), null);
});

test("actual DB Worker preserves concurrent generation charges and refunds", async () => {
  const instance = service();
  const userId = await createUser("stripe-generation-race", 2);
  const firstId = nextRequestId("stripe-generation-one");
  const secondId = nextRequestId("stripe-generation-two");
  const [first, second] = await Promise.all([reserve(instance, firstId, userId), reserve(instance, secondId, userId)]);
  assert.deepEqual([outcomeOf(first), outcomeOf(second)].sort(), ["CREATED", "CREATED"]);
  assert.equal(await credits(userId), "0");

  const firstAttempt = firstId + "-attempt";
  const secondAttempt = secondId + "-attempt";
  assert.equal(outcomeOf(await instance.generationClaimExecution({ generationRequestId: firstId, processingAttemptId: firstAttempt, leaseSeconds: 300 })), "CLAIMED");
  assert.equal(outcomeOf(await instance.generationClaimExecution({ generationRequestId: secondId, processingAttemptId: secondAttempt, leaseSeconds: 300 })), "CLAIMED");
  const [firstFailure, secondFailure] = await Promise.all([
    instance.generationFinalizeFailure({ generationRequestId: firstId, processingAttemptId: firstAttempt, errorMessage: "test refund" }),
    instance.generationFinalizeFailure({ generationRequestId: secondId, processingAttemptId: secondAttempt, errorMessage: "test refund" }),
  ]);
  assert.deepEqual([outcomeOf(firstFailure), outcomeOf(secondFailure)].sort(), ["FAILED", "FAILED"]);
  assert.equal(await credits(userId), "2");
});

test("real PostgreSQL reconciles stale unclaimed requests and refunds exactly once", async () => {
  const instance = service();
  const userId = await createUser("unclaimed");
  const requestId = nextRequestId("unclaimed");
  await reserve(instance, requestId, userId);
  await ageRequest(requestId, new Date(Date.now() - 16 * 60 * 1000));

  const first = await runDirectRecovery(instance, requestId);
  const second = await runDirectRecovery(instance, requestId);
  const row = await requestRow(requestId);

  assert.equal(outcomeOf(first), "FAILED");
  assert.equal(outcomeOf(second), "TERMINAL_NOOP");
  assert.equal(await credits(userId), "10");
  assert.equal(row?.status, "failed");
  assert.equal(row?.processingAttemptId, null);
  assert.equal(row?.processingStartedAt, null);
  assert.equal(row?.leaseExpiresAt, null);
});

test("real PostgreSQL enforces the processing grace boundary", async () => {
  const instance = service();
  const userId = await createUser("grace");
  const requestId = nextRequestId("grace");
  await reserve(instance, requestId, userId);
  const claimed = await instance.generationClaimExecution({
    generationRequestId: requestId,
    processingAttemptId: requestId + "-attempt",
    leaseSeconds: 300,
  });
  assert.equal(outcomeOf(claimed), "CLAIMED");

  await prisma.generationRequest.update({
    where: { generationRequestId: requestId },
    data: {
      leaseExpiresAt: new Date(Date.now() - 119 * 1000),
      processingStartedAt: new Date(Date.now() - 10 * 60 * 1000),
    },
  });
  assert.equal(
    outcomeOf(await runDirectRecovery(instance, requestId)),
    "TERMINAL_NOOP"
  );

  await prisma.generationRequest.update({
    where: { generationRequestId: requestId },
    data: { leaseExpiresAt: new Date(Date.now() - 121 * 1000) },
  });
  assert.equal(
    outcomeOf(await runDirectRecovery(instance, requestId)),
    "FAILED"
  );
  assert.equal(await credits(userId), "10");
});

test("scheduled reconciliation excludes synchronous, unscoped, differently scoped, and terminal rows", async () => {
  const instance = service();
  const stale = new Date(Date.now() - 16 * 60 * 1000);
  const definitions = [
    {
      label: "sync",
      requestType: "generateIcon",
      executionScope: TEST_SCOPE,
      status: "started",
    },
    {
      label: "unscoped",
      requestType: "generateIconAsync",
      executionScope: null,
      status: "started",
    },
    {
      label: "other-scope",
      requestType: "generateIconAsync",
      executionScope: OTHER_SCOPE,
      status: "started",
    },
    {
      label: "terminal",
      requestType: "generateIconAsync",
      executionScope: TEST_SCOPE,
      status: "completed",
    },
    {
      label: "eligible",
      requestType: "generateIconAsync",
      executionScope: TEST_SCOPE,
      status: "started",
    },
  ];
  const ids = new Map();

  for (const item of definitions) {
    const requestId = nextRequestId(item.label);
    ids.set(item.label, requestId);
    await prisma.generationRequest.create({
      data: {
        generationRequestId: requestId,
        requestType: item.requestType,
        executionScope: item.executionScope,
        model: "flux-schnell",
        promptHash: requestId + "-prompt",
        inputHash: requestId + "-input",
        status: item.status,
        numberOfImages: 1,
        aspectRatio: "1:1",
        createdAt: stale,
        completedAt: item.status === "completed" ? stale : null,
      },
    });
  }

  await instance["runGenerationRecovery"](
    TEST_SCOPE,
    25,
    2500,
    120,
    recoveryDbTimeouts()
  );

  /** @type {Record<string, string | undefined>} */
  const actual = {};
  for (const item of definitions) {
    actual[item.label] = (await requestRow(ids.get(item.label)))?.status;
  }
  assert.equal(actual.eligible, "failed");
  assert.equal(actual.sync, "started");
  assert.equal(actual.unscoped, "started");
  assert.equal(actual["other-scope"], "started");
  assert.equal(actual.terminal, "completed");
});

test("overlapping recovery refunds once and success-versus-recovery has one terminal winner", async () => {
  const instance = service();
  const userId = await createUser("overlap");
  const requestId = nextRequestId("overlap");
  await reserve(instance, requestId, userId);
  await ageRequest(requestId, new Date(Date.now() - 16 * 60 * 1000));

  const overlapping = await Promise.all([
    runDirectRecovery(instance, requestId),
    runDirectRecovery(instance, requestId),
  ]);
  assert.equal(
    overlapping.filter((item) => outcomeOf(item) === "FAILED").length,
    1
  );
  assert.equal(
    overlapping.filter((item) => outcomeOf(item) === "TERMINAL_NOOP").length,
    1
  );
  assert.equal(await credits(userId), "10");

  const raceUserId = await createUser("success-race");
  const raceId = nextRequestId("success-race");
  await reserve(instance, raceId, raceUserId);
  const attemptId = raceId + "-attempt";
  assert.equal(
    outcomeOf(
      await instance.generationClaimExecution({
        generationRequestId: raceId,
        processingAttemptId: attemptId,
        leaseSeconds: 300,
      })
    ),
    "CLAIMED"
  );
  await prisma.generationRequest.update({
    where: { generationRequestId: raceId },
    data: { leaseExpiresAt: new Date(Date.now() - 121 * 1000) },
  });

  const [success, recovery] = await Promise.all([
    instance.generationFinalizeSuccess({
      generationRequestId: raceId,
      processingAttemptId: attemptId,
      predictionId: raceId + "-prediction",
      outputs: [
        {
          iconId: raceId + "-0",
          s3Key: raceId + "-0",
          imageUrl: "https://example.invalid/" + raceId + "-0",
          prompt: "integration test",
          metadata: { sourcePage: "name-art-generator" },
          isPublic: true,
        },
      ],
    }),
    runDirectRecovery(instance, raceId),
  ]);

  const row = await requestRow(raceId);
  assert.ok(row?.status === "completed" || row?.status === "failed");
  assert.equal(row?.status === "completed", outcomeOf(success) === "COMPLETED");
  assert.equal(row?.status === "failed", outcomeOf(recovery) === "FAILED");
  assert.equal(
    (await prisma.icon.count({ where: { id: raceId + "-0" } })) <= 1,
    true
  );
  assert.equal(
    await credits(raceUserId),
    row?.status === "completed" ? "9" : "10"
  );
});

test("late claims and callbacks cannot revive a failed request", async () => {
  const instance = service();
  const userId = await createUser("late");
  const requestId = nextRequestId("late");
  await reserve(instance, requestId, userId);
  await ageRequest(requestId, new Date(Date.now() - 16 * 60 * 1000));
  assert.equal(
    outcomeOf(await runDirectRecovery(instance, requestId)),
    "FAILED"
  );

  const attemptId = requestId + "-late-attempt";
  const claim = await instance.generationClaimExecution({
    generationRequestId: requestId,
    processingAttemptId: attemptId,
    leaseSeconds: 300,
  });
  const success = await instance.generationFinalizeSuccess({
    generationRequestId: requestId,
    processingAttemptId: attemptId,
    outputs: [
      {
        iconId: requestId + "-0",
        s3Key: requestId + "-0",
        imageUrl: "https://example.invalid/" + requestId + "-0",
        prompt: "late callback",
        metadata: {},
      },
    ],
  });
  const failure = await instance.generationFinalizeFailure({
    generationRequestId: requestId,
    processingAttemptId: attemptId,
    errorMessage: "late failure",
  });

  assert.equal(outcomeOf(claim), "TERMINAL");
  assert.equal(outcomeOf(success), "TERMINAL_NOOP");
  assert.equal(outcomeOf(failure), "TERMINAL_NOOP");
  assert.equal(await credits(userId), "10");
  assert.equal(await prisma.icon.count({ where: { id: requestId + "-0" } }), 0);
});

test("persistent retry backoff lets later candidates progress across bounded runs", async () => {
  const instance = service();
  const firstUserId = await createUser("retry-one");
  const secondUserId = await createUser("retry-two");
  const firstId = nextRequestId("retry-one");
  const secondId = nextRequestId("retry-two");
  await reserve(instance, firstId, firstUserId);
  await reserve(instance, secondId, secondUserId);
  await prisma.generationRequest.updateMany({
    where: { generationRequestId: { in: [firstId, secondId] } },
    data: { createdAt: new Date(Date.now() - 16 * 60 * 1000) },
  });

  const timeouts = recoveryDbTimeouts();
  /**
   * @param {Date} now
   * @returns {(limit: number) => Promise<import("../workers/db/src/recovery.ts").RecoveryCandidate[]>}
   */
  const listAt = (now) => async (limit) =>
    prisma.generationRequest.findMany({
      where: {
        requestType: "generateIconAsync",
        executionScope: TEST_SCOPE,
        AND: [
          {
            OR: [
              {
                status: "started",
                createdAt: { lt: new Date(now.getTime() - 15 * 60 * 1000) },
              },
              {
                status: "processing",
                leaseExpiresAt: { lt: new Date(now.getTime() - 120 * 1000) },
              },
            ],
          },
          {
            OR: [
              { recoveryNextAttemptAt: null },
              { recoveryNextAttemptAt: { lte: now } },
            ],
          },
        ],
      },
      orderBy: [{ recoveryNextAttemptAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
      take: limit,
      select: {
        generationRequestId: true,
        requestType: true,
        executionScope: true,
        status: true,
        processingAttemptId: true,
        createdAt: true,
        leaseExpiresAt: true,
        recoveryNextAttemptAt: true,
      },
    });

  /** @param {Date} now */
  const run = async (now) =>
    runBoundedRecovery({
      batchSize: 1,
      maxDurationMs: 2500,
      listCandidates: listAt(now),
      reconcileOne: async (candidate) => {
        if (candidate.generationRequestId === firstId) {
          throw new Error("persistent-test-failure");
        }
        const transition = await runDirectRecovery(
          instance,
          candidate.generationRequestId
        );
        if ("ok" in transition) throw new Error(`RECOVERY_${transition.code}`);
        if (
          transition.outcome === "FAILED" ||
          transition.outcome === "TERMINAL_NOOP"
        )
          return transition.outcome;
        throw new Error(`Unexpected recovery outcome: ${transition.outcome}`);
      },
      onError: async (candidate) =>
        instance["markGenerationRecoveryFailure"](
          candidate,
          TEST_SCOPE,
          timeouts
        ),
      now: () => now.getTime(),
    });

  const firstRun = await run(new Date());
  assert.equal(firstRun.examined, 1);
  assert.equal(firstRun.errors, 1);
  const firstAfterRun = await requestRow(firstId);
  assert.equal(firstAfterRun?.status, "started");
  assert.equal(firstAfterRun?.recoveryAttemptCount, 1);
  assert.ok(firstAfterRun?.recoveryNextAttemptAt);

  const secondRun = await run(new Date(Date.now() + 5 * 60 * 1000));
  assert.equal(secondRun.examined, 1);
  assert.equal(secondRun.failed, 1);
  assert.equal((await requestRow(secondId))?.status, "failed");
  assert.equal((await requestRow(firstId))?.status, "started");
  assert.equal(await credits(secondUserId), "10");
  assert.equal(await credits(firstUserId), "9");
  assert.equal(recoveryBackoffSeconds(1), 60);
});

test("real PostgreSQL recovery selects NULL retry timestamps first", async () => {
  const instance = service();
  const retryUserId = await createUser("retry-order");
  const freshUserId = await createUser("fresh-order");
  const laterFreshUserId = await createUser("fresh-later");
  const retryId = nextRequestId("retry-order");
  const freshId = nextRequestId("fresh-order");
  const laterFreshId = nextRequestId("later-fresh");
  await reserve(instance, retryId, retryUserId);
  await reserve(instance, freshId, freshUserId);
  await reserve(instance, laterFreshId, laterFreshUserId);

  const baseNow = Date.now();
  recoveryClock.enable({ apis: ["Date"], now: baseNow });
  try {
    await prisma.generationRequest.updateMany({
      where: { generationRequestId: { in: [retryId, freshId, laterFreshId] } },
      data: { createdAt: new Date(baseNow - 16 * 60 * 1000) },
    });
    await prisma.generationRequest.update({
      where: { generationRequestId: laterFreshId },
      data: { createdAt: new Date(baseNow) },
    });
    await prisma.generationRequest.update({
      where: { generationRequestId: retryId },
      data: {
        recoveryAttemptCount: 1,
        recoveryNextAttemptAt: new Date(baseNow - 1000),
      },
    });

    const timeouts = recoveryDbTimeouts();
    const originalRecovery = instance.generationFailIfStale.bind(instance);
    /** @type {string[]} */
    const selected = [];
    instance.generationFailIfStale = async (input) => {
    /** @param {RecoveryTestInput} input */
      selected.push(input.generationRequestId);
      return originalRecovery(input);
    };

    await instance["runGenerationRecovery"](TEST_SCOPE, 1, 2500, 120, timeouts);
    assert.deepEqual(selected, [freshId]);
    assert.equal((await requestRow(freshId))?.status, "failed");
    assert.equal((await requestRow(retryId))?.status, "started");

    recoveryClock.setTime(baseNow + 5 * 60 * 1000);
    selected.length = 0;
    instance.generationFailIfStale = async (input) => {
    /** @param {RecoveryTestInput} input */
      selected.push(input.generationRequestId);
      if (input.generationRequestId === retryId) {
        throw new Error("persistent-test-failure");
      }
      return originalRecovery(input);
    };
    await instance["runGenerationRecovery"](TEST_SCOPE, 1, 2500, 120, timeouts);
    assert.deepEqual(selected, [retryId]);
    assert.equal((await requestRow(retryId))?.status, "started");
    assert.equal((await requestRow(retryId))?.recoveryAttemptCount, 2);

    recoveryClock.setTime(baseNow + 10 * 60 * 1000);
    selected.length = 0;
    instance.generationFailIfStale = async (input) => {
    /** @param {RecoveryTestInput} input */
      selected.push(input.generationRequestId);
      return originalRecovery(input);
    };
    await prisma.generationRequest.update({
      where: { generationRequestId: laterFreshId },
      data: {
        createdAt: new Date(baseNow - 16 * 60 * 1000),
        recoveryNextAttemptAt: null,
      },
    });
    await instance["runGenerationRecovery"](TEST_SCOPE, 1, 2500, 120, timeouts);
    assert.deepEqual(selected, [laterFreshId]);
    assert.equal((await requestRow(laterFreshId))?.status, "failed");
    assert.equal((await requestRow(retryId))?.status, "started");
    assert.equal(recoveryBackoffSeconds(1), 60);
  } finally {
    recoveryClock.reset();
  }
});

