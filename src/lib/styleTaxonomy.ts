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

type TaggedStyleItem = {
  src: string;
  title: string;
  tags: string[];
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toSentenceList(values: string[]) {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function buildNameArtStyleGroups(): StyleGroupPage[] {
  return Object.entries(stylesData).map(([groupTitle, substyles]) => ({
    slug: slugify(groupTitle),
    title: groupTitle,
    description: `${groupTitle} name art styles grouped by design direction and visual mood.`,
    items: Object.entries(substyles).map(([substyleTitle, entries]) => {
      const slug = slugify(substyleTitle);

      return {
        slug,
        title: substyleTitle,
        description: `Explore ${substyleTitle.toLowerCase()} name art styles for decor, gifts, keepsakes, and personalized products.`,
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

const coupleStyleTabs = [
  { key: "romantic", name: "Romantic and Classic" },
  { key: "modern", name: "Modern and Minimalist" },
  { key: "playful", name: "Playful and Fun" },
];

const coupleStyleItems: TaggedStyleItem[] = [
  { src: "/styles/couples/c012e.webp", title: "Vintage Love Letter", tags: ["romantic"] },
  { src: "/styles/couples/c002e.webp", title: "Floral Watercolor", tags: ["romantic"] },
  { src: "/styles/couples/c008e.webp", title: "Elegant Calligraphy Heart", tags: ["romantic"] },
  { src: "/styles/couples/c016e.webp", title: "Starlight Silhouettes", tags: ["romantic"] },
  { src: "/styles/couples/c018e.webp", title: "Clean Sans-Serif", tags: ["modern"] },
  { src: "/styles/couples/c019e.webp", title: "Single Line Art", tags: ["modern"] },
  { src: "/styles/couples/c024e.webp", title: "Abstract Watercolor", tags: ["modern", "playful"] },
  { src: "/styles/couples/c020e.webp", title: "Marble & Gold", tags: ["modern", "romantic"] },
  { src: "/styles/couples/c028e.webp", title: "Kawaii Characters", tags: ["playful"] },
  { src: "/styles/couples/c030e.webp", title: "Pixel Art Robots", tags: ["playful"] },
  { src: "/styles/couples/c033e.webp", title: "Cat Lovers", tags: ["playful", "modern"] },
  { src: "/styles/couples/c032e.webp", title: "Comic Pop Art", tags: ["playful"] },
];

function buildTaggedGroups(
  tabs: Array<{ key: string; name: string }>,
  items: TaggedStyleItem[],
  baseDescription: string,
) {
  return tabs.map((tab) => {
    const groupItems = items.filter((item) => item.tags.includes(tab.key));
    return {
      slug: slugify(tab.key),
      title: tab.name,
      description: `${tab.name} ${baseDescription}`,
      items: groupItems.map((item) => ({
        slug: slugify(item.title),
        title: item.title,
        description: `${item.title} style with a ${toSentenceList(item.tags)} direction.`,
        imageSrc: item.src,
        imageAlt: getStyleImageAlt(item.src, {
          kind: "couple",
          title: item.title,
          fallbackAlt: `${item.title} couple name art style example`,
        }),
        sampleImages: [item.src],
        count: 1,
        content: {},
      })),
    } satisfies StyleGroupPage;
  });
}

const arabicStyleItems: TaggedStyleItem[] = [
  { src: "/styles/arabic/thuluth-gold.webp", title: "Golden Thuluth", tags: ["calligraphy"] },
  { src: "/styles/arabic/wireframe.webp", title: "Wireframe", tags: ["modern"] },
  { src: "/styles/arabic/diwani-ink.webp", title: "Royal Diwani", tags: ["calligraphy"] },
  { src: "/styles/arabic/gold-3d.webp", title: "3D Gold Luxury", tags: ["luxury"] },
  { src: "/styles/arabic/smoke-art.webp", title: "Mystical Smoke", tags: ["experimental"] },
  { src: "/styles/arabic/sand-desert.webp", title: "Desert Sand", tags: ["regional"] },
  { src: "/styles/arabic/diamond.webp", title: "Diamond Encrusted", tags: ["luxury"] },
  { src: "/styles/arabic/kufic-geo.webp", title: "Geometric Kufic", tags: ["calligraphy", "modern"] },
];

export const NAME_ART_STYLE_GROUPS = buildNameArtStyleGroups();
export const COUPLES_STYLE_GROUPS = buildTaggedGroups(
  coupleStyleTabs,
  coupleStyleItems,
  "couple name art styles for keepsakes, decor, and gifts.",
);
export const ARABIC_STYLE_GROUPS: StyleGroupPage[] = [
  {
    slug: "arabic-calligraphy",
    title: "Arabic calligraphy styles",
    description: "Arabic name art styles spanning calligraphy, luxury, and modern visual directions.",
    items: arabicStyleItems.map((item) => ({
      slug: slugify(item.title),
      title: item.title,
      description: `${item.title} Arabic name art style for decor, branding, gifts, and keepsakes.`,
      imageSrc: item.src,
      imageAlt: getStyleImageAlt(item.src, {
        kind: "arabic",
        title: item.title,
        fallbackAlt: `${item.title} Arabic calligraphy example`,
      }),
      sampleImages: [item.src],
      count: 1,
      content: {},
    })),
  },
];

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
