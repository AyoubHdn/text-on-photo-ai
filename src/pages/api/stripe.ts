import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { Prisma } from "@prisma/client";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { stripeFulfillPurchaseFromService } from "~/server/cloudflare/dbService";
import { fulfillCreditPurchase } from "~/server/stripe/fulfillCreditPurchase";
import { handleStripeWebhook } from "~/server/stripe/webhookHandler";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";
import { sendMetaPurchaseEvent } from "~/server/meta/sendConversionEvent";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });
export const config = { api: { bodyParser: false } };

function getRequestIp(req: NextApiRequest): string | null {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) return forwardedFor.split(",")[0]?.trim() ?? null;
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) return forwardedFor[0]?.split(",")[0]?.trim() ?? null;
  return req.socket?.remoteAddress ?? null;
}

async function fulfillPurchase(input: Parameters<typeof fulfillCreditPurchase>[1]) {
  if (process.env.DB_STRIPE_BACKEND === "service") {
    const result = await stripeFulfillPurchaseFromService(input);
    if ("ok" in result) throw new Error(`Stripe purchase DB service failed: ${result.code}`);
    if (result.outcome === "DUPLICATE") return result;
    return {
      outcome: "APPLIED" as const,
      updatedUser: { ...result.updatedUser, credits: new Prisma.Decimal(result.updatedUser.credits) },
    };
  }
  return fulfillCreditPurchase(prisma, input);
}

const webhook = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const rawBody = await buffer(req);
  const signature = req.headers["stripe-signature"];
  const result = await handleStripeWebhook(
    rawBody,
    typeof signature === "string" ? signature : null,
    {
      constructEvent: (body, signedPayload) => stripe.webhooks.constructEvent(body, signedPayload, env.STRIPE_WEB_HOOK_SECRET),
      listLineItems: (sessionId) => stripe.checkout.sessions.listLineItems(sessionId),
      fulfillPurchase,
      priceIds: { starter: env.PRICE_ID_STARTER, pro: env.PRICE_ID_PRO, elite: env.PRICE_ID_ELITE },
      afterCommit: async ({ event, session, result: applied }) => {
        if (applied.updatedUser.email) {
          await updateMauticContact({
            email: applied.updatedUser.email,
            name: applied.updatedUser.name,
            brand_specific_credits: applied.updatedUser.credits,
            brand_specific_plan: applied.updatedUser.plan,
          }, "namedesignai");
        }
        const userAgent = req.headers["user-agent"];
        await sendMetaPurchaseEvent({
          eventId: event.id,
          value: (session.amount_total ?? 0) / 100,
          currency: "USD",
          contentType: "credits",
          contentIds: ["credits"],
          email: session.customer_details?.email ?? applied.updatedUser.email ?? null,
          externalId: session.metadata?.userId ?? null,
          fbp: session.metadata?.fbp ?? null,
          fbc: session.metadata?.fbc ?? null,
          clientIpAddress: getRequestIp(req),
          clientUserAgent: typeof userAgent === "string" ? userAgent : null,
        });
      },
    },
  );

  return res.status(result.status).json(result.body);
};

export default webhook;
