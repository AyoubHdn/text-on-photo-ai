import { type NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  FiCpu,
  FiDownload,
  FiGlobe,
  FiLayers,
  FiPenTool,
  FiStar,
} from "react-icons/fi";

import { SeoHead } from "~/component/SeoHead";
import { buildCollectionPageSchema, buildFAQSchema } from "~/lib/seo";
import { getStyleImageAlt } from "~/lib/styleImageAlt";

const galleryItems = [
  { src: "/styles/arabic/thuluth-gold.webp", title: "Golden Thuluth", href: "/arabic-calligraphy/styles/golden-thuluth" },
  { src: "/styles/arabic/wireframe.webp", title: "Wireframe", href: "/arabic-calligraphy/styles/wireframe" },
  { src: "/styles/arabic/diwani-ink.webp", title: "Royal Diwani", href: "/arabic-calligraphy/styles/royal-diwani" },
  { src: "/styles/arabic/gold-3d.webp", title: "3D Gold Luxury", href: "/arabic-calligraphy/styles/3d-gold-luxury" },
  { src: "/styles/arabic/smoke-art.webp", title: "Mystical Smoke", href: "/arabic-calligraphy/styles/mystical-smoke" },
  { src: "/styles/arabic/sand-desert.webp", title: "Desert Sand", href: "/arabic-calligraphy/styles/desert-sand" },
  { src: "/styles/arabic/diamond.webp", title: "Diamond Encrusted", href: "/arabic-calligraphy/styles/diamond-encrusted" },
  { src: "/styles/arabic/kufic-geo.webp", title: "Geometric Kufic", href: "/arabic-calligraphy/styles/geometric-kufic" },
];

const arabicFaqs = [
  {
    question: "What is Arabic name art?",
    answer:
      "Arabic name art is a personalized design where an Arabic name is written in a calligraphy or decorative typography style. It's often used for gifts, wall decor, and keepsakes with cultural and spiritual meaning. Arabic name calligraphy can be traditional (thuluth, diwani, kufic) or modern.",
  },
  {
    question: "Can I write my name in Arabic calligraphy online for free?",
    answer:
      "You can preview your name in Arabic calligraphy for free. Generating a high-resolution, downloadable design uses credits from our pricing plans — and you can unlock free credits through promotions.",
  },
  {
    question: "What's the difference between traditional and modern Arabic calligraphy?",
    answer:
      "Traditional Arabic calligraphy (thuluth, diwani, kufic) follows centuries-old proportional rules used in Islamic calligraphy and manuscripts. Modern Arabic calligraphy takes those roots and simplifies them — cleaner lines, contemporary color palettes, and decorative elements like geometric patterns or gold leaf.",
  },
  {
    question: "Can I order Arabic name art on products?",
    answer:
      "Yes. Every Arabic name design can be printed on mugs, framed wall art, posters, and shirts. Arabic name gifts are especially popular for weddings, Ramadan, Eid, and family keepsakes.",
  },
  {
    question: "Do I need to know Arabic to use the tool?",
    answer:
      "No. Type a name in English letters (transliteration) and the generator will render it in Arabic script using your chosen calligraphy style.",
  },
  {
    question: "What Arabic calligraphy styles do you offer?",
    answer:
      "Our styles include thuluth in gold, diwani ink, kufic geometric patterns, smoke art, sand desert, diamond, 3D gold, and wireframe modern. Each style has a different visual character — browse the full Arabic calligraphy style gallery.",
  },
  {
    question: "Is Arabic name art suitable as an Islamic gift?",
    answer:
      "Yes. Arabic name art is widely gifted for Islamic occasions — weddings, Ramadan, Eid al-Fitr, Eid al-Adha, and family celebrations. Many customers use it for nursery decor with a child's name, or as a wedding gift featuring both spouses' names.",
  },
];

const productLinks = [
  {
    href: "/arabic-calligraphy/products",
    title: "Arabic Name Art Products",
    description:
      "Compare Arabic calligraphy mugs, shirts, and wall art before choosing the final product format.",
  },
  {
    href: "/arabic-name-gifts",
    title: "Arabic Name Gifts",
    description:
      "Use Arabic calligraphy artwork as the starting point for gift-ready products and keepsakes.",
  },
  {
    href: "/arabic-calligraphy/products/wall-art",
    title: "Arabic Name Art Wall Art",
    description:
      "Frame a calligraphy-inspired design as decor for homes, offices, celebrations, and memorial keepsakes.",
  },
];

const ArabicArtLandingPage: NextPage = () => {
  return (
    <>
      <SeoHead
        title="Arabic Name Art for Gifts | Custom Calligraphy Designs | NameDesignAI"
        description="Create custom Arabic name art and calligraphy designs. Personalized styles for wall art, mugs, framed prints, and meaningful Islamic gifts."
        path="/arabic-calligraphy"
        keywords="arabic name art, arabic name gift, personalized arabic name, custom arabic calligraphy, arabic calligraphy gift, arabic name wall art"
        jsonLd={[
          buildCollectionPageSchema({
            name: "Arabic Name Art",
            description:
              "Explore Arabic name art and calligraphy styles for gifts, wall decor, and personalized keepsakes.",
            path: "/arabic-calligraphy",
          }),
          buildFAQSchema(arabicFaqs),
        ]}
      />

      <main className="bg-white">
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white px-4 py-24 text-center dark:from-gray-800 dark:to-gray-900 lg:py-32">
          <div className="absolute left-0 top-0 h-full w-full opacity-10 dark:opacity-5" />

          <div className="container relative z-10 mx-auto">
            <span className="mb-6 inline-block rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-brand-800">
              Arabic Name Gifts
            </span>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-6xl lg:text-7xl">
              Turn an Arabic name into a personalized gift
            </h1>
            <h2 className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-gray-600 dark:text-gray-300 md:text-2xl">
              Create custom Arabic name art and Arabic calligraphy in minutes
            </h2>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/arabic-calligraphy-generator">
                <button className="w-full rounded-xl bg-brand-600 px-8 py-4 text-lg font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-brand-700 hover:shadow-2xl sm:w-auto">
                  Create Arabic Art Now
                </button>
              </Link>
              <Link href="#gallery">
                <button className="w-full rounded-xl border-2 border-cream-200 bg-white px-8 py-4 text-lg font-bold text-gray-700 transition hover:border-cream-300 hover:bg-cream-50 sm:w-auto">
                  View Examples
                </button>
              </Link>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
              Looking for broader Latin-letter or decorative name styles instead?
              {" "}
              <Link href="/name-art" className="font-semibold text-brand-700 hover:text-brand-800">
                Start with the main Name Art page
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Calligraphy made simple
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                No design skills needed. Start with a name and refine the style.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 text-center md:grid-cols-3">
              <div className="flex flex-col items-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <FiPenTool className="text-4xl" />
                </div>
                <h3 className="mb-3 text-xl font-bold">1. Type Your Name</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Start with an Arabic name or an English spelling you want to explore visually.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <FiLayers className="text-4xl" />
                </div>
                <h3 className="mb-3 text-xl font-bold">2. Choose a Style</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Move between classic, geometric, luxurious, and modern Arabic directions.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <FiDownload className="text-4xl" />
                </div>
                <h3 className="mb-3 text-xl font-bold">3. Download or Print</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Use the final design for social visuals, wall art, product printing, or gifting.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="gallery" className="bg-cream-50 py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Styles that balance tradition and modern identity
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Explore a curated set of Arabic art directions before creating your Arabic name art.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {galleryItems.map((style) => (
                <Link
                  key={style.title}
                  href={style.href}
                  className="group relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-lg"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={style.src}
                      alt={getStyleImageAlt(style.src, {
                        kind: "arabic",
                        title: style.title,
                        fallbackAlt: `${style.title} Arabic calligraphy style example`,
                      })}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="text-lg font-bold text-white">{style.title}</span>
                    <span className="mt-2 text-sm font-medium text-white/90">
                      Explore style
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-12 text-center">
              <div className="mb-4">
                <Link
                  href="/arabic-calligraphy/styles"
                  className="inline-flex rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-600 dark:border-slate-600 dark:text-slate-200"
                >
                  Browse all Arabic styles
                </Link>
              </div>
              <Link href="/arabic-calligraphy-generator">
                <button className="inline-block rounded-full bg-brand-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-brand-700 hover:shadow-xl">
                  Try These Styles Now
                </button>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">Gift ideas built around the name</h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Arabic name art works across multiple gift formats — each one carrying the name in a different way.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl border p-8 transition duration-300 hover:shadow-xl dark:border-gray-700">
                <FiStar className="mb-4 text-4xl text-amber-500" />
                <h3 className="mb-3 text-2xl font-bold">Eid and occasion gifts</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  A name in calligraphy-inspired style makes a distinctive gift for Eid, birthdays, and family milestones.
                </p>
              </div>
              <div className="rounded-2xl border p-8 transition duration-300 hover:shadow-xl dark:border-gray-700">
                <FiGlobe className="mb-4 text-4xl text-brand-600" />
                <h3 className="mb-3 text-2xl font-bold">Framed wall art</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Print the design as a framed keepsake for a home, office, or shared space — a gift that stays visible.
                </p>
              </div>
              <div className="rounded-2xl border p-8 transition duration-300 hover:shadow-xl dark:border-gray-700">
                <FiCpu className="mb-4 text-4xl text-purple-500" />
                <h3 className="mb-3 text-2xl font-bold">Mugs and daily-use gifts</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Put the artwork on a mug or coaster — a practical gift that keeps the name in view every day.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-cream-50 py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12 max-w-3xl">
              <h2 className="text-3xl font-bold md:text-4xl">
                Continue into Arabic gift and decor categories
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Once the calligraphy direction is set, choose the gift or decor
                format that fits it best.
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
                    {link.title}
                  </h3>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">
                    {link.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cream-50 py-24">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {arabicFaqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-xl bg-white p-6 shadow-sm border border-cream-100"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{faq.question}</h3>
                    <span className="text-2xl font-bold text-slate-400 transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-300">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-brand-600 to-brand-800 px-4 py-24 text-center text-white">
          <div className="container mx-auto">
            <h2 className="mb-6 text-3xl font-bold md:text-5xl">
              Ready to create your masterpiece?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-brand-100">
              Join users creating Arabic name art for identity, decor, branding, and gifts.
            </p>
            <Link href="/arabic-calligraphy-generator">
              <button className="transform rounded-full bg-white px-10 py-5 text-lg font-bold text-brand-800 shadow-2xl transition hover:-translate-y-1 hover:bg-brand-50">
                Generate Arabic Art Now
              </button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default ArabicArtLandingPage;
