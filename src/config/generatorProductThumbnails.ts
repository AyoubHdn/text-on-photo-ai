export type ProductKey = "poster" | "tshirt" | "mug";

export type ProductThumbnail = {
  key: ProductKey;
  label: string;
  description: string;
  image: string;
};

type GeneratorProductThumbnailMap = {
  default: ProductThumbnail[];
  arabic: ProductThumbnail[];
  couples: ProductThumbnail[];
};

export const GENERATOR_PRODUCT_THUMBNAILS: GeneratorProductThumbnailMap = {
  default: [
    {
      key: "poster",
      label: "Poster",
      description: "Perfect for walls, frames, and gifts",
      image: "/images/products/poster.jpg",
    },
    {
      key: "tshirt",
      label: "T-Shirt",
      description: "Wear your name art every day",
      image: "/images/products/tshirt.jpg",
    },
    {
      key: "mug",
      label: "Mug",
      description: "A daily reminder with your design",
      image: "/images/products/mug.jpg",
    },
  ],
  arabic: [
    {
      key: "poster",
      label: "Poster",
      description: "Perfect for walls, frames, and gifts",
      image: "/images/products/arabic/poster.webp",
    },
    {
      key: "tshirt",
      label: "T-Shirt",
      description: "Wear your name art every day",
      image: "/images/products/arabic/tshirt.webp",
    },
    {
      key: "mug",
      label: "Mug",
      description: "A daily reminder with your design",
      image: "/images/products/arabic/mug.webp",
    },
  ],
  couples: [
    {
      key: "poster",
      label: "Poster",
      description: "Perfect for walls, frames, and gifts",
      image: "/images/products/poster.jpg",
    },
    {
      key: "tshirt",
      label: "T-Shirt",
      description: "Wear your name art every day",
      image: "/images/products/tshirt.jpg",
    },
    {
      key: "mug",
      label: "Mug",
      description: "A daily reminder with your design",
      image: "/images/products/mug.jpg",
    },
  ],
};
