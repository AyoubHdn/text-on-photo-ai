export type CreditPurchaseTrackingPayload = {
  plan?: "starter" | "pro" | "elite";
  context?: string;
  source_page?: string;
  funnel?: string;
  product_type?: string;
  niche?: string | null;
  traffic_type?: "paid" | "organic";
  country?: string | null;
  credits?: number;
  value?: number;
  session_id?: string | null;
};

const PENDING_PURCHASE_KEY = "last_credit_purchase";
const LEGACY_COMPLETION_KEY = "ga4_purchase_credits";

function getStorage(kind: "local" | "session"): Storage | null {
  if (typeof window === "undefined") return null;
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

function readFromStorage(key: string): string | null {
  return (
    getStorage("session")?.getItem(key) ??
    getStorage("local")?.getItem(key) ??
    null
  );
}

function writeToStorages(key: string, value: string) {
  getStorage("session")?.setItem(key, value);
  getStorage("local")?.setItem(key, value);
}

function removeFromStorages(key: string) {
  getStorage("session")?.removeItem(key);
  getStorage("local")?.removeItem(key);
}

export function storePendingCreditPurchase(
  payload: CreditPurchaseTrackingPayload,
) {
  writeToStorages(PENDING_PURCHASE_KEY, JSON.stringify(payload));
}

export function readPendingCreditPurchase(): CreditPurchaseTrackingPayload | null {
  const raw = readFromStorage(PENDING_PURCHASE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CreditPurchaseTrackingPayload;
  } catch {
    return null;
  }
}

export function clearPendingCreditPurchase() {
  removeFromStorages(PENDING_PURCHASE_KEY);
}

export function getCreditPurchaseCompletionKey(sessionId?: string | null) {
  return sessionId
    ? `${LEGACY_COMPLETION_KEY}:${sessionId}`
    : LEGACY_COMPLETION_KEY;
}

export function hasTrackedCreditPurchaseCompletion(sessionId?: string | null) {
  const completionKey = getCreditPurchaseCompletionKey(sessionId);
  return readFromStorage(completionKey) === "1";
}

export function markTrackedCreditPurchaseCompletion(sessionId?: string | null) {
  const completionKey = getCreditPurchaseCompletionKey(sessionId);
  writeToStorages(completionKey, "1");
}
