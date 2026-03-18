import { type NextPage } from "next";

import { ProductCategoryPage } from "~/component/ProductCategoryPage";
import {
  getCategoryCards,
  getNameArtExamples,
  getProductMockups,
} from "~/lib/productCategoryVisuals";

const CustomNameShirtsPage: NextPage = () => {
  return (
    <ProductCategoryPage
      title="Custom Name Shirts | Name Design AI"
      description="Create custom name shirts from personalized name art and bolder graphic styles. Explore shirt-ready paths for names, nicknames, family gifts, and couple designs."
      path="/custom-name-shirts"
      h1="Custom name shirts from AI-generated name art"
      eyebrow="Product Category"
      intro="Custom name shirts need artwork that reads clearly at a wearable scale. This page helps visitors choose a name-first design path, then match it to a shirt-friendly visual direction without losing the personalization angle."
      secondaryIntro="Compared with mugs or framed prints, shirts usually work best with cleaner layouts, stronger contrast, and more graphic confidence. That makes this category especially relevant for bold typography, playful styles, and identity-driven apparel."
      highlights={[
        {
          title: "Wearable identity product",
          description:
            "Shirts work best when the artwork feels expressive enough to be worn, not just displayed.",
        },
        {
          title: "Supports bold style families",
          description:
            "Graphic, playful, and high-contrast name art styles often translate better to apparel than delicate layouts.",
        },
        {
          title: "Useful for gifts and self-expression",
          description:
            "Custom name shirts can work for personal style, family events, birthdays, or couple sets.",
        },
      ]}
      useCases={[
        {
          title: "Birthday and event shirts",
          description:
            "Name-based apparel works well for celebrations, family reunions, and custom group moments.",
        },
        {
          title: "Playful or bold personal gifts",
          description:
            "If the recipient likes wearable gifts more than home decor, a shirt can be a better fit than wall art.",
        },
        {
          title: "Couple and matching shirts",
          description:
            "Relationship-themed art can be adapted into paired designs when the composition stays simple enough for apparel.",
        },
        {
          title: "Graphic nickname or gamer-style designs",
          description:
            "Bolder name art families often feel most natural on shirts and other apparel formats.",
        },
      ]}
      generatorLinks={[
        {
          href: "/name-art",
          label: "Start with Name Art",
          description:
            "Best when the shirt should focus on one name, nickname, or bold custom phrase.",
        },
        {
          href: "/couples-art",
          label: "Start with Couples Art",
          description:
            "Best when the shirt design should celebrate a relationship or matching set.",
        },
        {
          href: "/personalized-gifts",
          label: "Gift Hub",
          description:
            "Return to the broader gift hub if apparel may not be the best format for the idea.",
        },
      ]}
      relatedLinks={[
        {
          href: "/personalized-name-mugs",
          label: "Personalized Name Mugs",
          description:
            "Better fit when the buyer wants daily-use gifting without wearable styling.",
        },
        {
          href: "/personalized-name-wall-art",
          label: "Personalized Name Wall Art",
          description:
            "Better fit when the design is more decorative than graphic.",
        },
        {
          href: "/couple-gifts",
          label: "Couple Gifts",
          description:
            "Use this when the apparel idea is part of a broader anniversary or relationship gift set.",
        },
      ]}
      categoryCards={getCategoryCards([
        "/custom-name-shirts",
        "/personalized-name-mugs",
        "/personalized-name-wall-art",
        "/couple-gifts",
        "/arabic-name-gifts",
      ])}
      nameArtExamples={getNameArtExamples([
        "sarah",
        "emma",
        "aisha",
        "amelia",
      ])}
      productMockups={getProductMockups(["shirt", "mug", "wallArt"])}
      faqItems={[
        {
          question: "What styles work best for custom name shirts?",
          answer:
            "Shirt-ready designs usually benefit from bolder typography, clear contrast, and a simpler layout than decor-focused name art.",
        },
        {
          question: "Can I use couple artwork on shirts?",
          answer:
            "Yes. Couple-focused artwork can work on matching or coordinated shirts if the final layout is readable and balanced.",
        },
        {
          question: "When should I use /products instead of this page?",
          answer:
            "Use this page when you want shirt-specific ideas and guidance. Use /products when you already know you want to browse the product catalog directly.",
        },
      ]}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Personalized Gifts", path: "/personalized-gifts" },
        { name: "Custom Name Shirts", path: "/custom-name-shirts" },
      ]}
    />
  );
};

export default CustomNameShirtsPage;
