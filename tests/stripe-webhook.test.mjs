import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import { handleStripeWebhook } from "../src/server/stripe/webhookHandler.ts";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Prisma } = require("@prisma/client");

/** @returns {Stripe.Event} */
function checkoutEvent() {
  return /** @type {Stripe.Event} */ (/** @type {unknown} */ ({
    id: "evt_test_123",
    object: "event",
    api_version: "2025-02-24.acacia",
    created: 1,
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type: "checkout.session.completed",
    data: { object: { id: "cs_test_123", object: "checkout.session", metadata: { userId: "user_123" }, amount_total: 199, customer_details: { email: "buyer@example.com" } } },
  }));
}

const prices = { starter: "price_starter", pro: "price_pro", elite: "price_elite" };
/** @returns {Stripe.ApiList<Stripe.LineItem>} */
function lineItems(price = prices.starter) {
  return /** @type {Stripe.ApiList<Stripe.LineItem>} */ (/** @type {unknown} */ ({
    object: "list",
    data: [{ id: "li_test_123", object: "item", amount_discount: 0, amount_subtotal: 199, amount_tax: 0, amount_total: 199, currency: "usd", description: "Credits", price: /** @type {Stripe.Price} */ (/** @type {unknown} */ ({ id: price, object: "price" })), quantity: 1 }],
    has_more: false,
    url: "/v1/checkout/sessions/cs_test_123/line_items",
  }));
}

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
  /** @type {string[]} */
  const calls = [];
  /** @type {import("../src/server/stripe/fulfillCreditPurchase.ts").CreditPurchaseInput | undefined} */
  let receivedInput;
  const result = await handleStripeWebhook(Buffer.from("raw"), "sig", {
    constructEvent: () => checkoutEvent(),
    listLineItems: async () => lineItems(),
    fulfillPurchase: async (input) => { receivedInput = input; return { outcome: "APPLIED", updatedUser: { email: "buyer@example.com", name: "Buyer", credits: new Prisma.Decimal("21"), plan: "Starter" } }; },
    afterCommit: async () => { calls.push("external-sync"); },
    priceIds: prices,
  });
  assert.equal(result.status, 200);
  assert.ok(receivedInput);
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
