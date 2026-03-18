import type { Prisma } from "@prisma/client";
import { prisma } from "~/server/db";
import { sendOrderDeliveredEmail, sendOrderShippedEmail } from "./transactional";

const resendOrderInclude = {
  user: true,
  printfulOrder: true,
  deliveryEmailSchedule: true,
} satisfies Prisma.ProductOrderInclude;

type OrderWithRelations = Prisma.ProductOrderGetPayload<{
  include: typeof resendOrderInclude;
}>;

export type ResendEmailMode = "shipped" | "delivered" | "both";

type ResendOptions = {
  mode: ResendEmailMode;
  limit: number;
  orderId?: string | null;
  dryRun?: boolean;
  force?: boolean;
};

type ItemResult = {
  orderId: string;
  shipped: "sent" | "failed" | "skipped" | "dry_run";
  delivered: "sent" | "failed" | "skipped" | "dry_run";
  notes: string[];
};

type ResendResult = {
  mode: ResendEmailMode;
  scanned: number;
  shippedSent: number;
  deliveredSent: number;
  failed: number;
  items: ItemResult[];
};

function hasTracking(order: OrderWithRelations) {
  return Boolean(
    order.printfulOrder?.trackingUrl?.trim() ||
      order.printfulOrder?.trackingNumber?.trim(),
  );
}

function looksDelivered(order: OrderWithRelations) {
  const statusValues = [
    order.printfulOrder?.trackingStatus,
    order.printfulOrder?.status,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.toLowerCase());

  if (statusValues.some((value) => value.includes("deliver"))) return true;

  const deliveryDate = order.deliveryEmailSchedule?.deliveryDate;
  return Boolean(deliveryDate && deliveryDate <= new Date());
}

function buildPhysicalVariant(order: OrderWithRelations) {
  return [order.size, order.color]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" + ");
}

function buildPhysicalProductName(order: OrderWithRelations) {
  return (order.variantName ?? order.productKey).slice(0, 64);
}

export async function resendPhysicalOrderEmails(options: ResendOptions): Promise<ResendResult> {
  const where: Prisma.ProductOrderWhereInput = options.orderId
    ? { id: options.orderId }
    : { printfulOrder: { isNot: null } };

  const orders = await prisma.productOrder.findMany({
    where,
    include: resendOrderInclude,
    orderBy: { createdAt: "asc" },
    take: options.orderId ? 1 : options.limit,
  });

  const result: ResendResult = {
    mode: options.mode,
    scanned: orders.length,
    shippedSent: 0,
    deliveredSent: 0,
    failed: 0,
    items: [],
  };

  for (const order of orders) {
    const item: ItemResult = {
      orderId: order.id,
      shipped: "skipped",
      delivered: "skipped",
      notes: [],
    };

    const email = order.user?.email?.trim();
    if (!email) {
      item.notes.push("missing_customer_email");
      result.items.push(item);
      continue;
    }

    if (!order.printfulOrder) {
      item.notes.push("missing_printful_order");
      result.items.push(item);
      continue;
    }

    if (!hasTracking(order)) {
      item.notes.push("missing_tracking");
      result.items.push(item);
      continue;
    }

    const physicalVariant = buildPhysicalVariant(order);
    const physicalProductName = buildPhysicalProductName(order);

    if (options.mode === "shipped" || options.mode === "both") {
      if (!options.force && order.shippingEmailSentAt) {
        item.notes.push("shipping_email_already_sent");
      } else if (options.dryRun) {
        item.shipped = "dry_run";
      } else {
        const sendResult = await sendOrderShippedEmail(null, {
          orderNumber: order.id,
          customerEmail: email,
          shippingDate: order.printfulOrder.shippedAt ?? undefined,
          trackingUrl: order.printfulOrder.trackingUrl ?? undefined,
          trackingNumber: order.printfulOrder.trackingNumber ?? undefined,
          productImages: [order.mockupUrl, order.imageUrl].filter(Boolean),
          physical_product_name: physicalProductName,
          physical_variant: physicalVariant || undefined,
          physical_order_id: order.id,
        });

        if (sendResult.ok) {
          item.shipped = "sent";
          result.shippedSent += 1;
          await prisma.productOrder.update({
            where: { id: order.id },
            data: { shippingEmailSentAt: new Date() },
          });
        } else {
          item.shipped = "failed";
          item.notes.push(`shipping_failed:${sendResult.error}`);
          result.failed += 1;
        }
      }
    }

    if (options.mode === "delivered" || options.mode === "both") {
      if (!options.force && order.deliveryEmailSchedule?.sentAt) {
        item.notes.push("delivery_email_already_sent");
      } else if (!options.force && !looksDelivered(order)) {
        item.notes.push("order_not_marked_delivered");
      } else if (options.dryRun) {
        item.delivered = "dry_run";
      } else {
        const sendResult = await sendOrderDeliveredEmail(null, {
          orderNumber: order.id,
          customerEmail: email,
          shippingDate: order.printfulOrder.shippedAt ?? undefined,
          trackingUrl: order.printfulOrder.trackingUrl ?? undefined,
          trackingNumber: order.printfulOrder.trackingNumber ?? undefined,
          productImages: [order.mockupUrl, order.imageUrl].filter(Boolean),
          physical_product_name: physicalProductName,
          physical_variant: physicalVariant || undefined,
          physical_order_id: order.id,
        });

        if (sendResult.ok) {
          item.delivered = "sent";
          result.deliveredSent += 1;
          const effectiveDeliveryDate =
            order.deliveryEmailSchedule?.deliveryDate ?? new Date();
          await prisma.deliveryEmailSchedule.upsert({
            where: { productOrderId: order.id },
            create: {
              productOrderId: order.id,
              deliveryDate: effectiveDeliveryDate,
              maxDeliveryDays: order.deliveryEmailSchedule?.maxDeliveryDays ?? 1,
              sentAt: new Date(),
              processingAt: null,
              lastError: null,
            },
            update: {
              deliveryDate: effectiveDeliveryDate,
              maxDeliveryDays: order.deliveryEmailSchedule?.maxDeliveryDays ?? 1,
              sentAt: new Date(),
              processingAt: null,
              lastError: null,
            },
          });
        } else {
          item.delivered = "failed";
          item.notes.push(`delivered_failed:${sendResult.error}`);
          result.failed += 1;
        }
      }
    }

    result.items.push(item);
  }

  return result;
}

