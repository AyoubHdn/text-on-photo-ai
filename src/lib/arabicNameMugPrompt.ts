export type ArabicNameMugGiftIntent =
  | "Me"
  | "My Husband"
  | "My Wife"
  | "My Mom"
  | "Someone Special";

const ARABIC_CHAR_REGEX = /[\u0600-\u06FF]/;

const GIFT_INTENT_TONE: Record<ArabicNameMugGiftIntent, string> = {
  Me: "confident personal identity piece, self-expression focus",
  "My Husband": "thoughtful masculine gift mood, warm and elegant",
  "My Wife": "beautiful romantic gift mood, graceful and elegant",
  "My Mom": "meaningful heartfelt family gift mood, warm and loving",
  "Someone Special": "emotionally warm premium gift mood",
};

export function buildArabicNameMugPrompt(params: {
  name: string;
  giftIntent: ArabicNameMugGiftIntent;
  stylePrompt: string;
}) {
  const cleanedName = params.name.trim();
  const isArabicInput = ARABIC_CHAR_REGEX.test(cleanedName);
  const base = params.stylePrompt.replace(/'Text'/gi, `'${cleanedName}'`);
  const languageRule = isArabicInput
    ? "Preserve the exact Arabic spelling of the provided name without modifications."
    : "Render the provided name as elegant Arabic calligraphy while preserving pronunciation.";

  return [
    base,
    languageRule,
    `Art direction: ${GIFT_INTENT_TONE[params.giftIntent]}.`,
    "Output requirement: a flat 2D printable artwork only, one centered hero composition, square composition, print-ready for transfer onto a mug.",
    "Critical background constraint: avoid plain white, empty studio, blank paper, or mockup presentation backgrounds; always use a rich full-bleed artistic background integrated into the design.",
    "Critical constraint: do not show any mug, cup, handle, tumbler, plate, product, mockup, packaging, label, print preview, tabletop, room, hands, lifestyle scene, camera framing, or photography setup.",
    "Critical constraint: the result must be only the design artwork itself, not the design applied onto an object.",
    "No extra words, logos, signatures, frames, borders, mockup context, presentation context, or image-inside-image layout.",
    "High readability, clean edges, balanced negative space, premium Arabic calligraphy aesthetic, isolated artwork, design-only, 8k resolution.",
  ].join(" ");
}
