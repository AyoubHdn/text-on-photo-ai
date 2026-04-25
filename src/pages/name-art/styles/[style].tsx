import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import { SeoHead } from "~/component/SeoHead";
import type { StyleContent } from "~/data/styleContent";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFAQSchema,
  buildItemListSchema,
} from "~/lib/seo";
import { getStyleImageAlt } from "~/lib/styleImageAlt";
import {
  getNameArtStyleBySlug,
  getNamesForStyle,
  getStyleEntry,
  NAME_ART_STYLE_ITEMS,
} from "~/lib/styleTaxonomy";

type NameArtStylePageProps = {
  styleSlug: string;
  title: string;
  description: string;
  groupTitle: string;
  imageSrc: string;
  imageAlt: string;
  sampleImages: string[];
  relatedNames: Array<{ name: string; path: string; niches: string[] }>;
  content: StyleContent;
};

const NameArtStylePage: NextPage<NameArtStylePageProps> = ({
  styleSlug,
  title,
  description,
  groupTitle,
  imageSrc,
  imageAlt,
  sampleImages,
  relatedNames,
  content,
}) => {
  const pagePath = `/name-art/styles/${styleSlug}`;
  const getGeneratorHref = (styleImage = imageSrc) =>
    `/name-art-generator?style=${encodeURIComponent(
      styleSlug,
    )}&styleImage=${encodeURIComponent(styleImage)}`;

  return (
    <>
      <SeoHead
        title={`${title} Name Art Styles | Name Design AI`}
        description={description}
        path={pagePath}
        image={imageSrc}
        imageAlt={imageAlt}
        jsonLd={[
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Name Art", path: "/name-art" },
            { name: "Styles", path: "/name-art/styles" },
            { name: title, path: pagePath },
          ]),
          buildCollectionPageSchema({
            name: `${title} name art styles`,
            description,
            path: pagePath,
            itemPaths: [
              "/name-art-generator",
              ...relatedNames.map((item) => item.path),
            ],
          }),
          buildItemListSchema({
            name: `${title} related names`,
            itemPaths: relatedNames.map((item) => item.path),
          }),
          ...(content.faqs && content.faqs.length > 0
            ? [buildFAQSchema(content.faqs)]
            : []),
        ]}
      />
      <main className="bg-white dark:bg-gray-900">
        <section className="bg-gradient-to-b from-slate-50 to-white px-4 py-20 dark:from-gray-800 dark:to-gray-900">
          <div className="container mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr,1.05fr]">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">
                {groupTitle}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
                {title} name art styles
              </h1>
              <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
                {description}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={getGeneratorHref()}
                  className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
                >
                  {content.ctaPrimary ??
                    `Create your ${title.toLowerCase()} name art`}
                </Link>
                <Link
                  href="/name-art/styles"
                  className="rounded-lg border border-cream-200 px-6 py-3 font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
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
                Example {title.toLowerCase()} designs
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
                        kind: "name",
                        title,
                        fallbackAlt: `${title} name art example`,
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
                `${title} name art on real products`}
            </h2>
            {content.productBridgeBody && (
              <p className="mb-6 text-gray-700">{content.productBridgeBody}</p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { href: "/personalized-name-mugs", label: "Mug" },
                { href: "/custom-name-shirts", label: "Shirt" },
                { href: "/personalized-name-wall-art", label: "Wall art" },
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
              Related name art styles
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {content.relatedStyles.map((relatedSlug) => {
                const related = getStyleEntry(relatedSlug);
                if (!related) return null;

                return (
                  <Link
                    key={relatedSlug}
                    href={`/name-art/styles/${relatedSlug}`}
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

        <section className="bg-gray-50 px-4 py-16 dark:bg-gray-800">
          <div className="container mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Names that fit this style
              </h2>
              <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
                Explore name pages that already feature this visual direction.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {relatedNames.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
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

        {content.faqs && content.faqs.length > 0 && (
          <section className="mx-auto max-w-4xl px-4 py-12">
            <h2 className="mb-8 text-center text-2xl font-semibold text-gray-900">
              Frequently asked questions about {title.toLowerCase()} name art
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
            href="/name-art/styles"
            className="inline-flex rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
          >
            Back to all name art styles
          </Link>
        </section>
      </main>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = () => ({
  paths: NAME_ART_STYLE_ITEMS.map((item) => ({ params: { style: item.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<NameArtStylePageProps> = (context) => {
  const styleSlug = context.params?.style;
  if (typeof styleSlug !== "string") {
    return { notFound: true };
  }

  const style = getNameArtStyleBySlug(styleSlug);
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
      relatedNames: getNamesForStyle(style.title),
      content: style.content,
    },
  };
};

export default NameArtStylePage;
