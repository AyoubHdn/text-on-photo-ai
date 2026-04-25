import { type NextPage } from "next";

import { ProductCategoryPage } from "~/component/ProductCategoryPage";
import {
  getCategoryCards,
  getNameArtExamples,
  getProductMockups,
} from "~/lib/productCategoryVisuals";

const PersonalizedGiftsPage: NextPage = () => {
  return (
    <ProductCategoryPage
      title="Personalized Gifts | Name Design AI"
      description="Explore personalized gifts from name art: mugs, shirts, wall art, Arabic calligraphy gifts, and couples keepsakes with clear product paths."
      path="/personalized-gifts"
      h1="Personalized gifts made from identity-driven artwork"
      eyebrow="Gift Hub"
      intro="NameDesignAI starts with a name, phrase, or relationship and turns that identity cue into artwork that can be adapted for gifts. This page is the safest public entry point for visitors who already know they want a personalized gift, but have not decided on the exact product format."
      secondaryIntro="Use the pages below to narrow by product type, audience, or visual style. The goal is to keep the creative workflow centered on the person, Arabic name, or couple first, then choose the mug, shirt, wall art, or gift format that best fits the occasion."
      highlights={[
        {
          title: "Identity-first creation",
          description:
            "Start with a real name, initials, couple pairing, or Arabic calligraphy direction instead of a generic product template.",
        },
        {
          title: "Works across gift formats",
          description:
            "The same design can support mugs, shirts, framed prints, or keepsake-focused gift pages.",
        },
        {
          title: "Aligned with current workflow",
          description:
            "Create the artwork first, then move into a product page once the style direction is locked in.",
        },
      ]}
      useCases={[
        {
          title: "Birthday and personal milestone gifts",
          description:
            "Use name art when the gift should feel like it was made for one person rather than picked from a standard catalog.",
        },
        {
          title: "Home decor that still feels personal",
          description:
            "Wall art and framed prints work well when the goal is a gift that lives in a room, office, or shared space.",
        },
        {
          title: "Relationship and family keepsakes",
          description:
            "Couple names, family names, and Arabic calligraphy can all carry stronger emotional weight than a generic product slogan.",
        },
        {
          title: "Product-ready gift bundles",
          description:
            "Once a name-based design is approved, you can adapt it into multiple formats without changing the core concept.",
        },
      ]}
      generatorLinks={[
        {
          href: "/name-art-generator",
          label: "Create Name Art",
          description:
            "Best when the gift begins with one name, initials, or a custom phrase.",
        },
        {
          href: "/arabic-calligraphy",
          label: "Arabic Name Art",
          description:
            "Best for calligraphy-driven gifts, Arabic names, and culturally specific visual direction.",
        },
        {
          href: "/couples-art",
          label: "Couples Name Art",
          description:
            "Best for anniversaries, engagements, weddings, and relationship-centered keepsakes.",
        },
      ]}
      relatedLinks={[
        {
          href: "/name-art/products/mugs",
          label: "Name Art Mugs",
          description:
            "Daily-use mug gifts built from personalized name art and readable artwork.",
        },
        {
          href: "/name-art/products/shirts",
          label: "Name Art Shirts",
          description:
            "Wearable name art for bolder typography, nicknames, and event-ready gifts.",
        },
        {
          href: "/name-art/products/wall-art",
          label: "Name Art Wall Art",
          description:
            "Decor-ready prints and posters made from personalized name designs.",
        },
        {
          href: "/arabic-calligraphy/products/mugs",
          label: "Arabic Name Art Mugs",
          description:
            "Practical mug gifts using Arabic calligraphy-inspired name artwork.",
        },
        {
          href: "/arabic-calligraphy/products/shirts",
          label: "Arabic Name Art Shirts",
          description:
            "Wearable Arabic lettering and calligraphy-led custom apparel.",
        },
        {
          href: "/arabic-calligraphy/products/wall-art",
          label: "Arabic Name Art Wall Art",
          description:
            "Framed prints and posters for Arabic name art, decor, and keepsakes.",
        },
        {
          href: "/couples-art/products/mugs",
          label: "Couples Art Mugs",
          description:
            "Romantic daily-use mugs made from two-name couple artwork.",
        },
        {
          href: "/couples-art/products/shirts",
          label: "Couples Art Shirts",
          description:
            "Matching and romantic apparel for couples, anniversaries, and events.",
        },
        {
          href: "/couples-art/products/wall-art",
          label: "Couples Art Wall Art",
          description:
            "Shared-home decor, anniversary prints, and wedding keepsakes from couple art.",
        },
      ]}
      categoryCardsHeading="Browse personalized gift categories"
      categoryCards={getCategoryCards([
        "nameMugs",
        "nameShirts",
        "nameWallArt",
        "arabicGifts",
        "coupleGifts",
      ])}
      nameArtExamples={getNameArtExamples([
        "emma",
        "olivia",
        "fatima",
        "sarah",
      ])}
      productMockups={getProductMockups(["mug", "shirt", "wallArt"])}
      faqItems={[
        {
          question: "What makes these gifts different from generic custom products?",
          answer:
            "The design starts from the identity or relationship first, so the final product feels personal before it ever becomes a mug, shirt, or print.",
        },
        {
          question: "Do I need an existing design before using these pages?",
          answer:
            "No. These pages help you choose the right product direction, then guide you to the matching generator or category page to create the artwork.",
        },
        {
          question: "When should I use /products instead of this page?",
          answer:
            "Use this page when you want ideas by occasion or recipient. Use /products when you already know you want to browse the product catalog directly.",
        },
      ]}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Personalized Gifts", path: "/personalized-gifts" },
      ]}
    />
  );
};

export default PersonalizedGiftsPage;
