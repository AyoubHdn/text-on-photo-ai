import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import { SeoHead } from "~/component/SeoHead";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
} from "~/lib/seo";
import { getStyleImageAlt } from "~/lib/styleImageAlt";
import { getNameArtStyleBySlug, getNamesForStyle, NAME_ART_STYLE_ITEMS } from "~/lib/styleTaxonomy";

type NameArtStylePageProps = {
  styleSlug: string;
  title: string;
  description: string;
  groupTitle: string;
  imageSrc: string;
  imageAlt: string;
  sampleImages: string[];
  relatedNames: Array<{ name: string; path: string; niches: string[] }>;
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
                  Create this style
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
    },
  };
};

export default NameArtStylePage;
