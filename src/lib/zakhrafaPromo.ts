const ARABIC_NAME_PAGE_PREFIXES = [
  "/arabic-calligraphy",
  "/ar/arabic-calligraphy",
  "/arabic-name-mug-v1",
] as const;

export function isArabicNamePage(pathname: string): boolean {
  return ARABIC_NAME_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function shouldShowZakhrafaPromo(
  pathname: string,
  currentLanguage: "ar" | "en"
): boolean {
  return isArabicNamePage(pathname) || currentLanguage === "ar";
}

export function isAndroidUserAgent(userAgent: string): boolean {
  return /Android/i.test(userAgent);
}
