/**
 * Bidirectional map between EN and AR page paths.
 * Derived from the physical files under src/pages/ar/.
 * EN key → AR value; AR key → EN value.
 * All other paths have no twin.
 */
export const localeTwins: Record<string, string> = {
  "/arabic-calligraphy": "/ar/arabic-calligraphy",
  "/ar/arabic-calligraphy": "/arabic-calligraphy",
  "/arabic-calligraphy-generator": "/ar/arabic-calligraphy-generator",
  "/ar/arabic-calligraphy-generator": "/arabic-calligraphy-generator",
};

/** Return the twin path for the given locale, or null if none exists. */
export function getTwin(pathname: string, targetLocale: "en" | "ar"): string | null {
  const twin = localeTwins[pathname] ?? null;
  if (!twin) return null;
  const twinIsAr = twin.startsWith("/ar/");
  if (targetLocale === "ar" && twinIsAr) return twin;
  if (targetLocale === "en" && !twinIsAr) return twin;
  return null;
}
