import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import { SeoHead } from "~/component/SeoHead";
import { buildCollectionPageSchema, buildItemListSchema } from "~/lib/seo";
import { COUPLES_STYLE_GROUPS } from "~/lib/styleTaxonomy";

const CouplesStylesIndexPage: NextPage = () => {
  const itemPaths = COUPLES_STYLE_GROUPS.flatMap((group) =>
    group.items.map((item) => `/couples-art/styles/${item.slug}`),
  );

  return (
    <>
      <SeoHead
        title="Couple Art Styles | Romantic, Modern, and Playful Name Art"
        description="Browse couple name art styles for weddings, anniversaries, keepsakes, and romantic gifts. Explore romantic, modern, and playful sub-styles."
        path="/couples-art/styles"
        jsonLd={[
          buildCollectionPageSchema({
            name: "Couple art styles",
            description: "Browse romantic, modern, and playful couple art styles.",
            path: "/couples-art/styles",
            itemPaths,
          }),
          buildItemListSchema({
            name: "Couple art styles",
            itemPaths,
          }),
        ]}
      />
      <main className="bg-white dark:bg-gray-900">
        <section className="bg-gradient-to-b from-rose-50 to-white px-4 py-20 dark:from-gray-800 dark:to-gray-900">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
              Browse couple art styles
            </h1>
            <p className="mt-5 max-w-3xl text-lg text-slate-600 dark:text-slate-300">
              Explore the full couple art style library by mood and sub-style,
              then open the one that fits your relationship story best.
            </p>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="container mx-auto max-w-6xl space-y-14">
            {COUPLES_STYLE_GROUPS.map((group) => (
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
                      href={`/couples-art/styles/${item.slug}`}
                      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-pink-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
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
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-pink-600 dark:text-pink-300">
                          {group.title}
                        </p>
                        <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
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

export default CouplesStylesIndexPage;
