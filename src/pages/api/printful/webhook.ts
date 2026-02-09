// src/pages/api/printful/webhook.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { buffer } from "micro";
import { prisma } from "~/server/db";
import { env } from "~/env.mjs";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";

export const config = {
  api: {
    bodyParser: false,
  },
};

type ShipmentData = {
  tracking_number?: string;
  tracking_url?: string;
  carrier?: string;
  status?: string;
  shipped_at?: string | number;
};

type WebhookPayload = {
  type?: string;
  data?: {
    order?: { id?: number | string; external_id?: string };
    shipment?: ShipmentData;
    shipments?: ShipmentData[];
  };
  order?: { id?: number | string; external_id?: string };
  shipment?: ShipmentData;
  shipments?: ShipmentData[];
  order_id?: number | string;
};

function toStringId(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function coalesceShipment(payload: WebhookPayload): ShipmentData | null {
  return (
    payload.data?.shipment ??
    payload.shipment ??
    payload.data?.shipments?.[0] ??
    payload.shipments?.[0] ??
    null
  );
}

function parseShippedAt(value: unknown): Date | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function verifySignature(rawBody: Buffer, signature: string | undefined) {
  if (!env.PRINTFUL_WEBHOOK_SECRET) return true;
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", env.PRINTFUL_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const rawBody = await buffer(req);
  const signature =
    (req.headers["x-printful-signature"] as string | undefined) ??
    (req.headers["x-printful-signature-hmac-sha256"] as string | undefined);

  if (!verifySignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as WebhookPayload;
  } catch {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  const externalId =
    toStringId(payload.data?.order?.external_id) ??
    toStringId(payload.order?.external_id);
  const printfulOrderId =
    toStringId(payload.data?.order?.id) ??
    toStringId(payload.order?.id) ??
    toStringId(payload.order_id);

  const shipment = coalesceShipment(payload);
  const trackingNumber =
    shipment?.tracking_number?.trim() ||
    undefined;
  const trackingUrl =
    shipment?.tracking_url?.trim() ||
    undefined;
  const trackingCarrier =
    shipment?.carrier?.trim() ||
    undefined;
  const trackingStatus =
    shipment?.status?.trim() ||
    payload.type?.trim() ||
    undefined;
  const shippedAt = parseShippedAt(shipment?.shipped_at);

  let orderRecord = null as
    | (Awaited<ReturnType<typeof prisma.productOrder.findUnique>> & {
        user?: { email: string | null; name: string | null };
        printfulOrder?: { id: string };
      })
    | null;

  if (externalId) {
    orderRecord = await prisma.productOrder.findUnique({
      where: { id: externalId },
      include: { user: true, printfulOrder: true },
    });
  }

  let printfulOrder = orderRecord?.printfulOrder ?? null;
  if (!printfulOrder && printfulOrderId) {
    printfulOrder = await prisma.printfulOrder.findFirst({
      where: { printfulOrderId },
    });
  }

  if (!printfulOrder) {
    return res.status(200).json({ received: true, ignored: "order_not_found" });
  }

  await prisma.printfulOrder.update({
    where: { id: printfulOrder.id },
    data: {
      trackingNumber: trackingNumber ?? undefined,
      trackingUrl: trackingUrl ?? undefined,
      trackingCarrier: trackingCarrier ?? undefined,
      trackingStatus: trackingStatus ?? undefined,
      shippedAt: shippedAt ?? undefined,
      trackingUpdatedAt: new Date(),
      ...(trackingStatus ? { status: trackingStatus } : {}),
    },
  });

  if (orderRecord?.user?.email && (trackingNumber || trackingUrl || trackingCarrier)) {
    const customFields: Record<string, string> = {};
    if (env.MAUTIC_TRACKING_NUMBER_FIELD && trackingNumber) {
      customFields[env.MAUTIC_TRACKING_NUMBER_FIELD] = trackingNumber;
    }
    if (env.MAUTIC_TRACKING_URL_FIELD && trackingUrl) {
      customFields[env.MAUTIC_TRACKING_URL_FIELD] = trackingUrl;
    }
    if (env.MAUTIC_TRACKING_CARRIER_FIELD && trackingCarrier) {
      customFields[env.MAUTIC_TRACKING_CARRIER_FIELD] = trackingCarrier;
    }

    if (Object.keys(customFields).length > 0) {
      await updateMauticContact(
        {
          email: orderRecord.user.email,
          name: orderRecord.user.name,
          customFields,
        },
        "namedesignai"
      );
    }
  }

  return res.status(200).json({ received: true });
}
