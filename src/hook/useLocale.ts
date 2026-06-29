import { useRouter } from "next/router";

export type Locale = "ar" | "en";

export type UseLocaleResult = {
  locale: Locale;
  isArabic: boolean;
  dir: "rtl" | "ltr";
};

export function useLocale(): UseLocaleResult {
  const router = useRouter();

  // (1) /ar/* path is authoritative — available on both server and client
  const pathIsArabic = router.pathname.startsWith("/ar/") || router.pathname === "/ar";

  // (2) ?lang=ar param — read only after router hydrates (router.isReady).
  //     Before hydration, both SSR and first client render see null → "en",
  //     so there is no SSR/client tree mismatch.
  const queryLang: Locale | null = router.isReady
    ? router.query.lang === "ar"
      ? "ar"
      : router.query.lang === "en"
      ? "en"
      : null
    : null;

  // (3) Default English — cookie is never consulted here.
  const locale: Locale = pathIsArabic ? "ar" : (queryLang ?? "en");

  return {
    locale,
    isArabic: locale === "ar",
    dir: locale === "ar" ? "rtl" : "ltr",
  };
}
