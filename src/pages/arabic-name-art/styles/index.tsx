import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import { SeoHead } from "~/component/SeoHead";
import { buildCollectionPageSchema, buildItemListSchema } from "~/lib/seo";
import { ARABIC_STYLE_GROUPS } from "~/lib/styleTaxonomy";

const ArabicStylesIndexPage: NextPage = () => {
  const itemPaths = ARABIC_STYLE_GROUPS.flatMap((group) =>
    group.items.map((item) => `/arabic-name-art/styles/${item.slug}`),
  );

  return (
    <>
      <SeoHead
        title="Arabic Name Art Styles | Calligraphy and Decorative Directions"
        description="Browse Arabic name art styles including calligraphy-led, luxury, modern, and decorative visual directions."
        path="/arabic-name-art/styles"
        jsonLd={[
          buildCollectionPageSchema({
            name: "Arabic name art styles",
            description: "Browse Arabic name art styles and sub-styles.",
            path: "/arabic-name-art/styles",
            itemPaths,
          }),
          buildItemListSchema({
            name: "Arabic styles",
            itemPaths,
          }),
        ]}
      />
      <main className="bg-white dark:bg-gray-900">
        <section className="bg-gradient-to-b from-amber-50 to-white px-4 py-20 dark:from-gray-800 dark:to-gray-900">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
              Browse Arabic art styles
            </h1>
            <p className="mt-5 max-w-3xl text-lg text-slate-600 dark:text-slate-300">
              Explore Arabic calligraphy and decorative style directions, then open
              the one that best matches your intended look.
            </p>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="container mx-auto max-w-6xl space-y-14">
            {ARABIC_STYLE_GROUPS.map((group) => (
              <section key={group.slug}>
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {group.title}
                  </h2>
                  <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
                    {group.description}
                  </p>
                </div>

                <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {group.items.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/arabic-name-art/styles/${item.slug}`}
                      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={item.imageSrc}
                          alt={item.imageAlt}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h3>
                        <p className="mt-3 text-slate-600 dark:text-slate-300">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>
    </>
  );
};

export default ArabicStylesIndexPage;
