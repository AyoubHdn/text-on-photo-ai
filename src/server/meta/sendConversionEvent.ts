import crypto from "crypto";
import { env } from "~/env.mjs";

export type MetaConversionEventName = "Purchase" | "PhysicalPurchase";

export type MetaConversionInput = {
  eventName: MetaConversionEventName;
  eventId: string;
  value: number;
  currency: string;
  contentType: "credits" | "product";
  contentCategory: "credits" | "physical_product";
  contentIds: string[];
  email?: string | null;
  externalId?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  eventSourceUrl?: string;
  testEventCode?: string | null;
};

export type MetaSendResult =
  | { skipped: true; reason: string }
  | { skipped: false; ok: boolean; status: number; body: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashEmail(email: string) {
  return crypto.createHash("sha256").update(email).digest("hex");
}

function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function sendMetaConversionEvent(
  input: MetaConversionInput,
): Promise<MetaSendResult> {
  if (!env.META_PIXEL_ID || !env.META_ACCESS_TOKEN) {
    return {
      skipped: true,
      reason: "Meta pixel credentials are not configured.",
    };
  }

  const userData: Record<string, string[]> = {};
  if (input.email) {
    const normalized = normalizeEmail(input.email);
    if (normalized) {
      userData.em = [hashEmail(normalized)];
    }
  }
  if (input.externalId) {
    userData.external_id = [hashValue(input.externalId)];
  }
  if (input.fbp) {
    userData.fbp = [input.fbp];
  }
  if (input.fbc) {
    userData.fbc = [input.fbc];
  }
  if (input.clientIpAddress) {
    userData.client_ip_address = [input.clientIpAddress];
  }
  if (input.clientUserAgent) {
    userData.client_user_agent = [input.clientUserAgent];
  }

  const payload: {
    data: Array<{
      event_name: MetaConversionEventName;
      event_time: number;
      event_id: string;
      action_source: "website";
      event_source_url?: string;
      user_data?: Record<string, string[]>;
      custom_data: {
        value: number;
        currency: string;
        content_type: string;
        content_ids: string[];
        content_category: "credits" | "physical_product";
      };
    }>;
    test_event_code?: string;
  } = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        ...(Object.keys(userData).length > 0 ? { user_data: userData } : {}),
        custom_data: {
          value: input.value,
          currency: input.currency,
          content_type: input.contentType,
          content_ids: input.contentIds,
          content_category: input.contentCategory,
        },
      },
    ],
    ...(input.testEventCode ? { test_event_code: input.testEventCode } : {}),
  };

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${env.META_PIXEL_ID}/events?access_token=${env.META_ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  const body = await res.text();
  return {
    skipped: false,
    ok: res.ok,
    status: res.status,
    body,
  };
}

export async function sendMetaPurchaseEvent(
  input: Omit<MetaConversionInput, "eventName" | "contentCategory">,
): Promise<MetaSendResult> {
  return sendMetaConversionEvent({
    ...input,
    eventName: "Purchase",
    contentCategory: input.contentType === "credits" ? "credits" : "physical_product",
  });
}

export async function sendMetaPhysicalPurchaseEvent(
  input: Omit<MetaConversionInput, "eventName" | "contentType" | "contentCategory">,
): Promise<MetaSendResult> {
  return sendMetaConversionEvent({
    ...input,
    eventName: "PhysicalPurchase",
    contentType: "product",
    contentCategory: "physical_product",
  });
}
