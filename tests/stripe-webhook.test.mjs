import assert from "node:assert/strict";
import test from "node:test";
import { handleStripeWebhook } from "../src/server/stripe/webhookHandler.ts";

function checkoutEvent() {
  return {
    id: "evt_test_123",
    type: "checkout.session.completed",
    data: { object: { id: "cs_test_123", metadata: { userId: "user_123" }, amount_total: 199, customer_details: { email: "buyer@example.com" } } },
  };
}

const prices = { starter: "price_starter", pro: "price_pro", elite: "price_elite" };
const lineItems = (price = prices.starter) => ({ data: [{ price: { id: price } }] });

test("signature rejection happens before fulfillment or line-item/database work", async () => {
  let fulfilled = 0;
  let listed = 0;
  const result = await handleStripeWebhook(Buffer.from("raw"), "bad", {
    constructEvent: () => { throw new Error("invalid signature"); },
    listLineItems: async () => { listed += 1; return lineItems(); },
    fulfillPurchase: async () => { fulfilled += 1; return { outcome: "DUPLICATE" }; },
    priceIds: prices,
  });
  assert.equal(result.status, 400);
  assert.equal(fulfilled, 0);
  assert.equal(listed, 0);
});

test("applied purchase maps the reviewed price and runs external sync after commit", async () => {
  const calls = [];
  let receivedInput;
  const result = await handleStripeWebhook(Buffer.from("raw"), "sig", {
    constructEvent: () => checkoutEvent(),
    listLineItems: async () => lineItems(),
    fulfillPurchase: async (input) => { receivedInput = input; return { outcome: "APPLIED", updatedUser: { email: "buyer@example.com", name: "Buyer", credits: "21", plan: "Starter" } }; },
    afterCommit: async () => { calls.push("external-sync"); },
    priceIds: prices,
  });
  assert.equal(result.status, 200);
  assert.deepEqual(receivedInput, { eventId: "evt_test_123", eventType: "checkout.session.completed", stripeSessionId: "cs_test_123", userId: "user_123", credits: 20, plan: "Starter" });
  assert.deepEqual(calls, ["external-sync"]);
});

test("a duplicate is a successful no-op and does not repeat external sync", async () => {
  let syncCount = 0;
  const result = await handleStripeWebhook(Buffer.from("raw"), "sig", {
    constructEvent: () => checkoutEvent(),
    listLineItems: async () => lineItems(),
    fulfillPurchase: async () => ({ outcome: "DUPLICATE" }),
    afterCommit: async () => { syncCount += 1; },
    priceIds: prices,
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { received: true, duplicate: true });
  assert.equal(syncCount, 0);
});

test("database failure is retryable and does not look like a successful duplicate", async () => {
  const result = await handleStripeWebhook(Buffer.from("raw"), "sig", {
    constructEvent: () => checkoutEvent(),
    listLineItems: async () => lineItems(),
    fulfillPurchase: async () => { throw new Error("transaction unavailable"); },
    priceIds: prices,
  });
  assert.equal(result.status, 500);
  assert.deepEqual(result.body, { received: true, error: "Purchase fulfillment is retryable" });
});

test("the webhook alias reuses the same handler", async () => {
  const aliasSource = await import("node:fs/promises").then((fs) => fs.readFile("src/pages/api/stripe/webhook.ts", "utf8"));
  assert.match(aliasSource, /from \"\.\.\/stripe\"/);
  assert.match(aliasSource, /export default webhook/);
});
