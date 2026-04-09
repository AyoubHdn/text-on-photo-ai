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
      key: "mug" | "mugBlackGlossy" | "mugColorInside";
      name: string;
      printfulProductId: number;
      defaultVariantId: number;
      variants: {
        label: string;
        variantId: number;
        price: number;
        color?: string;
        colorHex?: string;
      }[];
      defaultPreviewMode: "two-side";
      availablePreviewModes: ("two-side" | "center" | "full-wrap")[];
    }
  | {
      key: "coaster";
      name: string;
      printfulProductId: number;
      defaultVariantId: number;
      variants: {
        label: string;
        variantId: number;
        price: number;
      }[];
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
      { label: "10x10", variantId: 6239, price: 7.89, aspect: "1:1" },
      { label: "16x20", variantId: 3877, price: 10.89, aspect: "4:5" },
      { label: "20x30", variantId: 16365, price: 17.89, aspect: "3:2" },
    ],
  },
  {
    key: "mug",
    name: "White Glossy Mug",
    printfulProductId: 19,
    defaultVariantId: 1320,
    defaultPreviewMode: "two-side",
    availablePreviewModes: ["two-side", "center", "full-wrap"],
    variants: [
      { label: "11 oz", variantId: 1320, price: 5.95 },
      { label: "15 oz", variantId: 4830, price: 7.95 },
      { label: "20 oz", variantId: 16586, price: 9.5 },
    ],
  },
  {
    key: "mugBlackGlossy",
    name: "Black Glossy Mug",
    printfulProductId: 300,
    defaultVariantId: 9323,
    defaultPreviewMode: "two-side",
    availablePreviewModes: ["two-side", "center", "full-wrap"],
    variants: [
      { label: "11 oz", variantId: 9323, price: 7.95, color: "Black", colorHex: "#000000" },
      { label: "15 oz", variantId: 9324, price: 8.95, color: "Black", colorHex: "#000000" },
    ],
  },
  {
    key: "mugColorInside",
    name: "White Ceramic Mug with Color Inside",
    printfulProductId: 403,
    defaultVariantId: 11051,
    defaultPreviewMode: "two-side",
    availablePreviewModes: ["two-side", "center", "full-wrap"],
    variants: [
      { label: "Black / 11 oz", variantId: 11051, price: 7.95, color: "Black", colorHex: "#050505" },
      { label: "Black / 15 oz", variantId: 17196, price: 8.95, color: "Black", colorHex: "#050505" },
      { label: "Blue / 11 oz", variantId: 11050, price: 7.95, color: "Blue", colorHex: "#1e9fcd" },
      { label: "Blue / 15 oz", variantId: 17197, price: 8.95, color: "Blue", colorHex: "#1e9fcd" },
      { label: "Dark Blue / 11 oz", variantId: 17362, price: 7.95, color: "Dark Blue", colorHex: "#1b1b51" },
      { label: "Dark Blue / 15 oz", variantId: 22373, price: 8.95, color: "Dark Blue", colorHex: "#1b1b51" },
      { label: "Dark Green / 11 oz", variantId: 17359, price: 7.95, color: "Dark Green", colorHex: "#226653" },
      { label: "Dark Green / 15 oz", variantId: 17360, price: 8.95, color: "Dark Green", colorHex: "#226653" },
      { label: "Golden Yellow / 11 oz", variantId: 17358, price: 7.95, color: "Golden Yellow", colorHex: "#feba45" },
      { label: "Green / 11 oz", variantId: 17361, price: 7.95, color: "Green", colorHex: "#b2d264" },
      { label: "Orange / 11 oz", variantId: 12579, price: 7.95, color: "Orange", colorHex: "#f85625" },
      { label: "Pink / 11 oz", variantId: 12578, price: 7.95, color: "Pink", colorHex: "#f6a1b1" },
      { label: "Pink / 15 oz", variantId: 17199, price: 8.95, color: "Pink", colorHex: "#f6a1b1" },
      { label: "Red / 11 oz", variantId: 11049, price: 7.95, color: "Red", colorHex: "#e32a2d" },
      { label: "Red / 15 oz", variantId: 17200, price: 8.95, color: "Red", colorHex: "#e32a2d" },
      { label: "Yellow / 11 oz", variantId: 11048, price: 7.95, color: "Yellow", colorHex: "#ffdc3a" },
    ],
  },
  {
    key: "coaster",
    name: "Cork-Back Coaster",
    printfulProductId: 611,
    defaultVariantId: 15662,
    variants: [{ label: '3.74"x3.74"', variantId: 15662, price: 5.44 }],
  },
  {
    key: "tshirt",
    name: "Unisex Staple T-Shirt | Bella + Canvas 3001",
    printfulProductId: 71,
    variants: [
      { label: "S", variantId: 4012, price: 12.95 },
      { label: "M", variantId: 4013, price: 12.95 },
      { label: "L", variantId: 4014, price: 12.95 },
      { label: "XL", variantId: 4015, price: 12.95 },
    ],
  },
];
