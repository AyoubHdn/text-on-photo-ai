export const ARABIC_GENERATOR_SOURCE_PAGE = "arabic-name-art-generator";

export const ARABIC_GENERATOR_TIERS = [
  {
    id: "standard",
    label: "Standard Arabic",
    description: "Faster and more affordable Arabic generation",
    model: "google/nano-banana-2",
    credits: 3,
    premium: false,
  },
  {
    id: "premium",
    label: "Premium Arabic",
    description: "Higher quality Arabic details and refinement",
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
  return (sourcePage ?? "").trim().toLowerCase() === ARABIC_GENERATOR_SOURCE_PAGE;
}

export function getArabicTierByModel(
  model: string | null | undefined,
): ArabicGeneratorTier | null {
  return (
    ARABIC_GENERATOR_TIERS.find((tier) => tier.model === model) ?? null
  );
}
