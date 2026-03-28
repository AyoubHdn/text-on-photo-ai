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
import { sendOrderConfirmedEmail } from "~/server/mautic/transactional";
import {
  sendMetaPhysicalPurchaseEvent,
  sendMetaPurchaseEvent,
} from "~/server/meta/sendConversionEvent";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

const COUNTRIES_REQUIRING_STATE = new Set(["US", "CA", "AU"]);

export const config = {
  api: {
    bodyParser: false,
  },
};

function getRequestIp(req: NextApiRequest): string | null {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]?.split(",")[0]?.trim() ?? null;
  }
  return req.socket?.remoteAddress ?? null;
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
        const completedEvent = event.data.object;
        const clientIpAddress = getRequestIp(req);
        const clientUserAgent =
          typeof req.headers["user-agent"] === "string"
            ? req.headers["user-agent"]
            : Array.isArray(req.headers["user-agent"])
            ? req.headers["user-agent"][0]
            : null;

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
        name: order.name?.trim(),
        address1: order.address1?.trim(),
        city: order.city?.trim(),
        zip,
        country_code: countryCode,
        state_code: COUNTRIES_REQUIRING_STATE.has(countryCode)
          ? stateCode
          : undefined,
      };

      if (
        !recipient.name ||
        !recipient.address1 ||
        !recipient.city ||
        !recipient.zip ||
        !recipient.country_code ||
        (COUNTRIES_REQUIRING_STATE.has(recipient.country_code) &&
          recipient.state_code?.length !== 2)
      ) {
        const missing = {
          name: !!recipient.name,
          address1: !!recipient.address1,
          city: !!recipient.city,
          zip: !!recipient.zip,
          country_code: !!recipient.country_code,
          state_code: COUNTRIES_REQUIRING_STATE.has(recipient.country_code)
            ? recipient.state_code?.length === 2
            : true,
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

      const signedInEmail = order.user?.email ?? null;
      const stripeCheckoutEmail = completedEvent.customer_details?.email ?? null;
      const preferredEmail = signedInEmail ?? stripeCheckoutEmail;

      if (
        signedInEmail &&
        stripeCheckoutEmail &&
        signedInEmail.toLowerCase() !== stripeCheckoutEmail.toLowerCase()
      ) {
        console.warn("Stripe checkout email differs from signed-in account email", {
          orderId: order.id,
          signedInEmail,
          stripeCheckoutEmail,
        });
      }

      await sendMetaPurchaseEvent({
        eventId: `physical_order_${order.id}`,
        value: Number(order.totalPrice ?? 0),
        currency: "USD",
        contentType: "product",
        contentIds: [order.productKey],
        email: preferredEmail,
        externalId: order.userId ?? preferredEmail ?? null,
        fbp: completedEvent.metadata?.fbp ?? null,
        fbc: completedEvent.metadata?.fbc ?? null,
        clientIpAddress,
        clientUserAgent,
        eventSourceUrl: `${env.NEXTAUTH_URL}/order/success?orderId=${order.id}`,
      });
      await sendMetaPhysicalPurchaseEvent({
        eventId: `physical_purchase_${order.id}`,
        value: Number(order.totalPrice ?? 0),
        currency: "USD",
        contentIds: [order.productKey],
        email: preferredEmail,
        externalId: order.userId ?? preferredEmail ?? null,
        fbp: completedEvent.metadata?.fbp ?? null,
        fbc: completedEvent.metadata?.fbc ?? null,
        clientIpAddress,
        clientUserAgent,
        eventSourceUrl: `${env.NEXTAUTH_URL}/order/success?orderId=${order.id}`,
      });

      // Mautic: mark/update physical purchase fields for this contact.
      const physicalPurchaseEmail = preferredEmail;
      if (!physicalPurchaseEmail) {
        console.error(
          "Mautic physical purchase sync skipped: missing customer email",
          { orderId: order.id, stripeSessionId: completedEvent.id },
        );
      } else {
        try {
          const physicalPurchaseCount = await prisma.productOrder.count({
            where: {
              userId: order.userId,
              status: { in: ["paid", "fulfilled"] },
            },
          });

          // Added: extend existing Mautic payload with physical order metadata.
          const physicalVariant = [order.size, order.color]
            .filter(
              (value): value is string =>
                typeof value === "string" && value.trim().length > 0,
            )
            .join(" + ");
          const rawPhysicalProductName =
            (order as { productName?: string | null }).productName ??
            order.variantName ??
            order.productKey;
          const physicalProductName = rawPhysicalProductName.slice(0, 64);
          const payload = {
            has_purchased_physical: true,
            physical_purchase_count: physicalPurchaseCount || 1,
            last_physical_purchase_da: new Date().toISOString(),
            last_physical_product_typ: order.productKey,
            physical_order_id: order.id,
            physical_product_name: physicalProductName,
            physical_variant: physicalVariant || undefined,
            physical_order_status: "confirmed",
          };
          const mauticResponse = await updateMauticContact(
            {
              email: physicalPurchaseEmail,
              name: order.user?.name ?? null,
              customFields: payload,
            },
            "namedesignai",
          );

          if (mauticResponse.errors?.length) {
            console.error(
              "Mautic physical purchase sync returned errors:",
              mauticResponse.errors,
            );
          }
        } catch (mauticErr) {
          console.error("Failed to sync physical purchase fields to Mautic:", {
            orderId: order.id,
            email: physicalPurchaseEmail,
            error: mauticErr,
          });
        }
      }

      if (physicalPurchaseEmail) {
        const physicalVariant = [order.size, order.color]
          .filter(
            (value): value is string =>
              typeof value === "string" && value.trim().length > 0,
          )
          .join(" + ");
        const physicalProductName = (order.variantName ?? order.productKey).slice(0, 64);

        await sendOrderConfirmedEmail(null, {
          orderNumber: order.id,
          customerEmail: physicalPurchaseEmail,
          productImages: [order.mockupUrl, order.imageUrl].filter(Boolean),
          physical_product_name: physicalProductName,
          physical_variant: physicalVariant || undefined,
          physical_order_id: order.id,
        });
      }

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
        externalId: userId ?? completedEvent.customer_details?.email ?? null,
        fbp: completedEvent.metadata?.fbp ?? null,
        fbc: completedEvent.metadata?.fbc ?? null,
        clientIpAddress,
        clientUserAgent,
      });
    } catch (err) {
      console.error("Error updating user credits or plan:", err);
    }

    break;
  }

    default:
      break;
  }

  res.json({ received: true });
};

export default webhook;




