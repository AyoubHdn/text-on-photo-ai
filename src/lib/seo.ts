export const SITE_NAME = "Name Design AI";
export const SITE_URL = "https://www.namedesignai.com";
export const DEFAULT_OG_IMAGE = "/banner.webp";
export const TWITTER_HANDLE = "@name_design_ai";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

type ArticleSchemaOptions = {
  headline: string;
  description: string;
  path: string;
  imagePath?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
};

type CollectionPageSchemaOptions = {
  name: string;
  description: string;
  path: string;
  itemPaths?: string[];
};

type ItemListSchemaOptions = {
  name: string;
  itemPaths: string[];
};

export function toAbsoluteUrl(path: string) {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;

  if (path.startsWith("/")) {
    return `${SITE_URL}${path}`;
  }

  return `${SITE_URL}/${path}`;
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: toAbsoluteUrl("/logo.webp"),
    sameAs: [
      "https://www.facebook.com/profile.php?id=61571453621496",
      "https://x.com/name_design_ai",
      "https://www.pinterest.com/namedesignai/",
    ],
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function buildArticleSchema({
  headline,
  description,
  path,
  imagePath = DEFAULT_OG_IMAGE,
  datePublished,
  dateModified,
  authorName = `${SITE_NAME} Team`,
}: ArticleSchemaOptions) {
  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    mainEntityOfPage: toAbsoluteUrl(path),
    image: [toAbsoluteUrl(imagePath)],
    author: {
      "@type": "Organization",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: toAbsoluteUrl("/logo.webp"),
      },
    },
  };

  if (datePublished) {
    article.datePublished = datePublished;
  }

  if (dateModified ?? datePublished) {
    article.dateModified = dateModified ?? datePublished;
  }

  return article;
}

export function buildFAQSchema(
  items: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildCollectionPageSchema({
  name,
  description,
  path,
  itemPaths = [],
}: CollectionPageSchemaOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: toAbsoluteUrl(path),
    hasPart: itemPaths.map((itemPath) => ({
      "@type": "WebPage",
      url: toAbsoluteUrl(itemPath),
    })),
  };
}

export function buildItemListSchema({
  name,
  itemPaths,
}: ItemListSchemaOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: itemPaths.map((itemPath, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: toAbsoluteUrl(itemPath),
    })),
  };
}
