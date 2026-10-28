import type Stripe from "stripe";
import type { CreditPurchaseInput, CreditPurchaseResult } from "~/server/stripe/fulfillCreditPurchase";

export type StripeWebhookHandlerResult = {
  status: 200 | 400 | 500;
  body: { received: true; duplicate?: boolean; error?: string };
};

export type StripeWebhookHandlerDependencies = {
  constructEvent: (rawBody: Buffer, signature: string) => Stripe.Event;
  listLineItems: (sessionId: string) => Promise<Stripe.ApiList<Stripe.LineItem>>;
  fulfillPurchase: (input: CreditPurchaseInput) => Promise<CreditPurchaseResult>;
  afterCommit?: (input: {
    event: Stripe.Event;
    session: Stripe.Checkout.Session;
    result: Extract<CreditPurchaseResult, { outcome: "APPLIED" }>;
  }) => Promise<void>;
  priceIds: { starter: string; pro: string; elite: string };
};

function planForPrice(priceId: string | undefined, priceIds: StripeWebhookHandlerDependencies["priceIds"]): { credits: number; plan: CreditPurchaseInput["plan"] } | null {
  if (priceId === priceIds.starter) return { credits: 20, plan: "Starter" };
  if (priceId === priceIds.pro) return { credits: 50, plan: "Pro" };
  if (priceId === priceIds.elite) return { credits: 100, plan: "Elite" };
  return null;
}

export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string | null,
  dependencies: StripeWebhookHandlerDependencies,
): Promise<StripeWebhookHandlerResult> {
  if (!signature) return { status: 400, body: { received: true, error: "Missing Stripe signature" } };

  let event: Stripe.Event;
  try {
    event = dependencies.constructEvent(rawBody, signature);
  } catch {
    return { status: 400, body: { received: true, error: "Webhook signature verification failed" } };
  }

  if (event.type !== "checkout.session.completed") return { status: 200, body: { received: true } };

  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;
  if (!userId) return { status: 200, body: { received: true } };

  let lineItems: Stripe.ApiList<Stripe.LineItem>;
  try {
    lineItems = await dependencies.listLineItems(session.id);
  } catch {
    return { status: 500, body: { received: true, error: "Unable to read checkout line items" } };
  }

  const purchase = planForPrice(lineItems.data[0]?.price?.id, dependencies.priceIds);
  if (!purchase) return { status: 200, body: { received: true } };

  let result: CreditPurchaseResult;
  try {
    result = await dependencies.fulfillPurchase({
      eventId: event.id,
      eventType: event.type,
      stripeSessionId: session.id,
      userId,
      credits: purchase.credits,
      plan: purchase.plan,
    });
  } catch {
    return { status: 500, body: { received: true, error: "Purchase fulfillment is retryable" } };
  }

  if (result.outcome === "DUPLICATE") return { status: 200, body: { received: true, duplicate: true } };

  if (dependencies.afterCommit) {
    try {
      await dependencies.afterCommit({ event, session, result });
    } catch {
      // Credit fulfillment is authoritative and committed. External sync is best effort.
    }
  }

  return { status: 200, body: { received: true } };
}
