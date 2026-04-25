export type ProductPageNamespace =
  | "name-art"
  | "arabic-calligraphy"
  | "couples-art";

export type ProductPageContent = {
  introHeading?: string;
  introBody?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  longTailKeywords?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  ctaPrimary?: string;
  productSchemaName?: string;
  productSchemaDescription?: string;
  priceFrom?: string;
  priceCurrency?: string;
};

export const PRODUCT_PAGE_CONTENT: Record<string, ProductPageContent> = {};

export function getProductPageContent(
  namespace: ProductPageNamespace,
  product: string,
): ProductPageContent {
  return PRODUCT_PAGE_CONTENT[`${namespace}/${product}`] ?? {};
}
