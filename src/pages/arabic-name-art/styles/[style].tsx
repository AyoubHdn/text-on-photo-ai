import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import { SeoHead } from "~/component/SeoHead";
import { buildBreadcrumbSchema, buildCollectionPageSchema } from "~/lib/seo";
import { ARABIC_STYLE_ITEMS, getArabicStyleBySlug } from "~/lib/styleTaxonomy";

type ArabicStylePageProps = {
  styleSlug: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

const ArabicStylePage: NextPage<ArabicStylePageProps> = ({
  styleSlug,
  title,
  description,
  imageSrc,
  imageAlt,
}) => {
  const pagePath = `/arabic-name-art/styles/${styleSlug}`;

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
            { name: "Arabic Name Art", path: "/arabic-name-art" },
            { name: "Styles", path: "/arabic-name-art/styles" },
            { name: title, path: pagePath },
          ]),
          buildCollectionPageSchema({
            name: `${title} Arabic style`,
            description,
            path: pagePath,
            itemPaths: ["/arabic-name-art-generator", "/arabic-name-gifts"],
          }),
        ]}
      />
      <main className="bg-white">
        <section className="bg-gradient-to-b from-amber-50 to-white px-4 py-20 dark:from-gray-800 dark:to-gray-900">
          <div className="container mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr,1.05fr]">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
                {title} Arabic style
              </h1>
              <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
                {description}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/arabic-name-art-generator"
                  className="rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-700"
                >
                  Create this style
                </Link>
                <Link
                  href="/arabic-name-gifts"
                  className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
                >
                  See gift ideas
                </Link>
                <Link
                  href="/arabic-name-art/styles"
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
      </main>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: ARABIC_STYLE_ITEMS.map((item) => ({ params: { style: item.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<ArabicStylePageProps> = async (context) => {
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
      imageSrc: style.imageSrc,
      imageAlt: style.imageAlt,
    },
  };
};

export default ArabicStylePage;

