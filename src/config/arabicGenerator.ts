export const ARABIC_GENERATOR_SOURCE_PAGE = "arabic-calligraphy-generator";
export const ARABIC_GENERATOR_SOURCE_PAGES = [
  ARABIC_GENERATOR_SOURCE_PAGE,
  "arabic-name-mug-v1",
] as const;

export const ARABIC_GENERATOR_TIERS = [
  {
    id: "standard",
    label: "Standard Arabic",
    labelAr: "عربي قياسي",
    description: "Faster and more affordable Arabic generation",
    descAr: "إنشاء عربي أسرع وأوفر",
    model: "google/nano-banana-2",
    credits: 3,
    premium: false,
  },
  {
    id: "premium",
    label: "Premium Arabic",
    labelAr: "عربي متميّز",
    description: "Higher quality Arabic details and refinement",
    descAr: "تفاصيل عربية أدق وجودة أعلى",
    model: "google/nano-banana-pro",
    credits: 6,
    premium: true,
  },
] as const;

export type ArabicGeneratorTier = (typeof ARABIC_GENERATOR_TIERS)[number];
export type ArabicGeneratorModel = ArabicGeneratorTier["model"];

export function isArabicGeneratorSourcePage(
  sourcePage: string | null | undefined,
): boolean {
  const normalizedSourcePage = (sourcePage ?? "").trim().toLowerCase();
  return ARABIC_GENERATOR_SOURCE_PAGES.some((page) => page === normalizedSourcePage);
}

export function getArabicTierByModel(
  model: string | null | undefined,
): ArabicGeneratorTier | null {
  return (
    ARABIC_GENERATOR_TIERS.find((tier) => tier.model === model) ?? null
  );
}
