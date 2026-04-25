import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import { SeoHead } from "~/component/SeoHead";
import type { StyleContent } from "~/data/styleContent";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFAQSchema,
} from "~/lib/seo";
import { getStyleImageAlt } from "~/lib/styleImageAlt";
import { ARABIC_STYLE_ITEMS, getArabicStyleBySlug } from "~/lib/styleTaxonomy";

type ArabicStylePageProps = {
  styleSlug: string;
  title: string;
  description: string;
  groupTitle: string;
  imageSrc: string;
  imageAlt: string;
  sampleImages: string[];
  content: StyleContent;
};

const ArabicStylePage: NextPage<ArabicStylePageProps> = ({
  styleSlug,
  title,
  description,
  groupTitle,
  imageSrc,
  imageAlt,
  sampleImages,
  content,
}) => {
  const pagePath = `/arabic-calligraphy/styles/${styleSlug}`;
  const getGeneratorHref = (styleImage = imageSrc) =>
    `/arabic-calligraphy-generator?style=${encodeURIComponent(
      styleSlug,
    )}&styleImage=${encodeURIComponent(styleImage)}`;

  return (
    <>
      <SeoHead
        title={`${title} Arabic Name Art Style | Name Design AI`}
        description={description}
        path={pagePath}
        image={imageSrc}
        imageAlt={imageAlt}
        jsonLd={[
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Arabic Name Art", path: "/arabic-calligraphy" },
            { name: "Styles", path: "/arabic-calligraphy/styles" },
            { name: title, path: pagePath },
          ]),
          buildCollectionPageSchema({
            name: `${title} Arabic style`,
            description,
            path: pagePath,
            itemPaths: [
              "/arabic-calligraphy-generator",
              "/arabic-calligraphy/products",
              "/personalized-gifts",
            ],
          }),
          ...(content.faqs && content.faqs.length > 0
            ? [buildFAQSchema(content.faqs)]
            : []),
        ]}
      />
      <main className="bg-white dark:bg-gray-900">
        <section className="bg-gradient-to-b from-amber-50 to-white px-4 py-20 dark:from-gray-800 dark:to-gray-900">
          <div className="container mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr,1.05fr]">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-amber-700">
                {groupTitle}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
                {title} Arabic style
              </h1>
              <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
                {description}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={getGeneratorHref()}
                  className="rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-700"
                >
                  {content.ctaPrimary ??
                    `Create your ${title.toLowerCase()} name calligraphy`}
                </Link>
                <Link
                  href="/arabic-calligraphy/styles"
                  className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-amber-400 hover:text-amber-600 dark:border-slate-600 dark:text-slate-200"
                >
                  Browse all styles
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <Image src={imageSrc} alt={imageAlt} fill className="object-cover" />
            </div>
          </div>
        </section>

        {content.introBody && (
          <section className="mx-auto max-w-3xl px-4 py-8">
            {content.introHeading && (
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                {content.introHeading}
              </h2>
            )}
            <p className="leading-relaxed text-gray-700">{content.introBody}</p>
          </section>
        )}

        <section className="px-4 py-16">
          <div className="container mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Example {title.toLowerCase()} calligraphy designs
              </h2>
              <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
                Browse sample directions for this style, then open the generator to
                create your own version.
              </p>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {sampleImages.map((src) => (
                <Link
                  key={src}
                  href={getGeneratorHref(src)}
                  className="group overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={src}
                      alt={getStyleImageAlt(src, {
                        kind: "arabic",
                        title,
                        fallbackAlt: `${title} Arabic calligraphy example`,
                      })}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {(content.productBridgeBody || content.productBridgeHeading) && (
          <section className="mx-auto max-w-4xl px-4 py-12">
            <h2 className="mb-3 text-2xl font-semibold text-gray-900">
              {content.productBridgeHeading ??
                `${title} name calligraphy on real products`}
            </h2>
            {content.productBridgeBody && (
              <p className="mb-6 text-gray-700">{content.productBridgeBody}</p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { href: "/arabic-calligraphy/products/mugs", label: "Mug" },
                { href: "/arabic-calligraphy/products/shirts", label: "Shirt" },
                {
                  href: "/arabic-calligraphy/products/wall-art",
                  label: "Wall art",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
                >
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {item.label}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {content.relatedStyles && content.relatedStyles.length > 0 && (
          <section className="mx-auto max-w-4xl px-4 py-12">
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">
              Related Arabic calligraphy styles
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {content.relatedStyles.map((relatedSlug) => {
                const related = getArabicStyleBySlug(relatedSlug);
                if (!related) return null;

                return (
                  <Link
                    key={relatedSlug}
                    href={`/arabic-calligraphy/styles/${relatedSlug}`}
                    className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
                  >
                    <span className="text-sm text-gray-500">
                      {related.groupTitle}
                    </span>
                    <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                      {related.title}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {content.faqs && content.faqs.length > 0 && (
          <section className="mx-auto max-w-4xl px-4 py-12">
            <h2 className="mb-8 text-center text-2xl font-semibold text-gray-900">
              Frequently asked questions about {title.toLowerCase()} Arabic name
              art
            </h2>
            <div className="space-y-6">
              {content.faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-lg border border-gray-200 p-6"
                >
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {faq.question}
                  </h3>
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="px-4 pb-16 text-center">
          <Link
            href="/arabic-calligraphy/styles"
            className="inline-flex rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
          >
            Back to all Arabic calligraphy styles
          </Link>
        </section>
      </main>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = () => ({
  paths: ARABIC_STYLE_ITEMS.map((item) => ({ params: { style: item.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<ArabicStylePageProps> = (context) => {
  const styleSlug = context.params?.style;
  if (typeof styleSlug !== "string") {
    return { notFound: true };
  }

  const style = getArabicStyleBySlug(styleSlug);
  if (!style) {
    return { notFound: true };
  }

  return {
    props: {
      styleSlug,
      title: style.title,
      description: style.description,
      groupTitle: style.groupTitle,
      imageSrc: style.imageSrc,
      imageAlt: style.imageAlt,
      sampleImages: style.sampleImages,
      content: style.content,
    },
  };
};

export default ArabicStylePage;
