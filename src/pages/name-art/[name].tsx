import { type GetStaticPaths, type GetStaticProps, type NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { FiDownload, FiEdit3, FiGift } from "react-icons/fi";

import { SeoHead } from "~/component/SeoHead";
import { getRelatedNamePages } from "~/lib/nameArtSeo";
import { popularNames } from "~/lib/names";
import {
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFAQSchema,
  buildItemListSchema,
} from "~/lib/seo";
import { getStyleImageAlt } from "~/lib/styleImageAlt";
import { getNameArtStyleBySlug, slugifyStyleName } from "~/lib/styleTaxonomy";

interface ShowcaseData {
  [niche: string]: { src: string }[];
}

type RelatedName = {
  name: string;
  path: string;
  niches: string[];
  previewSrc: string;
  previewAlt: string;
};

interface NameArtPageProps {
  name: string;
  niches: string[];
  showcaseData: ShowcaseData;
  otherStyles: string[];
  relatedNames: RelatedName[];
}

type ExampleCard = {
  title: string;
  imageSrc: string;
  imageAlt: string;
  niche: string;
};

type VisualCard = {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
  ctaLabel: string;
};

const buildFaqItems = (name: string, niches: string[]) => [
  {
    question: `What styles work well for ${name} name art?`,
    answer: `${name} works well across multiple visual directions. This page highlights ${niches.join(
      ", ",
    )} so you can compare a few distinct looks before moving into the full generator.`,
  },
  {
    question: `Can I use ${name} name art for gifts or wall decor?`,
    answer: `Yes. Once you find a direction you like, the artwork can be used for framed wall art, mugs, shirts, and other personalized gift formats.`,
  },
  {
    question: `Do I need design experience to create ${name} name art?`,
    answer: `No. The generator is built so you can start with the name ${name}, test styles quickly, and download or print the version that fits your use case.`,
  },
];

function getExampleLabel(name: string, niche: string) {
  const labels: Record<string, string> = {
    Floral: `${name} floral style`,
    Typography: `${name} minimal typography`,
    Classic: `${name} gold lettering`,
    Islamic: `${name} Arabic calligraphy`,
    Graffiti: `${name} graffiti style`,
    Vintage: `${name} vintage lettering`,
  };

  return labels[niche] ?? `${name} ${niche.toLowerCase()} style`;
}

function buildExampleCards(name: string, showcaseData: ShowcaseData) {
  const exampleCards: ExampleCard[] = [];
  const showcaseEntries = Object.entries(showcaseData);
  let round = 0;

  while (exampleCards.length < 4) {
    let addedInRound = false;

    for (const [niche, styles] of showcaseEntries) {
      const style = styles[round];

      if (!style) {
        continue;
      }

      exampleCards.push({
        title: getExampleLabel(name, niche),
        imageSrc: style.src,
        imageAlt: getStyleImageAlt(style.src, {
          kind: "name",
          title: niche,
          fallbackAlt: `${name} name art ${niche.toLowerCase()} design`,
        }),
        niche,
      });
      addedInRound = true;

      if (exampleCards.length >= 4) {
        break;
      }
    }

    if (!addedInRound) {
      break;
    }

    round += 1;
  }

  return exampleCards;
}

function buildStyleCategoryCards(name: string, styleNames: string[]) {
  return styleNames
    .map((styleName) => {
      const style = getNameArtStyleBySlug(slugifyStyleName(styleName));
      if (!style) return null;

      return {
        title: style.title,
        description: style.description,
        imageSrc: style.imageSrc,
        imageAlt: getStyleImageAlt(style.imageSrc, {
          kind: "name",
          title: style.title,
          fallbackAlt: `${name} name art in ${style.title.toLowerCase()} style`,
        }),
        href: `/name-art/styles/${style.slug}`,
        ctaLabel: `Explore ${style.title}`,
      };
    })
    .filter((style): style is VisualCard => Boolean(style));
}

function buildProductMockups(name: string) {
  return [
    {
      href: "/personalized-name-mugs",
      title: "Mug mockup",
      description:
        "See how the name art reads on a practical gift product people use every day.",
      imageSrc: "/images/products/mug.webp",
      imageAlt: `${name} name art printed on mug`,
      ctaLabel: "Explore personalized mugs",
    },
    {
      href: "/custom-name-shirts",
      title: "Shirt mockup",
      description:
        "Preview how bold or playful lettering can translate into wearable custom apparel.",
      imageSrc: "/images/products/tshirt.webp",
      imageAlt: `${name} name art printed on shirt`,
      ctaLabel: "Explore custom shirts",
    },
    {
      href: "/personalized-name-wall-art",
      title: "Poster mockup",
      description:
        "Use a decor preview to judge whether the artwork works best as a framed print or poster.",
      imageSrc: "/images/products/poster.webp",
      imageAlt: `${name} name art printed on poster`,
      ctaLabel: "Explore wall art",
    },
  ] satisfies VisualCard[];
}

const NameArtPage: NextPage<NameArtPageProps> = ({
  name,
  niches,
  showcaseData,
  otherStyles,
  relatedNames,
}) => {
  const faqItems = buildFaqItems(name, niches);
  const pagePath = `/name-art/${name.toLowerCase()}`;
  const generatorHref = `/name-art-generator?name=${encodeURIComponent(name)}`;
  const exampleCards = buildExampleCards(name, showcaseData);
  const firstShowcaseImage = exampleCards[0]?.imageSrc ?? "/banner.webp";
  const relevantStyleNames = Array.from(new Set([...niches, ...otherStyles]));
  const styleCategoryCards = buildStyleCategoryCards(
    name,
    relevantStyleNames.slice(0, 6),
  );
  const extraStyleCards = buildStyleCategoryCards(
    name,
    relevantStyleNames.slice(6, 14),
  );
  const productMockups = buildProductMockups(name);
  const collectionItems = Array.from(
    new Set([
      generatorHref,
      "/name-art",
      ...styleCategoryCards.map((item) => item.href),
      ...extraStyleCards.map((item) => item.href),
      ...productMockups.map((item) => item.href),
      ...relatedNames.map((item) => item.path),
    ]),
  );

  return (
    <>
      <SeoHead
        title={`${name} Name Art | Personalized Styles, Gift Ideas, and Design Inspiration`}
        description={`Explore ${name} name art ideas in styles like ${niches.join(
          ", ",
        )}. Compare visual directions, gift uses, and product-ready options before creating your own custom ${name} design.`}
        path={pagePath}
        image={firstShowcaseImage}
        imageAlt={`${name} personalized name art example`}
        jsonLd={[
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Name Art", path: "/name-art" },
            { name: `${name} Name Art`, path: pagePath },
          ]),
          buildCollectionPageSchema({
            name: `${name} name art gallery`,
            description: `A gallery of ${name} name art examples, style directions, and product mockups.`,
            path: pagePath,
            itemPaths: collectionItems,
          }),
          buildItemListSchema({
            name: `${name} name art examples`,
            itemPaths: exampleCards.map(
              (_, index) => `${pagePath}#example-${index + 1}`,
            ),
          }),
          buildItemListSchema({
            name: `Related names for ${name}`,
            itemPaths: relatedNames.map((item) => item.path),
          }),
          buildFAQSchema(faqItems),
        ]}
      />

      <main className="bg-white dark:bg-gray-900">
        <section className="overflow-hidden bg-gradient-to-br from-cream-50 via-white to-cream-100 px-4 py-16">
          <div className="container mx-auto max-w-6xl">
            <nav className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              <Link href="/" className="hover:text-brand-600">
                Home
              </Link>{" "}
              /{" "}
              <Link href="/name-art" className="hover:text-brand-600">
                Name Art
              </Link>{" "}
              / <span>{name}</span>
            </nav>

            <div className="grid items-center gap-12 lg:grid-cols-[0.95fr,1.05fr]">
              <div className="max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                  {name} name art ideas for decor, gifts, and custom design
                </h1>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                  This page collects curated examples of <strong>{name}</strong>{" "}
                  name art so you can compare how the name looks in different
                  visual directions before creating your own version.
                </p>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                  The strongest directions for {name} right now are{" "}
                  {niches.join(", ")}. If you are creating artwork for a bedroom,
                  gift, mug, shirt, or framed print, these examples give you a
                  stronger starting point than a blank generator screen.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link href={generatorHref}>
                    <button className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700">
                      Create Art for {name}
                    </button>
                  </Link>
                  <Link
                    href="/name-art"
                    className="rounded-lg border border-cream-200 px-6 py-3 font-semibold text-amber-900 transition hover:border-brand-400 hover:text-brand-700"
                  >
                    Browse More Name Art Ideas
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {exampleCards.map((example, index) => (
                  <Link
                    key={`${example.imageSrc}-${example.title}`}
                    href={generatorHref}
                    className={index === 0 ? "sm:row-span-2" : ""}
                  >
                    <article className="group h-full overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">
                      <div
                        className={`relative ${
                          index === 0 ? "aspect-[4/5] h-full min-h-[300px]" : "aspect-[4/3]"
                        }`}
                      >
                        <Image
                          src={example.imageSrc}
                          alt={example.imageAlt}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                          unoptimized={true}
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent p-5">
                          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-200">
                            {example.niche}
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {example.title}
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

        <section className="py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">
                Example name art designs for {name}
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Use these generated examples to compare mood, ornament, and
                readability before you open the generator.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {exampleCards.map((example, index) => (
                <Link
                  key={`${example.title}-detail`}
                  id={`example-${index + 1}`}
                  href={generatorHref}
                  className="group overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={example.imageSrc}
                      alt={example.imageAlt}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      unoptimized={true}
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">
                      {example.niche}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {example.title}
                    </h3>
                    <span className="mt-4 inline-flex text-sm font-semibold text-brand-700">
                      Open generator
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-16 dark:bg-gray-800">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">
                Styles for {name}
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Explore the styles that fit {name} best, then open the matching
                style for more examples and a direct path into the generator.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {styleCategoryCards.map((style) => (
                <Link
                  key={style.title}
                  href={style.href}
                  className="group overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={style.imageSrc}
                      alt={style.imageAlt}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      unoptimized={true}
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {style.title}
                    </h3>
                    <p className="mt-3 text-slate-600 dark:text-slate-300">
                      {style.description}
                    </p>
                    <span className="mt-4 inline-flex text-sm font-semibold text-brand-700">
                      {style.ctaLabel}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">
                Product mockups for {name}
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Once the artwork direction is set, these mockups help you judge
                whether the name should live on a mug, shirt, or framed print.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {productMockups.map((mockup) => (
                <Link
                  key={mockup.title}
                  href={mockup.href}
                  className="group overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={mockup.imageSrc}
                      alt={mockup.imageAlt}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {mockup.title}
                    </h3>
                    <p className="mt-3 text-slate-600 dark:text-slate-300">
                      {mockup.description}
                    </p>
                    <span className="mt-4 inline-flex text-sm font-semibold text-brand-700">
                      {mockup.ctaLabel}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {extraStyleCards.length > 0 ? (
          <section className="bg-gray-50 py-16 dark:bg-gray-800">
            <div className="container mx-auto max-w-6xl px-4">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">
                  More styles for {name}
                </h2>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                  Keep exploring related styles that may suit {name} for decor,
                  gifts, apparel, or framed art.
                </p>
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {extraStyleCards.map((style) => (
                  <Link
                    key={style.href}
                    href={style.href}
                    className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"
                  >
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {style.title}
                    </h3>
                    <p className="mt-3 text-slate-600 dark:text-slate-300">
                      {style.description}
                    </p>
                    <span className="mt-4 inline-flex text-sm font-semibold text-brand-700">
                      {style.ctaLabel}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid gap-12 lg:grid-cols-[0.95fr,1.05fr]">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">
                  Design directions for {name}
                </h2>
                <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                  The goal is not just to generate any version of {name}, but to
                  find the right mood for the person, room, or gift you have in mind.
                </p>
                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    More style prompts for {name}
                  </h3>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">
                    Other creative directions people often test for {name}:{" "}
                    {otherStyles.join(", ")}.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-gray-50 p-6 shadow-sm dark:border-slate-700 dark:bg-gray-800">
                  <FiEdit3 className="text-2xl text-brand-600" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Start with the name
                  </h3>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">
                    Enter {name} in the generator and begin from the style family
                    that feels closest to your intended use.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-gray-50 p-6 shadow-sm dark:border-slate-700 dark:bg-gray-800">
                  <FiGift className="text-2xl text-brand-600" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Match the use case
                  </h3>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">
                    A framed print, gift mug, or shirt often needs a different
                    level of detail and visual energy than a profile image.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-gray-50 p-6 shadow-sm dark:border-slate-700 dark:bg-gray-800">
                  <FiDownload className="text-2xl text-brand-600" />
                  <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Download or print
                  </h3>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">
                    Keep the final version digital or move it into one of the
                    style or product options above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-16 dark:bg-gray-800">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">
              Frequently asked questions about {name} name art
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

        <section className="py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 md:text-4xl">
                Related name art pages
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Compare nearby high-interest name pages if you are exploring family
                gifts, friend gifts, or multiple names at once.
              </p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {relatedNames.map((related) => (
                <Link
                  key={related.path}
                  href={related.path}
                  className="group overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={related.previewSrc}
                      alt={related.previewAlt}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      unoptimized={true}
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {related.name} name art
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      Featured styles: {related.niches.slice(0, 3).join(", ")}
                    </p>
                    <span className="mt-4 inline-flex text-sm font-semibold text-brand-700">
                      Open {related.name} page
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20 text-gray-800 dark:bg-gray-800 dark:text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Ready to create your own {name} masterpiece?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-700 dark:text-gray-300">
              Use these examples as your starting point, then generate a version
              of {name} that fits your style, gift idea, or product goal.
            </p>
            <div className="mt-8">
              <Link href={generatorHref}>
                <button className="rounded-lg bg-brand-600 px-8 py-4 text-lg font-bold text-white transition hover:bg-brand-700">
                  Generate Art for {name}
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = popularNames.map((item) => ({
    params: { name: item.name.toLowerCase() },
  }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = (context) => {
  const nameParam = context.params?.name as string;
  const nameBlueprint = popularNames.find(
    (item) => item.name.toLowerCase() === nameParam,
  );

  if (!nameBlueprint) {
    return { notFound: true };
  }

  const showcaseData: ShowcaseData = {};

  nameBlueprint.niches.forEach((nicheName) => {
    const imagesForNiche =
      nameBlueprint.images[nicheName as keyof typeof nameBlueprint.images];

    if (imagesForNiche) {
      showcaseData[nicheName] = imagesForNiche.map((imageFile) => ({
        src: `/styles/name-art/${nicheName}/${imageFile}`,
      }));
    }
  });

  const relatedNames = getRelatedNamePages(nameBlueprint.name).map((related) => {
    const relatedBlueprint = popularNames.find(
      (item) => item.name.toLowerCase() === related.name.toLowerCase(),
    );
    const previewNiche = relatedBlueprint?.niches[0];
    const previewImage =
      previewNiche &&
      relatedBlueprint?.images[
        previewNiche as keyof typeof relatedBlueprint.images
      ]?.[0];

    return {
      ...related,
      previewSrc:
        previewNiche && previewImage
          ? `/styles/name-art/${previewNiche}/${previewImage}`
          : "/banner.webp",
      previewAlt: previewNiche && previewImage
        ? getStyleImageAlt(`/styles/name-art/${previewNiche}/${previewImage}`, {
            kind: "name",
            title: previewNiche,
            fallbackAlt: `${related.name} name art preview image`,
          })
        : `${related.name} name art preview image`,
    };
  });

  return {
    props: {
      name: nameBlueprint.name,
      niches: nameBlueprint.niches,
      showcaseData,
      otherStyles: nameBlueprint.otherStyles,
      relatedNames,
    },
    revalidate: 60 * 60 * 24,
  };
};

export default NameArtPage;
