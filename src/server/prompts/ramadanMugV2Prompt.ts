type Recipient =
  | "My Husband"
  | "My Wife"
  | "My Father"
  | "My Mother"
  | "Someone Special";

const ARABIC_CHAR_REGEX = /[\u0600-\u06FF]/;

const RECIPIENT_TONE: Record<Recipient, string> = {
  "My Husband": "warm masculine elegance, heartfelt gift mood",
  "My Wife": "romantic feminine elegance, heartfelt gift mood",
  "My Father": "respectful noble tone, dignified family tribute",
  "My Mother": "tender graceful tone, loving family tribute",
  "Someone Special": "romantic premium gift mood, emotionally warm tone",
};

export function buildRamadanMugV2Prompt(params: {
  name: string;
  recipient: Recipient;
  stylePrompt: string;
}) {
  const cleanedName = params.name.trim();
  const isArabicInput = ARABIC_CHAR_REGEX.test(cleanedName);
  const tone = RECIPIENT_TONE[params.recipient];
  const base = params.stylePrompt.replace(/'Text'/gi, `'${cleanedName}'`);
  const languageRule = isArabicInput
    ? "Preserve the exact Arabic spelling of the provided name without modifications."
    : "Render the provided name as elegant Arabic calligraphy while preserving pronunciation.";

  return [
    base,
    languageRule,
    `Art direction: ${tone}.`,
    "Output requirement: a flat 2D printable artwork only, one centered hero composition, square composition, print-ready for transfer onto a mug.",
    "Critical constraint: do not show any mug, cup, handle, tumbler, plate, product, product mockup, packaging, label, print preview, tabletop, room, candle, dates, hands, lifestyle scene, camera framing, photography setup, or any physical object.",
    "Critical constraint: the result must be only the design artwork itself, not the design applied onto an object.",
    "No extra words, logos, signatures, frames, borders, mockup context, presentation context, or image-inside-image layout.",
    "Flat graphic design only, not product photography, not a 3D render of an object, not an embossed mug, not a printed cup scene.",
    "High readability, clean edges, balanced negative space, premium Ramadan aesthetic, isolated artwork, design-only.",
    "arabic calligraphy masterpiece, flat 2D artwork, 8k resolution",
  ].join(" ");
}
