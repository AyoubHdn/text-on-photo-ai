import Image from "next/image";
import Link from "next/link";

import { SeoHead } from "~/component/SeoHead";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFAQSchema,
  buildItemListSchema,
  type BreadcrumbItem,
} from "~/lib/seo";
import {
  type NameArtExample,
  type ProductMockup,
  type VisualCategoryCard,
} from "~/lib/productCategoryVisuals";

type PageLink = {
  href: string;
  label: string;
  description: string;
};

type ContentCard = {
  title: string;
  description: string;
};

type FAQItem = {
  question: string;
  answer: string;
};

type ProductCategoryPageProps = {
  title: string;
  description: string;
  path: string;
  h1: string;
  eyebrow: string;
  intro: string;
  secondaryIntro: string;
  useCases: ContentCard[];
  highlights: ContentCard[];
  generatorLinks: PageLink[];
  relatedLinks: PageLink[];
  categoryCards: VisualCategoryCard[];
  nameArtExamples: NameArtExample[];
  productMockups: ProductMockup[];
  faqItems: FAQItem[];
  breadcrumbs: BreadcrumbItem[];
};

export function ProductCategoryPage({
  title,
  description,
  path,
  h1,
  eyebrow,
  intro,
  secondaryIntro,
  useCases,
  highlights,
  generatorLinks,
  relatedLinks,
  categoryCards,
  nameArtExamples,
  productMockups,
  faqItems,
  breadcrumbs,
}: ProductCategoryPageProps) {
  const collectionItemPaths = Array.from(
    new Set([
      ...generatorLinks.map((link) => link.href),
      ...relatedLinks.map((link) => link.href),
      ...categoryCards.map((card) => card.href),
      ...nameArtExamples.map((example) => example.href),
      ...productMockups.map((mockup) => mockup.href),
    ]),
  );
  const primaryImage =
    categoryCards[0]?.imageSrc ?? productMockups[0]?.imageSrc ?? "/banner.webp";
  const primaryImageAlt =
    categoryCards[0]?.imageAlt ??
    productMockups[0]?.imageAlt ??
    `${h1} preview image`;
  const heroTiles = [
    ...categoryCards.slice(0, 2).map((card) => ({
      href: card.href,
      title: card.title,
      imageSrc: card.imageSrc,
      imageAlt: card.imageAlt,
    })),
    ...nameArtExamples.slice(0, 2).map((example) => ({
      href: example.href,
      title: example.title,
      imageSrc: example.imageSrc,
      imageAlt: example.imageAlt,
    })),
  ].slice(0, 4);

  return (
    <>
      <SeoHead
        title={title}
        description={description}
        path={path}
        image={primaryImage}
        imageAlt={primaryImageAlt}
        jsonLd={[
          buildBreadcrumbSchema(breadcrumbs),
          buildCollectionPageSchema({
            name: h1,
            description,
            path,
            itemPaths: collectionItemPaths,
          }),
          buildFAQSchema(faqItems),
          buildItemListSchema({
            name: `${h1} category links`,
            itemPaths: categoryCards.map((card) => card.href),
          }),
          buildItemListSchema({
            name: `${h1} example name art pages`,
            itemPaths: nameArtExamples.map((example) => example.href),
          }),
        ]}
      />

      <main className="bg-white dark:bg-gray-900">
        <section className="overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-16 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 lg:py-20">
          <div className="container mx-auto max-w-6xl">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr,0.95fr]">
              <div>
                <nav className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                  {breadcrumbs.map((crumb, index) => (
                    <span key={crumb.path}>
                      {index > 0 ? " / " : ""}
                      <Link href={crumb.path} className="hover:text-blue-500">
                        {crumb.name}
                      </Link>
                    </span>
                  ))}
                </nav>
                <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {eyebrow}
                </span>
                <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                  {h1}
                </h1>
                <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                  {intro}
                </p>
                <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                  {secondaryIntro}
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  {generatorLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {heroTiles.map((tile, index) => (
                  <Link
                    key={`${tile.href}-${tile.title}`}
                    href={tile.href}
                    className={index === 0 ? "sm:row-span-2" : ""}
                  >
                    <article className="group h-full overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">
                      <div
                        className={`relative ${
                          index === 0 ? "aspect-[4/5] h-full min-h-[260px]" : "aspect-[4/3]"
                        }`}
                      >
                        <Image
                          src={tile.imageSrc}
                          alt={tile.imageAlt}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent p-5">
                          <p className="text-lg font-semibold text-white">
                            {tile.title}
                          </p>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">
                  Highlight
                </p>
                <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-3 text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-50 px-4 py-16 dark:bg-gray-800">
          <div className="container mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Browse personalized gift categories
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Use these category cards to narrow the gift idea by product,
                recipient, or occasion.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
              {categoryCards.map((card) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={card.imageSrc}
                      alt={card.imageAlt}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      {card.description}
                    </p>
                    <span className="mt-4 inline-flex text-sm font-semibold text-blue-600 dark:text-blue-300">
                      View category
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Name art examples that can become products
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                These examples give you a more visual starting point before you
                choose a generator or a product direction.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {nameArtExamples.map((example) => (
                <Link
                  key={example.href}
                  href={example.href}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={example.imageSrc}
                      alt={example.imageAlt}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {example.title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                      {example.description}
                    </p>
                    <span className="mt-4 inline-flex text-sm font-semibold text-blue-600 dark:text-blue-300">
                      Open name art page
                    </span>
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
                See how the artwork looks on finished products
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Product mockups show how the artwork can look on finished items
                while keeping the design itself front and center.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {productMockups.map((mockup) => (
                <article
                  key={`${mockup.href}-${mockup.title}`}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={mockup.imageSrc}
                      alt={mockup.imageAlt}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {mockup.title}
                    </h3>
                    <p className="mt-3 text-slate-600 dark:text-slate-300">
                      {mockup.description}
                    </p>
                    <Link
                      href={mockup.href}
                      className="mt-5 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:text-slate-200"
                    >
                      {mockup.ctaLabel}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-5xl px-4 py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              How these personalized products fit the NameDesignAI workflow
            </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
              Every product still starts with a custom design. These use-case
              cards show how the artwork can fit different gift ideas and
              product formats.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {useCase.title}
                </h3>
                <p className="mt-3 text-slate-600 dark:text-slate-300">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto max-w-5xl px-4 py-16">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Best generators for this category
              </h2>
              <div className="mt-6 space-y-4">
                {generatorLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-2xl border border-slate-200 p-5 transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {link.label}
                    </h3>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">
                      {link.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Related gift and product pages
              </h2>
              <div className="mt-6 space-y-4">
                {relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-2xl border border-slate-200 p-5 transition hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {link.label}
                    </h3>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">
                      {link.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 px-4 py-16 dark:bg-gray-800">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Frequently asked questions
            </h2>
            <div className="mt-8 space-y-5">
              {faqItems.map((faq) => (
                <details
                  key={faq.question}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <summary className="cursor-pointer text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {faq.question}
                  </summary>
                  <p className="mt-4 text-slate-600 dark:text-slate-300">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
