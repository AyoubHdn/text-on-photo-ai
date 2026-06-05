const ADSENSE_EXCLUDED_PATHS = new Set([
  "/collection",
  "/buy-credits",
  "/checkout",
  "/success",
  "/cancel",
  "/order/success",
  "/order/cancel",
  "/unlock/free-credit",
  "/unlock/result",
  "/name-art-generator",
  "/couples-name-art-generator",
  "/arabic-calligraphy-generator",
  "/ar/arabic-calligraphy-generator",
  "/community",
  "/name-art",
]);

const ADSENSE_EXCLUDED_PREFIXES = [
  "/api/",
  "/track/",
];

export function getAdSenseClientId() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  return clientId && clientId.startsWith("ca-pub-") ? clientId : undefined;
}

export function getAdSenseContentSlotId() {
  return process.env.NEXT_PUBLIC_ADSENSE_CONTENT_SLOT_ID?.trim() || undefined;
}

export function shouldShowAdSenseForPath(pathname: string, isPaidTrafficUser = false) {
  if (isPaidTrafficUser) return false;
  if (ADSENSE_EXCLUDED_PATHS.has(pathname)) return false;
  return !ADSENSE_EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
