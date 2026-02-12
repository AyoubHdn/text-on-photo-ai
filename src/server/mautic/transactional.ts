import { env } from "~/env.mjs";

type MauticOrderData = {
  orderNumber: string;
  customerEmail?: string | null;
  shippingDate?: string | Date | null;
  trackingUrl?: string | null;
  productImages?: string[] | null;
  physical_product_name?: string | null;
  physical_variant?: string | null;
  physical_order_id?: string | null;
};

type SendResult =
  | { ok: true; contactId: number }
  | { ok: false; error: string };

function getMauticAuthHeader() {
  if (env.MAUTIC_API_TOKEN?.trim()) {
    return `Bearer ${env.MAUTIC_API_TOKEN.trim()}`;
  }
  return `Basic ${Buffer.from(`${env.MAUTIC_USERNAME}:${env.MAUTIC_PASSWORD}`).toString("base64")}`;
}

function mauticApiUrl(path: string) {
  return `${env.MAUTIC_BASE_URL.replace(/\/+$/, "")}/api/${path.replace(/^\/+/, "")}`;
}

function formatShippingDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildTokens(orderData: MauticOrderData) {
  return {
    "{order_number}": orderData.orderNumber,
    "{shipping_date}": formatShippingDate(orderData.shippingDate),
    "{tracking_url}": orderData.trackingUrl ?? "",
    "{product_images}": (orderData.productImages ?? []).filter(Boolean).join(", "),
    "{physical_product_name}": orderData.physical_product_name ?? "",
    "{physical_variant}": orderData.physical_variant ?? "",
    "{physical_order_id}": orderData.physical_order_id ?? "",
  };
}

async function fetchWithRetry(
  input: string,
  init: RequestInit,
  maxAttempts = 3,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(input, init);
      if (response.ok) return response;
      if (response.status !== 429 && response.status < 500) return response;
      lastError = new Error(`Mautic retryable status ${response.status}`);
    } catch (err) {
      lastError = err;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** (attempt - 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Mautic request failed");
}

async function findContactIdByEmail(email: string): Promise<number | null> {
  const response = await fetchWithRetry(
    mauticApiUrl(`contacts?search=email:${encodeURIComponent(email)}&limit=1`),
    {
      method: "GET",
      headers: {
        Authorization: getMauticAuthHeader(),
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mautic contact lookup failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    contacts?: Record<string, { id?: number }>;
  };
  const firstContact = data.contacts ? Object.values(data.contacts)[0] : undefined;
  return typeof firstContact?.id === "number" ? firstContact.id : null;
}

async function sendEmailToContact(
  emailTemplateId: string,
  contactId: number,
  orderData: MauticOrderData,
) {
  const response = await fetchWithRetry(
    mauticApiUrl(`emails/${emailTemplateId}/contact/${contactId}/send`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getMauticAuthHeader(),
      },
      body: JSON.stringify({ tokens: buildTokens(orderData) }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mautic email send failed (${response.status}): ${text}`);
  }
}

async function resolveContactId(
  contactId: string | number | null | undefined,
  orderData: MauticOrderData,
) {
  if (typeof contactId === "number" && Number.isFinite(contactId)) return contactId;
  if (typeof contactId === "string" && contactId.trim()) {
    const parsed = Number(contactId.trim());
    if (Number.isFinite(parsed)) return parsed;
  }

  const email = orderData.customerEmail?.trim();
  if (!email) {
    throw new Error("Missing Mautic contactId and customerEmail");
  }

  const foundContactId = await findContactIdByEmail(email);
  if (!foundContactId) {
    throw new Error(`Mautic contact not found for email ${email}`);
  }
  return foundContactId;
}

export async function sendOrderConfirmedEmail(
  contactId: string | number | null | undefined,
  orderData: MauticOrderData,
): Promise<SendResult> {
  if (!env.MAUTIC_ORDER_CONFIRMED_TEMPLATE_ID?.trim()) {
    return { ok: false, error: "MAUTIC_ORDER_CONFIRMED_TEMPLATE_ID is not configured" };
  }

  try {
    const resolvedContactId = await resolveContactId(contactId, orderData);
    await sendEmailToContact(
      env.MAUTIC_ORDER_CONFIRMED_TEMPLATE_ID.trim(),
      resolvedContactId,
      orderData,
    );
    console.log("Mautic transactional email sent: order_confirmed", {
      contactId: resolvedContactId,
      orderNumber: orderData.orderNumber,
    });
    return { ok: true, contactId: resolvedContactId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sendOrderConfirmedEmail error";
    console.error("Mautic transactional email failed: order_confirmed", {
      orderNumber: orderData.orderNumber,
      customerEmail: orderData.customerEmail,
      error: message,
    });
    return { ok: false, error: message };
  }
}

export async function sendOrderShippedEmail(
  contactId: string | number | null | undefined,
  orderData: MauticOrderData,
): Promise<SendResult> {
  if (!env.MAUTIC_ORDER_SHIPPED_TEMPLATE_ID?.trim()) {
    return { ok: false, error: "MAUTIC_ORDER_SHIPPED_TEMPLATE_ID is not configured" };
  }

  try {
    const resolvedContactId = await resolveContactId(contactId, orderData);
    await sendEmailToContact(
      env.MAUTIC_ORDER_SHIPPED_TEMPLATE_ID.trim(),
      resolvedContactId,
      orderData,
    );
    console.log("Mautic transactional email sent: order_shipped", {
      contactId: resolvedContactId,
      orderNumber: orderData.orderNumber,
    });
    return { ok: true, contactId: resolvedContactId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sendOrderShippedEmail error";
    console.error("Mautic transactional email failed: order_shipped", {
      orderNumber: orderData.orderNumber,
      customerEmail: orderData.customerEmail,
      error: message,
    });
    return { ok: false, error: message };
  }
}

export async function sendOrderDeliveredEmail(
  contactId: string | number | null | undefined,
  orderData: MauticOrderData,
): Promise<SendResult> {
  if (!env.MAUTIC_ORDER_DELIVERED_TEMPLATE_ID?.trim()) {
    return { ok: false, error: "MAUTIC_ORDER_DELIVERED_TEMPLATE_ID is not configured" };
  }

  try {
    const resolvedContactId = await resolveContactId(contactId, orderData);
    await sendEmailToContact(
      env.MAUTIC_ORDER_DELIVERED_TEMPLATE_ID.trim(),
      resolvedContactId,
      orderData,
    );
    console.log("Mautic transactional email sent: order_delivered", {
      contactId: resolvedContactId,
      orderNumber: orderData.orderNumber,
    });
    return { ok: true, contactId: resolvedContactId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sendOrderDeliveredEmail error";
    console.error("Mautic transactional email failed: order_delivered", {
      orderNumber: orderData.orderNumber,
      customerEmail: orderData.customerEmail,
      error: message,
    });
    return { ok: false, error: message };
  }
}
