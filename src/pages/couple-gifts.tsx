import { type NextPage } from "next";

import { ProductCategoryPage } from "~/component/ProductCategoryPage";
import {
  getCategoryCards,
  getNameArtExamples,
  getProductMockups,
} from "~/lib/productCategoryVisuals";

const CoupleGiftsPage: NextPage = () => {
  return (
    <ProductCategoryPage
      title="Couple Gifts | Name Design AI"
      description="Explore couple gifts built from personalized couple name art. Find routes for anniversaries, weddings, shared decor, and romantic keepsakes."
      path="/personalized-gifts"
      h1="Couple gifts built from personalized name art"
      eyebrow="Gift Category"
      intro="Couple gifts work best when the artwork feels like it belongs to the relationship itself rather than a generic product catalog. This page turns couple name art into a stronger gifting architecture for anniversaries, weddings, engagements, and shared-home decor."
      secondaryIntro="Use this route when the buyer already has relationship intent but still needs help choosing the right output. The artwork can remain romantic, elegant, playful, or modern, while the final product format depends on the occasion and where the gift will live."
      highlights={[
        {
          title: "Relationship-first positioning",
          description:
            "The page keeps the focus on the couple, the milestone, and the story before narrowing into products.",
        },
        {
          title: "Strong fit for milestones",
          description:
            "Anniversaries, weddings, and new-home gifts often need a more intentional route than generic personalized merchandise.",
        },
        {
          title: "Supports decor and practical gifts",
          description:
            "Couple artwork can move into framed wall art, mugs, prints, or other keepsake-oriented categories.",
        },
      ]}
      useCases={[
        {
          title: "Anniversary gifts",
          description:
            "Name art helps anniversary gifts feel specific to the relationship instead of generic and interchangeable.",
        },
        {
          title: "Wedding and engagement keepsakes",
          description:
            "A couple design can become a framed print, shared decor piece, or gift tied to a major milestone.",
        },
        {
          title: "Housewarming gifts for couples",
          description:
            "When the gift is meant for a shared space, couple wall art often works better than a purely individual product.",
        },
        {
          title: "Romantic daily-use products",
          description:
            "Mugs and other practical formats can still feel personal when the design begins with the couple artwork itself.",
        },
      ]}
      generatorLinks={[
        {
          href: "/couples-art",
          label: "Couples Name Art",
          description:
            "The main place to explore relationship-focused artwork and romantic styles.",
        },
        {
          href: "/personalized-gifts",
          label: "Wall Art Route",
          description:
            "Best when the couple gift should be framed, displayed, or used as shared decor.",
        },
        {
          href: "/personalized-gifts",
          label: "Mug Route",
          description:
            "Best when the buyer wants a practical gift while keeping the design relationship-led.",
        },
      ]}
      relatedLinks={[
        {
          href: "/personalized-gifts",
          label: "Personalized Gifts",
          description:
            "Return to the broader gift hub if you want to compare couple intent with other categories.",
        },
        {
          href: "/blog/why-couple-name-art-is-the-perfect-keepsake",
          label: "Couple Name Art Blog Guide",
          description:
            "Editorial support for why couple artwork works so well as a keepsake and decor concept.",
        },
        {
          href: "/personalized-gifts",
          label: "Personalized Name Wall Art",
          description:
            "Often the strongest output when the relationship design should live in a shared room or home.",
        },
        {
          href: "/couples-art/products",
          label: "Couples Art Products",
          description:
            "Compare romantic mugs, shirts, and wall art made from couple name artwork.",
        },
        {
          href: "/couples-art/products/wall-art",
          label: "Couples Art Wall Art",
          description:
            "Best when the couple gift should become an anniversary, wedding, or shared-home print.",
        },
        {
          href: "/couples-art/products/mugs",
          label: "Couples Art Mugs",
          description:
            "Best when the couple design should become a practical daily-use gift.",
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
        "olivia",
        "sarah",
        "amelia",
      ])}
      productMockups={getProductMockups([
        "coupleWallArt",
        "coupleMug",
        "coupleShirt",
      ])}
      faqItems={[
        {
          question: "Why is there a separate couple gifts page from /couples-art?",
          answer:
            "Because some people start with the gift idea first, while others start with the artwork. This page helps with the gift format, and /couples-art helps with the design direction.",
        },
        {
          question: "What product format usually works best for couple gifts?",
          answer:
            "Wall art is often the strongest keepsake format, while mugs and other practical products work well for lighter daily-use gifting.",
        },
        {
          question: "Can this page support wedding and anniversary intent at the same time?",
          answer:
            "Yes. Both use cases share the same relationship-centered design logic, even if the final product choice differs.",
        },
      ]}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Personalized Gifts", path: "/personalized-gifts" },
        { name: "Couple Gifts", path: "/personalized-gifts" },
      ]}
    />
  );
};

export default CoupleGiftsPage;
