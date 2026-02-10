/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// ~/server/api/stripe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { env } from "~/env.mjs";
import { buffer } from "micro";
import { prisma } from "~/server/db";
import { Prisma } from "@prisma/client";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";
import { printfulRequest } from "~/server/printful/client";
import sharp from "sharp";
import { convertWebpToPngAndUpload } from "~/server/image/convertWebpToPng";
import { generateMugWrapImage } from "~/server/printful/generateMugWrapImage";
import { MUG_PRINT_CONFIG } from "~/server/printful/printAreas";
import { generateTshirtPrintImage } from "~/server/printful/generateTshirtPrintImage";
import type { AspectRatio } from "~/server/printful/aspects";
import type { MugPreviewMode } from "~/server/printful/previewModes";
import crypto from "crypto";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

type MetaPurchaseInput = {
  eventId: string;
  value: number;
  currency: string;
  contentType: "credits" | "product";
  contentIds: string[];
  email?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashEmail(email: string) {
  return crypto.createHash("sha256").update(email).digest("hex");
}

async function sendMetaPurchaseEvent(input: MetaPurchaseInput) {
  if (!env.META_PIXEL_ID || !env.META_ACCESS_TOKEN) return;

  try {
    const userData: Record<string, string[]> = {};
    if (input.email) {
      const normalized = normalizeEmail(input.email);
      if (normalized) {
        userData.em = [hashEmail(normalized)];
      }
    }

    const payload: {
      data: Array<{
        event_name: "Purchase";
        event_time: number;
        event_id: string;
        action_source: "website";
        user_data?: Record<string, string[]>;
        custom_data: {
          value: number;
          currency: string;
          content_type: string;
          content_ids: string[];
        };
      }>;
      test_event_code?: string;
    } = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: input.eventId,
          action_source: "website",
          ...(Object.keys(userData).length > 0 ? { user_data: userData } : {}),
          custom_data: {
            value: input.value,
            currency: input.currency,
            content_type: input.contentType,
            content_ids: input.contentIds,
          },
        },
      ],
      ...(env.META_TEST_EVENT_CODE
        ? { test_event_code: env.META_TEST_EVENT_CODE }
        : {}),
    };

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${env.META_PIXEL_ID}/events?access_token=${env.META_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Meta CAPI error:", res.status, text);
    }
  } catch (err) {
    console.error("Meta CAPI request failed:", err);
  }
}

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
    case "checkout.session.completed": {
        console.log("Processing checkout.session.completed event...");
        const completedEvent = event.data.object;

        /* ------------------------------------
          PRINTFUL PHYSICAL ORDER FLOW
        ------------------------------------ */
        const orderId =
          completedEvent.metadata?.orderId ??
          completedEvent.client_reference_id;
        if (orderId) {
      // Printful: use orderId to create/confirm order after payment

      if (!orderId) {
        console.error("Missing orderId in product_order metadata");
        break;
      }

      const order = await prisma.productOrder.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order) {
        console.error("ProductOrder not found:", orderId);
        break;
      }

      const existingPrintfulOrder = await prisma.printfulOrder.findUnique({
        where: { productOrderId: orderId },
      });

      // 🛑 Idempotency: if Printful order already created, do nothing
      if (existingPrintfulOrder) {
        console.log("Printful order already created:", orderId);
        break;
      }

      if (order.status !== "paid") {
        await prisma.productOrder.update({
          where: { id: orderId },
          data: {
            status: "paid",
            paidAt: order.paidAt ?? new Date(),
            stripeSessionId: order.stripeSessionId ?? completedEvent.id,
          },
        });
      }

      const countryCode = (order.country ?? "").trim().toUpperCase();
      const stateCode = (order.state ?? "").trim().toUpperCase();

      const rawZip = (order.zip ?? "").trim();
      const zip =
        countryCode === "US"
          ? rawZip.replace(/\s+/g, "").split("-")[0]
          : rawZip;

      const recipient = {
        name: order.name,
        address1: order.address1,
        city: order.city,
        zip,
        country_code: countryCode,
        state_code: countryCode === "US" ? stateCode : undefined,
      };

      if (
        !recipient.name ||
        !recipient.address1 ||
        !recipient.city ||
        !recipient.zip ||
        !recipient.country_code ||
        (recipient.country_code === "US" && recipient.state_code?.length !== 2)
      ) {
        const missing = {
          name: !!recipient.name,
          address1: !!recipient.address1,
          city: !!recipient.city,
          zip: !!recipient.zip,
          country_code: !!recipient.country_code,
          state_code: recipient.state_code?.length === 2,
        };
        console.error("Missing Printful recipient fields:", missing);
        throw new Error("Missing recipient fields for Printful order");
      }

      let printImageUrl: string;
      try {
        const imageRes = await fetch(order.imageUrl);
        if (!imageRes.ok) {
          throw new Error("Failed to fetch image for Printful");
        }

        const buffer = Buffer.from(await imageRes.arrayBuffer());

        const printReadyBuffer = await sharp(buffer)
          .png({ quality: 100 })
          .withMetadata({ density: 300 })
          .toBuffer();

        if (order.productKey === "mug") {
          const mugConfig = MUG_PRINT_CONFIG[order.variantId];
          if (!mugConfig) {
            throw new Error(`Invalid mug variant: ${order.variantId}`);
          }

          const wrappedBuffer = await generateMugWrapImage({
            inputBuffer: printReadyBuffer,
            outputWidth: mugConfig.areaWidth,
            outputHeight: mugConfig.areaHeight,
            mode: (order.previewMode ?? "two-side") as MugPreviewMode,
          });

          printImageUrl = await convertWebpToPngAndUpload(
            wrappedBuffer,
            order.userId
          );
        } else if (order.productKey === "tshirt") {
          const tshirtBuffer = await generateTshirtPrintImage({
            inputBuffer: buffer,
            printWidth: 3810,
            printHeight: 4572,
            aspect: (order.aspect ?? "1:1") as AspectRatio,
          });

          printImageUrl = await convertWebpToPngAndUpload(
            tshirtBuffer,
            order.userId
          );
        } else {
          printImageUrl = await convertWebpToPngAndUpload(
            printReadyBuffer,
            order.userId
          );
        }
      } catch (err) {
        console.error("Printful image preparation error:", err);
        throw err;
      }

      console.log("Printful print image URL:", printImageUrl);

      let draftOrder: { result?: { id?: number } };
      try {
        draftOrder = await printfulRequest("/orders", "POST", {
          // Draft order created after payment
          recipient,
          external_id: order.id,
          items: [
            {
              variant_id: order.variantId,
              quantity: 1,
              files: [{ url: printImageUrl }],
            },
          ],
          confirm: false,
        });
        console.log("Printful draft order response:", draftOrder);
      } catch (err) {
        console.error("Printful draft order error:", err);
        throw err;
      }

      const printfulId = draftOrder?.result?.id;
      if (!printfulId) {
        console.error("Invalid Printful draft order response:", draftOrder);
        throw new Error("Invalid Printful draft order response");
      }

      let confirmResult: unknown;
      try {
        confirmResult = await printfulRequest(
          `/orders/${printfulId}/confirm`,
          "POST"
        );
        console.log("Printful confirm response:", confirmResult);
      } catch (err) {
        console.error("Printful confirm error:", err);
        throw err;
      }

      // ✅ Mark as fulfilled and store Printful order id
      await prisma.printfulOrder.create({
        data: {
          productOrderId: order.id,
          printfulOrderId: String(printfulId),
          status: "submitted",
        },
      });

      await prisma.productOrder.update({
        where: { id: orderId },
        data: {
          status: "fulfilled",
        },
      });

      console.log("ProductOrder marked as FULFILLED:", orderId);
      await sendMetaPurchaseEvent({
        eventId: event.id,
        value: Number(order.totalPrice ?? 0),
        currency: "USD",
        contentType: "product",
        contentIds: [order.productKey],
        email: completedEvent.customer_details?.email ?? order.user?.email ?? null,
      });

      break;
    }

    /* ------------------------------------
      CREDITS PURCHASE FLOW (EXISTING)
    ------------------------------------ */
    const userId = completedEvent.metadata?.userId;
    if (!userId) {
      console.error("User ID missing in session metadata.");
      break;
    }

    let lineItems;
    try {
      lineItems = await stripe.checkout.sessions.listLineItems(completedEvent.id);
    } catch (err) {
      console.error("Error fetching line items:", err);
      break;
    }

    const priceId = lineItems.data[0]?.price?.id;
    if (!priceId) {
      console.error("Missing priceId in line items.");
      break;
    }

    const creditsMap: Record<string, number> = {
      [env.PRICE_ID_STARTER]: 20,
      [env.PRICE_ID_PRO]: 50,
      [env.PRICE_ID_ELITE]: 100,
    };

    const planMap: Record<number, string> = {
      20: "Starter",
      50: "Pro",
      100: "Elite",
    };

    const incrementCredits = creditsMap[priceId] ?? 0;
    const plan = planMap[incrementCredits] ?? "None";

    if (incrementCredits === 0) {
      console.warn(`Unhandled priceId: ${priceId}`);
      break;
    }

    try {
      const incrementCreditsDecimal = new Prisma.Decimal(incrementCredits);
      let updatedUser:
        | {
            email: string | null;
            name: string | null;
            credits: Prisma.Decimal;
            plan: "None" | "Starter" | "Pro" | "Elite";
          }
        | null = null;
      let alreadyProcessed = false;

      await prisma.$transaction(async (tx) => {
        try {
          await tx.stripeWebhookEvent.create({
            data: {
              id: event.id,
              type: event.type,
              stripeSessionId: completedEvent.id,
              userId,
            },
          });
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
          ) {
            alreadyProcessed = true;
            return;
          }
          throw err;
        }

        const existingUser = await tx.user.findUnique({
          where: { id: userId },
          select: { credits: true },
        });

        if (!existingUser) {
          throw new Error("User not found for credits purchase.");
        }

        const updatedCredits = new Prisma.Decimal(existingUser.credits).plus(
          incrementCreditsDecimal
        );

        updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            credits: updatedCredits,
            plan: plan as "None" | "Starter" | "Pro" | "Elite",
          },
          select: {
            email: true,
            name: true,
            credits: true,
            plan: true,
          },
        });
      });

      if (alreadyProcessed) {
        console.log("Stripe event already processed:", event.id);
        break;
      }

      if (updatedUser?.email) {
        await updateMauticContact(
          {
            email: updatedUser.email,
            name: updatedUser.name,
            brand_specific_credits: updatedUser.credits,
            brand_specific_plan: updatedUser.plan,
          },
          "namedesignai"
        );
      }
      await sendMetaPurchaseEvent({
        eventId: event.id,
        value: (completedEvent.amount_total ?? 0) / 100,
        currency: "USD",
        contentType: "credits",
        contentIds: ["credits"],
        email: completedEvent.customer_details?.email ?? updatedUser?.email ?? null,
      });
    } catch (err) {
      console.error("Error updating user credits or plan:", err);
    }

    break;
  }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

export default webhook;
