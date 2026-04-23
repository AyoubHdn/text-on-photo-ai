import { type NextPage } from "next";

import { ProductCategoryPage } from "~/component/ProductCategoryPage";
import {
  getCategoryCards,
  getNameArtExamples,
  getProductMockups,
} from "~/lib/productCategoryVisuals";

const PersonalizedNameWallArtPage: NextPage = () => {
  return (
    <ProductCategoryPage
      title="Personalized Name Wall Art | Name Design AI"
      description="Create personalized name wall art from custom name art, Arabic calligraphy, or couple designs. Explore decor-ready pages for framed prints, posters, and keepsake displays."
      path="/personalized-name-wall-art"
      h1="Personalized name wall art for rooms, homes, and keepsakes"
      eyebrow="Product Category"
      intro="Wall art is one of the strongest end uses for name-driven artwork because it gives the design room to breathe. This page helps visitors move from a custom name or relationship into a decor-ready format without losing the original identity-first intent."
      secondaryIntro="If the design is meant to live on a wall rather than in a drawer, on a desk, or on clothing, framed prints and posters usually give the artwork the most visual impact. That makes this page a natural bridge between generator intent and physical decor intent."
      highlights={[
        {
          title: "Best fit for detailed artwork",
          description:
            "Wall art supports richer visuals, more layered styling, and layouts that deserve more space.",
        },
        {
          title: "Works across rooms and occasions",
          description:
            "Personalized prints can be used for bedrooms, nurseries, offices, weddings, and family gifts.",
        },
        {
          title: "Natural decor path",
          description:
            "This category keeps the artwork central instead of shrinking it down to fit a smaller product surface.",
        },
      ]}
      useCases={[
        {
          title: "Bedroom and nursery decor",
          description:
            "Name art is especially strong when the artwork is meant to personalize a child's room or a family space.",
        },
        {
          title: "Office and workspace decor",
          description:
            "More refined typography or Arabic calligraphy can work well in offices and personal workspaces.",
        },
        {
          title: "Wedding and anniversary keepsakes",
          description:
            "Couple name art is often best displayed as a framed print or poster rather than a small product.",
        },
        {
          title: "Gift-ready framed prints",
          description:
            "Wall art is a useful gift format when the buyer wants something decorative and lasting.",
        },
      ]}
      generatorLinks={[
        {
          href: "/name-art",
          label: "Start with Name Art",
          description:
            "Best for one-name decor, initials, and custom phrase artwork.",
        },
        {
          href: "/arabic-name-art",
          label: "Start with Arabic Name Art",
          description:
            "Best when calligraphy is the main design feature and the artwork should be displayed prominently.",
        },
        {
          href: "/couples-art",
          label: "Start with Couples Art",
          description:
            "Best for relationship-centered keepsakes that are meant to be framed or displayed.",
        },
      ]}
      relatedLinks={[
        {
          href: "/personalized-gifts",
          label: "Personalized Gifts",
          description:
            "Use the broader hub if you are still deciding between decor and other product types.",
        },
        {
          href: "/personalized-name-mugs",
          label: "Personalized Name Mugs",
          description:
            "Better fit when the gift should be practical and used daily.",
        },
        {
          href: "/couple-gifts",
          label: "Couple Gifts",
          description:
            "Good next step when the wall art concept is tied to weddings, anniversaries, or shared spaces.",
        },
        {
          href: "/name-art/products/wall-art",
          label: "Name Art Wall Art",
          description:
            "Use this when the wall art is specifically built from personalized name art.",
        },
        {
          href: "/arabic-name-art/products/wall-art",
          label: "Arabic Name Art Wall Art",
          description:
            "Use this for Arabic calligraphy prints and Arabic-name decor intent.",
        },
        {
          href: "/couples-art/products/wall-art",
          label: "Couples Art Wall Art",
          description:
            "Use this for romantic two-name prints, anniversary art, and wedding keepsakes.",
        },
      ]}
      categoryCards={getCategoryCards([
        "/personalized-name-wall-art",
        "/personalized-name-mugs",
        "/custom-name-shirts",
        "/arabic-name-gifts",
        "/couple-gifts",
      ])}
      nameArtExamples={getNameArtExamples([
        "olivia",
        "fatima",
        "emma",
        "sarah",
      ])}
      productMockups={getProductMockups(["wallArt", "mug", "shirt"])}
      faqItems={[
        {
          question: "Why is wall art such a strong fit for personalized name designs?",
          answer:
            "Wall art gives the custom lettering and visual style enough room to feel intentional, decorative, and display-worthy.",
        },
        {
          question: "Can Arabic name art be used as framed decor?",
          answer:
            "Yes. Arabic calligraphy-style artwork is one of the strongest candidates for framed prints and decor-focused products.",
        },
        {
          question: "Should I start with the product page or the generator?",
          answer:
            "Start with the generator or the matching name-art page so the artwork is strong before choosing the final decor format.",
        },
      ]}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Personalized Gifts", path: "/personalized-gifts" },
        { name: "Personalized Name Wall Art", path: "/personalized-name-wall-art" },
      ]}
    />
  );
};

export default PersonalizedNameWallArtPage;
