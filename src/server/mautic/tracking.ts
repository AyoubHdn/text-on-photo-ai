import { env } from "~/env.mjs";

type TrackingLinkInput = {
  orderNumber: string;
  trackingUrl?: string | null;
  trackingNumber?: string | null;
};

function getBaseUrl() {
  return env.NEXTAUTH_URL.replace(/\/+$/, "");
}

export function resolveTransactionalTrackingUrl(input: TrackingLinkInput) {
  const directTrackingUrl = input.trackingUrl?.trim();
  if (directTrackingUrl) return directTrackingUrl;

  const trackingNumber = input.trackingNumber?.trim();
  if (!trackingNumber) return "";

  return `${getBaseUrl()}/track/${encodeURIComponent(input.orderNumber)}`;
}

