export type VisualCategoryCard = {
  href: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

export type NameArtExample = {
  href: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

export type ProductMockup = {
  href: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  ctaLabel: string;
};

const categoryCardLibrary: Record<string, VisualCategoryCard> = {
  "/personalized-name-mugs": {
    href: "/personalized-name-mugs",
    title: "Personalized Name Mugs",
    description:
      "Gift-ready mug designs that turn a name or phrase into a daily-use keepsake.",
    imageSrc: "/images/products/mug.webp",
    imageAlt: "Personalized name mug mockup featuring custom artwork",
  },
  "/custom-name-shirts": {
    href: "/custom-name-shirts",
    title: "Custom Name Shirts",
    description:
      "Wearable name art for bold apparel, matching outfits, and playful gift ideas.",
    imageSrc: "/images/products/tshirt.webp",
    imageAlt: "Custom name shirt mockup with bold graphic lettering",
  },
  "/personalized-name-wall-art": {
    href: "/personalized-name-wall-art",
    title: "Personalized Name Wall Art",
    description:
      "Display-focused posters and framed print ideas built from personalized artwork.",
    imageSrc: "/images/products/poster.webp",
    imageAlt: "Personalized name wall art poster mockup for home decor",
  },
  "/arabic-name-gifts": {
    href: "/arabic-name-gifts",
    title: "Arabic Name Gifts",
    description:
      "Arabic calligraphy-inspired gift ideas for mugs, prints, and premium keepsakes.",
    imageSrc: "/images/products/arabic/poster.webp",
    imageAlt: "Arabic name art poster mockup for personalized gifts",
  },
  "/couple-gifts": {
    href: "/couple-gifts",
    title: "Couple Gifts",
    description:
      "Romantic keepsakes and shared decor ideas built from relationship-first artwork.",
    imageSrc: "/user-couple-art.webp",
    imageAlt: "Couple name artwork styled as a romantic personalized gift",
  },
};

const nameArtExampleLibrary: Record<string, NameArtExample> = {
  emma: {
    href: "/name-art/emma",
    title: "Emma name art",
    description:
      "Soft, playful lettering for mugs, room decor, and thoughtful personalized gifts.",
    imageSrc: "/styles/name-art/Cute/s57e.webp",
    imageAlt: "Emma name art example with soft pastel lettering and decorative detail",
  },
  olivia: {
    href: "/name-art/olivia",
    title: "Olivia name art",
    description:
      "Decor-friendly floral styling that works well for prints and premium gift pages.",
    imageSrc: "/styles/name-art/Floral/s127e.webp",
    imageAlt: "Olivia name art example with floral styling for personalized decor",
  },
  amelia: {
    href: "/name-art/amelia",
    title: "Amelia name art",
    description:
      "Celebration-driven artwork for birthdays, keepsakes, and product-ready visuals.",
    imageSrc: "/styles/name-art/Celebrations/s120e.webp",
    imageAlt: "Amelia name art example in a celebratory personalized design style",
  },
  sarah: {
    href: "/name-art/sarah",
    title: "Sarah name art",
    description:
      "Crisp typography-led artwork that adapts cleanly across shirts, mugs, and posters.",
    imageSrc: "/styles/name-art/Typography/s258e.webp",
    imageAlt: "Sarah name art example with modern typography for personalized products",
  },
  fatima: {
    href: "/name-art/fatima",
    title: "Fatima name art",
    description:
      "Classic and calligraphy-inspired styling for meaningful gifts and framed prints.",
    imageSrc: "/styles/arabic/diwani-ink.webp",
    imageAlt: "Fatima Arabic calligraphy-inspired name art example for personalized gifts",
  },
  aisha: {
    href: "/name-art/aisha",
    title: "Aisha name art",
    description:
      "Elegant Arabic-inspired artwork suited to heritage gifts, mugs, and display pieces.",
    imageSrc: "/styles/arabic/thuluth-gold.webp",
    imageAlt: "Aisha Arabic name art example in a gold calligraphy style",
  },
};

const productMockupLibrary: Record<string, ProductMockup> = {
  mug: {
    href: "/personalized-name-mugs",
    title: "Mug mockups",
    description:
      "Preview how a personalized name design reads on a giftable daily-use mug.",
    imageSrc: "/images/products/mug.webp",
    imageAlt: "Personalized name art design printed on mug mockup",
    ctaLabel: "Explore mug ideas",
  },
  shirt: {
    href: "/custom-name-shirts",
    title: "Shirt mockups",
    description:
      "See how bold lettering and clean layouts translate into wearable custom apparel.",
    imageSrc: "/images/products/tshirt.webp",
    imageAlt: "Custom name art design printed on shirt mockup",
    ctaLabel: "Browse shirt ideas",
  },
  wallArt: {
    href: "/personalized-name-wall-art",
    title: "Wall art prints",
    description:
      "Use larger-format mockups to compare decor-ready posters and framed print concepts.",
    imageSrc: "/images/products/poster.webp",
    imageAlt: "Personalized name art design displayed as wall art print",
    ctaLabel: "View wall art ideas",
  },
  arabicMug: {
    href: "/arabic-name-art/products/mugs",
    title: "Arabic mug mockups",
    description:
      "Check how Arabic calligraphy styling holds up on a compact mug layout.",
    imageSrc: "/images/products/arabic/mug.webp",
    imageAlt: "Arabic name art design printed on mug mockup",
    ctaLabel: "See mug formats",
  },
  arabicShirt: {
    href: "/arabic-name-art/products/shirts",
    title: "Arabic shirt mockups",
    description:
      "Preview Arabic lettering on apparel before choosing a printable product route.",
    imageSrc: "/images/products/arabic/tshirt.webp",
    imageAlt: "Arabic name art design printed on shirt mockup",
    ctaLabel: "See shirt formats",
  },
  arabicWallArt: {
    href: "/arabic-name-art/products/wall-art",
    title: "Arabic wall art prints",
    description:
      "Compare calligraphy-led decor layouts for home, office, and premium gift use cases.",
    imageSrc: "/images/products/arabic/poster.webp",
    imageAlt: "Arabic calligraphy name art displayed as framed wall art print",
    ctaLabel: "View decor ideas",
  },
  coupleMug: {
    href: "/couples-art/products/mugs",
    title: "Couple mug mockups",
    description:
      "Relationship-led designs can be turned into practical gifts without losing sentiment.",
    imageSrc: "/images/products/mug.webp",
    imageAlt: "Couple name art design printed on romantic mug mockup",
    ctaLabel: "Explore couple mugs",
  },
  coupleShirt: {
    href: "/couples-art/products/shirts",
    title: "Couple shirt mockups",
    description:
      "Use matching apparel previews for anniversaries, travel sets, or playful pair gifts.",
    imageSrc: "/images/products/tshirt.webp",
    imageAlt: "Couple name art design printed on matching shirt mockup",
    ctaLabel: "Explore couple shirts",
  },
  coupleWallArt: {
    href: "/couples-art/products/wall-art",
    title: "Couple wall art prints",
    description:
      "See how romantic name art works as a shared-home statement piece or framed keepsake.",
    imageSrc: "/images/products/poster.webp",
    imageAlt: "Couple name art displayed as romantic wall art print",
    ctaLabel: "Explore couple decor",
  },
};

export function getCategoryCards(paths: string[]) {
  return paths.map((path) => {
    const card = categoryCardLibrary[path];

    if (!card) {
      throw new Error(`Unknown category card path: ${path}`);
    }

    return card;
  });
}

export function getNameArtExamples(ids: string[]) {
  return ids.map((id) => {
    const example = nameArtExampleLibrary[id];

    if (!example) {
      throw new Error(`Unknown name art example id: ${id}`);
    }

    return example;
  });
}

export function getProductMockups(ids: string[]) {
  return ids.map((id) => {
    const mockup = productMockupLibrary[id];

    if (!mockup) {
      throw new Error(`Unknown product mockup id: ${id}`);
    }

    return mockup;
  });
}
