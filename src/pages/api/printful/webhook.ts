// src/pages/api/printful/webhook.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { buffer } from "micro";
import { prisma } from "~/server/db";
import { env } from "~/env.mjs";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";
import { sendOrderShippedEmail } from "~/server/mautic/transactional";
import { scheduleOrderDeliveredEmail } from "~/server/mautic/deliveryScheduler";

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
  estimated_delivery_days_max?: number | string;
  estimated_delivery_days?: number | string | { max?: number | string };
  delivery_days?: number | string;
  estimated_delivery_date_max?: string;
  estimated_delivery?: { max?: string };
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

function parsePositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  }
  return null;
}

function parseMaxDeliveryDays(shipment: ShipmentData | null, shippedAt: Date | null): number {
  if (!shipment) return 7;

  const candidates: Array<unknown> = [
    shipment.estimated_delivery_days_max,
    shipment.delivery_days,
    typeof shipment.estimated_delivery_days === "object"
      ? shipment.estimated_delivery_days?.max
      : shipment.estimated_delivery_days,
  ];

  for (const candidate of candidates) {
    const parsed = parsePositiveInt(candidate);
    if (parsed) return Math.min(parsed, 30);
  }

  const estimatedDateString =
    shipment.estimated_delivery_date_max ?? shipment.estimated_delivery?.max;
  if (estimatedDateString && shippedAt) {
    const estimatedDate = new Date(estimatedDateString);
    if (!Number.isNaN(estimatedDate.getTime())) {
      const diffMs = estimatedDate.getTime() - shippedAt.getTime();
      const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      if (diffDays > 0) return Math.min(diffDays, 30);
    }
  }

  return 7;
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
  const normalizedTrackingStatus = (trackingStatus ?? "").toLowerCase();
  const physicalOrderStatus =
    normalizedTrackingStatus.includes("deliver")
      ? "delivered"
      : normalizedTrackingStatus.includes("ship")
      ? "shipped"
      : trackingNumber || trackingUrl || trackingCarrier
      ? "shipped"
      : undefined;
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

  if (!orderRecord && printfulOrder?.productOrderId) {
    orderRecord = await prisma.productOrder.findUnique({
      where: { id: printfulOrder.productOrderId },
      include: { user: true, printfulOrder: true },
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

  if (
    orderRecord?.user?.email &&
    (trackingNumber || trackingUrl || trackingCarrier || physicalOrderStatus)
  ) {
    const physicalVariant = [orderRecord.size, orderRecord.color]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(" + ");
    const physicalProductName = (orderRecord.variantName ?? orderRecord.productKey).slice(0, 64);

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

    // Extend existing Mautic payload with shipment fields.
    if (physicalOrderStatus) {
      customFields.physical_order_status = physicalOrderStatus;
    }
    if (trackingCarrier) {
      customFields.physical_carrier = trackingCarrier;
    }
    if (trackingNumber) {
      customFields.physical_tracking_number = trackingNumber;
    }
    if (trackingUrl) {
      customFields.physical_tracking_url = trackingUrl;
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

    if (orderRecord.shippingEmailSentAt) {
      console.log("Shipping email already sent, skipping", orderRecord.id);
    }

    const shouldSendShippingEmail =
      physicalOrderStatus === "shipped" &&
      Boolean(trackingNumber) &&
      !orderRecord.shippingEmailSentAt;

    if (shouldSendShippingEmail) {
      const shippingSendResult = await sendOrderShippedEmail(null, {
        orderNumber: orderRecord.id,
        customerEmail: orderRecord.user.email,
        shippingDate: shippedAt ?? undefined,
        trackingUrl: trackingUrl ?? undefined,
        productImages: [orderRecord.mockupUrl, orderRecord.imageUrl].filter(Boolean),
        physical_product_name: physicalProductName,
        physical_variant: physicalVariant || undefined,
        physical_order_id: orderRecord.id,
      });

      if (shippingSendResult.ok) {
        await prisma.productOrder.update({
          where: { id: orderRecord.id },
          data: { shippingEmailSentAt: new Date() },
        });
      } else {
        console.error("Shipping email send failed; not marking shippingEmailSentAt", {
          orderId: orderRecord.id,
          error: shippingSendResult.error,
        });
      }
    }

    if (shippedAt) {
      const maxDeliveryDays = parseMaxDeliveryDays(shipment, shippedAt);
      await scheduleOrderDeliveredEmail({
        productOrderId: orderRecord.id,
        shippingDate: shippedAt,
        maxDeliveryDays,
      });
    }
  }

  return res.status(200).json({ received: true });
}

