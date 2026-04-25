import { type NextPage } from "next";

import { ProductCategoryPage } from "~/component/ProductCategoryPage";
import {
  getCategoryCards,
  getNameArtExamples,
  getProductMockups,
} from "~/lib/productCategoryVisuals";

const PersonalizedNameMugsPage: NextPage = () => {
  return (
    <ProductCategoryPage
      title="Personalized Name Mugs | Name Design AI"
      description="Create personalized name mugs from custom name art, Arabic calligraphy, or relationship-based designs. Use this page for gift-ready mug ideas that start with identity."
      path="/personalized-gifts"
      h1="Personalized name mugs built from custom artwork"
      eyebrow="Product Category"
      intro="A personalized name mug works best when the design starts with a real identity cue: a person's name, initials, a romantic pairing, or an Arabic calligraphy concept. This page connects that idea to a mug-friendly workflow without flattening it into generic merchandise."
      secondaryIntro="If you want a gift that feels useful and personal at the same time, mugs are a strong fit. Start with artwork that already feels right as name art, then refine it so it reads cleanly on a product people use every day."
      highlights={[
        {
          title: "Daily-use gift format",
          description:
            "Mugs are practical enough to be used regularly, which makes the underlying name design more visible over time.",
        },
        {
          title: "Works with multiple styles",
          description:
            "Playful, elegant, and bold designs can all work on mugs as long as the composition stays readable.",
        },
        {
          title: "Easy handoff from generator to product",
          description:
            "The current product workflow already supports mugs once a compatible design exists.",
        },
      ]}
      useCases={[
        {
          title: "Birthday gifts",
          description:
            "A mug built from custom name art is a simple personalized gift when the recipient uses it often.",
        },
        {
          title: "Desk and work gifts",
          description:
            "Readable name-based artwork works well on office mugs, study setups, and remote-work spaces.",
        },
        {
          title: "Arabic calligraphy mugs",
          description:
            "Arabic name art is especially strong when the buyer wants a gift with cultural identity or calligraphic elegance.",
        },
        {
          title: "Couple mug sets",
          description:
            "Two-name or relationship-based artwork can translate into coordinated mug gifts for couples.",
        },
      ]}
      generatorLinks={[
        {
          href: "/name-art",
          label: "Start with Name Art",
          description:
            "Use this when the mug should feature one name, initials, or a short word.",
        },
        {
          href: "/arabic-calligraphy",
          label: "Start with Arabic Name Art",
          description:
            "Use this when the mug should feature Arabic lettering or calligraphy-inspired styling.",
        },
        {
          href: "/couples-art",
          label: "Start with Couples Art",
          description:
            "Use this when the mug is meant for a pair, an anniversary, or a romantic gift.",
        },
      ]}
      relatedLinks={[
        {
          href: "/personalized-gifts",
          label: "Personalized Gifts",
          description:
            "Return to the broader gift hub if you want to compare mugs with other product categories.",
        },
        {
          href: "/personalized-gifts",
          label: "Custom Name Shirts",
          description:
            "Better fit if the artwork needs larger scale or stronger graphic expression.",
        },
        {
          href: "/personalized-gifts",
          label: "Personalized Name Wall Art",
          description:
            "Better fit if the design should be framed or displayed rather than used daily.",
        },
        {
          href: "/name-art/products/mugs",
          label: "Name Art Mugs",
          description:
            "Use this when the search intent is specifically personalized name art on mugs.",
        },
        {
          href: "/arabic-calligraphy/products/mugs",
          label: "Arabic Name Art Mugs",
          description:
            "Use this for Arabic calligraphy-inspired mugs and Arabic-name product intent.",
        },
        {
          href: "/couples-art/products/mugs",
          label: "Couples Art Mugs",
          description:
            "Use this for romantic two-name mugs, anniversary mugs, and couple keepsakes.",
        },
      ]}
      categoryCards={getCategoryCards([
        "/personalized-gifts",
        "/personalized-gifts",
        "/personalized-gifts",
        "/personalized-gifts",
        "/personalized-gifts",
      ])}
      nameArtExamples={getNameArtExamples([
        "emma",
        "amelia",
        "sarah",
        "olivia",
      ])}
      productMockups={getProductMockups(["mug", "wallArt", "shirt"])}
      faqItems={[
        {
          question: "What kind of name art works best on a mug?",
          answer:
            "Designs with a clear focal point, readable lettering, and a balanced layout usually transfer best to mugs.",
        },
        {
          question: "Can Arabic name art be used on mugs?",
          answer:
            "Yes. Arabic calligraphy-style artwork is a strong fit for mug gifts when the layout remains legible and visually balanced.",
        },
        {
          question: "Is this page meant to replace the generator?",
          answer:
            "No. This page helps visitors choose the mug use case first, then move into the right generator to create the artwork.",
        },
      ]}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Personalized Gifts", path: "/personalized-gifts" },
        { name: "Personalized Name Mugs", path: "/personalized-gifts" },
      ]}
    />
  );
};

export default PersonalizedNameMugsPage;
