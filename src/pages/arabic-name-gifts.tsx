import { type NextPage } from "next";

import { ProductCategoryPage } from "~/component/ProductCategoryPage";
import {
  getCategoryCards,
  getNameArtExamples,
  getProductMockups,
} from "~/lib/productCategoryVisuals";

const ArabicNameGiftsPage: NextPage = () => {
  return (
    <ProductCategoryPage
      title="Arabic Name Gifts | Name Design AI"
      description="Explore Arabic name gifts built from AI-assisted calligraphy and Arabic name art. Find gift-ready paths for mugs, wall art, and personalized keepsakes."
      path="/arabic-name-gifts"
      h1="Arabic name gifts built from calligraphy-inspired artwork"
      eyebrow="Gift Category"
      intro="Arabic name gifts need more than a generic product template. They work best when the core design has real visual presence, and Arabic calligraphy is often the strongest starting point for that. This page helps connect Arabic name art to decor and gift ideas in a clearer way."
      secondaryIntro="Use this route when someone already knows they want a personalized Arabic gift, but still needs help choosing the right product and design direction. The artwork remains central, while the product format becomes the second decision."
      highlights={[
        {
          title: "Culturally specific design path",
          description:
            "Arabic lettering and calligraphy create a distinct visual identity that generic custom product pages usually miss.",
        },
        {
          title: "Strong decor and keepsake fit",
          description:
            "Arabic calligraphy is particularly effective in framed prints, meaningful gifts, and display-ready artwork.",
        },
        {
          title: "Supports multiple product outputs",
          description:
            "The same Arabic artwork can move into mugs, wall art, and other personalized gift categories.",
        },
      ]}
      useCases={[
        {
          title: "Family and heritage gifts",
          description:
            "Arabic name gifts often work best when the buyer wants the design to carry identity, heritage, or cultural weight.",
        },
        {
          title: "Religious or occasion-adjacent decor",
          description:
            "Calligraphy-led art can suit meaningful spaces and gifting moments without forcing the page into a specific seasonal campaign.",
        },
        {
          title: "Modern Arabic profile or brand gifts",
          description:
            "Some buyers want Arabic lettering that still feels polished and contemporary enough for branding or modern decor.",
        },
        {
          title: "Calligraphy-led keepsakes",
          description:
            "Arabic artwork can feel especially premium when used on a framed print or carefully composed keepsake product.",
        },
      ]}
      generatorLinks={[
        {
          href: "/arabic-calligraphy",
          label: "Arabic Name Art",
          description:
            "The best starting point when Arabic calligraphy is the central visual requirement.",
        },
        {
          href: "/personalized-name-wall-art",
          label: "Wall Art Route",
          description:
            "Use this when the gift is likely to become framed decor or a display piece.",
        },
        {
          href: "/personalized-name-mugs",
          label: "Mug Route",
          description:
            "Use this when the buyer wants a practical daily-use gift with Arabic lettering.",
        },
      ]}
      relatedLinks={[
        {
          href: "/personalized-gifts",
          label: "Personalized Gifts",
          description:
            "Return to the broader gift hub if the buyer is still comparing Arabic and non-Arabic gift paths.",
        },
        {
          href: "/personalized-name-wall-art",
          label: "Personalized Name Wall Art",
          description:
            "Often the strongest format for detailed Arabic calligraphy and premium-looking keepsakes.",
        },
        {
          href: "/personalized-name-mugs",
          label: "Personalized Name Mugs",
          description:
            "Useful when the buyer wants a gift that is both personal and practical.",
        },
        {
          href: "/arabic-calligraphy/products",
          label: "Arabic Name Art Products",
          description:
            "Compare Arabic calligraphy mugs, shirts, and wall art by product surface.",
        },
        {
          href: "/arabic-calligraphy/products/wall-art",
          label: "Arabic Name Art Wall Art",
          description:
            "Best when the Arabic name design should become a decor-ready print.",
        },
        {
          href: "/arabic-calligraphy/products/mugs",
          label: "Arabic Name Art Mugs",
          description:
            "Best when the Arabic calligraphy gift should be practical and used daily.",
        },
      ]}
      categoryCards={getCategoryCards([
        "/arabic-name-gifts",
        "/personalized-name-wall-art",
        "/personalized-name-mugs",
        "/custom-name-shirts",
        "/couple-gifts",
      ])}
      nameArtExamples={getNameArtExamples([
        "fatima",
        "aisha",
        "sarah",
        "olivia",
      ])}
      productMockups={getProductMockups([
        "arabicWallArt",
        "arabicMug",
        "arabicShirt",
      ])}
      faqItems={[
        {
          question: "Why use a dedicated Arabic gift page instead of a generic product page?",
          answer:
            "Arabic lettering needs a stronger design-first explanation so the visitor understands the artwork options before choosing the product.",
        },
        {
          question: "What product format usually works best for Arabic name gifts?",
          answer:
            "Wall art is often the strongest fit, but mugs and other products can work well when the composition remains clean and readable.",
        },
        {
          question: "Can this page support both personal and commercial use cases?",
          answer:
            "Yes. Some visitors want decor or gifts, while others want Arabic name visuals for profile art, branding, or identity-led design exploration.",
        },
      ]}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Personalized Gifts", path: "/personalized-gifts" },
        { name: "Arabic Name Gifts", path: "/arabic-name-gifts" },
      ]}
    />
  );
};

export default ArabicNameGiftsPage;
