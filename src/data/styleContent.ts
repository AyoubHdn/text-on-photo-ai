export type StyleContent = {
  introHeading?: string;
  introBody?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  longTailKeywords?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  ctaPrimary?: string;
  ctaSecondary?: string;
  productBridgeHeading?: string;
  productBridgeBody?: string;
  relatedStyles?: string[];
};

export const STYLE_CONTENT: Record<string, StyleContent> = {
  // Empty for now. Will be populated per-style in follow-up commits.
  // Slug keys must match styleTaxonomy slugs (e.g., "cute", "floral", "graffiti").
};

export function getStyleContent(slug: string): StyleContent {
  return STYLE_CONTENT[slug] ?? {};
}
