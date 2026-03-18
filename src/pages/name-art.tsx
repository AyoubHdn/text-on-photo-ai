import { type NextPage } from "next";
import Link from "next/link";
import { useState } from "react";
import { FaQuoteLeft } from "react-icons/fa";
import { FiDownload, FiEdit3, FiHeart } from "react-icons/fi";

import { SeoHead } from "~/component/SeoHead";
import { FEATURED_NAME_PAGES } from "~/lib/nameArtSeo";
import {
  buildCollectionPageSchema,
  buildItemListSchema,
} from "~/lib/seo";
import { getStyleImageAlt } from "~/lib/styleImageAlt";

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
    href: "/personalized-name-wall-art",
    label: "Personalized Name Wall Art",
    description: "Turn a design into printable decor for bedrooms, nurseries, offices, and gifts.",
  },
  {
    href: "/personalized-name-mugs",
    label: "Personalized Name Mugs",
    description: "Create daily-use gifts built from the same personalized artwork.",
  },
  {
    href: "/custom-name-shirts",
    label: "Custom Name Shirts",
    description: "Use bold or playful styles on wearable products without losing the name-first intent.",
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
        title="AI Name Art Generator | Create Custom Name Designs Online"
        description="Bring your name to life with AI name art. Explore custom styles for decor, gifts, wall art, mugs, shirts, and social-ready designs while keeping the focus on personalized name art."
        path="/name-art"
        jsonLd={[
          buildCollectionPageSchema({
            name: "AI Name Art Generator",
            description:
              "Browse personalized name art styles and entry points into product-ready use cases.",
            path: "/name-art",
            itemPaths: [
              "/name-art/styles",
              ...FEATURED_NAME_PAGES.map((item) => item.path),
              ...productLinks.map((item) => item.href),
            ],
          }),
          buildItemListSchema({
            name: "Popular name art pages",
            itemPaths: FEATURED_NAME_PAGES.map((item) => item.path),
          }),
        ]}
      />

      <main className="bg-white dark:bg-gray-900">
        <section className="bg-gray-50 px-4 py-20 dark:bg-gray-800 lg:py-32">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Transform your name into a work of art
            </h1>
            <h2 className="mx-auto mt-4 max-w-3xl text-xl text-gray-700 dark:text-gray-300 md:text-2xl">
              The AI name art generator for custom decor, keepsakes, gifts, and
              product-ready designs.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Explore personalized styles for your name, initials, or phrase, then
              move that artwork into wall art, mugs, shirts, and shareable visuals
              without changing the core name-art intent.
            </p>
            <div className="mt-10">
              <Link href="/name-art-generator">
                <button className="inline-block rounded-lg bg-blue-500 px-8 py-4 text-lg font-bold text-white transition hover:bg-blue-600">
                  Start Creating Name Art
                </button>
              </Link>
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
                <FiEdit3 className="mb-4 text-5xl text-blue-500" />
                <h3 className="mb-2 text-xl font-semibold">1. Enter Your Text</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Type any name, word, or initials you want to transform.
                </p>
              </div>
              <div className="flex flex-col items-center border-y border-gray-200 p-6 md:border-x md:border-y-0 dark:border-gray-700">
                <FiHeart className="mb-4 text-5xl text-blue-500" />
                <h3 className="mb-2 text-xl font-semibold">2. Pick a Style</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose from elegant, bold, playful, modern, and gift-ready visual directions.
                </p>
              </div>
              <div className="flex flex-col items-center p-6">
                <FiDownload className="mb-4 text-5xl text-blue-500" />
                <h3 className="mb-2 text-xl font-semibold">3. Generate and Use</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Download the artwork or move it into print-focused categories when you are ready.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-24 dark:bg-gray-800">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Explore a world of creative styles
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Find a direction that fits your name, then refine it inside the
              generator.
            </p>

            <div className="mb-12 flex flex-wrap justify-center gap-2">
              {galleryTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    activeTab === tab.key
                      ? "bg-blue-500 text-white shadow"
                      : "bg-white text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
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
                className="inline-flex rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:text-slate-200"
              >
                Browse all name art styles
              </Link>
            </div>
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
                  className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800"
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

        <section className="bg-gray-50 py-24 dark:bg-gray-800">
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
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
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
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-12 text-3xl font-bold md:text-4xl">
              See what our users are creating
            </h2>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-8 text-left dark:bg-gray-800">
                <FaQuoteLeft className="mb-4 text-3xl text-blue-400" />
                <p className="mb-6 italic text-gray-600 dark:text-gray-300">
                  "I designed a new logo direction for my Etsy shop in a few
                  minutes and then used the same art style for a print."
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- Maria S.</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-8 text-left shadow-xl dark:bg-gray-800">
                <FaQuoteLeft className="mb-4 text-3xl text-blue-400" />
                <p className="mb-6 italic text-gray-600 dark:text-gray-300">
                  "It helped me test a lot of styles quickly. I ended up using
                  one version for my profile and another for a custom mug."
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- David L.</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-8 text-left dark:bg-gray-800">
                <FaQuoteLeft className="mb-4 text-3xl text-blue-400" />
                <p className="mb-6 italic text-gray-600 dark:text-gray-300">
                  "We made art with our kids&apos; names for their playroom and
                  then used one of the designs as a framed gift."
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- Carol P.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-24 text-gray-800 dark:bg-gray-800 dark:text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to see your name in a new light?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-700 dark:text-gray-300">
              Start with the name art generator, then expand into prints and
              personalized products when the design is ready.
            </p>
            <div className="mt-8">
              <Link href="/name-art-generator">
                <button className="inline-block rounded-lg bg-blue-500 px-8 py-4 text-lg font-bold text-white transition hover:bg-blue-600">
                  Start Name Art Generator
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default NameArtLandingPage;
