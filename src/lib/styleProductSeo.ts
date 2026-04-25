import type { BreadcrumbItem } from "~/lib/seo";
import {
  ARABIC_STYLE_ITEMS,
  COUPLES_STYLE_ITEMS,
  NAME_ART_STYLE_ITEMS,
} from "~/lib/styleTaxonomy";

export type StyleProductHubSlug = "name-art" | "arabic-calligraphy" | "couples-art";
export type StyleProductSlug = "mugs" | "shirts" | "wall-art";

export type StyleProductLink = {
  href: string;
  label: string;
  description: string;
};

export type StyleProductCard = StyleProductLink & {
  imageSrc: string;
  imageAlt: string;
};

export type StyleProductContentCard = {
  title: string;
  description: string;
};

export type StyleProductVisualCard = StyleProductContentCard & {
  imageSrc: string;
  imageAlt: string;
  href: string;
};

export type StyleProductFAQ = {
  question: string;
  answer: string;
};

export type StyleProductHubConfig = {
  slug: StyleProductHubSlug;
  path: string;
  title: string;
  description: string;
  h1: string;
  eyebrow: string;
  intro: string;
  secondaryIntro: string;
  heroImage: string;
  heroImageAlt: string;
  generatorHref: string;
  generatorLabel: string;
  styleGalleryHref: string;
  styleGalleryLabel: string;
  productCards: StyleProductCard[];
  highlights: StyleProductContentCard[];
  inspiration: StyleProductVisualCard[];
  relatedLinks: StyleProductLink[];
  faqItems: StyleProductFAQ[];
  breadcrumbs: BreadcrumbItem[];
};

export type StyleProductDetailConfig = {
  styleSlug: StyleProductHubSlug;
  productSlug: StyleProductSlug;
  path: string;
  title: string;
  description: string;
  h1: string;
  eyebrow: string;
  intro: string;
  secondaryIntro: string;
  heroImage: string;
  heroImageAlt: string;
  generatorHref: string;
  generatorLabel: string;
  hubHref: string;
  hubLabel: string;
  broadProductHref: string;
  broadProductLabel: string;
  highlights: StyleProductContentCard[];
  designNotes: StyleProductContentCard[];
  useCases: StyleProductContentCard[];
  inspiration: StyleProductVisualCard[];
  relatedProducts: StyleProductCard[];
  crossStyleLinks: StyleProductLink[];
  faqItems: StyleProductFAQ[];
  breadcrumbs: BreadcrumbItem[];
};

type ProductBaseConfig = {
  slug: StyleProductSlug;
  label: string;
  singularLabel: string;
  shortLabel: string;
  broadProductHref: string;
  broadProductLabel: string;
  surfaceNote: string;
  defaultImage: string;
  defaultImageAlt: string;
  arabicImage?: string;
  arabicImageAlt?: string;
};

type ProductCopy = {
  title: string;
  description: string;
  h1: string;
  intro: string;
  secondaryIntro: string;
  highlights: StyleProductContentCard[];
  designNotes: StyleProductContentCard[];
  useCases: StyleProductContentCard[];
  faqItems: StyleProductFAQ[];
};

type StyleBaseConfig = {
  slug: StyleProductHubSlug;
  label: string;
  baseHref: string;
  productsHref: string;
  generatorHref: string;
  generatorLabel: string;
  styleGalleryHref: string;
  styleGalleryLabel: string;
  giftHubHref: string;
  giftHubLabel: string;
  hubTitle: string;
  hubDescription: string;
  hubH1: string;
  eyebrow: string;
  hubIntro: string;
  hubSecondaryIntro: string;
  heroImage: string;
  heroImageAlt: string;
  hubHighlights: StyleProductContentCard[];
  inspiration: StyleProductVisualCard[];
  hubFaqItems: StyleProductFAQ[];
  productCopy: Record<StyleProductSlug, ProductCopy>;
};

export const STYLE_PRODUCT_SLUGS: StyleProductSlug[] = [
  "mugs",
  "shirts",
  "wall-art",
];

export const STYLE_PRODUCT_HUB_SLUGS: StyleProductHubSlug[] = [
  "name-art",
  "arabic-calligraphy",
  "couples-art",
];

const STYLE_ITEMS_BY_NAMESPACE = {
  "name-art": NAME_ART_STYLE_ITEMS,
  "arabic-calligraphy": ARABIC_STYLE_ITEMS,
  "couples-art": COUPLES_STYLE_ITEMS,
} as const;

export function buildStyleHref(
  namespace: StyleProductHubSlug,
  slug: string,
): string {
  const items = STYLE_ITEMS_BY_NAMESPACE[namespace];
  const item = items.find((entry) => entry.slug === slug);

  if (!item && process.env.NODE_ENV !== "production") {
    throw new Error(
      `[styleProductSeo] Unknown ${namespace} style slug: "${slug}". Available: ${items
        .map((entry) => entry.slug)
        .join(", ")}`,
    );
  }

  return `/${namespace}/styles/${slug}`;
}

const PRODUCT_CONFIGS: Record<StyleProductSlug, ProductBaseConfig> = {
  mugs: {
    slug: "mugs",
    label: "Mugs",
    singularLabel: "mug",
    shortLabel: "mug",
    broadProductHref: "/personalized-gifts",
    broadProductLabel: "Personalized Name Mugs",
    surfaceNote:
      "Mugs need a clear focal point, readable lettering, and enough empty space for the design to survive a curved surface.",
    defaultImage: "/images/products/mug.webp",
    defaultImageAlt: "Personalized name art printed on a white mug mockup",
    arabicImage: "/images/products/arabic/mug.webp",
    arabicImageAlt: "Arabic name art printed on a white mug mockup",
  },
  shirts: {
    slug: "shirts",
    label: "Shirts",
    singularLabel: "shirt",
    shortLabel: "shirt",
    broadProductHref: "/personalized-gifts",
    broadProductLabel: "Custom Name Shirts",
    surfaceNote:
      "Shirts work best with stronger contrast, simple silhouettes, and artwork that remains legible from a few feet away.",
    defaultImage: "/images/products/tshirt.webp",
    defaultImageAlt: "Custom name art printed on a shirt mockup",
    arabicImage: "/images/products/arabic/tshirt.webp",
    arabicImageAlt: "Arabic name art printed on a shirt mockup",
  },
  "wall-art": {
    slug: "wall-art",
    label: "Wall Art",
    singularLabel: "wall art print",
    shortLabel: "wall art",
    broadProductHref: "/personalized-gifts",
    broadProductLabel: "Personalized Name Wall Art",
    surfaceNote:
      "Wall art gives detailed name designs the most room, so it can support richer texture, decor styling, and premium keepsake intent.",
    defaultImage: "/images/products/poster.webp",
    defaultImageAlt: "Personalized name art displayed as a poster mockup",
    arabicImage: "/images/products/arabic/poster.webp",
    arabicImageAlt: "Arabic calligraphy name art displayed as a poster mockup",
  },
};

const STYLE_CONFIGS: Record<StyleProductHubSlug, StyleBaseConfig> = {
  "name-art": {
    slug: "name-art",
    label: "Name Art",
    baseHref: "/name-art",
    productsHref: "/name-art/products",
    generatorHref: "/name-art-generator",
    generatorLabel: "Create name art",
    styleGalleryHref: "/name-art/styles",
    styleGalleryLabel: "Browse name art styles",
    giftHubHref: "/personalized-gifts",
    giftHubLabel: "Personalized Gifts",
    hubTitle: "Name Art Products | Mugs, Shirts, and Wall Art | Name Design AI",
    hubDescription:
      "Browse name art products for mugs, shirts, and wall art. Start with a custom name design, then choose the product format that fits the gift or room.",
    hubH1: "Name art products for mugs, shirts, and wall art",
    eyebrow: "Name Art Products",
    hubIntro:
      "This hub is for visitors who already like the name art idea and now need a product direction. It keeps the style-specific intent separate from broader gift pages, so mugs, shirts, and wall art can each explain how regular name art behaves on that surface.",
    hubSecondaryIntro:
      "Use it as the bridge between the main name art gallery and product-specific pages. The broad product hubs still cover every style; these pages focus only on personalized name art.",
    heroImage: "/styles/name-art/Floral/s5e.webp",
    heroImageAlt: "Floral personalized name art example for product-ready gifts",
    hubHighlights: [
      {
        title: "Keeps the name as the hero",
        description:
          "Every page in this section starts from the artwork, then explains which product surface supports that design best.",
      },
      {
        title: "Reduces product-page overlap",
        description:
          "The broad mug, shirt, and wall art hubs stay general while these pages target name-art-specific searches.",
      },
      {
        title: "Useful before checkout",
        description:
          "Visitors can compare product formats before opening the generator or product catalog.",
      },
    ],
    inspiration: [
      {
        title: "Floral name art",
        description:
          "A softer decor-friendly direction that translates naturally into prints and thoughtful gifts.",
        imageSrc: "/styles/name-art/Floral/s127e.webp",
        imageAlt: "Floral Olivia name art example for personalized products",
        href: buildStyleHref("name-art", "floral"),
      },
      {
        title: "Typography name art",
        description:
          "Cleaner lettering that works especially well for shirts and compact product surfaces.",
        imageSrc: "/styles/name-art/Typography/s258e.webp",
        imageAlt: "Typography name art example for shirts and mugs",
        href: buildStyleHref("name-art", "typography"),
      },
      {
        title: "Cute name art",
        description:
          "Playful styles that suit birthday gifts, kids rooms, mugs, and casual keepsakes.",
        imageSrc: "/styles/name-art/Cute/s57e.webp",
        imageAlt: "Cute pastel name art example for personalized gifts",
        href: buildStyleHref("name-art", "cute"),
      },
    ],
    hubFaqItems: [
      {
        question: "How is this different from the main product hubs?",
        answer:
          "The main product hubs cover every style and recipient. This section focuses only on products made from personalized name art.",
      },
      {
        question: "Should I start here or on the generator?",
        answer:
          "Start here when you are choosing a product format. Start with the generator when you already know the design style you want.",
      },
      {
        question: "Can the same name art work on multiple products?",
        answer:
          "Yes, but each surface has different constraints. Mugs need readability, shirts need stronger contrast, and wall art can support more detail.",
      },
    ],
    productCopy: {
      mugs: {
        title: "Name Art Mugs | Custom Personalized Name Mugs | Name Design AI",
        description:
          "Create name art mugs from personalized AI-generated name designs. Learn what styles read clearly on mugs before making a printable design.",
        h1: "Name art mugs made from your custom design",
        intro:
          "Name art mugs work best when the design is personal but still readable at daily-use size. This page focuses on the overlap between name art and mug printing, not generic mug shopping.",
        secondaryIntro:
          "Use this page when the visitor wants a practical personalized gift but still needs guidance on style, contrast, and composition before opening the generator.",
        highlights: [
          {
            title: "Readable at compact size",
            description:
              "The strongest mug designs keep the name clear and avoid fine detail that gets lost on a curved ceramic surface.",
          },
          {
            title: "Good for daily-use gifting",
            description:
              "A mug turns a custom name design into something visible in morning routines, desks, and kitchen spaces.",
          },
          {
            title: "Flexible style range",
            description:
              "Cute, floral, typography, and celebration styles can all work when the layout stays centered and balanced.",
          },
        ],
        designNotes: [
          {
            title: "Choose a strong focal point",
            description:
              "The name should be visible first. Decorative elements should support the lettering instead of competing with it.",
          },
          {
            title: "Avoid tiny details",
            description:
              "Fine lines, very small icons, and low-contrast textures usually work better on prints than on mugs.",
          },
          {
            title: "Preview before ordering",
            description:
              "A design that looks good as square art may need more breathing room before it feels right on a mug.",
          },
        ],
        useCases: [
          {
            title: "Birthday name mugs",
            description:
              "A first name, nickname, or short phrase can become a useful birthday gift without feeling generic.",
          },
          {
            title: "Desk gifts",
            description:
              "Clean typography name art works especially well for office mugs, teacher gifts, and study spaces.",
          },
          {
            title: "Kids and family gifts",
            description:
              "Cute or playful name art can make simple mugs feel more personal for family occasions.",
          },
        ],
        faqItems: [
          {
            question: "What name art style is best for mugs?",
            answer:
              "Typography, cute, floral, and celebration styles usually work well if the name remains large and readable.",
          },
          {
            question: "Can I use detailed artwork on a mug?",
            answer:
              "You can, but detailed artwork should still have a clear central name and enough contrast to read on a compact surface.",
          },
          {
            question: "Is this page replacing the broad mug hub?",
            answer:
              "No. The broad mug hub covers all personalized name mugs. This page focuses specifically on name art mugs.",
          },
        ],
      },
      shirts: {
        title: "Name Art Shirts | Custom Name Art T-Shirts | Name Design AI",
        description:
          "Explore name art shirts that turn personalized name designs into wearable custom apparel. Compare style directions before generating shirt-ready artwork.",
        h1: "Name art shirts for wearable custom designs",
        intro:
          "Name art shirts need a stronger graphic read than mugs or prints. The design has to feel personal, but it also has to work from a distance as wearable artwork.",
        secondaryIntro:
          "This page helps separate shirt-ready name art from broader custom shirt searches by focusing on contrast, layout, and styles that feel natural on apparel.",
        highlights: [
          {
            title: "Built for distance",
            description:
              "A shirt-ready design should still make sense when someone sees it from across a room.",
          },
          {
            title: "Best for bold styles",
            description:
              "Typography, graffiti, gaming, and celebration styles often translate better to apparel than delicate decor-first designs.",
          },
          {
            title: "Works for groups and events",
            description:
              "Name art shirts can support birthdays, family events, teams, nickname designs, and matching gifts.",
          },
        ],
        designNotes: [
          {
            title: "Favor contrast",
            description:
              "High-contrast lettering and simplified shapes are easier to read on fabric.",
          },
          {
            title: "Keep the composition centered",
            description:
              "Shirt graphics usually work best when the name and supporting art form one clear block.",
          },
          {
            title: "Use playful styles carefully",
            description:
              "Playful artwork can work well, but it should still feel intentional enough to wear.",
          },
        ],
        useCases: [
          {
            title: "Birthday shirts",
            description:
              "Use a name, age, nickname, or short phrase for celebration-ready apparel.",
          },
          {
            title: "Family and event shirts",
            description:
              "A shared style can make related custom shirts feel connected without using the same exact text.",
          },
          {
            title: "Nickname apparel",
            description:
              "Bold lettering styles are useful when the shirt is more about personality than formal gifting.",
          },
        ],
        faqItems: [
          {
            question: "What styles are strongest for name art shirts?",
            answer:
              "Bold typography, graffiti, gaming, and simple illustrated styles usually work best because they stay readable on fabric.",
          },
          {
            question: "Can floral name art work on shirts?",
            answer:
              "Yes, especially when the floral elements frame the name instead of making the lettering too delicate.",
          },
          {
            question: "Should I use the shirt page or the main generator first?",
            answer:
              "Use this page to choose the right shirt direction, then open the generator once the style goal is clear.",
          },
        ],
      },
      "wall-art": {
        title: "Name Art Wall Art | Personalized Name Prints | Name Design AI",
        description:
          "Create name art wall art from personalized name designs. Explore decor-ready styles for posters, framed prints, nurseries, rooms, and gifts.",
        h1: "Name art wall art for rooms and keepsakes",
        intro:
          "Wall art is often the strongest product format for name art because it gives the design room to breathe. This page focuses on decor-ready name art rather than every possible wall art product.",
        secondaryIntro:
          "Use it when the design should feel display-worthy: a bedroom print, nursery piece, office poster, framed gift, or keepsake that centers the name.",
        highlights: [
          {
            title: "Best for detailed styles",
            description:
              "Wall art can support floral detail, illustrated texture, elegant lettering, and richer color palettes.",
          },
          {
            title: "Strong gift and decor intent",
            description:
              "A name print feels more permanent than a small daily-use product, which makes it useful for rooms and keepsakes.",
          },
          {
            title: "Easy to personalize by mood",
            description:
              "Soft, classic, playful, and modern styles can each map to a different room or recipient.",
          },
        ],
        designNotes: [
          {
            title: "Match the room mood",
            description:
              "Nursery decor, office art, and birthday keepsakes often need different color and type choices.",
          },
          {
            title: "Let detail breathe",
            description:
              "Wall art can handle more decoration than shirts or mugs, but the name still needs to stay central.",
          },
          {
            title: "Choose display-friendly colors",
            description:
              "Avoid color combinations that only look good on-screen if the goal is a long-lasting print.",
          },
        ],
        useCases: [
          {
            title: "Bedroom and nursery prints",
            description:
              "Soft and playful name art can make a room feel personal without needing a heavy design concept.",
          },
          {
            title: "Framed birthday gifts",
            description:
              "A custom name print can feel more thoughtful than a generic birthday poster.",
          },
          {
            title: "Office and creative spaces",
            description:
              "Typography-led designs work well when the artwork should feel polished and less sentimental.",
          },
        ],
        faqItems: [
          {
            question: "Why is wall art a strong fit for name art?",
            answer:
              "It gives the design enough space for lettering, detail, color, and decorative elements to feel intentional.",
          },
          {
            question: "Can I make nursery name art?",
            answer:
              "Yes. Cute, floral, soft 3D, and watercolor styles can work well for nursery and kids room decor.",
          },
          {
            question: "How is this different from personalized name wall art?",
            answer:
              "The broad page covers all personalized name wall art. This page focuses specifically on wall art made from the name art workflow.",
          },
        ],
      },
    },
  },
  "arabic-calligraphy": {
    slug: "arabic-calligraphy",
    label: "Arabic Name Art",
    baseHref: "/arabic-calligraphy",
    productsHref: "/arabic-calligraphy/products",
    generatorHref: "/arabic-calligraphy-generator",
    generatorLabel: "Create Arabic name art",
    styleGalleryHref: "/arabic-calligraphy/styles",
    styleGalleryLabel: "Browse Arabic styles",
    giftHubHref: "/personalized-gifts",
    giftHubLabel: "Arabic Name Gifts",
    hubTitle: "Arabic Name Art Products | Mugs, Shirts, Wall Art | Name Design AI",
    hubDescription:
      "Browse Arabic name art products for mugs, shirts, and wall art. Turn calligraphy-inspired Arabic name designs into gift-ready product formats.",
    hubH1: "Arabic name art products for gifts and decor",
    eyebrow: "Arabic Name Art Products",
    hubIntro:
      "Arabic name art products need a dedicated path because the lettering, calligraphy style, and cultural context matter before the product choice. This hub keeps Arabic-specific intent separate from generic mug, shirt, and wall art pages.",
    hubSecondaryIntro:
      "Use these pages when the buyer wants Arabic calligraphy-inspired artwork on a product. The broader Arabic gift hub can stay occasion-led, while this section stays product and style-led.",
    heroImage: "/styles/arabic/thuluth-gold.webp",
    heroImageAlt: "Gold Arabic calligraphy name art example for products",
    hubHighlights: [
      {
        title: "Calligraphy-first structure",
        description:
          "The pages explain how Arabic lettering behaves on products before sending visitors into the generator.",
      },
      {
        title: "Clearer Arabic product intent",
        description:
          "Arabic mug, shirt, and wall art searches can land on pages built for that exact visual style.",
      },
      {
        title: "Connects gifts and decor",
        description:
          "The same Arabic name design can become a meaningful decor piece, daily-use gift, or wearable graphic.",
      },
    ],
    inspiration: [
      {
        title: "Thuluth",
        description:
          "A premium calligraphy direction for display pieces, keepsakes, and refined gifts.",
        imageSrc: "/styles/arabic/thuluth-gold.webp",
        imageAlt: "Thuluth Arabic calligraphy style example",
        href: buildStyleHref("arabic-calligraphy", "thuluth"),
      },
      {
        title: "Diwani",
        description:
          "A flowing calligraphy style that suits framed decor and meaningful gift pages.",
        imageSrc: "/styles/arabic/diwani-ink.webp",
        imageAlt: "Diwani Arabic calligraphy style example",
        href: buildStyleHref("arabic-calligraphy", "diwani"),
      },
      {
        title: "Kufic",
        description:
          "A structured Arabic style that can work especially well for modern products.",
        imageSrc: "/styles/arabic/kufic-geo.webp",
        imageAlt: "Kufic Arabic style example",
        href: buildStyleHref("arabic-calligraphy", "kufic"),
      },
    ],
    hubFaqItems: [
      {
        question: "Why make separate Arabic product pages?",
        answer:
          "Arabic calligraphy has different readability, cultural, and design considerations than Latin-letter name art.",
      },
      {
        question: "Which Arabic product is usually strongest?",
        answer:
          "Wall art is often the strongest format for detailed calligraphy, while mugs and shirts work best with simpler high-contrast compositions.",
      },
      {
        question: "Do these pages replace Arabic name gifts?",
        answer:
          "No. Arabic name gifts remains the broader gift hub. These pages are the product-specific Arabic name art layer.",
      },
    ],
    productCopy: {
      mugs: {
        title: "Arabic Name Art Mugs | Custom Calligraphy Mugs | Name Design AI",
        description:
          "Create Arabic name art mugs from calligraphy-inspired designs. Learn which Arabic styles stay readable on custom mugs before generating artwork.",
        h1: "Arabic name art mugs with calligraphy-inspired designs",
        intro:
          "Arabic name art mugs work when the calligraphy feels meaningful but remains readable on a compact curved surface. This page focuses on that Arabic-specific product fit.",
        secondaryIntro:
          "Use it for buyers searching for Arabic calligraphy mugs, personalized Arabic mugs, or daily-use gifts with a name in Arabic lettering.",
        highlights: [
          {
            title: "Compact calligraphy surface",
            description:
              "Arabic lettering needs enough spacing and contrast to stay legible on a mug.",
          },
          {
            title: "Meaningful daily-use gift",
            description:
              "A mug keeps the Arabic name visible in ordinary routines without turning the gift into only decor.",
          },
          {
            title: "Best with simpler styles",
            description:
              "Clean Thuluth, Kufic, and balanced Diwani-inspired designs often work better than very intricate layouts.",
          },
        ],
        designNotes: [
          {
            title: "Protect letter clarity",
            description:
              "Avoid calligraphy layouts where the name becomes too small or compressed.",
          },
          {
            title: "Use contrast intentionally",
            description:
              "Gold, black, blue, and monochrome Arabic designs can work well when the background stays clean.",
          },
          {
            title: "Keep decoration secondary",
            description:
              "Geometric or floral details should frame the Arabic name rather than dominate the mug.",
          },
        ],
        useCases: [
          {
            title: "Arabic birthday mugs",
            description:
              "Use a name or short phrase in Arabic lettering for a practical personal gift.",
          },
          {
            title: "Family keepsake mugs",
            description:
              "A clean Arabic name design can suit parents, siblings, teachers, or close family gifts.",
          },
          {
            title: "Occasion gifts",
            description:
              "Arabic name mugs can work around Eid, Ramadan, graduations, or everyday appreciation gifts.",
          },
        ],
        faqItems: [
          {
            question: "Can Arabic calligraphy fit on a mug?",
            answer:
              "Yes, as long as the calligraphy is not too dense and the name remains clear at mug size.",
          },
          {
            question: "Which Arabic styles are best for mugs?",
            answer:
              "Cleaner Thuluth, Kufic, and balanced Diwani-inspired styles usually work better than very ornate compositions.",
          },
          {
            question: "Is this the same as the Arabic gifts page?",
            answer:
              "No. The Arabic gifts page covers many gift intents. This page focuses only on Arabic name art mugs.",
          },
        ],
      },
      shirts: {
        title: "Arabic Name Art Shirts | Calligraphy T-Shirts | Name Design AI",
        description:
          "Explore Arabic name art shirts for wearable calligraphy-inspired designs. Compare style directions before creating custom Arabic shirt artwork.",
        h1: "Arabic name art shirts for wearable calligraphy",
        intro:
          "Arabic name art shirts need a confident graphic shape. The calligraphy should feel expressive enough for apparel while staying clear enough to read.",
        secondaryIntro:
          "This page helps visitors choose Arabic lettering styles that can survive fabric, scale, and movement better than delicate print-only designs.",
        highlights: [
          {
            title: "Wearable Arabic identity",
            description:
              "A shirt can turn Arabic name art into a personal statement rather than only a gift object.",
          },
          {
            title: "Strong graphic silhouettes",
            description:
              "Kufic, modern, and high-contrast calligraphy directions often work especially well on apparel.",
          },
          {
            title: "Useful for groups and events",
            description:
              "Arabic name shirts can support family events, cultural celebrations, teams, and personalized apparel.",
          },
        ],
        designNotes: [
          {
            title: "Simplify the linework",
            description:
              "Fabric is less forgiving than a poster, so heavy detail should be reduced before printing.",
          },
          {
            title: "Use a clear silhouette",
            description:
              "A shirt design should still look intentional from a distance, even if the viewer cannot read every letter immediately.",
          },
          {
            title: "Pick colors for fabric",
            description:
              "High-contrast Arabic lettering usually works better than subtle tonal effects on apparel.",
          },
        ],
        useCases: [
          {
            title: "Arabic name apparel",
            description:
              "Use the page for custom shirts centered on a name, family identity, or personal phrase.",
          },
          {
            title: "Event shirts",
            description:
              "Arabic lettering can create a cohesive visual identity for family gatherings or cultural events.",
          },
          {
            title: "Modern calligraphy shirts",
            description:
              "Cleaner modern Arabic styles can feel polished enough for everyday apparel.",
          },
        ],
        faqItems: [
          {
            question: "Do Arabic calligraphy designs work on shirts?",
            answer:
              "Yes, especially when the design has a strong silhouette, clear contrast, and less fine detail.",
          },
          {
            question: "Which Arabic style is best for shirts?",
            answer:
              "Modern Kufic, bold Thuluth-inspired, and high-contrast calligraphy styles usually translate best to shirts.",
          },
          {
            question: "Can I make matching Arabic name shirts?",
            answer:
              "Yes. Use a shared style direction for multiple names so the designs feel connected.",
          },
        ],
      },
      "wall-art": {
        title: "Arabic Name Art Wall Art | Custom Calligraphy Prints | Name Design AI",
        description:
          "Create Arabic name art wall art with calligraphy-inspired designs for framed prints, posters, rooms, and meaningful personalized gifts.",
        h1: "Arabic name art wall art for meaningful decor",
        intro:
          "Wall art is the strongest format for many Arabic name designs because calligraphy benefits from space, detail, and visual presence.",
        secondaryIntro:
          "This page targets visitors looking for Arabic name wall art, personalized Arabic calligraphy prints, and decor-worthy Arabic name designs.",
        highlights: [
          {
            title: "Best format for detail",
            description:
              "Arabic calligraphy can use flourishes, geometry, texture, and premium color palettes more safely on wall art.",
          },
          {
            title: "Strong keepsake intent",
            description:
              "A framed Arabic name print can feel meaningful for family gifts, nurseries, offices, and shared homes.",
          },
          {
            title: "Works across traditional and modern styles",
            description:
              "Thuluth, Diwani, Kufic, gold, ink, and geometric styles can each carry a different decor mood.",
          },
        ],
        designNotes: [
          {
            title: "Let the calligraphy breathe",
            description:
              "Wall art can support wider spacing, elegant negative space, and more expressive Arabic letterforms.",
          },
          {
            title: "Choose decor-level colors",
            description:
              "Gold, black, sand, emerald, and soft neutrals can help the print feel display-ready.",
          },
          {
            title: "Match the setting",
            description:
              "Nursery, office, wedding, and family-room prints may need different levels of softness or formality.",
          },
        ],
        useCases: [
          {
            title: "Arabic nursery decor",
            description:
              "A child's name in Arabic calligraphy can become a meaningful room print.",
          },
          {
            title: "Family and heritage gifts",
            description:
              "Arabic name prints can carry cultural and personal identity in a display-worthy format.",
          },
          {
            title: "Wedding or home decor",
            description:
              "Calligraphy-inspired wall art can feel appropriate for shared homes, offices, or milestone gifts.",
          },
        ],
        faqItems: [
          {
            question: "Is wall art the best product for Arabic name art?",
            answer:
              "Often yes, because wall art gives Arabic calligraphy room for detail, spacing, and premium presentation.",
          },
          {
            question: "Can I create Arabic nursery wall art?",
            answer:
              "Yes. Use softer Arabic styles, clean backgrounds, and a name-focused composition for nursery decor.",
          },
          {
            question: "How does this differ from personalized name wall art?",
            answer:
              "The broad wall art page covers all name styles. This page focuses specifically on Arabic name art and calligraphy-inspired prints.",
          },
        ],
      },
    },
  },
  "couples-art": {
    slug: "couples-art",
    label: "Couples Art",
    baseHref: "/couples-art",
    productsHref: "/couples-art/products",
    generatorHref: "/couples-name-art-generator",
    generatorLabel: "Create couples art",
    styleGalleryHref: "/couples-art/styles",
    styleGalleryLabel: "Browse couples styles",
    giftHubHref: "/personalized-gifts",
    giftHubLabel: "Couple Gifts",
    hubTitle: "Couples Art Products | Mugs, Shirts, Wall Art | Name Design AI",
    hubDescription:
      "Browse couples art products for mugs, shirts, and wall art. Turn romantic two-name artwork into anniversary, wedding, and keepsake gifts.",
    hubH1: "Couples art products for romantic gifts",
    eyebrow: "Couples Art Products",
    hubIntro:
      "Couples art products work best when the relationship stays central. This hub gives romantic, modern, and playful couple-name designs their own product layer beneath the broader couple gifts page.",
    hubSecondaryIntro:
      "Use these pages when a visitor already wants couple artwork but needs help choosing between mugs, shirts, and wall art for the final gift.",
    heroImage: "/styles/couples/c008e.webp",
    heroImageAlt: "Romantic couple name art example for personalized products",
    hubHighlights: [
      {
        title: "Relationship-first product pages",
        description:
          "Each page keeps the couple story and occasion in front of the product choice.",
      },
      {
        title: "Useful for milestone searches",
        description:
          "Anniversary, wedding, engagement, and shared-home gift intent can be routed into the right product format.",
      },
      {
        title: "Supports romantic and playful styles",
        description:
          "The same two-name concept can become decor, daily-use mugs, or matching apparel depending on tone.",
      },
    ],
    inspiration: [
      {
        title: "Timeless Love",
        description:
          "A romantic option for anniversary gifts, framed keepsakes, and classic couple products.",
        imageSrc: "/styles/couples/c008e.webp",
        imageAlt: "Timeless Love couple name art example",
        href: buildStyleHref("couples-art", "timeless-love"),
      },
      {
        title: "Chic & Simple",
        description:
          "A softer style that suits wedding gifts, shared decor, and keepsake prints.",
        imageSrc: "/styles/couples/c002e.webp",
        imageAlt: "Chic & Simple couple name art example",
        href: buildStyleHref("couples-art", "chic-and-simple"),
      },
      {
        title: "Unique & Cute",
        description:
          "A modern direction for shirts, minimal mugs, and contemporary home decor.",
        imageSrc: "/styles/couples/c018e.webp",
        imageAlt: "Unique & Cute couple name art example",
        href: buildStyleHref("couples-art", "unique-and-cute"),
      },
    ],
    hubFaqItems: [
      {
        question: "How is this different from couple gifts?",
        answer:
          "Couple gifts is the broader gift hub. This section focuses on product pages built from couples art specifically.",
      },
      {
        question: "Which product works best for couples art?",
        answer:
          "Wall art is usually strongest for keepsakes, mugs work well for practical gifts, and shirts fit matching or playful occasions.",
      },
      {
        question: "Can one couples art design work on multiple products?",
        answer:
          "Yes, but the final layout may need adjustments for each surface so the names, date, or symbol stay clear.",
      },
    ],
    productCopy: {
      mugs: {
        title: "Couples Art Mugs | Personalized Couple Name Mugs | Name Design AI",
        description:
          "Create couples art mugs from romantic two-name designs. Explore anniversary, wedding, and daily-use mug ideas before generating artwork.",
        h1: "Couples art mugs for romantic daily-use gifts",
        intro:
          "Couples art mugs turn two names, initials, or a shared date into a practical gift. The challenge is keeping the relationship message readable on a compact product.",
        secondaryIntro:
          "This page is for visitors searching for personalized couple mugs, romantic name mugs, or anniversary mugs built from actual artwork instead of generic templates.",
        highlights: [
          {
            title: "Practical romantic gift",
            description:
              "Mugs are useful enough for daily routines while still carrying a personalized couple design.",
          },
          {
            title: "Works for dates and initials",
            description:
              "A short date, initials, or two names can fit well when the composition stays simple.",
          },
          {
            title: "Good for light occasions",
            description:
              "Couple mugs suit anniversaries, Valentine's Day, engagements, and casual romantic gifts.",
          },
        ],
        designNotes: [
          {
            title: "Keep both names balanced",
            description:
              "Neither name should feel visually secondary unless the design intentionally uses initials or a shared symbol.",
          },
          {
            title: "Limit tiny romantic details",
            description:
              "Hearts, dates, flowers, or icons should stay readable instead of becoming noise on the mug.",
          },
          {
            title: "Use a direct focal area",
            description:
              "A mug design should make the couple theme clear quickly from one viewing angle.",
          },
        ],
        useCases: [
          {
            title: "Anniversary mugs",
            description:
              "Use both names with a year or short date for a gift that feels personal but practical.",
          },
          {
            title: "Engagement gifts",
            description:
              "A romantic couple mug can work as a lighter alternative to framed decor.",
          },
          {
            title: "Matching drinkware",
            description:
              "Use the same style direction for paired mugs or coordinated couple designs.",
          },
        ],
        faqItems: [
          {
            question: "Can couples art be printed on mugs?",
            answer:
              "Yes. It works best when both names are clear and the design avoids tiny details.",
          },
          {
            question: "Are couples art mugs good anniversary gifts?",
            answer:
              "Yes. They are practical, personal, and easy to connect to dates, names, or a shared phrase.",
          },
          {
            question: "How is this different from personalized name mugs?",
            answer:
              "The broad mug page covers many name mug ideas. This page focuses specifically on two-name couple artwork.",
          },
        ],
      },
      shirts: {
        title: "Couples Art Shirts | Matching Couple Name Shirts | Name Design AI",
        description:
          "Explore couples art shirts for matching, romantic, and playful two-name designs. Create shirt-ready couple artwork for events and gifts.",
        h1: "Couples art shirts for matching and romantic apparel",
        intro:
          "Couples art shirts need to feel wearable, not just sentimental. The design should make sense on apparel while still celebrating the relationship.",
        secondaryIntro:
          "This page targets matching couple shirts, anniversary shirts, and playful two-name apparel made from couples art rather than generic slogans.",
        highlights: [
          {
            title: "Best for matching gifts",
            description:
              "Couple shirts can work as coordinated apparel for travel, events, anniversaries, or casual gifts.",
          },
          {
            title: "Needs a bold layout",
            description:
              "Shirt-ready couples art should have clear names, strong contrast, and a shape that works on fabric.",
          },
          {
            title: "Can be romantic or playful",
            description:
              "Minimal, calligraphy, cartoon, and pop-art styles can each support a different relationship tone.",
          },
        ],
        designNotes: [
          {
            title: "Avoid overdecorating",
            description:
              "A shirt design can become busy quickly, especially when it includes two names and romantic symbols.",
          },
          {
            title: "Use shared visual language",
            description:
              "Matching shirts feel better when both designs use the same style, colors, or layout logic.",
          },
          {
            title: "Make it wearable",
            description:
              "The artwork should feel like apparel art first and a keepsake second.",
          },
        ],
        useCases: [
          {
            title: "Matching couple shirts",
            description:
              "Use one shared style with two names, initials, or coordinated phrases.",
          },
          {
            title: "Anniversary apparel",
            description:
              "A date or short phrase can make the shirt feel tied to a specific milestone.",
          },
          {
            title: "Playful relationship gifts",
            description:
              "Cartoon, comic, or modern styles can suit couples who prefer fun over formal keepsakes.",
          },
        ],
        faqItems: [
          {
            question: "Can I make matching couples art shirts?",
            answer:
              "Yes. Use a shared style direction so the two shirts feel coordinated even if each has different text.",
          },
          {
            question: "What style is best for couple shirts?",
            answer:
              "Clean modern, bold calligraphy, comic, and playful illustrated styles usually work best on apparel.",
          },
          {
            question: "Are couple shirts better than mugs or wall art?",
            answer:
              "They are better for wearable, matching, and event-based gifts. Wall art is usually stronger for keepsakes.",
          },
        ],
      },
      "wall-art": {
        title: "Couples Art Wall Art | Custom Couple Name Prints | Name Design AI",
        description:
          "Create couples art wall art for anniversaries, weddings, engagements, and shared-home decor. Turn two-name artwork into personalized prints.",
        h1: "Couples art wall art for anniversaries and shared spaces",
        intro:
          "Wall art is often the strongest product for couples art because it gives the relationship design enough space to feel like a keepsake.",
        secondaryIntro:
          "Use this page when visitors search for couple name prints, anniversary wall art, wedding keepsakes, or romantic decor built around two names.",
        highlights: [
          {
            title: "Strong keepsake format",
            description:
              "A framed couple design can live in a bedroom, living room, office, or shared home.",
          },
          {
            title: "Supports dates and milestones",
            description:
              "Wedding dates, anniversaries, engagement years, and shared phrases can fit naturally into wall art.",
          },
          {
            title: "Best for detailed romantic styles",
            description:
              "Watercolor, floral, calligraphy, and storybook styles have enough room to feel intentional.",
          },
        ],
        designNotes: [
          {
            title: "Design around the relationship",
            description:
              "The names, date, and visual mood should work together instead of feeling like separate elements.",
          },
          {
            title: "Use decor-friendly colors",
            description:
              "Wall art should match a room more than a screen, so softer or more intentional palettes often work best.",
          },
          {
            title: "Leave room for framing",
            description:
              "The design should not place essential names or dates too close to the edge.",
          },
        ],
        useCases: [
          {
            title: "Anniversary wall art",
            description:
              "Use names and a date to create a romantic keepsake for a shared room.",
          },
          {
            title: "Wedding gifts",
            description:
              "A two-name print can become a personal gift for newlyweds or engaged couples.",
          },
          {
            title: "Shared-home decor",
            description:
              "Couples art can personalize a home without relying on generic romantic quotes.",
          },
        ],
        faqItems: [
          {
            question: "Is wall art the best product for couples art?",
            answer:
              "Often yes, especially for anniversaries, weddings, engagements, and shared-home decor.",
          },
          {
            question: "Can I include a wedding date?",
            answer:
              "Yes. Dates, initials, and short phrases can be included when they do not crowd the names.",
          },
          {
            question: "How is this different from couple gifts?",
            answer:
              "Couple gifts covers many romantic gift formats. This page focuses specifically on wall art made from couples art.",
          },
        ],
      },
    },
  },
};

const getProductImage = (styleSlug: StyleProductHubSlug, productSlug: StyleProductSlug) => {
  const product = PRODUCT_CONFIGS[productSlug];

  if (styleSlug === "arabic-calligraphy" && product.arabicImage) {
    return {
      imageSrc: product.arabicImage,
      imageAlt: product.arabicImageAlt ?? product.defaultImageAlt,
    };
  }

  return {
    imageSrc: product.defaultImage,
    imageAlt: product.defaultImageAlt,
  };
};

const getProductHref = (styleSlug: StyleProductHubSlug, productSlug: StyleProductSlug) =>
  `/${styleSlug}/products/${productSlug}`;

const getSiblingProductCards = (
  styleSlug: StyleProductHubSlug,
  currentProductSlug?: StyleProductSlug,
): StyleProductCard[] =>
  STYLE_PRODUCT_SLUGS.filter((slug) => slug !== currentProductSlug).map((slug) => {
    const product = PRODUCT_CONFIGS[slug];
    const copy = STYLE_CONFIGS[styleSlug].productCopy[slug];
    const image = getProductImage(styleSlug, slug);

    return {
      href: getProductHref(styleSlug, slug),
      label: `${STYLE_CONFIGS[styleSlug].label} ${product.label}`,
      description: copy.description,
      ...image,
    };
  });

const getProductCardsForHub = (styleSlug: StyleProductHubSlug): StyleProductCard[] =>
  STYLE_PRODUCT_SLUGS.map((slug) => {
    const product = PRODUCT_CONFIGS[slug];
    const copy = STYLE_CONFIGS[styleSlug].productCopy[slug];
    const image = getProductImage(styleSlug, slug);

    return {
      href: getProductHref(styleSlug, slug),
      label: `${STYLE_CONFIGS[styleSlug].label} ${product.label}`,
      description: copy.description,
      ...image,
    };
  });

export function getStyleProductHubConfig(
  styleSlug: StyleProductHubSlug,
): StyleProductHubConfig {
  const style = STYLE_CONFIGS[styleSlug];
  const productCards = getProductCardsForHub(styleSlug);

  return {
    slug: styleSlug,
    path: style.productsHref,
    title: style.hubTitle,
    description: style.hubDescription,
    h1: style.hubH1,
    eyebrow: style.eyebrow,
    intro: style.hubIntro,
    secondaryIntro: style.hubSecondaryIntro,
    heroImage: style.heroImage,
    heroImageAlt: style.heroImageAlt,
    generatorHref: style.generatorHref,
    generatorLabel: style.generatorLabel,
    styleGalleryHref: style.styleGalleryHref,
    styleGalleryLabel: style.styleGalleryLabel,
    productCards,
    highlights: style.hubHighlights,
    inspiration: style.inspiration,
    relatedLinks: [
      {
        href: style.baseHref,
        label: style.label,
        description: `Return to the main ${style.label.toLowerCase()} page for styles, examples, and generator context.`,
      },
      {
        href: style.giftHubHref,
        label: style.giftHubLabel,
        description:
          "Use the broader gift hub when the search intent is more about recipient or occasion than product surface.",
      },
      ...productCards.map((card) => ({
        href: card.href,
        label: card.label,
        description: card.description,
      })),
    ],
    faqItems: style.hubFaqItems,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: style.label, path: style.baseHref },
      { name: "Products", path: style.productsHref },
    ],
  };
}

export function getStyleProductDetailConfig(
  styleSlug: StyleProductHubSlug,
  productSlug: StyleProductSlug,
): StyleProductDetailConfig {
  const style = STYLE_CONFIGS[styleSlug];
  const product = PRODUCT_CONFIGS[productSlug];
  const copy = style.productCopy[productSlug];
  const image = getProductImage(styleSlug, productSlug);
  const sameProductCrossStyleLinks = STYLE_PRODUCT_HUB_SLUGS.filter(
    (slug) => slug !== styleSlug,
  ).map((slug) => ({
    href: getProductHref(slug, productSlug),
    label: `${STYLE_CONFIGS[slug].label} ${product.label}`,
    description: `Compare ${product.shortLabel} ideas built from ${STYLE_CONFIGS[
      slug
    ].label.toLowerCase()} instead of ${style.label.toLowerCase()}.`,
  }));

  return {
    styleSlug,
    productSlug,
    path: getProductHref(styleSlug, productSlug),
    title: copy.title,
    description: copy.description,
    h1: copy.h1,
    eyebrow: `${style.label} ${product.label}`,
    intro: copy.intro,
    secondaryIntro: copy.secondaryIntro,
    heroImage: image.imageSrc,
    heroImageAlt: image.imageAlt,
    generatorHref: style.generatorHref,
    generatorLabel: style.generatorLabel,
    hubHref: style.productsHref,
    hubLabel: `${style.label} Products`,
    broadProductHref: product.broadProductHref,
    broadProductLabel: product.broadProductLabel,
    highlights: copy.highlights,
    designNotes: [
      {
        title: "Product surface fit",
        description: product.surfaceNote,
      },
      ...copy.designNotes,
    ],
    useCases: copy.useCases,
    inspiration: style.inspiration,
    relatedProducts: getSiblingProductCards(styleSlug, productSlug),
    crossStyleLinks: [
      {
        href: product.broadProductHref,
        label: product.broadProductLabel,
        description:
          "Use the broad product hub when you want every style, not just this style-specific page.",
      },
      ...sameProductCrossStyleLinks,
    ],
    faqItems: copy.faqItems,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: style.label, path: style.baseHref },
      { name: "Products", path: style.productsHref },
      { name: product.label, path: getProductHref(styleSlug, productSlug) },
    ],
  };
}

export function isStyleProductSlug(value: string): value is StyleProductSlug {
  return STYLE_PRODUCT_SLUGS.includes(value as StyleProductSlug);
}

export const STYLE_PRODUCT_SEO_PATHS = STYLE_PRODUCT_HUB_SLUGS.flatMap(
  (styleSlug) => [
    STYLE_CONFIGS[styleSlug].productsHref,
    ...STYLE_PRODUCT_SLUGS.map((productSlug) =>
      getProductHref(styleSlug, productSlug),
    ),
  ],
);
