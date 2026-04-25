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
import type {
  StyleProductCard,
  StyleProductContentCard,
  StyleProductDetailConfig,
  StyleProductFAQ,
  StyleProductHubConfig,
  StyleProductLink,
  StyleProductVisualCard,
} from "~/lib/styleProductSeo";

const Breadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav className="mb-6 text-sm text-slate-500">
    {items.map((crumb, index) => (
      <span key={crumb.path}>
        {index > 0 ? " / " : ""}
        <Link href={crumb.path} className="hover:text-brand-700">
          {crumb.name}
        </Link>
      </span>
    ))}
  </nav>
);

const PrimaryActions = ({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) => (
  <div className="mt-8 flex flex-wrap gap-4">
    <Link
      href={primaryHref}
      className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
    >
      {primaryLabel}
    </Link>
    <Link
      href={secondaryHref}
      className="rounded-lg border border-cream-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
    >
      {secondaryLabel}
    </Link>
  </div>
);

const ContentCards = ({
  items,
  eyebrow,
}: {
  items: StyleProductContentCard[];
  eyebrow?: string;
}) => (
  <div className="grid gap-4 md:grid-cols-3">
    {items.map((item) => (
      <article
        key={item.title}
        className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm"
      >
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            {eyebrow}
          </p>
        ) : null}
        <h3 className={eyebrow ? "mt-3 text-xl font-semibold text-slate-900" : "text-xl font-semibold text-slate-900"}>
          {item.title}
        </h3>
        <p className="mt-3 text-slate-600">{item.description}</p>
      </article>
    ))}
  </div>
);

const ProductCardGrid = ({
  cards,
  compact = false,
}: {
  cards: StyleProductCard[];
  compact?: boolean;
}) => (
  <div className={`grid gap-6 ${compact ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
    {cards.map((card) => (
      <Link
        key={card.href}
        href={card.href}
        className="group overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-cream-50">
          <Image
            src={card.imageSrc}
            alt={card.imageAlt}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-6">
          <h3 className="text-xl font-semibold text-slate-900">{card.label}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {card.description}
          </p>
          <span className="mt-5 inline-flex text-sm font-semibold text-brand-700">
            {`View ${card.label}`}
          </span>
        </div>
      </Link>
    ))}
  </div>
);

const VisualCardGrid = ({
  items,
}: {
  items: StyleProductVisualCard[];
}) => (
  <div className="grid gap-6 md:grid-cols-3">
    {items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className="group overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
      >
        <div className="relative aspect-square overflow-hidden bg-cream-50">
          <Image
            src={item.imageSrc}
            alt={item.imageAlt}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-6">
          <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {item.description}
          </p>
          <span className="mt-5 inline-flex text-sm font-semibold text-brand-700">
            {`View ${item.title}`}
          </span>
        </div>
      </Link>
    ))}
  </div>
);

const LinkList = ({ links }: { links: StyleProductLink[] }) => (
  <div className="grid gap-4 md:grid-cols-2">
    {links.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        className="block rounded-2xl border border-cream-200 bg-white p-5 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
      >
        <h3 className="text-lg font-semibold text-slate-900">{link.label}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {link.description}
        </p>
      </Link>
    ))}
  </div>
);

const FAQSection = ({ items }: { items: StyleProductFAQ[] }) => (
  <section className="bg-cream-50 px-4 py-16">
    <div className="container mx-auto max-w-4xl">
      <h2 className="text-3xl font-bold text-slate-900">
        Frequently asked questions
      </h2>
      <div className="mt-8 space-y-5">
        {items.map((faq) => (
          <details
            key={faq.question}
            className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm"
          >
            <summary className="cursor-pointer text-lg font-semibold text-slate-900">
              {faq.question}
            </summary>
            <p className="mt-4 leading-7 text-slate-600">{faq.answer}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

export function StyleProductHubPage({ config }: { config: StyleProductHubConfig }) {
  const itemPaths = [
    ...config.productCards.map((card) => card.href),
    ...config.inspiration.map((item) => item.href),
    ...config.relatedLinks.map((link) => link.href),
  ];

  return (
    <>
      <SeoHead
        title={config.title}
        description={config.description}
        path={config.path}
        image={config.heroImage}
        imageAlt={config.heroImageAlt}
        jsonLd={[
          buildBreadcrumbSchema(config.breadcrumbs),
          buildCollectionPageSchema({
            name: config.h1,
            description: config.description,
            path: config.path,
            itemPaths,
          }),
          buildItemListSchema({
            name: `${config.h1} product pages`,
            itemPaths: config.productCards.map((card) => card.href),
          }),
          buildFAQSchema(config.faqItems),
        ]}
      />

      <main className="bg-white">
        <section className="overflow-hidden bg-gradient-to-b from-cream-50 via-white to-cream-100 px-4 py-16 lg:py-20">
          <div className="container mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr,0.9fr]">
            <div>
              <Breadcrumbs items={config.breadcrumbs} />
              <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800">
                {config.eyebrow}
              </span>
              <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                {config.h1}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {config.intro}
              </p>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                {config.secondaryIntro}
              </p>
              <PrimaryActions
                primaryHref={config.generatorHref}
                primaryLabel={config.generatorLabel}
                secondaryHref={config.styleGalleryHref}
                secondaryLabel={config.styleGalleryLabel}
              />
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-xl shadow-amber-100/60">
              <Image
                src={config.heroImage}
                alt={config.heroImageAlt}
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-14">
          <ContentCards items={config.highlights} eyebrow="Strategy" />
        </section>

        <section className="bg-cream-50 px-4 py-16">
          <div className="container mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-slate-900">
                Choose a product direction
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Each page keeps this style family separate from the broad product
                hubs, so search intent stays clean.
              </p>
            </div>
            <div className="mt-10">
              <ProductCardGrid cards={config.productCards} />
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-900">
              Style examples that shape the product
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Product fit starts with the artwork. These examples help visitors
              choose the right visual direction before opening the generator.
            </p>
          </div>
          <div className="mt-10">
            <VisualCardGrid items={config.inspiration} />
          </div>
        </section>

        <section className="bg-white px-4 py-16">
          <div className="container mx-auto max-w-5xl">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-slate-900">
                Related pages in the product architecture
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                These links keep the broad hubs, style hubs, and product pages
                connected without making them target the same query.
              </p>
            </div>
            <div className="mt-8">
              <LinkList links={config.relatedLinks} />
            </div>
          </div>
        </section>

        <FAQSection items={config.faqItems} />
      </main>
    </>
  );
}

export function StyleProductDetailPage({
  config,
}: {
  config: StyleProductDetailConfig;
}) {
  const itemPaths = [
    config.hubHref,
    config.broadProductHref,
    ...config.relatedProducts.map((card) => card.href),
    ...config.crossStyleLinks.map((link) => link.href),
    ...config.inspiration.map((item) => item.href),
  ];

  return (
    <>
      <SeoHead
        title={config.title}
        description={config.description}
        path={config.path}
        image={config.heroImage}
        imageAlt={config.heroImageAlt}
        jsonLd={[
          buildBreadcrumbSchema(config.breadcrumbs),
          buildCollectionPageSchema({
            name: config.h1,
            description: config.description,
            path: config.path,
            itemPaths,
          }),
          buildItemListSchema({
            name: `${config.h1} related product pages`,
            itemPaths,
          }),
          buildFAQSchema(config.faqItems),
        ]}
      />

      <main className="bg-white">
        <section className="overflow-hidden bg-gradient-to-b from-cream-50 via-white to-cream-100 px-4 py-16 lg:py-20">
          <div className="container mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.95fr,1.05fr]">
            <div>
              <Breadcrumbs items={config.breadcrumbs} />
              <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800">
                {config.eyebrow}
              </span>
              <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                {config.h1}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {config.intro}
              </p>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                {config.secondaryIntro}
              </p>
              <PrimaryActions
                primaryHref={config.generatorHref}
                primaryLabel={config.generatorLabel}
                secondaryHref={config.hubHref}
                secondaryLabel={`Browse ${config.hubLabel}`}
              />
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-xl shadow-amber-100/60">
              <Image
                src={config.heroImage}
                alt={config.heroImageAlt}
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-14">
          <ContentCards items={config.highlights} eyebrow="Why it works" />
        </section>

        <section className="bg-cream-50 px-4 py-16">
          <div className="container mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-slate-900">
                Design notes for this product
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                These notes make the page useful beyond a keyword match: they
                explain what has to change when artwork becomes a product.
              </p>
            </div>
            <div className="mt-10">
              <ContentCards items={config.designNotes} />
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-10 lg:grid-cols-[0.9fr,1.1fr]">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Gift and use-case fit
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                The same design can be useful for different buyers. These use
                cases help the page answer more than one shopping scenario.
              </p>
            </div>
            <div className="grid gap-4">
              {config.useCases.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-xl font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cream-50 px-4 py-16">
          <div className="container mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-slate-900">
                Style directions to try first
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Open a style direction, then create artwork that fits the final
                product instead of adapting a random design afterward.
              </p>
            </div>
            <div className="mt-10">
              <VisualCardGrid items={config.inspiration} />
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-4 py-16">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-900">
              Compare nearby product pages
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Keep moving by product type, or compare the same product across
              another style family.
            </p>
          </div>
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Same style, other products
              </h3>
              <div className="mt-5">
                <ProductCardGrid cards={config.relatedProducts} compact />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Same product, other styles
              </h3>
              <div className="mt-5">
                <LinkList links={config.crossStyleLinks} />
              </div>
            </div>
          </div>
        </section>

        <FAQSection items={config.faqItems} />
      </main>
    </>
  );
}
