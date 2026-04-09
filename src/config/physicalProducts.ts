import type { AspectRatio } from "~/server/printful/aspects";

export type ProductKey = "poster" | "tshirt" | "mug" | "mugColorInside";

export type ProductPresentation = {
  cardLabel: string;
  cardDescription: string;
  cardImage: string;
  title: string;
};

export const PRODUCT_PRESENTATION: Record<ProductKey, ProductPresentation> = {
  poster: {
    cardLabel: "Poster",
    cardDescription: "Perfect for walls, frames, and gifts",
    cardImage: "/images/products/poster.webp",
    title: "Premium Poster",
  },
  tshirt: {
    cardLabel: "T-Shirt",
    cardDescription: "Wear your name art every day",
    cardImage: "/images/products/tshirt.webp",
    title: "Unisex T-Shirt",
  },
  mug: {
    cardLabel: "Mug",
    cardDescription: "A daily reminder with your design",
    cardImage: "/images/products/mug.webp",
    title: "White Glossy Mug",
  },
  mugColorInside: {
    cardLabel: "White Ceramic Mug with Color Inside",
    cardDescription: "Glossy ceramic mug with a colored rim, inside, and handle",
    cardImage: "https://files.cdn.printful.com/o/products/403/product_1595515161.jpg",
    title: "White Ceramic Mug with Color Inside",
  },
};

export const PRODUCT_SUPPORTED_ASPECTS: Record<ProductKey, AspectRatio[]> = {
  poster: ["1:1", "4:5", "3:2"],
  mug: ["1:1", "4:5", "3:2"],
  mugColorInside: ["1:1", "4:5", "3:2"],
  tshirt: ["1:1", "4:5", "3:2", "16:9"],
};

export const PRODUCTS_PAGE_PRODUCT_KEYS: ProductKey[] = [
  "poster",
  "tshirt",
  "mug",
  "mugColorInside",
];

export function isMugProductKey(
  value: string | null | undefined,
): value is "mug" | "mugColorInside" {
  return value === "mug" || value === "mugColorInside";
}
