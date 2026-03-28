import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { sendMetaPhysicalPurchaseEvent } from "~/server/meta/sendConversionEvent";

type RequestBody = {
  orderId?: string;
  testEventCode?: string;
};

function getBody(req: NextApiRequest): RequestBody {
  if (!req.body || typeof req.body !== "object") return {};
  return req.body as RequestBody;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = getBody(req);
  const orderId = body.orderId?.trim();
  const testEventCode = body.testEventCode?.trim() || null;

  if (!orderId) {
    return res.status(400).json({ error: "Missing orderId" });
  }

  try {
    const order = await prisma.productOrder.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const eventId = `physical_purchase_manual_${order.id}_${Date.now()}`;
    const result = await sendMetaPhysicalPurchaseEvent({
      eventId,
      value: Number(order.totalPrice ?? 0),
      currency: "USD",
      contentIds: [order.productKey],
      email: order.user?.email ?? null,
      externalId: order.userId ?? order.user?.email ?? null,
      eventSourceUrl: `${env.NEXTAUTH_URL}/order/success?orderId=${order.id}`,
      testEventCode,
    });

    if (!result.skipped && !result.ok) {
      console.error("Manual Meta physical purchase trigger failed", {
        orderId: order.id,
        eventId,
        testEventCode,
        status: result.status,
        body: result.body,
      });
      return res.status(502).json({
        error: "Meta rejected the event",
        orderId: order.id,
        eventId,
        metaStatus: result.status,
        metaBody: result.body,
      });
    }

    return res.status(200).json({
      ok: true,
      orderId: order.id,
      status: order.status,
      productKey: order.productKey,
      eventName: "PhysicalPurchase",
      eventId,
      testEventCode,
      meta: result,
    });
  } catch (error) {
    console.error("Failed to trigger manual physical purchase event", {
      orderId,
      testEventCode,
      error,
    });
    return res.status(500).json({ error: "Failed to trigger physical purchase event" });
  }
}
