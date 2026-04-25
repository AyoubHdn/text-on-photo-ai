import { arabicStylesData } from "~/data/arabicStylesData";
import { coupleStylesData } from "~/data/coupleStylesData";
import { stylesData } from "~/data/stylesData";
import { getStyleContent, type StyleContent } from "~/data/styleContent";
import { popularNames } from "~/lib/names";
import { getEnhancedNameArtSrc, getStyleImageAlt } from "~/lib/styleImageAlt";

export type StyleSubPage = {
  slug: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  sampleImages: string[];
  count: number;
  content: StyleContent;
};

export type StyleGroupPage = {
  slug: string;
  title: string;
  description: string;
  items: StyleSubPage[];
};

type CatalogStyleEntry = {
  src: string;
  altText?: string;
  name?: string;
  basePrompt?: string;
  allowCustomColors?: boolean;
};

type CatalogStylesData = Record<string, Record<string, CatalogStyleEntry[]>>;
type StyleContentGetter = (slug: string) => StyleContent;

type OptionalStyleContentModule = {
  getArabicStyleContent?: StyleContentGetter;
  getCoupleStyleContent?: StyleContentGetter;
};

type WebpackRequireContext = {
  keys: () => string[];
  <TModule>(id: string): TModule;
};

type WebpackRequire = NodeRequire & {
  context?: (
    directory: string,
    useSubdirectories: boolean,
    regExp: RegExp,
  ) => WebpackRequireContext;
};

const EMPTY_STYLE_CONTENT: StyleContent = {};
const getEmptyStyleContent: StyleContentGetter = () => EMPTY_STYLE_CONTENT;

const optionalStyleContentContext = (require as WebpackRequire).context!(
  "../data",
  false,
  /^\.\/(?:arabicStyleContent|coupleStyleContent)\.ts$/,
);

function getOptionalContentGetter(
  moduleKey: "./arabicStyleContent.ts" | "./coupleStyleContent.ts",
  exportName: keyof OptionalStyleContentModule,
): StyleContentGetter {
  if (!optionalStyleContentContext?.keys().includes(moduleKey)) {
    return getEmptyStyleContent;
  }

  try {
    const contentModule =
      optionalStyleContentContext<OptionalStyleContentModule>(moduleKey);
    const contentGetter = contentModule[exportName];

    return typeof contentGetter === "function"
      ? contentGetter
      : getEmptyStyleContent;
  } catch {
    return getEmptyStyleContent;
  }
}

const getArabicStyleContent = getOptionalContentGetter(
  "./arabicStyleContent.ts",
  "getArabicStyleContent",
);
const getCoupleStyleContent = getOptionalContentGetter(
  "./coupleStyleContent.ts",
  "getCoupleStyleContent",
);

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildNameArtStyleGroups(): StyleGroupPage[] {
  return Object.entries(stylesData).map(([groupTitle, substyles]) => ({
    slug: slugify(groupTitle),
    title: groupTitle,
    description: `${groupTitle} name art styles grouped by design direction and visual mood.`,
    items: Object.entries(substyles).map(([substyleTitle, entries]) => {
      const slug = slugify(substyleTitle);
      const description =
        substyleTitle === "Logos"
          ? "Personal name logos and monogram-style designs - make your name look like an emblem."
          : `Explore ${substyleTitle.toLowerCase()} name art styles for decor, gifts, keepsakes, and personalized products.`;

      return {
        slug,
        title: substyleTitle,
        description,
        imageSrc: getEnhancedNameArtSrc(entries[0]?.src ?? "/banner.webp"),
        imageAlt: getStyleImageAlt(entries[0]?.src ?? "/banner.webp", {
          kind: "name",
          title: substyleTitle,
          fallbackAlt: `${substyleTitle} name art style example`,
        }),
        sampleImages: entries
          .slice(0, 12)
          .map((entry) => getEnhancedNameArtSrc(entry.src)),
        count: entries.length,
        content: getStyleContent(slug),
      };
    }),
  }));
}

function buildCatalogStyleGroups({
  data,
  kind,
  groupDescription,
  itemDescription,
  fallbackAlt,
  contentGetter,
}: {
  data: CatalogStylesData;
  kind: "arabic" | "couple";
  groupDescription: (groupTitle: string) => string;
  itemDescription: (substyleTitle: string) => string;
  fallbackAlt: (substyleTitle: string) => string;
  contentGetter: StyleContentGetter;
}): StyleGroupPage[] {
  return Object.entries(data).map(([groupTitle, substyles]) => ({
    slug: slugify(groupTitle),
    title: groupTitle,
    description: groupDescription(groupTitle),
    items: Object.entries(substyles).map(([substyleTitle, entries]) => {
      const slug = slugify(substyleTitle);
      const imageSrc = entries[0]?.src ?? "/banner.webp";

      return {
        slug,
        title: substyleTitle,
        description: itemDescription(substyleTitle),
        imageSrc,
        imageAlt: getStyleImageAlt(imageSrc, {
          kind,
          title: substyleTitle,
          fallbackAlt: fallbackAlt(substyleTitle),
        }),
        sampleImages: entries.slice(0, 12).map((entry) => entry.src),
        count: entries.length,
        content: contentGetter(slug),
      };
    }),
  }));
}

export const NAME_ART_STYLE_GROUPS = buildNameArtStyleGroups();
export const COUPLES_STYLE_GROUPS = buildCatalogStyleGroups({
  data: coupleStylesData,
  kind: "couple",
  groupDescription: (groupTitle) =>
    `${groupTitle} couple name art styles for keepsakes, decor, and gifts.`,
  itemDescription: (substyleTitle) =>
    `${substyleTitle} couple name art style for keepsakes, decor, and romantic gifts.`,
  fallbackAlt: (substyleTitle) =>
    `${substyleTitle} couple name art style example`,
  contentGetter: getCoupleStyleContent,
});
export const ARABIC_STYLE_GROUPS = buildCatalogStyleGroups({
  data: arabicStylesData,
  kind: "arabic",
  groupDescription: (groupTitle) =>
    `${groupTitle} Arabic name art styles for decor, branding, gifts, and keepsakes.`,
  itemDescription: (substyleTitle) =>
    `${substyleTitle} Arabic name art style for decor, branding, gifts, and keepsakes.`,
  fallbackAlt: (substyleTitle) =>
    `${substyleTitle} Arabic calligraphy example`,
  contentGetter: getArabicStyleContent,
});

function flattenGroups(groups: StyleGroupPage[]) {
  return groups.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      groupSlug: group.slug,
      groupTitle: group.title,
    })),
  );
}

export const NAME_ART_STYLE_ITEMS = flattenGroups(NAME_ART_STYLE_GROUPS);
export const COUPLES_STYLE_ITEMS = flattenGroups(COUPLES_STYLE_GROUPS);
export const ARABIC_STYLE_ITEMS = flattenGroups(ARABIC_STYLE_GROUPS);

export function getNameArtStyleBySlug(slug: string) {
  return NAME_ART_STYLE_ITEMS.find((item) => item.slug === slug) ?? null;
}

export function getStyleEntry(slug: string) {
  return getNameArtStyleBySlug(slug);
}

export function getCouplesStyleBySlug(slug: string) {
  return COUPLES_STYLE_ITEMS.find((item) => item.slug === slug) ?? null;
}

export function getArabicStyleBySlug(slug: string) {
  return ARABIC_STYLE_ITEMS.find((item) => item.slug === slug) ?? null;
}

export function getNamesForStyle(styleTitle: string, limit = 12) {
  return popularNames
    .filter(
      (item) =>
        item.niches.includes(styleTitle) ||
        item.otherStyles.includes(styleTitle),
    )
    .slice(0, limit)
    .map((item) => ({
      name: item.name,
      path: `/name-art/${item.name.toLowerCase()}`,
      niches: item.niches,
    }));
}

export function slugifyStyleName(value: string) {
  return slugify(value);
}
