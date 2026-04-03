export type CoupleNameMugMode = "names_only" | "avatar_name";

export type CoupleNameMugStyleId =
  | "floral-watercolor"
  | "funny-caricature"
  | "single-line-art"
  | "romantic-storybook-interaction";

type LegacyCoupleNameMugStyleId = CoupleNameMugStyleId | "marble-gold";

export type CoupleNameMugV1Style = {
  id: CoupleNameMugStyleId;
  name: string;
  previewSrc: string;
  blurb: string;
  namesOnlyPrompt: string;
  avatarPrompt: string;
};

export const COUPLE_NAME_MUG_V1_STYLES: CoupleNameMugV1Style[] = [
  {
    id: "floral-watercolor",
    name: "Soft Watercolor Floral Portrait",
    previewSrc: "/styles/couples/couple-avatar-name-mug-v1/floral-watercolor.webp",
    blurb: "Soft blush florals and flattering romantic portrait styling for wife and girlfriend gifts.",
    namesOnlyPrompt:
      "Create a wide premium romantic mug wrap in a best-selling soft watercolor floral gift style. The left visible side features the exact name '[HER_NAME]' in elegant highly readable decorative script integrated naturally into a flattering blush watercolor floral composition. The right visible side features the exact name '[HIS_NAME]' in the same matching lettering and the same matching floral styling. Use a creamy ivory background, blush peonies, soft pink garden roses, delicate leaves, faint warm beige shadows, subtle fine gold details, feminine premium keepsake energy, polished Etsy-style gift appeal, balanced spacing, highly readable names, flat printable artwork only.",
    avatarPrompt:
      "Using the supplied reference photos, create a wide premium romantic mug wrap in a soft watercolor floral portrait gift style. The first reference image becomes a flattering illustrated female avatar on the left visible side with the exact name '[HER_NAME]' clearly written below. The second reference image becomes a flattering illustrated male avatar on the right visible side with the exact name '[HIS_NAME]' clearly written below. Use soft blush watercolor florals, creamy ivory background, peonies, roses, delicate leaves, faint warm beige shadows, subtle fine gold details, emotionally warm gift-ready composition for wife or girlfriend buyers, coordinated art direction, recognizable faces, flat printable artwork only.",
  },
  {
    id: "single-line-art",
    name: "Minimal Line-Art Portrait",
    previewSrc: "/styles/couples/couple-avatar-name-mug-v1/single-line-art.webp",
    blurb: "Clean elegant line art with a premium wedding and anniversary feel.",
    namesOnlyPrompt:
      "Create a flat wide rectangular print artwork file for a premium minimalist couple mug, not a product mockup. Use a true wedding-style single-line outline aesthetic. The left visible side shows the exact name '[HER_NAME]' in a small elegant handwritten wedding script placed neatly below a completed minimal continuous-line romantic outline drawing. The right visible side shows the exact name '[HIS_NAME]' in the same small handwritten wedding script placed neatly below a matching completed minimal continuous-line outline drawing. Use a pure white background with no cream cast, thin black or deep charcoal line work, faceless or near-faceless minimalist contour style, almost no decoration, no florals, no gold frame, no watercolor texture, no colored fills, no shading, no 3D effects, no painterly rendering, generous negative space, premium wedding and anniversary keepsake aesthetic. The line art must feel finished and self-contained with no stray continuation lines, no incomplete outlines, and no cut-off mug edges or handles. Flat printable design only.",
    avatarPrompt:
      "Using the supplied reference photos, create a flat wide rectangular print artwork file for a premium minimalist couple mug, not a product mockup. It should look like custom photo-to-line-art portrait art often used on wedding and anniversary mugs. Convert the first reference image into a clean elegant female single-line or continuous-outline portrait on the left visible side with the exact name '[HER_NAME]' placed small and neatly below in delicate handwritten wedding script. Convert the second reference image into a clean elegant male single-line or continuous-outline portrait on the right visible side with the exact name '[HIS_NAME]' placed small and neatly below in the same script. Use a pure white background with no cream or beige tint, thin black or deep charcoal contour lines, simplified faceless or near-faceless line-art treatment, minimal facial detail, no color fills, no skin coloring, no watercolor, no florals, no gold frame, no textured painting, no cartoon coloring, no shading, no realistic photo rendering, premium wedding and anniversary keepsake mood, recognizable silhouette and pose feeling. The portraits must be fully completed and self-contained with no floating strokes, no decorative ribbons, no unfinished lower body lines, and no mug edges, handles, rim, shadows, or curved product surface. Flat printable artwork only.",
  },
  {
    id: "funny-caricature",
    name: "Funny Caricature Couple Wrap",
    previewSrc: "/styles/couples/couple-avatar-name-mug-v1/funny-caricature.webp",
    blurb: "Cute exaggerated couple energy with playful chemistry and shareable gift appeal.",
    namesOnlyPrompt:
      "Create a wide playful couple mug wrap in a funny caricature gift style, not a romantic floral style. The left visible side shows the exact name '[HER_NAME]' in a cute stylish readable hand-lettered script integrated with playful comic-style accents. The right visible side shows the exact name '[HIS_NAME]' in the same coordinated hand-lettered style. Use a clean light pastel or warm cream background, cheerful balanced composition, tiny humorous interaction cues such as coffee cups, hearts, stars, motion lines, blanket, fries, or remote-inspired doodles, and a light comic relationship vibe. The overall feeling should be cute, cheeky, personalized, and giftable for boyfriend-girlfriend or husband-wife shoppers. No quote text, names are the only text, flat printable design only.",
    avatarPrompt:
      "Using the supplied reference photos, create a wide funny caricature couple mug wrap with strong commercial gift appeal. Turn the first reference image into a cute exaggerated female avatar on the left visible side with the exact name '[HER_NAME]' below. Turn the second reference image into a cute exaggerated male avatar on the right visible side with the exact name '[HIS_NAME]' below. Use playful expressions, slightly exaggerated but flattering features, light comic energy, clean pastel or warm background, tiny humorous relationship cues such as coffee, hearts, motion lines, playful push-pull chemistry, or micro-scene props. The result should feel fun, personalized, cheeky, and shareable while keeping both faces recognizable. No extra text other than the two names, flat printable design only.",
  },
  {
    id: "romantic-storybook-interaction",
    name: "Romantic Storybook Interaction",
    previewSrc: "/styles/couples/couple-avatar-name-mug-v1/romantic-storybook-interaction.webp",
    blurb: "A soft storybook couple scene with a tender emotional connection.",
    namesOnlyPrompt:
      "Create a wide romantic storybook mug wrap with a tender emotional couple mood. The left visible side features the exact name '[HER_NAME]' in elegant readable lettering and the right visible side features the exact name '[HIS_NAME]' in matching lettering. Build a soft illustrated romantic scene that feels like a sweet memory, with dreamy garden or twilight storybook atmosphere, gentle painterly textures, warm blush and cream palette, subtle florals or lantern glow, emotional premium gift feeling, highly readable names, flat printable artwork only.",
    avatarPrompt:
      "Using the supplied reference photos, create a wide romantic storybook mug wrap where both illustrated characters feel part of one shared memory scene. The first reference image becomes a warm flattering female avatar on the left visible side with the exact name '[HER_NAME]' below. The second reference image becomes a warm flattering male avatar on the right visible side with the exact name '[HIS_NAME]' below. Show soft interaction energy such as leaning toward each other, gentle hand-holding, shoulder-to-shoulder closeness, or a subtle hug feeling without dramatic poses. Use dreamy painterly textures, warm blush and cream palette, romantic garden or twilight storybook atmosphere, emotionally rich gift mood, recognizable faces, flat printable artwork only.",
  },
];

export const DEFAULT_COUPLE_NAME_MUG_V1_STYLE_ID: CoupleNameMugStyleId =
  "floral-watercolor";

function normalizeCoupleNameMugStyleId(
  styleId: LegacyCoupleNameMugStyleId,
): CoupleNameMugStyleId {
  if (styleId === "marble-gold") {
    return "funny-caricature";
  }

  return styleId;
}

export function getCoupleNameMugV1Style(styleId: LegacyCoupleNameMugStyleId) {
  const normalizedStyleId = normalizeCoupleNameMugStyleId(styleId);
  const style =
    COUPLE_NAME_MUG_V1_STYLES.find((entry) => entry.id === normalizedStyleId) ??
    COUPLE_NAME_MUG_V1_STYLES[0];

  if (!style) {
    throw new Error("Couple mug styles are not configured.");
  }

  return style;
}
