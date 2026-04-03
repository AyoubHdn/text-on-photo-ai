import {
  getCoupleNameMugV1Style,
  type CoupleNameMugMode,
  type CoupleNameMugStyleId,
} from "~/config/coupleNameMugV1Style";
import { FULL_BLEED_ARTWORK_PROMPT_RULES } from "~/lib/fullBleedArtworkPromptRules";

const FONT_GUIDANCE_BY_STYLE: Record<CoupleNameMugStyleId, string> = {
  "floral-watercolor":
    "Font direction for floral-watercolor: use elegant romantic bridal calligraphy with smooth thick-thin strokes, graceful feminine curves, medium-to-large readable size, tasteful flourishes, and a premium personalized gift feel. Keep the names refined and clear, not blocky and not serif-heavy.",
  "single-line-art":
    "Font direction for single-line-art: use delicate handwritten wedding-script calligraphy, small-to-medium size, centered neatly below the portrait, airy spacing, refined thin strokes, and a clean custom-wedding keepsake feel. Avoid bold lettering, serif fonts, or oversized names.",
  "funny-caricature":
    "Font direction for funny-caricature style: use playful modern handwritten script or cute brush-lettered calligraphy with friendly curves, lively energy, and strong readability. Keep the names charming and fun, medium readable size, slightly cheeky but still giftable, not luxury serif and not overly ornate.",
  "romantic-storybook-interaction":
    "Font direction for romantic-storybook style: use soft hand-lettered romantic script with a storybook feel, medium readable size, warm flowing curves, and gentle emotional charm. Keep it elegant and readable, not bold serif and not childish.",
};

const FONT_LAYOUT_GUIDANCE_BY_MODE: Record<CoupleNameMugMode, string> = {
  names_only:
    "Typography layout rule for names-only mode: let each name be a meaningful part of the composition, prominent enough to read clearly on the mug, but still balanced with the art around it.",
  avatar_name:
    "Typography layout rule for avatar-name mode: place each name neatly below its corresponding portrait, sized smaller than the portrait but still easy to read on the mug.",
};

export function buildCoupleNameMugWrapPrompt(params: {
  mode: CoupleNameMugMode;
  styleId: CoupleNameMugStyleId;
  herName: string;
  hisName: string;
  centerText?: string | null;
}) {
  const style = getCoupleNameMugV1Style(params.styleId);
  const baseTemplate =
    params.mode === "avatar_name" ? style.avatarPrompt : style.namesOnlyPrompt;
  const herName = params.herName.trim();
  const hisName = params.hisName.trim();
  const centerText = params.centerText?.trim() ?? "";
  const basePrompt = baseTemplate
    .replace(/\[HER_NAME\]/g, herName)
    .replace(/\[HIS_NAME\]/g, hisName);

  return [
    basePrompt,
    `The left visible side name must be exactly '${herName}'.`,
    `The right visible side name must be exactly '${hisName}'.`,
    centerText
      ? `The centered lower text must be exactly ${JSON.stringify(
          centerText,
        )}. Place it in the lower center of the wrap below the two names, smaller than the names, elegant, balanced, and clearly readable.`
      : null,
    params.mode === "avatar_name"
      ? "Use the first reference image for the woman on the left and the second reference image for the man on the right. Preserve identity, face shape, hairstyle direction, skin tone, and recognizable features while stylizing them consistently in a flattering gift-ready way."
      : "Keep both names elegant, highly readable, gift-ready, and visually balanced with matching styling on both sides.",
    centerText
      ? "Typography layout rule for the optional center text: use a smaller complementary line of text centered beneath both names in the lower middle of the wrap, integrated naturally with the chosen style."
      : null,
    FONT_GUIDANCE_BY_STYLE[params.styleId],
    FONT_LAYOUT_GUIDANCE_BY_MODE[params.mode],
    "Create one finished wide printable mug wrap design with two coordinated visible sides and a softer calmer center seam area.",
    centerText
      ? "Place the main personalized artwork inside the left and right visible mug panels, keep the center seam area soft, and reserve the lower center area for the exact optional center text beneath both names."
      : "Place the main personalized artwork inside the left and right visible mug panels, and keep the center seam area decorative, soft, and low-detail.",
    centerText
      ? "Render the names and the optional center text directly inside the artwork instead of leaving empty placeholders."
      : "Render the names directly inside the artwork instead of leaving empty placeholders.",
    ...FULL_BLEED_ARTWORK_PROMPT_RULES,
    params.styleId === "single-line-art"
      ? centerText
        ? "Style-specific constraint for single-line-art: the output must be a flat horizontal rectangular print design file only, never a mug mockup and never a curved product render. Use clean thin black or charcoal outline drawing only on a pure white background, not cream and not beige. Keep the portraits faceless or nearly faceless, minimal, elegant, outline-based, and fully completed. The names must be smaller and more refined, centered neatly below the portraits in delicate handwritten wedding-script calligraphy, not serif, not bold, and not oversized. The optional center text must appear in an even smaller matching script in the lower middle beneath both names. No filled colors, no watercolor, no florals, no gold decoration, no realistic painting, no mug handles, no mug rim, no cylindrical shading, no product shadows, and no unfinished contour lines except extremely subtle line variation."
        : "Style-specific constraint for single-line-art: the output must be a flat horizontal rectangular print design file only, never a mug mockup and never a curved product render. Use clean thin black or charcoal outline drawing only on a pure white background, not cream and not beige. Keep the portraits faceless or nearly faceless, minimal, elegant, outline-based, and fully completed. The names must be smaller and more refined, centered neatly below the portraits in delicate handwritten wedding-script calligraphy, not serif, not bold, and not oversized. No filled colors, no watercolor, no florals, no gold decoration, no realistic painting, no mug handles, no mug rim, no cylindrical shading, no product shadows, and no unfinished contour lines except extremely subtle line variation."
      : params.styleId === "funny-caricature"
      ? "Style-specific constraint for funny-caricature style: make it clearly playful and different from the floral romantic style. Use cute exaggerated avatars or cheeky graphic cues, light comic relationship energy, and clean giftable humor. No marble texture, no gold frame, no luxury wedding styling, and no heavy romantic florals."
      : null,
    centerText
      ? `Critical constraint: no extra letters, no hidden text, no altered spelling, no initials, no extra names, no signature, and no additional text other than the two exact names requested plus the one exact center text ${JSON.stringify(
          centerText,
        )}.`
      : "Critical constraint: no extra letters, no hidden text, no altered spelling, no initials, no extra names, no signature, no quote, no date, no location text, and no additional text other than the two exact names requested.",
    "Critical constraint: do not show any mug, cup, handle, tumbler, product, frame, poster, wall art mockup, packaging, tabletop, hands, or lifestyle photography.",
    "High-quality romantic printable design, flat artwork only, crisp detail, premium gift-ready finish, one cohesive style across the whole wrap.",
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");
}
