/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { Prisma } from "@prisma/client";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
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

const webhook = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }
  const buf = await buffer(req);
  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") return res.status(400).send("Missing Stripe signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, signature, env.STRIPE_WEB_HOOK_SECRET);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook Error:", message);
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  if (event.type === "checkout.session.completed") {
    const completedEvent = event.data.object;
    const userId = completedEvent.metadata?.userId;
    if (!userId) return res.json({ received: true });

    let lineItems: Stripe.ApiList<Stripe.LineItem>;
    try {
      lineItems = await stripe.checkout.sessions.listLineItems(completedEvent.id);
    } catch (error) {
      console.error("Error fetching credit line items:", error);
      return res.json({ received: true });
    }

    const priceId = lineItems.data[0]?.price?.id;
    const creditsMap: Record<string, number> = {
      [env.PRICE_ID_STARTER]: 20,
      [env.PRICE_ID_PRO]: 50,
      [env.PRICE_ID_ELITE]: 100,
    };
    const planMap: Record<number, "Starter" | "Pro" | "Elite"> = { 20: "Starter", 50: "Pro", 100: "Elite" };
    const incrementCredits = priceId ? creditsMap[priceId] ?? 0 : 0;
    const plan = planMap[incrementCredits];
    if (!plan) return res.json({ received: true });

    try {
      const result = await prisma.$transaction(async (tx) => {
        try {
          await tx.stripeWebhookEvent.create({ data: { id: event.id, type: event.type, stripeSessionId: completedEvent.id, userId } });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return { alreadyProcessed: true as const, updatedUser: null };
          }
          throw error;
        }
        const existingUser = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } });
        if (!existingUser) throw new Error("User not found for credits purchase.");
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { credits: new Prisma.Decimal(existingUser.credits).plus(incrementCredits), plan },
          select: { email: true, name: true, credits: true, plan: true },
        });
        return { alreadyProcessed: false as const, updatedUser };
      });

      if (!result.alreadyProcessed && result.updatedUser) {
        if (result.updatedUser.email) {
          await updateMauticContact({
            email: result.updatedUser.email,
            name: result.updatedUser.name,
            brand_specific_credits: result.updatedUser.credits,
            brand_specific_plan: result.updatedUser.plan,
          }, "namedesignai");
        }
        const userAgent = req.headers["user-agent"];
        await sendMetaPurchaseEvent({
          eventId: event.id,
          value: (completedEvent.amount_total ?? 0) / 100,
          currency: "USD",
          contentType: "credits",
          contentIds: ["credits"],
          email: completedEvent.customer_details?.email ?? result.updatedUser.email ?? null,
          externalId: userId,
          fbp: completedEvent.metadata?.fbp ?? null,
          fbc: completedEvent.metadata?.fbc ?? null,
          clientIpAddress: getRequestIp(req),
          clientUserAgent: typeof userAgent === "string" ? userAgent : null,
        });
      }
    } catch (error) {
      console.error("Error updating user credits or plan:", error);
    }
  }
  return res.json({ received: true });
};

export default webhook;
