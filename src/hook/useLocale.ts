import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export type Locale = "ar" | "en";

export type UseLocaleResult = {
  locale: Locale;
  isArabic: boolean;
  dir: "rtl" | "ltr";
};

function readLangCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const part of cookies) {
    const [k, ...rest] = part.split("=");
    if (k === "lang") {
      const v = decodeURIComponent(rest.join("="));
      if (v === "ar" || v === "en") return v;
    }
  }
  return null;
}

export function useLocale(): UseLocaleResult {
  const router = useRouter();

  // (a) route prefix is authoritative — safe on both server and client
  const pathIsArabic = router.pathname.startsWith("/ar/") || router.pathname === "/ar";

  // (b) cookie — read only after mount to avoid SSR/client hydration mismatch.
  //     Start null (= same as server) and update once the browser is ready.
  const [cookieLocale, setCookieLocale] = useState<Locale | null>(null);
  useEffect(() => {
    setCookieLocale(readLangCookie());
  }, []);

  let locale: Locale;
  if (pathIsArabic) {
    locale = "ar";
  } else {
    // (c) default English until cookie is known
    locale = cookieLocale ?? "en";
  }

  return {
    locale,
    isArabic: locale === "ar",
    dir: locale === "ar" ? "rtl" : "ltr",
  };
}
