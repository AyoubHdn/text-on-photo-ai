/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";

import { SeoHead } from "~/component/SeoHead";
import { getCommunityImagePresentation } from "~/lib/styleImageAlt";
import { FEATURED_NAME_PAGES } from "~/lib/nameArtSeo";
import {
  buildCollectionPageSchema,
  buildFAQSchema,
  buildItemListSchema,
  buildOrganizationSchema,
  buildWebsiteSchema,
} from "~/lib/seo";
import { env } from "~/env.mjs";
import { api } from "~/utils/api";

type VisualCard = {
  href: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  eyebrow?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

const homepageFaqs = [
  {
    question: "What is Name Design AI?",
    answer:
      "Name Design AI is a platform for creating personalized name art, Arabic calligraphy, couple name designs, and gift-ready visuals using artificial intelligence.",
  },
  {
    question: "Can I create Arabic name art online?",
    answer:
      "Yes. We offer a dedicated Arabic name art experience with styles inspired by traditional calligraphy and modern visual design.",
  },
  {
    question: "Is Name Design AI useful for personalized gifts?",
    answer:
      "Yes. Many customers use Name Design AI to create artwork that can be turned into framed wall art, mugs, shirts, and occasion-focused gifts.",
  },
  {
    question: "Do I need design skills to use Name Design AI?",
    answer:
      "No. The generators are designed for non-designers and let you create polished artwork quickly with guided style choices.",
  },
  {
    question: "Can I download my designs in high resolution?",
    answer:
      "Yes. Finished designs can be downloaded in high resolution so they are ready for printing, sharing, or personal keepsakes.",
  },
];

const generatorCards: VisualCard[] = [
  {
    href: "/name-art-generator",
    title: "Create Name Art",
    description:
      "Turn any name into visual art for decor, gifts, profile images, and printable keepsakes.",
    imageSrc: "/name-art.webp",
    imageAlt: "Emma personalized name art example",
    eyebrow: "Visual generator",
    ctaLabel: "Explore generator",
    secondaryHref: "/name-art/styles",
    secondaryLabel: "Browse all name art styles",
  },
  {
    href: "/arabic-calligraphy",
    title: "Arabic Name Art",
    description:
      "Create Arabic calligraphy-inspired artwork for identity-rich gifts, decor, and premium visuals.",
    imageSrc: "/styles/arabic/thuluth-black.webp",
    imageAlt: "Arabic calligraphy name art example in a black thuluth style",
    eyebrow: "Calligraphy styles",
    ctaLabel: "Browse Arabic styles",
    secondaryHref: "/arabic-calligraphy/styles",
    secondaryLabel: "Browse Arabic calligraphy styles",
  },
  {
    href: "/couples-art",
    title: "Couples Name Art",
    description:
      "Design romantic visuals for anniversaries, weddings, shared decor, and couple keepsakes.",
    imageSrc: "/user-couple-art.webp",
    imageAlt: "Couple name art example for wedding and anniversary gifts",
    eyebrow: "Relationship art",
    ctaLabel: "See couple designs",
    secondaryHref: "/couples-art/styles",
    secondaryLabel: "Browse couple name styles",
  },
];

const popularNameExamples: VisualCard[] = [
  {
    href: "/name-art/emma",
    title: "Emma name art",
    description:
      "Soft, playful lettering that works well for mugs, nursery decor, and birthday gifts.",
    imageSrc: "/images/home/emma.webp",
    imageAlt: "Emma name art example in a cute pastel personalized style",
    eyebrow: "Popular example",
    ctaLabel: "Open Emma page",
  },
  {
    href: "/name-art/olivia",
    title: "Olivia name art",
    description:
      "Floral styling that feels premium on framed prints and decor-focused gift pages.",
    imageSrc: "/user-birthday-design.webp",
    imageAlt: "Olivia floral name art example for personalized wall decor",
    eyebrow: "Popular example",
    ctaLabel: "Open Olivia page",
  },
  {
    href: "/name-art/mohammed",
    title: "Mohammed Arabic calligraphy",
    description:
      "Arabic-inspired styling for culturally specific gifts, elegant branding, and premium wall art.",
    imageSrc: "/images/home/muhammed.webp",
    imageAlt: "Mohammed Arabic calligraphy name art example in a gold style",
    eyebrow: "Popular example",
    ctaLabel: "Open Mohammed page",
  },
  {
    href: "/name-art/sarah",
    title: "Sarah floral style",
    description:
      "A softer decorative direction that feels at home on prints, keepsakes, and gift sets.",
    imageSrc: "/images/home/sarah.webp",
    imageAlt: "Sarah floral style name art example with watercolor flowers",
    eyebrow: "Popular example",
    ctaLabel: "Open Sarah page",
  },
];

const productMockupCards: VisualCard[] = [
  {
    href: "/personalized-gifts",
    title: "Name art on mugs",
    description:
      "Show buyers how personalized artwork translates into a giftable daily-use product.",
    imageSrc: "/images/products/mug.webp",
    imageAlt: "Personalized name art design printed on mug mockup",
    eyebrow: "Product mockup",
    ctaLabel: "Shop mug ideas",
  },
  {
    href: "/personalized-gifts",
    title: "Name art on shirts",
    description:
      "Preview bolder artwork on apparel before choosing a shirt-ready direction.",
    imageSrc: "/images/products/tshirt.webp",
    imageAlt: "Custom name art design printed on shirt mockup",
    eyebrow: "Product mockup",
    ctaLabel: "Browse shirt ideas",
  },
  {
    href: "/personalized-gifts",
    title: "Name art as wall decor",
    description:
      "Use decor mockups to make framed prints and posters feel product-ready and gift-ready.",
    imageSrc: "/images/products/poster.webp",
    imageAlt: "Personalized name art displayed as framed wall art mockup",
    eyebrow: "Product mockup",
    ctaLabel: "View wall art",
  },
  {
    href: "/personalized-gifts",
    title: "Couple gift mockups",
    description:
      "Show how relationship-led artwork can become anniversary gifts and shared-home keepsakes.",
    imageSrc: "/user-couple-art.webp",
    imageAlt: "Couple name art used as a romantic personalized gift mockup",
    eyebrow: "Product mockup",
    ctaLabel: "Explore couple gifts",
  },
];

const giftIdeaCards: VisualCard[] = [
  {
    href: "/personalized-gifts",
    title: "Birthday gifts",
    description:
      "Name-first birthday ideas that work across mugs, prints, and keepsake-focused products.",
    imageSrc: "/images/home/happy_birthday_babe.webp",
    imageAlt: "Birthday gift idea featuring personalized name art design",
    eyebrow: "Gift idea",
    ctaLabel: "See birthday ideas",
  },
  {
    href: "/personalized-gifts",
    title: "Anniversary gifts",
    description:
      "Relationship-led designs for weddings, anniversaries, and romantic milestone keepsakes.",
    imageSrc: "/styles/name-art/Celebrations/s43e.webp",
    imageAlt: "Anniversary gift idea with romantic couple name art",
    eyebrow: "Gift idea",
    ctaLabel: "See anniversary ideas",
  },
  {
    href: "/personalized-gifts",
    title: "Eid gifts",
    description:
      "Arabic calligraphy-inspired gifts and decor paths for meaningful seasonal giving.",
    imageSrc: "/images/home/catrina.webp",
    imageAlt: "Eid gift idea with Arabic name art displayed as a framed print",
    eyebrow: "Gift idea",
    ctaLabel: "See Eid ideas",
  },
  {
    href: "/personalized-gifts",
    title: "Gifts for her",
    description:
      "Decor-friendly and sentimental gift ideas built from elegant personalized artwork.",
    imageSrc: "/images/home/lilly_mug.webp",
    imageAlt: "Personalized gift for her featuring custom name art",
    eyebrow: "Gift idea",
    ctaLabel: "Browse gifts for her",
  },
  {
    href: "/personalized-gifts",
    title: "Couple gifts",
    description:
      "Shared decor and keepsake ideas for two-name artwork, mug sets, and wall pieces.",
    imageSrc: "/styles/couples/c012e.webp",
    imageAlt: "Couple gift idea featuring personalized two-name artwork",
    eyebrow: "Gift idea",
    ctaLabel: "Browse couple gifts",
  },
];

const homepageCollectionItems = Array.from(
  new Set([
    ...generatorCards.map((card) => card.href),
    ...popularNameExamples.map((card) => card.href),
    ...productMockupCards.map((card) => card.href),
    ...giftIdeaCards.map((card) => card.href),
    ...FEATURED_NAME_PAGES.slice(0, 8).map((item) => item.path),
  ]),
);

const extraFeaturedNames = FEATURED_NAME_PAGES.filter(
  (item) =>
    !popularNameExamples.some((example) => example.href === item.path),
).slice(0, 8);

const HomePage: NextPage = () => {
  return (
    <>
      <SeoHead
        title="Name Design AI | Personalized Name Art, Gifts, and Arabic Calligraphy"
        description="Create personalized name art, name design, Arabic calligraphy, and couple designs with AI. Turn names into meaningful art and product-ready gifts."
        path="/"
        keywords="personalized name art, custom name art, arabic name art, couple name art, custom name gifts"
        imageAlt="Name Design AI homepage showing personalized name art examples and gift mockups"
        jsonLd={[
          buildOrganizationSchema(),
          buildWebsiteSchema(),
          buildFAQSchema(homepageFaqs),
          buildCollectionPageSchema({
            name: "Name Design AI homepage",
            description:
              "Browse name art examples, product mockups, gift categories, and generator entry points.",
            path: "/",
            itemPaths: homepageCollectionItems,
          }),
          buildItemListSchema({
            name: "Popular name art examples",
            itemPaths: popularNameExamples.map((item) => item.href),
          }),
          buildItemListSchema({
            name: "Gift idea categories",
            itemPaths: giftIdeaCards.map((item) => item.href),
          }),
        ]}
      />
      <main className="bg-white dark:bg-gray-900">
        <HeroBanner />
        <TrustStrip />
        <ProductsSection />
        <PopularNameExamplesSection />
        <ProductMockupSection />
        <GiftIdeasSection />
        <HowItWorksSection />
        <PopularTodaySection />
        <FinalCTASection />
        <FAQSection />
      </main>
    </>
  );
};

function HeroBanner() {
  const handleScrollToProducts = () => {
    document
      .getElementById("products-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const heroGallery = [
    {
      title: "Personalized name art",
      imageSrc: "/images/home/name_art.webp",
      imageAlt:
        "Collage of personalized name art, Arabic calligraphy, and custom gift mockups",
      className: "sm:row-span-2",
      aspectClass: "aspect-[4/6] h-full min-h-[320px]",
    },
    {
      title: "Couple keepsakes",
      imageSrc: "/styles/couples/c001e.webp",
      imageAlt: "Couple name art example for romantic keepsakes",
      className: "",
      aspectClass: "aspect-[4/3]",
    },
    {
      title: "Arabic calligraphy",
      imageSrc: "/images/home/amira.webp",
      imageAlt: "Arabic calligraphy style example for personalized name art",
      className: "",
      aspectClass: "aspect-[4/3]",
    },
    {
      title: "product mockups",
      imageSrc: "/images/home/products.webp",
      imageAlt: "Personalized name art printed on mug mockup",
      className: "sm:col-span-2",
      aspectClass: "aspect-[8/3]",
    },
  ];

  return (
    <section className="overflow-hidden bg-gradient-to-br from-cream-50 via-white to-cream-100 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900">
      <div className="container mx-auto grid gap-14 px-6 py-16 lg:grid-cols-[1.05fr,0.95fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit rounded-full bg-brand-100 px-4 py-1 text-sm font-semibold uppercase tracking-[0.14em] text-brand-800 dark:bg-brand-900/30 dark:text-brand-200">
            AI name art, name design, and personalized gifts
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
            Turn identity into visual art, gift mockups, and keepsake-ready products
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300 md:text-xl">
            Create personalized name art, Arabic calligraphy, and couple designs
            in minutes, then move that artwork into mugs, shirts, wall art, and
            occasion-focused gifts.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/name-art-generator"
              className="inline-block rounded-lg bg-brand-600 px-8 py-4 text-base font-bold text-white transition hover:bg-brand-700 md:text-lg"
              id="try-it-free-button-heroBanner"
            >
              Create Your Design Free
            </Link>
            <button
              onClick={handleScrollToProducts}
              className="rounded-lg border border-cream-200 px-6 py-4 font-semibold text-amber-900 transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-600 dark:text-slate-200"
            >
              Browse Examples
            </button>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            <span className="rounded-full border border-cream-200 bg-cream-50 px-4 py-2 dark:bg-slate-800">
              Name art examples
            </span>
            <span className="rounded-full border border-cream-200 bg-cream-50 px-4 py-2 dark:bg-slate-800">
              Arabic calligraphy
            </span>
            <span className="rounded-full border border-cream-200 bg-cream-50 px-4 py-2 dark:bg-slate-800">
              Product mockups
            </span>
            <span className="rounded-full border border-cream-200 bg-cream-50 px-4 py-2 dark:bg-slate-800">
              Personalized gift pages
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {heroGallery.map((item) => (
            <article
              key={item.title}
              className={`group overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20 ${item.className}`}
            >
              <div className={`relative ${item.aspectClass}`}>
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  fill
                  priority={item.title === "Personalized name art"}
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent p-5">
                  <p className="text-lg font-semibold text-white">{item.title}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const stats = [
    { icon: "🎨", label: "AI-generated designs", value: "10,000+" },
    { icon: "🌍", label: "Shipped worldwide", value: "Free shipping" },
    { icon: "⭐", label: "Customer satisfaction", value: "4.9 / 5" },
    { icon: "🔒", label: "Secure checkout", value: "Powered by Stripe" },
  ];

  return (
    <div className="border-y border-cream-200 bg-cream-50 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="container mx-auto px-6 lg:px-8">
        <ul className="flex flex-wrap items-center justify-center divide-y divide-cream-200 sm:divide-x sm:divide-y-0 dark:divide-slate-700">
          {stats.map((stat) => (
            <li
              key={stat.label}
              className="flex w-full items-center gap-3 px-6 py-4 sm:w-auto"
            >
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ProductsSection() {
  return (
    <section id="products-section" className="py-20 lg:py-24">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            Personalized design generators
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Start with the three main creative directions: name art, Arabic
            calligraphy, and relationship-led designs.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {generatorCards.map((card) => (
            <VisualMarketplaceCard key={card.href} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularNameExamplesSection() {
  return (
    <section className="bg-cream-50 py-20 dark:bg-gray-800 lg:py-24">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            Popular name art examples
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            These examples make it easier to compare different names and styles
            before opening a page that matches the look you want.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {popularNameExamples.map((card) => (
            <VisualMarketplaceCard key={card.href} card={card} />
          ))}
        </div>

        <div className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            More name pages
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {extraFeaturedNames.map((namePage) => (
              <Link
                key={namePage.path}
                href={namePage.path}
                className="rounded-full border border-cream-200 bg-cream-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {namePage.name} name art
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductMockupSection() {
  const homepageProductMockups = productMockupCards.slice(0, 3);

  return (
    <section className="py-20 lg:py-24">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            Product mockups built from name art
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            These mockups show how the artwork can translate into real products
            while keeping the design itself front and center.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {homepageProductMockups.map((card) => (
            <VisualMarketplaceCard key={card.href + card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GiftIdeasSection() {
  return (
    <section id="gift-ideas" className="bg-cream-50 py-20 dark:bg-gray-800 lg:py-24">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            Gift ideas and product pathways
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Browse gift ideas by occasion and recipient so it is easier to find
            the format that fits the person and the moment.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {giftIdeaCards.map((card) => (
            <VisualMarketplaceCard key={card.title} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      title: "Choose a creative path",
      description:
        "Start with name art, Arabic calligraphy, or couple designs depending on the story you want to tell.",
    },
    {
      title: "Enter the name or names",
      description:
        "Use one name, two names, initials, or a short phrase and let the generator handle the heavy lifting.",
    },
    {
      title: "Compare visual directions",
      description:
        "Try decorative, bold, floral, romantic, or calligraphy-led styles before committing to a product.",
    },
    {
      title: "Download or move into products",
      description:
        "Use the final artwork digitally or continue into mugs, shirts, wall art, and other gift-ready formats.",
    },
  ];

  const trustPoints = [
    "Designed for personalized gifts and keepsakes",
    "High-resolution downloads available",
    "No design software required",
    "Works for decor, products, and social visuals",
  ];

  const workflowGallery = [
    {
      title: "Poster-ready art",
      imageSrc: "/images/home/best-dad-ever-poster.webp",
      imageAlt: "Personalized name art shown as a framed poster mockup",
    },
    {
      title: "Giftable mug design",
      imageSrc: "/images/products/mug.webp",
      imageAlt: "Personalized name art shown on a mug product mockup",
    },
    {
      title: "Couple keepsake",
      imageSrc: "/styles/couples/c033e.webp",
      imageAlt: "Couple name art example for a keepsake or anniversary gift",
    },
  ];

  return (
    <section className="py-20 lg:py-24">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.95fr,1.05fr]">
          <div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
              How Name Design AI works
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              The workflow stays simple: start from identity, compare visual directions,
              then move the strongest design into a finished product or downloadable image.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-cream-200 bg-cream-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {workflowGallery.map((item, index) => (
              <article
                key={item.title}
                className={`group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 ${
                  index === 0 ? "sm:row-span-2" : ""
                }`}
              >
                <div
                  className={`relative ${
                    index === 0 ? "aspect-[4/6] h-full min-h-[280px]" : "aspect-[4/3]"
                  }`}
                >
                  <Image
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent p-5">
                    <p className="text-lg font-semibold text-white">{item.title}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-cream-200 bg-cream-50 p-6 shadow-sm dark:border-slate-700 dark:bg-gray-800"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
                Step {index + 1}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {step.title}
              </h3>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PopularTodaySection() {
  const { data: icons, isLoading } =
    api.icons.getPopularPaidIcons.useQuery({ limit: 12 });

  if (isLoading || !icons?.length) return null;

  return (
    <section className="bg-cream-50 py-20 dark:bg-gray-800 lg:py-24">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="mb-12 max-w-3xl">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            Popular today
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Real designs created on the platform, with a path into the public
            gallery for more ideas.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {icons.map((icon: { id: string; prompt: string | null; metadata?: unknown }) => {
            const imagePresentation = getCommunityImagePresentation({
              metadata: icon.metadata,
              prompt: icon.prompt,
            });

            return (
            <li
              key={icon.id}
              className="group overflow-hidden rounded-2xl shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <Link href="/community">
                <div className="relative aspect-square w-full bg-gray-200 dark:bg-gray-800">
                  <Image
                    src={`https://${env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${icon.id}`}
                    alt={imagePresentation.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </Link>
            </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function FinalCTASection() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  return (
    <section className="bg-gradient-to-r from-brand-950 via-brand-900 to-brand-950 text-white">
      <div className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">
          Create a name that feels worth keeping
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-100">
          Start with the artwork, then move into wall decor, mugs, shirts, or
          gift-ready products once the design direction is right.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {isLoggedIn ? (
            <Link
              href="/name-art"
              className="rounded-lg bg-white px-8 py-4 text-lg font-bold text-brand-800 transition hover:bg-brand-50"
            >
              Create Name Art
            </Link>
          ) : (
            <button
              className="rounded-lg bg-white px-8 py-4 text-lg font-bold text-brand-800 transition hover:bg-brand-50"
              onClick={() => void signIn(undefined, { callbackUrl: "/name-art-generator" })}
            >
              Sign Up and Create Your First Design
            </button>
          )}
          <Link
            href="/personalized-gifts"
            className="rounded-lg border border-white/30 px-8 py-4 text-lg font-bold text-white transition hover:border-white hover:bg-white/10"
          >
            Browse Gift Pages
          </Link>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section className="py-20 lg:py-24">
      <div className="container mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Everything you need to know before creating your first design.
          </p>
        </div>

        <div className="space-y-6">
          {homepageFaqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl bg-cream-50 p-6 shadow-md dark:bg-gray-800"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {faq.question}
                </h3>
                <span className="text-2xl font-bold transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-300">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function VisualMarketplaceCard({ card }: { card: VisualCard }) {
  return (
    <article
      className="group overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
    >
      <Link href={card.href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={card.imageSrc}
            alt={card.imageAlt}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className={card.secondaryHref ? "p-5 pb-3" : "p-5"}>
          {card.eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
              {card.eyebrow}
            </p>
          ) : null}
          <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
            {card.title}
          </h3>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            {card.description}
          </p>
          <span className="mt-4 inline-flex text-sm font-semibold text-brand-700 dark:text-brand-300">
            {card.ctaLabel ?? "Explore page"}
          </span>
        </div>
      </Link>
      {card.secondaryHref && card.secondaryLabel ? (
        <div className="px-5 pb-5">
          <Link
            href={card.secondaryHref}
            className="text-sm font-medium text-brand-700 transition hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
          >
            {card.secondaryLabel}
          </Link>
        </div>
      ) : null}
    </article>
  );
}

export default HomePage;
