// src/pages/api/stripe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { env } from "~/env.mjs";
import { buffer } from "micro";
import { prisma } from "~/server/db";
import { updateMauticContact } from "~/server/api/routers/mautic";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const webhook = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, env.STRIPE_WEB_HOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Error";
    console.error("Webhook Error:", message);
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  switch (event.type) {
    case "checkout.session.completed":
      console.log("Processing checkout.session.completed event...");
      const completedEvent = event.data.object;

      const userId = completedEvent.metadata?.userId;
      if (!userId) {
        console.error("User ID missing in session metadata.");
        return res.status(400).send("Invalid metadata in session.");
      }

      console.log(`User ID from metadata: ${userId}`);

      let lineItems;
      try {
        lineItems = await stripe.checkout.sessions.listLineItems(completedEvent.id);
      } catch (err) {
        console.error("Error fetching line items:", err);
        return res.status(500).send("Failed to fetch line items.");
      }

      const priceId = lineItems.data[0]?.price?.id;
      console.log("Price ID from line items:", priceId);

      if (!priceId) {
        console.error("Missing priceId in line items.");
        return;
      }

      const creditsMap: Record<string, number> = {
        [env.PRICE_ID_STARTER]: 20,
        [env.PRICE_ID_PRO]: 50,
        [env.PRICE_ID_ELITE]: 100,
      };

      const incrementCredits = creditsMap[priceId] ?? 0;

      if (incrementCredits === 0) {
        console.warn(`Unhandled priceId: ${priceId}`);
        return;
      }

      console.log(`Credits to increment: ${incrementCredits}`);

      // Update user credits and immediately update Mautic
      try {
        const userBeforeUpdate = await prisma.user.findUnique({
          where: { id: userId },
        });

        console.log("User before update:", userBeforeUpdate);

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            credits: {
              increment: incrementCredits,
            },
          },
        });

        console.log("User after update:", updatedUser);

        // Immediately update Mautic contact with the new credit balance.
        if (updatedUser.email) {
          try {
            const mauticResult = await updateMauticContact({
              email: updatedUser.email,
              name: updatedUser.name,
              credits: updatedUser.credits,
            });
            console.log("Mautic updated after purchase:", mauticResult);
          } catch (err) {
            console.error("Error updating Mautic after purchase:", err);
          }
        } else {
          console.error("Updated user has no email; cannot update Mautic.");
        }
      } catch (err) {
        console.error("Error updating user credits:", err);
        return res.status(500).send("Failed to update user credits.");
      }

      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

export default webhook;
