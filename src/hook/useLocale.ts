import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import {
  persistExplicitLocale,
  readExplicitLocale,
} from "~/lib/localePreference";

export type Locale = "ar" | "en";

export type UseLocaleResult = {
  locale: Locale;
  isArabic: boolean;
  isExplicit: boolean;
  dir: "rtl" | "ltr";
};

export function useLocale(): UseLocaleResult {
  const router = useRouter();

  // (1) /ar/* path is authoritative — available on both server and client.
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

  const [storedExplicitLocale, setStoredExplicitLocale] = useState<Locale | null>(null);

  useEffect(() => {
    const explicitRouteLocale = pathIsArabic ? "ar" : queryLang;

    if (explicitRouteLocale) {
      persistExplicitLocale(explicitRouteLocale);
    }
    setStoredExplicitLocale(readExplicitLocale());
  }, [pathIsArabic, queryLang, router.asPath]);

  // (3) A previously selected locale is used after the URL has no explicit value.
  const locale: Locale = pathIsArabic
    ? "ar"
    : (queryLang ?? storedExplicitLocale ?? "en");
  const isExplicit = Boolean(pathIsArabic || queryLang || storedExplicitLocale);

  return {
    locale,
    isArabic: locale === "ar",
    isExplicit,
    dir: locale === "ar" ? "rtl" : "ltr",
  };
}
