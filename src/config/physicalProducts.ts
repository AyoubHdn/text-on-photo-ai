import type { AspectRatio } from "~/server/printful/aspects";

export type ProductKey =
  | "poster"
  | "framedPoster"
  | "canvas"
  | "postcard"
  | "candle"
  | "pillow"
  | "journal"
  | "tshirt"
  | "mug"
  | "mugBlackGlossy"
  | "mugColorInside"
  | "coaster";

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
  framedPoster: {
    cardLabel: "Framed Poster",
    cardDescription: "Enhanced matte paper framed poster, ready to hang",
    cardImage: "https://files.cdn.printful.com/o/products/2/product_1613463227.jpg",
    title: "Enhanced Matte Paper Framed Poster (in)",
  },
  canvas: {
    cardLabel: "Canvas",
    cardDescription: "Fade-resistant canvas print, hand-stretched and ready to hang",
    cardImage: "https://files.cdn.printful.com/o/products/3/product_1613463725.jpg",
    title: "Canvas (in)",
  },
  postcard: {
    cardLabel: "Postcard",
    cardDescription: "Thick matte postcard with a custom printed front",
    cardImage: "https://files.cdn.printful.com/o/products/433/product_1602054891.jpg",
    title: "Standard Postcard",
  },
  candle: {
    cardLabel: "Soy Candle",
    cardDescription: "Natural soy wax candle with a custom printed front label",
    cardImage:
      "https://files.cdn.printful.com/o/upload/product-catalog-img/28/280cf4f2390e842ed112dd43f290c401_l",
    title: "Scented Soy Candle, 9oz",
  },
  pillow: {
    cardLabel: "Basic Pillow",
    cardDescription: "Soft all-over print pillow with insert included",
    cardImage: "https://files.cdn.printful.com/o/products/83/product_1573737219.jpg",
    title: "All-Over Print Basic Pillow",
  },
  journal: {
    cardLabel: "Hardcover Journal Matte",
    cardDescription: "Matte laminated hardcover journal with 150 lined pages",
    cardImage:
      "https://files.cdn.printful.com/o/upload/product-catalog-img/74/748c0511a2d90ae39f7840ec77cfc203_l",
    title: "Hardcover Journal Matte",
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
  mugBlackGlossy: {
    cardLabel: "Black Glossy Mug",
    cardDescription: "Sleek glossy ceramic mug in classic black",
    cardImage:
      "https://files.cdn.printful.com/o/upload/product-catalog-img/2e/2e374a575d31ab64fa9cb7f1af7db269_l",
    title: "Black Glossy Mug",
  },
  mugColorInside: {
    cardLabel: "White Ceramic Mug with Color Inside",
    cardDescription: "Glossy ceramic mug with a colored rim, inside, and handle",
    cardImage: "https://files.cdn.printful.com/o/products/403/product_1595515161.jpg",
    title: "White Ceramic Mug with Color Inside",
  },
  coaster: {
    cardLabel: "Cork-Back Coaster",
    cardDescription: "Glossy square coaster with cork backing and rounded corners",
    cardImage:
      "https://files.cdn.printful.com/o/upload/product-catalog-img/d4/d41d6e69b8c865b6a4546ce030775f2f_l",
    title: "Cork-Back Coaster",
  },
};

export const PRODUCT_SUPPORTED_ASPECTS: Record<ProductKey, AspectRatio[]> = {
  poster: ["1:1", "4:5", "3:2"],
  framedPoster: ["1:1", "4:5", "3:2"],
  canvas: ["1:1", "4:5", "3:2"],
  postcard: ["3:2"],
  candle: ["3:2"],
  pillow: ["1:1", "3:2"],
  journal: ["1:1", "4:5", "3:2"],
  mug: ["1:1", "4:5", "3:2"],
  mugBlackGlossy: ["1:1", "4:5", "3:2"],
  mugColorInside: ["1:1", "4:5", "3:2"],
  coaster: ["1:1"],
  tshirt: ["1:1", "4:5", "3:2", "16:9"],
};

export const PRODUCTS_PAGE_PRODUCT_KEYS: ProductKey[] = [
  "poster",
  "framedPoster",
  "canvas",
  "postcard",
  "candle",
  "pillow",
  "journal",
  "tshirt",
  "mug",
  "mugBlackGlossy",
  "mugColorInside",
  "coaster",
];

export function isMugProductKey(
  value: string | null | undefined,
): value is "mug" | "mugBlackGlossy" | "mugColorInside" {
  return value === "mug" || value === "mugBlackGlossy" || value === "mugColorInside";
}
