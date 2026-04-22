import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import { SeoHead } from "~/component/SeoHead";
import { buildBreadcrumbSchema, buildCollectionPageSchema } from "~/lib/seo";
import { COUPLES_STYLE_ITEMS, getCouplesStyleBySlug } from "~/lib/styleTaxonomy";

type CouplesStylePageProps = {
  styleSlug: string;
  title: string;
  description: string;
  groupTitle: string;
  imageSrc: string;
  imageAlt: string;
};

const CouplesStylePage: NextPage<CouplesStylePageProps> = ({
  styleSlug,
  title,
  description,
  groupTitle,
  imageSrc,
  imageAlt,
}) => {
  const pagePath = `/couples-art/styles/${styleSlug}`;
  const generatorHref = `/couples-name-art-generator?style=${encodeURIComponent(
    styleSlug,
  )}&styleImage=${encodeURIComponent(imageSrc)}`;

  return (
    <>
      <SeoHead
        title={`${title} Couple Art Style | Name Design AI`}
        description={description}
        path={pagePath}
        image={imageSrc}
        imageAlt={imageAlt}
        jsonLd={[
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Couples Art", path: "/couples-art" },
            { name: "Styles", path: "/couples-art/styles" },
            { name: title, path: pagePath },
          ]),
          buildCollectionPageSchema({
            name: `${title} couple art style`,
            description,
            path: pagePath,
            itemPaths: [
              "/couples-name-art-generator",
              "/couple-gifts",
            ],
          }),
        ]}
      />
      <main className="bg-white dark:bg-gray-900">
        <section className="bg-gradient-to-b from-rose-50 to-white px-4 py-20 dark:from-gray-800 dark:to-gray-900">
          <div className="container mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr,1.05fr]">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-pink-600 dark:text-pink-300">
                {groupTitle}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
                {title} couple art style
              </h1>
              <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
                {description}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={generatorHref}
                  className="rounded-lg bg-pink-600 px-6 py-3 font-semibold text-white transition hover:bg-pink-700"
                >
                  Create this style
                </Link>
                <Link
                  href="/couples-art/styles"
                  className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-pink-400 hover:text-pink-600 dark:border-slate-600 dark:text-slate-200"
                >
                  Browse all couple styles
                </Link>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <Image src={imageSrc} alt={imageAlt} fill className="object-cover" />
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = () => ({
  paths: COUPLES_STYLE_ITEMS.map((item) => ({ params: { style: item.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<CouplesStylePageProps> = (context) => {
  const styleSlug = context.params?.style;
  if (typeof styleSlug !== "string") {
    return { notFound: true };
  }

  const style = getCouplesStyleBySlug(styleSlug);
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
    },
  };
};

export default CouplesStylePage;
