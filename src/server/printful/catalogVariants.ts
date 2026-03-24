import { printfulRequestV2 } from "~/server/printful/client";

export type PrintfulCatalogVariant = {
  id: number;
  name: string;
  size?: string | null;
  color?: string | null;
  color_code?: string | null;
  retail_price?: string | null;
  price?: string | null;
};

type CatalogVariantsResponse = {
  data?: Array<{
    id?: number;
    name?: string;
    size?: string | null;
    color?: string | null;
    color_code?: string | null;
    retail_price?: string | null;
    price?: string | null;
  }>;
  _links?: {
    next?: {
      href?: string | null;
    };
  };
};

export const SELLING_REGION_BY_COUNTRY: Partial<Record<string, string>> = {
  US: "north_america",
  CA: "canada",
  GB: "uk",
  AU: "australia",
  NZ: "new_zealand",
};

export async function fetchCatalogVariants(
  printfulProductId: number,
  sellingRegionName?: string | null,
): Promise<PrintfulCatalogVariant[]> {
  const variants: PrintfulCatalogVariant[] = [];
  const params = new URLSearchParams({ limit: "100" });
  if (sellingRegionName) {
    params.set("selling_region_name", sellingRegionName);
  }

  let nextPath = `/catalog-products/${printfulProductId}/catalog-variants?${params.toString()}`;

  while (nextPath) {
    const response = await printfulRequestV2<CatalogVariantsResponse>(nextPath);

    for (const variant of response.data ?? []) {
      const variantId = Number(variant.id);
      if (!Number.isFinite(variantId)) continue;

      variants.push({
        id: variantId,
        name: variant.name ?? "",
        size: variant.size ?? undefined,
        color: variant.color ?? undefined,
        color_code: variant.color_code ?? undefined,
        retail_price: variant.retail_price ?? undefined,
        price: variant.price ?? undefined,
      });
    }

    const nextHref = response._links?.next?.href?.trim();
    if (!nextHref) {
      nextPath = "";
      continue;
    }

    try {
      const nextUrl = new URL(nextHref);
      nextPath = `${nextUrl.pathname}${nextUrl.search}`.replace(/^\/v2/, "");
    } catch {
      nextPath = nextHref.replace(/^https:\/\/api\.printful\.com\/v2/, "");
    }
  }

  return variants;
}
