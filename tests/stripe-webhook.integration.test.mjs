import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { fulfillCreditPurchase } from "../src/server/stripe/fulfillCreditPurchase.ts";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const databaseUrl = process.env.RECOVERY_TEST_DATABASE_URL;
if (databaseUrl && !/(127\.0\.0\.1|localhost)/i.test(databaseUrl)) {
  throw new Error("Stripe integration tests refuse non-local database URLs");
}

const integration = databaseUrl ? test : test.skip;

integration("atomic purchase fulfillment handles duplicates and concurrent increments", async () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const user = await prisma.user.create({ data: { email: `stripe-${suffix}@example.test`, credits: 1 } });
  const eventIds = [`evt-${suffix}-a`, `evt-${suffix}-b`];
  try {
    const duplicateResults = await Promise.all([
      fulfillCreditPurchase(prisma, { eventId: eventIds[0], eventType: "checkout.session.completed", stripeSessionId: "cs-a", userId: user.id, credits: 20, plan: "Starter" }),
      fulfillCreditPurchase(prisma, { eventId: eventIds[0], eventType: "checkout.session.completed", stripeSessionId: "cs-a", userId: user.id, credits: 20, plan: "Starter" }),
    ]);
    assert.deepEqual(duplicateResults.map((result) => result.outcome).sort(), ["APPLIED", "DUPLICATE"]);

    const concurrentResults = await Promise.all([
      fulfillCreditPurchase(prisma, { eventId: eventIds[1], eventType: "checkout.session.completed", stripeSessionId: "cs-b", userId: user.id, credits: 50, plan: "Pro" }),
      fulfillCreditPurchase(prisma, { eventId: `${eventIds[1]}-second`, eventType: "checkout.session.completed", stripeSessionId: "cs-c", userId: user.id, credits: 100, plan: "Elite" }),
    ]);
    assert.deepEqual(concurrentResults.map((result) => result.outcome).sort(), ["APPLIED", "APPLIED"]);
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { credits: true } });
    assert.equal(updated.credits.toString(), "171");
  } finally {
    await prisma.stripeWebhookEvent.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});

integration("failed user update rolls back the deduplication record", async () => {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  const eventId = `evt-rollback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    await assert.rejects(() => fulfillCreditPurchase(prisma, { eventId, eventType: "checkout.session.completed", stripeSessionId: "cs-missing", userId: "missing-user", credits: 20, plan: "Starter" }));
    assert.equal(await prisma.stripeWebhookEvent.findUnique({ where: { id: eventId } }), null);
  } finally {
    await prisma.$disconnect();
  }
});
