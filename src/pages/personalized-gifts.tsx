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
      description="Explore personalized gifts built from custom name art, Arabic calligraphy, and couple designs. Find a clear path into mugs, shirts, wall art, and occasion-ready keepsakes."
      path="/personalized-gifts"
      h1="Personalized gifts made from identity-driven artwork"
      eyebrow="Gift Hub"
      intro="NameDesignAI starts with a name, phrase, or relationship and turns that identity cue into artwork that can be adapted for gifts. This page is the safest public entry point for visitors who already know they want a personalized gift, but have not decided on the exact product format."
      secondaryIntro="Use the pages below to narrow by product type, recipient, or visual style. The goal is to keep the creative workflow centered on the person or relationship first, then choose the mug, shirt, wall art, or gift format that best fits the occasion."
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
          href: "/name-art",
          label: "Name Art Generator",
          description:
            "Best when the gift begins with one name, initials, or a custom phrase.",
        },
        {
          href: "/arabic-name-art",
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
          href: "/personalized-name-mugs",
          label: "Personalized Name Mugs",
          description:
            "Daily-use gift format with room for playful, sentimental, or celebratory artwork.",
        },
        {
          href: "/custom-name-shirts",
          label: "Custom Name Shirts",
          description:
            "Apparel-focused page for wearable name art and stronger graphic styles.",
        },
        {
          href: "/personalized-name-wall-art",
          label: "Personalized Name Wall Art",
          description:
            "Decor-first route for framed prints, posters, and display-ready artwork.",
        },
        {
          href: "/arabic-name-gifts",
          label: "Arabic Name Gifts",
          description:
            "Gift page built around Arabic calligraphy and Arabic name design.",
        },
        {
          href: "/couple-gifts",
          label: "Couple Gifts",
          description:
            "Relationship-focused gift page for anniversaries, weddings, and romantic keepsakes.",
        },
      ]}
      categoryCardsHeading="Browse personalized gift categories"
      categoryCards={getCategoryCards([
        "/personalized-name-mugs",
        "/custom-name-shirts",
        "/personalized-name-wall-art",
        "/arabic-name-gifts",
        "/couple-gifts",
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
