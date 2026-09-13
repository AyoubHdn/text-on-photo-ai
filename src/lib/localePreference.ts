import type { Locale } from "~/hook/useLocale";

export const EXPLICIT_LOCALE_COOKIE = "namedesignai_explicit_locale";

export function normalizeMauticLocale(
  value: string | null | undefined
): "ar" | "en" {
  const primaryLanguage = (value ?? "")
    .trim()
    .replace(/_/g, "-")
    .split("-", 1)[0]
    ?.toLowerCase();

  return primaryLanguage === "ar" ? "ar" : "en";
}

export function persistExplicitLocale(locale: Locale): void {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${EXPLICIT_LOCALE_COOKIE}=${locale}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
}

export function readExplicitLocale(): Locale | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${EXPLICIT_LOCALE_COOKIE}=`));
  const value = cookie?.split("=", 2)[1];

  return value === "ar" || value === "en" ? value : null;
}
