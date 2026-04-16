import Head from "next/head";

import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  TWITTER_HANDLE,
  toAbsoluteUrl,
} from "~/lib/seo";

type AlternateLink = {
  hrefLang: string;
  href: string;
};

type SeoHeadProps = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  keywords?: string;
  noindex?: boolean;
  type?: "website" | "article";
  alternates?: AlternateLink[];
  jsonLd?: Array<Record<string, unknown>>;
};

export function SeoHead({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  keywords,
  noindex = false,
  type = "website",
  alternates = [],
  jsonLd = [],
}: SeoHeadProps) {
  const canonicalUrl = toAbsoluteUrl(path);
  const imageUrl = toAbsoluteUrl(image);
  const robots = noindex ? "noindex, nofollow" : "index, follow";

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="icon" href="/favicon.ico" />
      {keywords ? <meta name="keywords" content={keywords} /> : null}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />

      {imageAlt ? <meta property="og:image:alt" content={imageAlt} /> : null}
      {imageAlt ? <meta name="twitter:image:alt" content={imageAlt} /> : null}

      {alternates.map((alternate) => (
        <link
          key={`${alternate.hrefLang}-${alternate.href}`}
          rel="alternate"
          hrefLang={alternate.hrefLang}
          href={toAbsoluteUrl(alternate.href)}
        />
      ))}

      {jsonLd.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}
    </Head>
  );
}
