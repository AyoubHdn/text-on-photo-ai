import { type NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FaQuoteLeft } from "react-icons/fa";
import { FiDownload, FiEdit3, FiHeart } from "react-icons/fi";

import { SeoHead } from "~/component/SeoHead";
import { FEATURED_NAME_PAGES } from "~/lib/nameArtSeo";
import {
  buildCollectionPageSchema,
  buildFAQSchema,
  buildItemListSchema,
} from "~/lib/seo";
import { getStyleImageAlt } from "~/lib/styleImageAlt";
import { NAME_ART_STYLE_ITEMS } from "~/lib/styleTaxonomy";

const galleryItems = [
  { src: "/styles/name-art/Cute/s34e.webp", title: "3D Floral", tags: ["artistic", "playful"], href: "/name-art/styles/cute" },
  { src: "/styles/name-art/Graffiti/s118e.webp", title: "Graffiti Art", tags: ["modern", "playful"], href: "/name-art/styles/graffiti" },
  { src: "/styles/name-art/Landscapes/s251e.webp", title: "Carved Wood", tags: ["artistic"], href: "/name-art/styles/landscapes" },
  { src: "/styles/name-art/Gaming/s18e.webp", title: "Neon Sign", tags: ["modern"], href: "/name-art/styles/gaming" },
  { src: "/styles/name-art/Abstract/s184e.webp", title: "Golden Glitter", tags: ["playful", "artistic"], href: "/name-art/styles/abstract" },
  { src: "/styles/name-art/Abstract/s179e.webp", title: "Abstract Ink", tags: ["artistic", "modern"], href: "/name-art/styles/abstract" },
  { src: "/styles/name-art/Floral/s5e.webp", title: "Watercolor Flowers", tags: ["artistic"], href: "/name-art/styles/floral" },
  { src: "/styles/name-art/Cute/s87e.webp", title: "Pastel Clouds", tags: ["playful"], href: "/name-art/styles/cute" },
  { src: "/styles/name-art/Typography/s13e.webp", title: "Gold on Marble", tags: ["modern", "artistic"], href: "/name-art/styles/typography" },
  { src: "/styles/name-art/Vintage/s259e.webp", title: "Vintage Letter", tags: ["artistic"], href: "/name-art/styles/vintage" },
  { src: "/styles/name-art/Cute/s92e.webp", title: "Heart Balloons", tags: ["playful"], href: "/name-art/styles/cute" },
  { src: "/styles/name-art/Christian/s276e.webp", title: "Celtic Knotwork", tags: ["artistic"], href: "/name-art/styles/christian" },
];

const galleryTabs = [
  { key: "all", name: "All Styles" },
  { key: "artistic", name: "Artistic" },
  { key: "modern", name: "Modern" },
  { key: "playful", name: "Playful" },
];

const productLinks = [
  {
    href: "/name-art/products/wall-art",
    label: "Name Art Wall Art",
    description:
      "Turn personalized name art into decor-ready prints for bedrooms, nurseries, offices, and gifts.",
  },
  {
    href: "/name-art/products/mugs",
    label: "Name Art Mugs",
    description:
      "Create daily-use mug gifts built from the same personalized name artwork.",
  },
  {
    href: "/name-art/products/shirts",
    label: "Name Art Shirts",
    description:
      "Use bold or playful name art styles on wearable products without losing the name-first intent.",
  },
];

const nameArtFaqs = [
  {
    question: "What is name art?",
    answer:
      "Name art is a visual design built around a name — using typography, illustration, or decorative effects to turn the name itself into artwork. It's used for gifts, decor, profile images, and personalized keepsakes. Modern name art is often created with AI tools, which let you generate a design quickly and explore different styles before committing to one.",
  },
  {
    question: "What's the difference between name art and name design?",
    answer:
      "They largely describe the same thing — turning a name into a visual design. 'Name art' tends to emphasize artistic and decorative styles (calligraphy, floral, neon, 3D). 'Name design' is broader and includes text-based designs, typography, and logo-adjacent visuals. Our tool covers both.",
  },
  {
    question: "How do I design my name online?",
    answer:
      "You can design your name using our AI name art generator. Type the name, pick a style (elegant, graffiti, neon, floral, and more), and generate a finished artwork in seconds. No design skill needed.",
  },
  {
    question: "Can I create a custom name design or edit text into art?",
    answer:
      "Yes. You can create a custom name design by entering any name, word, or short phrase, picking a style, and generating the artwork. The tool handles name edits, initials, and text-based designs across dozens of style directions.",
  },
  {
    question: "Can I get name art on a mug, shirt, or poster?",
    answer:
      "Yes. Every design you create can be ordered on a personalized mug, custom name shirt, or wall art print.",
  },
  {
    question: "What styles of name art are available?",
    answer:
      "Styles range from elegant cursive and calligraphy to bold graffiti, neon lights, watercolor florals, gold typography, and cute 3D characters. Browse our full name art styles gallery to explore each direction.",
  },
  {
    question: "Is stylish name art free?",
    answer:
      "You can preview and explore styles for free. Generating high-resolution, print-ready designs uses credits from our pricing plans, starting at $1.99.",
  },
];

const NameArtLandingPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredStyles =
    activeTab === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.tags.includes(activeTab));

  return (
    <>
      <SeoHead
        title="Name Art & Name Design | Personalized Styles and Custom Designs"
        description="Explore personalized name art and name design styles for decor, gifts, and keepsakes. Browse custom name designs, text styles, and creative ideas."
        path="/name-art"
        jsonLd={[
          buildCollectionPageSchema({
            name: "Name Art and Name Design",
            description:
              "Browse personalized name art and name design styles for gifts, decor, and printable formats.",
            path: "/name-art",
            itemPaths: [
              "/name-art/styles",
              ...NAME_ART_STYLE_ITEMS.map(
                (item) => `/name-art/styles/${item.slug}`,
              ),
              ...FEATURED_NAME_PAGES.map((item) => item.path),
              ...productLinks.map((item) => item.href),
            ],
          }),
          buildItemListSchema({
            name: "Popular name art pages",
            itemPaths: FEATURED_NAME_PAGES.map((item) => item.path),
          }),
          buildFAQSchema(nameArtFaqs),
        ]}
      />

      <main className="bg-white">
        <section className="overflow-hidden bg-gradient-to-br from-cream-50 via-white to-cream-100 px-4 py-16 lg:py-24">
          <div className="container mx-auto">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <span className="inline-flex rounded-full bg-brand-100 px-4 py-1 text-sm font-semibold uppercase tracking-[0.14em] text-brand-800">
                  Personalized name art
                </span>
                <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
                  Transform your name into a work of art
                </h1>
                <p className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-300">
                  Explore personalized name art and name design styles for custom
                  decor, keepsakes, gifts, and product-ready designs. Browse text
                  styles, artistic directions, and design ideas for your name,
                  initials, or phrase — then move that artwork into wall art,
                  mugs, and shirts.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/name-art-generator"
                    className="inline-block rounded-lg bg-brand-600 px-8 py-4 text-lg font-bold text-white transition hover:bg-brand-700"
                  >
                    Start Creating Name Art
                  </Link>
                  <Link
                    href="#gallery"
                    className="inline-block rounded-lg border border-cream-200 px-6 py-4 font-semibold text-amber-900 transition hover:border-brand-400 hover:text-brand-700"
                  >
                    Browse Styles
                  </Link>
                </div>
                <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <span className="rounded-full border border-cream-200 bg-cream-50 px-4 py-2">Free to start</span>
                  <span className="rounded-full border border-cream-200 bg-cream-50 px-4 py-2">High-res downloads</span>
                  <span className="rounded-full border border-cream-200 bg-cream-50 px-4 py-2">Print-ready products</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { src: "/styles/name-art/Floral/s5e.webp", alt: "Watercolor floral name art example", className: "row-span-2", aspectClass: "aspect-[4/6] h-full min-h-[280px]" },
                  { src: "/styles/name-art/Abstract/s184e.webp", alt: "Golden glitter name art example", className: "", aspectClass: "aspect-[4/3]" },
                  { src: "/styles/name-art/Gaming/s18e.webp", alt: "Neon sign name art example", className: "", aspectClass: "aspect-[4/3]" },
                ].map((item) => (
                  <article
                    key={item.src}
                    className={`group overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20 ${item.className}`}
                  >
                    <div className={`relative ${item.aspectClass}`}>
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Create your design in seconds
            </h2>
            <p className="mx-auto mb-16 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              A simple workflow for custom name art that still leaves room for
              style exploration.
            </p>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 text-center md:grid-cols-3">
              <div className="flex flex-col items-center p-6">
                <FiEdit3 className="mb-4 text-5xl text-brand-500" />
                <h3 className="mb-2 text-xl font-semibold">1. Enter Your Text</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Type any name, word, or initials you want to transform.
                </p>
              </div>
              <div className="flex flex-col items-center border-y border-gray-200 p-6 md:border-x md:border-y-0 dark:border-gray-700">
                <FiHeart className="mb-4 text-5xl text-brand-500" />
                <h3 className="mb-2 text-xl font-semibold">2. Pick a Style</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose from elegant, bold, playful, modern, and gift-ready visual directions.
                </p>
              </div>
              <div className="flex flex-col items-center p-6">
                <FiDownload className="mb-4 text-5xl text-brand-500" />
                <h3 className="mb-2 text-xl font-semibold">3. Generate and Use</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Download the artwork or move it into print-focused categories when you are ready.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="gallery" className="bg-cream-50 py-24 dark:bg-gray-800">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Explore name art and name design styles
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Find a direction that fits your name, then refine it in the
              creation flow.
            </p>

            <div className="mb-12 flex flex-wrap justify-center gap-2">
              {galleryTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    activeTab === tab.key
                      ? "bg-brand-600 text-white shadow"
                      : "bg-white text-gray-600 hover:bg-cream-100 border border-cream-200"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {filteredStyles.map((style) => (
                <Link
                  key={style.src}
                  href={style.href}
                  className="group relative overflow-hidden rounded-lg shadow-lg"
                >
                  <img
                    src={style.src}
                    alt={getStyleImageAlt(style.src, {
                      kind: "name",
                      title: style.title,
                      fallbackAlt: `${style.title} name art style example`,
                    })}
                    className="aspect-square h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="px-2 text-center text-white">
                      <span className="block text-lg font-semibold">{style.title}</span>
                      <span className="mt-2 block text-sm font-medium">
                        Explore style
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10">
              <Link
                href="/name-art/styles"
                className="inline-flex rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
              >
                Browse all name art styles
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            Browse all name art styles
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {NAME_ART_STYLE_ITEMS.map((style) => (
              <Link
                key={style.slug}
                href={`/name-art/styles/${style.slug}`}
                className="group overflow-hidden rounded-lg border border-gray-200 transition hover:border-indigo-300"
              >
                <Image
                  src={style.imageSrc}
                  alt={`${style.title} name art example`}
                  width={300}
                  height={300}
                  className="aspect-square w-full object-cover"
                />
                <div className="p-3">
                  <span className="text-xs text-gray-500">
                    {style.groupTitle}
                  </span>
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                    {style.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12 max-w-3xl">
              <h2 className="text-3xl font-bold md:text-4xl">
                Popular name art pages to explore
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                These curated name pages help users compare visual directions for
                individual names before generating their own artwork.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURED_NAME_PAGES.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:border-brand-400 hover:bg-brand-50"
                >
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {item.name} name art
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Featured styles: {item.niches.slice(0, 3).join(", ")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cream-50 py-24 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="mb-12 max-w-3xl">
              <h2 className="text-3xl font-bold md:text-4xl">
                Move from name art into product categories
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Keep the design experience centered on names, then choose the
                product format that fits the gift or room.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {productLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
                >
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {link.label}
                  </h3>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">
                    {link.description}
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center text-sm text-gray-600">
              <p>
                Looking for ideas beyond name art styles? Browse all{" "}
                <Link href="/personalized-gifts" className="font-medium text-indigo-600 hover:underline">
                  personalized gifts
                </Link>{" "}
                or explore our full{" "}
                <Link href="/products" className="font-medium text-indigo-600 hover:underline">
                  product catalog
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-12 text-3xl font-bold md:text-4xl">
              See what our users are creating
            </h2>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="rounded-lg bg-cream-50 p-8 text-left dark:bg-gray-800">
                <FaQuoteLeft className="mb-4 text-3xl text-brand-400" />
                <p className="mb-6 italic text-gray-600 dark:text-gray-300">
                  &quot;I designed a new logo direction for my Etsy shop in a few
                  minutes and then used the same art style for a print.&quot;
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- Maria S.</p>
              </div>
              <div className="rounded-lg bg-cream-50 p-8 text-left shadow-xl dark:bg-gray-800">
                <FaQuoteLeft className="mb-4 text-3xl text-brand-400" />
                <p className="mb-6 italic text-gray-600 dark:text-gray-300">
                  &quot;It helped me test a lot of styles quickly. I ended up using
                  one version for my profile and another for a custom mug.&quot;
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- David L.</p>
              </div>
              <div className="rounded-lg bg-cream-50 p-8 text-left dark:bg-gray-800">
                <FaQuoteLeft className="mb-4 text-3xl text-brand-400" />
                <p className="mb-6 italic text-gray-600 dark:text-gray-300">
                  &quot;We made art with our kids&apos; names for their playroom and
                  then used one of the designs as a framed gift.&quot;
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- Carol P.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Frequently asked questions about name art
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
            Everything you need to know about creating personalized name art and name designs.
          </p>
          <div className="mt-10 space-y-6">
            {nameArtFaqs.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                <p className="mt-2 text-gray-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-cream-50 py-24 text-gray-800 dark:bg-gray-800 dark:text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to see your name in a new light?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-700 dark:text-gray-300">
              Start with personalized name art ideas, then expand into prints and
              products once the direction is clear.
            </p>
            <div className="mt-8">
              <Link
                href="/name-art-generator"
                className="inline-block rounded-lg bg-brand-600 px-8 py-4 text-lg font-bold text-white transition hover:bg-brand-700"
              >
                Create Custom Name Art
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default NameArtLandingPage;
