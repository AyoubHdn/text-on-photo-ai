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
    "Output requirement: one centered hero composition, print-ready for mug design.",
    "No extra words, logos, signatures, frames, or mockup context.",
    "High readability, clean edges, balanced negative space, premium Ramadan aesthetic.",
    "arabic calligraphy masterpiece, 8k resolution",
  ].join(" ");
}

