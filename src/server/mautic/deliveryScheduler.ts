import { prisma } from "~/server/db";
import { sendOrderDeliveredEmail } from "~/server/mautic/transactional";

type ScheduleInput = {
  productOrderId: string;
  shippingDate: Date;
  maxDeliveryDays: number;
};

function normalizeMaxDeliveryDays(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 7;
  return Math.min(30, Math.max(1, Math.floor(value)));
}

export async function scheduleOrderDeliveredEmail(input: ScheduleInput) {
  const maxDeliveryDays = normalizeMaxDeliveryDays(input.maxDeliveryDays);
  const deliveryDate = new Date(input.shippingDate);
  deliveryDate.setUTCDate(deliveryDate.getUTCDate() + maxDeliveryDays);

  const existing = await prisma.deliveryEmailSchedule.findUnique({
    where: { productOrderId: input.productOrderId },
  });

  let schedule;
  if (!existing) {
    schedule = await prisma.deliveryEmailSchedule.create({
      data: {
        productOrderId: input.productOrderId,
        deliveryDate,
        maxDeliveryDays,
      },
    });
  } else if (!existing.sentAt) {
    schedule = await prisma.deliveryEmailSchedule.update({
      where: { id: existing.id },
      data: {
        deliveryDate,
        maxDeliveryDays,
      },
    });
  } else {
    console.log("Delivered email already sent; schedule not changed", {
      productOrderId: input.productOrderId,
      sentAt: existing.sentAt.toISOString(),
    });
    return existing;
  }

  console.log("Scheduled order delivered email", {
    productOrderId: input.productOrderId,
    deliveryDate: schedule.deliveryDate.toISOString(),
    maxDeliveryDays: schedule.maxDeliveryDays,
  });

  return schedule;
}

export async function processDueDeliveredEmailSchedules() {
  const now = new Date();
  const dueSchedules = await prisma.deliveryEmailSchedule.findMany({
    where: {
      sentAt: null,
      deliveryDate: { lte: now },
    },
    orderBy: { deliveryDate: "asc" },
    take: 100,
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const schedule of dueSchedules) {
    const lockResult = await prisma.deliveryEmailSchedule.updateMany({
      where: {
        id: schedule.id,
        sentAt: null,
        OR: [{ processingAt: null }, { processingAt: { lt: new Date(Date.now() - 15 * 60 * 1000) } }],
      },
      data: {
        processingAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    if (lockResult.count !== 1) {
      skipped += 1;
      continue;
    }

    const order = await prisma.productOrder.findUnique({
      where: { id: schedule.productOrderId },
      include: { user: true, printfulOrder: true },
    });

    if (!order?.user?.email) {
      await prisma.deliveryEmailSchedule.update({
        where: { id: schedule.id },
        data: {
          processingAt: null,
          lastError: "Missing order or customer email",
        },
      });
      failed += 1;
      continue;
    }

    const physicalVariant = [order.size, order.color]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(" + ");
    const physicalProductName = (order.variantName ?? order.productKey).slice(0, 64);

    const sendResult = await sendOrderDeliveredEmail(null, {
      orderNumber: order.id,
      customerEmail: order.user.email,
      shippingDate: order.printfulOrder?.shippedAt ?? undefined,
      trackingUrl: order.printfulOrder?.trackingUrl ?? undefined,
      productImages: [order.mockupUrl, order.imageUrl].filter(Boolean),
      physical_product_name: physicalProductName,
      physical_variant: physicalVariant || undefined,
      physical_order_id: order.id,
    });

    if (sendResult.ok) {
      await prisma.deliveryEmailSchedule.update({
        where: { id: schedule.id },
        data: {
          sentAt: new Date(),
          processingAt: null,
          lastError: null,
        },
      });
      sent += 1;
    } else {
      await prisma.deliveryEmailSchedule.update({
        where: { id: schedule.id },
        data: {
          processingAt: null,
          lastError: sendResult.error.slice(0, 1000),
        },
      });
      failed += 1;
    }
  }

  console.log("Processed delivered email schedules", { due: dueSchedules.length, sent, failed, skipped });
  return { due: dueSchedules.length, sent, failed, skipped };
}
