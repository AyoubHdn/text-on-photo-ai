import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import { SeoHead } from "~/component/SeoHead";
import { buildCollectionPageSchema, buildItemListSchema } from "~/lib/seo";
import { NAME_ART_STYLE_GROUPS } from "~/lib/styleTaxonomy";

const NameArtStylesIndexPage: NextPage = () => {
  const itemPaths = NAME_ART_STYLE_GROUPS.flatMap((group) =>
    group.items.map((item) => `/name-art/styles/${item.slug}`),
  );

  return (
    <>
      <SeoHead
        title="Name Art Styles | Browse All Name Design AI Style Categories"
        description="Browse name art styles by category and sub-style. Explore cute, fantasy, floral, typography, graffiti, classic, and more name art directions."
        path="/name-art/styles"
        jsonLd={[
          buildCollectionPageSchema({
            name: "Name art styles",
            description: "Browse all name art style categories and sub-styles.",
            path: "/name-art/styles",
            itemPaths,
          }),
          buildItemListSchema({
            name: "Name art styles",
            itemPaths,
          }),
        ]}
      />
      <main className="bg-white">
        <section className="bg-gradient-to-b from-cream-50 to-white px-4 py-20">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">
              Browse name art styles
            </h1>
            <p className="mt-5 max-w-3xl text-lg text-slate-600 dark:text-slate-300">
              Explore the full style library by category, then open any sub-style to
              see examples, sample names, and a direct path into the generator.
            </p>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="container mx-auto max-w-6xl space-y-14">
            {NAME_ART_STYLE_GROUPS.map((group) => (
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
                      href={`/name-art/styles/${item.slug}`}
                      className="group overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
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
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">
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

export default NameArtStylesIndexPage;
