import { type NextPage } from "next";
import Link from "next/link";
import { useState } from "react";
import { FaQuoteLeft } from "react-icons/fa";
import { FiEdit3, FiGift, FiHeart } from "react-icons/fi";

import { SeoHead } from "~/component/SeoHead";
import { buildCollectionPageSchema } from "~/lib/seo";
import { getStyleImageAlt } from "~/lib/styleImageAlt";

const galleryItems = [
  { src: "/styles/couples/c012e.webp", title: "Vintage Love Letter", tags: ["romantic"], href: "/couples-art/styles/vintage-love-letter" },
  { src: "/styles/couples/c002e.webp", title: "Floral Watercolor", tags: ["romantic"], href: "/couples-art/styles/floral-watercolor" },
  { src: "/styles/couples/c008e.webp", title: "Elegant Calligraphy Heart", tags: ["romantic"], href: "/couples-art/styles/elegant-calligraphy-heart" },
  { src: "/styles/couples/c016e.webp", title: "Starlight Silhouettes", tags: ["romantic"], href: "/couples-art/styles/starlight-silhouettes" },
  { src: "/styles/couples/c018e.webp", title: "Clean Sans-Serif", tags: ["modern"], href: "/couples-art/styles/clean-sans-serif" },
  { src: "/styles/couples/c019e.webp", title: "Single Line Art", tags: ["modern"], href: "/couples-art/styles/single-line-art" },
  { src: "/styles/couples/c024e.webp", title: "Abstract Watercolor", tags: ["modern", "playful"], href: "/couples-art/styles/abstract-watercolor" },
  { src: "/styles/couples/c020e.webp", title: "Marble & Gold", tags: ["modern", "romantic"], href: "/couples-art/styles/marble-and-gold" },
  { src: "/styles/couples/c028e.webp", title: "Kawaii Characters", tags: ["playful"], href: "/couples-art/styles/kawaii-characters" },
  { src: "/styles/couples/c030e.webp", title: "Pixel Art Robots", tags: ["playful"], href: "/couples-art/styles/pixel-art-robots" },
  { src: "/styles/couples/c033e.webp", title: "Cat Lovers", tags: ["playful", "modern"], href: "/couples-art/styles/cat-lovers" },
  { src: "/styles/couples/c032e.webp", title: "Comic Pop Art", tags: ["playful"], href: "/couples-art/styles/comic-pop-art" },
];

const galleryTabs = [
  { key: "all", name: "All Styles" },
  { key: "romantic", name: "Romantic and Classic" },
  { key: "modern", name: "Modern and Minimalist" },
  { key: "playful", name: "Playful and Fun" },
];

const relatedLinks = [
  {
    href: "/couple-gifts",
    label: "Couple Gifts",
    description:
      "Browse product and occasion ideas built around romantic name art and shared keepsakes.",
  },
  {
    href: "/personalized-gifts",
    label: "Personalized Gifts",
    description:
      "Expand from couple art into gifts for anniversaries, weddings, and milestones.",
  },
  {
    href: "/blog/why-couple-name-art-is-the-perfect-keepsake",
    label: "Couple Name Art Guide",
    description:
      "Read the supporting blog content for gift intent, decor use cases, and keepsake ideas.",
  },
  {
    href: "/personalized-name-mugs",
    label: "Name Mugs",
    description: "Turn couple name art into daily-use mugs.",
  },
  {
    href: "/personalized-name-wall-art",
    label: "Name Wall Art",
    description: "Make couple name art the centerpiece of your home.",
  },
];

const CouplesArtLandingPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredStyles =
    activeTab === "all"
      ? galleryItems
      : galleryItems.filter((item) => item.tags.includes(activeTab));

  return (
    <>
      <SeoHead
        title="Couples Name Art | Romantic Designs for Anniversaries and Gifts"
        description="Explore romantic couples name art styles and gift ideas. Anniversary, wedding, and relationship-themed designs for mugs, prints, and keepsakes."
        path="/couples-art"
        jsonLd={[
          buildCollectionPageSchema({
            name: "Couples Name Art",
            description:
              "Explore romantic couple name art styles, gift pathways, and supporting content.",
            path: "/couples-art",
            itemPaths: [
              "/couples-art/styles",
              ...relatedLinks.map((item) => item.href),
            ],
          }),
        ]}
      />

      <main className="bg-white">
        <section className="bg-cream-50 px-4 py-20 text-center lg:py-32">
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Where two names become one artwork
            </h1>
            <h2 className="mx-auto mt-4 max-w-3xl text-xl text-gray-700 dark:text-gray-300 md:text-2xl">
              Create custom couple name art for anniversaries, weddings, special
              dates, and meaningful gifts.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Use romantic, modern, or playful styles to turn two names into a
              keepsake that still works for decor, gifting, and product-ready formats.
            </p>
            <div className="mt-10">
              <Link href="/couples-name-art-generator">
                <button className="inline-block rounded-lg bg-brand-600 px-8 py-4 text-lg font-bold text-white transition hover:bg-brand-700">
                  Design Your Couples Art
                </button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Create your couple art in three steps
            </h2>
            <p className="mx-auto mb-16 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              A simple path from two names to a romantic keepsake.
            </p>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 text-center md:grid-cols-3">
              <div className="flex flex-col items-center p-6">
                <FiEdit3 className="mb-4 text-5xl text-pink-500" />
                <h3 className="mb-2 text-xl font-semibold">1. Enter Your Names</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Start with the names, initials, or date you want to celebrate.
                </p>
              </div>
              <div className="flex flex-col items-center border-y border-gray-200 p-6 md:border-x md:border-y-0 dark:border-gray-700">
                <FiHeart className="mb-4 text-5xl text-pink-500" />
                <h3 className="mb-2 text-xl font-semibold">2. Choose a Style</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Browse elegant calligraphy, minimal line art, and expressive color-heavy layouts.
                </p>
              </div>
              <div className="flex flex-col items-center p-6">
                <FiGift className="mb-4 text-5xl text-pink-500" />
                <h3 className="mb-2 text-xl font-semibold">3. Turn It Into a Keepsake</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Download the art or continue into gift and decor-focused pages.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-cream-50 py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              A style for every love story
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Choose the tone that best matches the relationship and the occasion.
            </p>

            <div className="mb-12 flex flex-wrap justify-center gap-2">
              {galleryTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    activeTab === tab.key
                      ? "bg-pink-500 text-white shadow"
                      : "bg-white text-gray-600 hover:bg-pink-50 border border-gray-200"
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
                      kind: "couple",
                      title: style.title,
                      fallbackAlt: `${style.title} couple name art style example`,
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
                href="/couples-art/styles"
                className="inline-flex rounded-full border border-cream-200 px-6 py-3 font-semibold text-slate-700 transition hover:border-pink-400 hover:text-pink-600"
              >
                Browse all couple styles
              </Link>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12 max-w-3xl">
              <h2 className="text-3xl font-bold md:text-4xl">
                Continue into gift and occasion pages
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Couple name art often performs best when it is tied to a clear
                gifting or decor use case. Use these related pages to go deeper.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-cream-200 p-6 transition hover:border-pink-400 hover:bg-pink-50"
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
              Cherished by couples everywhere
            </h2>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="rounded-lg bg-cream-50 p-8 text-left border border-cream-200">
                <FaQuoteLeft className="mb-4 text-3xl text-pink-400" />
                <p className="mb-6 italic text-gray-600 dark:text-gray-300">
                  "I created a piece with our names and wedding date for our
                  anniversary. It ended up becoming the centerpiece of our living room."
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- Mark T.</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-8 text-left shadow-xl dark:bg-gray-800">
                <FaQuoteLeft className="mb-4 text-3xl text-pink-400" />
                <p className="mb-6 italic text-gray-600 dark:text-gray-300">
                  "We used a couple design as a wedding keepsake and then carried
                  the same concept into our guest-book display."
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- Sarah and Liam</p>
              </div>
              <div className="rounded-lg bg-cream-50 p-8 text-left border border-cream-200">
                <FaQuoteLeft className="mb-4 text-3xl text-pink-400" />
                <p className="mb-6 italic text-gray-600 dark:text-gray-300">
                  "It gave me a personal gift idea that felt much more thoughtful
                  than generic decor."
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- Chloe J.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-brand-950 via-pink-900 to-brand-950 text-white">
          <div className="container mx-auto px-6 py-20 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to create your love story in art?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-pink-100">
              Design the artwork first, then move into gifts, decor, or milestone-focused pages.
            </p>
            <div className="mt-8">
              <Link href="/couples-name-art-generator">
                <button className="inline-block rounded-lg bg-white px-8 py-4 text-lg font-bold text-brand-900 transition hover:bg-brand-50">
                  Start Designing Now
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default CouplesArtLandingPage;
