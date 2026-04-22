export type GeneratorStyleItem = {
  src: string;
  basePrompt: string;
  altText?: string;
  name?: string;
  allowCustomColors?: boolean;
};

export type GeneratorStyleData<T extends GeneratorStyleItem> = Record<
  string,
  Record<string, T[]>
>;

export type GeneratorStyleSelection<T extends GeneratorStyleItem> = {
  category: string;
  subcategory: string;
  item: T;
};

export function getStringQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function slugifyGeneratorStyle(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeGeneratorStyleImageSrc(value?: string | null) {
  if (!value) return "";

  let pathname = value.trim();
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    // Use the raw value if it is already decoded or malformed.
  }

  try {
    pathname = new URL(pathname, "https://namedesignai.local").pathname;
  } catch {
    // Keep the original path if URL parsing fails.
  }

  return pathname
    .replace(/\\/g, "/")
    .replace(
      /\/styles\/(name-art|couples)\/([^/]+?)e\.webp$/i,
      "/styles/$1/$2.webp",
    )
    .toLowerCase();
}

export function findGeneratorStyleSelection<T extends GeneratorStyleItem>(
  styles: GeneratorStyleData<T>,
  params: {
    style?: string | null;
    styleImage?: string | null;
  },
): GeneratorStyleSelection<T> | null {
  const requestedStyle = slugifyGeneratorStyle(params.style);
  const requestedImage = normalizeGeneratorStyleImageSrc(params.styleImage);
  let styleMatch: GeneratorStyleSelection<T> | null = null;

  for (const [category, subcategories] of Object.entries(styles)) {
    for (const [subcategory, items] of Object.entries(subcategories)) {
      for (const item of items) {
        if (
          requestedImage &&
          normalizeGeneratorStyleImageSrc(item.src) === requestedImage
        ) {
          return { category, subcategory, item };
        }

        if (!requestedStyle || styleMatch) continue;

        const slugs = [category, subcategory, item.name].map((value) =>
          slugifyGeneratorStyle(value),
        );

        if (slugs.includes(requestedStyle)) {
          styleMatch = { category, subcategory, item };
        }
      }
    }
  }

  return styleMatch;
}
