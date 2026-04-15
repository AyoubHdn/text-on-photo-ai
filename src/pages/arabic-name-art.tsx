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
import { buildFAQSchema } from "~/lib/seo";
import { getStyleImageAlt } from "~/lib/styleImageAlt";

const galleryItems = [
  { src: "/styles/arabic/thuluth-gold.webp", title: "Golden Thuluth", href: "/arabic-name-art/styles/golden-thuluth" },
  { src: "/styles/arabic/wireframe.webp", title: "Wireframe", href: "/arabic-name-art/styles/wireframe" },
  { src: "/styles/arabic/diwani-ink.webp", title: "Royal Diwani", href: "/arabic-name-art/styles/royal-diwani" },
  { src: "/styles/arabic/gold-3d.webp", title: "3D Gold Luxury", href: "/arabic-name-art/styles/3d-gold-luxury" },
  { src: "/styles/arabic/smoke-art.webp", title: "Mystical Smoke", href: "/arabic-name-art/styles/mystical-smoke" },
  { src: "/styles/arabic/sand-desert.webp", title: "Desert Sand", href: "/arabic-name-art/styles/desert-sand" },
  { src: "/styles/arabic/diamond.webp", title: "Diamond Encrusted", href: "/arabic-name-art/styles/diamond-encrusted" },
  { src: "/styles/arabic/kufic-geo.webp", title: "Geometric Kufic", href: "/arabic-name-art/styles/geometric-kufic" },
];

const arabicFaqs = [
  {
    question: "Do I need an Arabic keyboard?",
    answer:
      "No. You can start with an English spelling of the name or use Arabic text directly, then test visual directions inside the generator.",
  },
  {
    question: "Can I use the artwork for logos or branding?",
    answer:
      "Yes. Many users explore Arabic calligraphy styles for branding, profile artwork, decor, and personalized gifts.",
  },
  {
    question: "Can this artwork be used on gifts and decor?",
    answer:
      "Yes. Arabic name art can be adapted for framed wall art, mugs, shirts, and other personalized product formats after the design is finalized.",
  },
];

const productLinks = [
  {
    href: "/arabic-name-gifts",
    title: "Arabic Name Gifts",
    description:
      "Use Arabic calligraphy artwork as the starting point for gift-ready products and keepsakes.",
  },
  {
    href: "/personalized-name-wall-art",
    title: "Personalized Name Wall Art",
    description:
      "Frame a calligraphy-inspired design as decor for homes, offices, celebrations, and memorial keepsakes.",
  },
];

const ArabicArtLandingPage: NextPage = () => {
  return (
    <>
      <SeoHead
        title="Arabic Name Art Generator | AI Arabic Calligraphy Styles | NameDesignAI"
        description="Create Arabic name art with AI-powered calligraphy styles. Explore Thuluth, Diwani, Kufic, and modern Arabic lettering for gifts, wall art, branding, and decor."
        path="/arabic-name-art"
        keywords="arabic name art, arabic calligraphy generator, arabic name design, thuluth calligraphy, diwani calligraphy, kufic calligraphy, custom arabic wall art"
        jsonLd={[buildFAQSchema(arabicFaqs)]}
      />

      <main className="bg-white dark:bg-gray-900">
        <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white px-4 py-24 text-center dark:from-gray-800 dark:to-gray-900 lg:py-32">
          <div className="absolute left-0 top-0 h-full w-full opacity-10 dark:opacity-5" />

          <div className="container relative z-10 mx-auto">
            <span className="mb-6 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
              AI Arabic calligraphy tool
            </span>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-6xl lg:text-7xl">
              Create Arabic name art in calligraphy-inspired styles
            </h1>
            <h2 className="mx-auto mb-10 max-w-3xl text-xl leading-relaxed text-gray-600 dark:text-gray-300 md:text-2xl">
              Blend the feel of traditional calligraphy with modern AI to create
              Arabic name art for gifts, decor, branding, and identity-rich
              visuals without losing the focus on Arabic lettering.
            </h2>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/arabic-name-art-generator">
                <button className="w-full rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-blue-700 hover:shadow-2xl sm:w-auto">
                  Create Arabic Art Now
                </button>
              </Link>
              <Link href="#gallery">
                <button className="w-full rounded-xl border-2 border-gray-200 bg-white px-8 py-4 text-lg font-bold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 sm:w-auto">
                  View Examples
                </button>
              </Link>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
              Looking for broader Latin-letter or decorative name styles instead?
              {" "}
              <Link href="/name-art" className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200">
                Start with the main Name Art page
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="bg-white py-24 dark:bg-gray-900">
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
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
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

        <section id="gallery" className="bg-gray-50 py-24 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Styles that balance tradition and modern identity
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Explore a curated set of Arabic art directions before starting the generator.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {galleryItems.map((style) => (
                <Link
                  key={style.title}
                  href={style.href}
                  className="group relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-lg dark:bg-gray-700"
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
                  href="/arabic-name-art/styles"
                  className="inline-flex rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-600 dark:border-slate-600 dark:text-slate-200"
                >
                  Browse all Arabic styles
                </Link>
              </div>
              <Link href="/arabic-name-art-generator">
                <button className="inline-block rounded-full bg-blue-600 px-10 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-blue-700 hover:shadow-xl">
                  Try These Styles Now
                </button>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white py-24 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold md:text-4xl">More than just a name</h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Arabic calligraphy can support identity-focused use cases far beyond a single image.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl border p-8 transition duration-300 hover:shadow-xl dark:border-gray-700">
                <FiStar className="mb-4 text-4xl text-amber-500" />
                <h3 className="mb-3 text-2xl font-bold">Logos and Branding</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Build an identity-rich starting point for brands, personal marks, and signature visuals.
                </p>
              </div>
              <div className="rounded-2xl border p-8 transition duration-300 hover:shadow-xl dark:border-gray-700">
                <FiGlobe className="mb-4 text-4xl text-blue-500" />
                <h3 className="mb-3 text-2xl font-bold">Social and Profile Art</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Give your profile visuals a culturally distinctive direction that still feels contemporary.
                </p>
              </div>
              <div className="rounded-2xl border p-8 transition duration-300 hover:shadow-xl dark:border-gray-700">
                <FiCpu className="mb-4 text-4xl text-purple-500" />
                <h3 className="mb-3 text-2xl font-bold">Decor and Gifts</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Adapt the same artwork for framed decor, mugs, gift bundles, and special-occasion keepsakes.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-24 dark:bg-gray-800">
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
            <div className="grid gap-6 md:grid-cols-2">
              {productLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
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

        <section className="bg-gray-50 py-24 dark:bg-gray-800">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {arabicFaqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-700"
                >
                  <h3 className="mb-2 text-lg font-bold">{faq.question}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-24 text-center text-white">
          <div className="container mx-auto">
            <h2 className="mb-6 text-3xl font-bold md:text-5xl">
              Ready to create your masterpiece?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-xl text-blue-100">
              Join users creating Arabic name art for identity, decor, branding, and gifts.
            </p>
            <Link href="/arabic-name-art-generator">
              <button className="transform rounded-full bg-white px-10 py-5 text-lg font-bold text-blue-700 shadow-2xl transition hover:-translate-y-1 hover:bg-blue-50">
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
