// src/server/printful/products.ts
export type PosterAspect = "1:1" | "4:5" | "3:2" | "16:9";

export type PosterSize = {
  label: string;
  variantId: number;
  price: number;
  aspect: PosterAspect;
};

export type PrintfulProduct =
  | {
      key: "poster";
      name: string;
      printfulProductId: number;
      sizes: PosterSize[];
    }
  | {
      key: "mug";
      name: string;
      printfulProductId: number;
      variants: {
        label: string;
        variantId: number;
        price: number;
      }[];
      defaultPreviewMode: "two-side";
      availablePreviewModes: ("two-side" | "center" | "full-wrap")[];
    }
  | {
      key: "tshirt";
      name: string;
      printfulProductId: number;
      variants: {
        label: string;
        variantId: number;
        price: number;
      }[];
    };

export const PRINTFUL_PRODUCTS: PrintfulProduct[] = [
  {
    key: "poster",
    name: "Poster",
    printfulProductId: 1,
    sizes: [
      { label: "10×10", variantId: 6239, price: 7.89, aspect: "1:1" },
      { label: "16×20", variantId: 3877, price: 10.89, aspect: "4:5" },
      { label: "20×30", variantId: 16365, price: 17.89, aspect: "3:2" },
    ],
  },
  {
    key: "mug",
    name: "White Glossy Mug",
    printfulProductId: 19,
    defaultPreviewMode: "two-side",
    availablePreviewModes: ["two-side", "center", "full-wrap"],
    variants: [
      { label: "11 oz", variantId: 1320, price: 5.95 },
      { label: "15 oz", variantId: 4830, price: 7.95 },
      { label: "20 oz", variantId: 16586, price: 9.5 },
    ],
  },
  {
    key: "tshirt",
    name: "Unisex Staple T-Shirt | Bella + Canvas 3001",
    printfulProductId: 71, // ✅ Printful product ID for Bella + Canvas 3001
    variants: [
      { label: "S", variantId: 4012, price: 12.95 },
      { label: "M", variantId: 4013, price: 12.95 },
      { label: "L", variantId: 4014, price: 12.95 },
      { label: "XL", variantId: 4015, price: 12.95 },
    ],
  }

];
