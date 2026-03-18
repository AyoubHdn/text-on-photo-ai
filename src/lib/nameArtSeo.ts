import { popularNames } from "~/lib/names";

const NAME_SITEMAP_LIMIT = 120;
const FEATURED_NAME_LIMIT = 12;

export function getNameArtPath(name: string) {
  return `/name-art/${name.toLowerCase()}`;
}

export const SITEMAP_NAME_PAGES = popularNames.slice(0, NAME_SITEMAP_LIMIT);

export const FEATURED_NAME_PAGES = popularNames
  .slice(0, FEATURED_NAME_LIMIT)
  .map((item) => ({
    name: item.name,
    path: getNameArtPath(item.name),
    niches: item.niches,
  }));

export function getRelatedNamePages(currentName: string, limit = 8) {
  const currentIndex = popularNames.findIndex(
    (item) => item.name.toLowerCase() === currentName.toLowerCase(),
  );

  if (currentIndex === -1) {
    return FEATURED_NAME_PAGES.slice(0, limit);
  }

  const related: Array<{ name: string; path: string; niches: string[] }> = [];
  const seen = new Set([currentName.toLowerCase()]);

  for (let offset = 1; related.length < limit; offset += 1) {
    const before = popularNames[currentIndex - offset];
    const after = popularNames[currentIndex + offset];

    for (const candidate of [before, after]) {
      if (!candidate) continue;
      const key = candidate.name.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      related.push({
        name: candidate.name,
        path: getNameArtPath(candidate.name),
        niches: candidate.niches,
      });

      if (related.length >= limit) {
        break;
      }
    }

    if (!before && !after) {
      break;
    }
  }

  return related;
}
