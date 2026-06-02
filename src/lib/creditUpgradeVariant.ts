import {
  CREDIT_UPGRADE_EXPERIMENT,
  type CreditUpgradeVariant,
} from "~/config/creditUpgradeExperiment";

const VALID_VARIANTS: CreditUpgradeVariant[] = ["A", "B"];

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const part of cookies) {
    const [key, ...rest] = part.split("=");
    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeDays: number) {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function isCreditUpgradeVariant(value: string | null): value is CreditUpgradeVariant {
  return value === "A" || value === "B";
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash;
}

export function getStoredCreditUpgradeVariant(): CreditUpgradeVariant | null {
  const cookieValue = readCookie(CREDIT_UPGRADE_EXPERIMENT.cookieName);
  return isCreditUpgradeVariant(cookieValue) ? cookieValue : null;
}

export function getCreditUpgradeVariantForUserId(userId: string): CreditUpgradeVariant {
  const index = Math.abs(hashString(userId)) % VALID_VARIANTS.length;
  return VALID_VARIANTS[index] ?? "A";
}

export function resolveCreditUpgradeVariant(
  userId?: string | null,
): CreditUpgradeVariant {
  const maxAgeDays = CREDIT_UPGRADE_EXPERIMENT.cookieMaxAgeDays;

  if (userId) {
    const derived = getCreditUpgradeVariantForUserId(userId);
    writeCookie(CREDIT_UPGRADE_EXPERIMENT.cookieName, derived, maxAgeDays);
    return derived;
  }

  const stored = getStoredCreditUpgradeVariant();
  if (stored) {
    return stored;
  }

  const fallback: CreditUpgradeVariant = Math.random() < 0.5 ? "A" : "B";
  writeCookie(CREDIT_UPGRADE_EXPERIMENT.cookieName, fallback, maxAgeDays);
  return fallback;
}
