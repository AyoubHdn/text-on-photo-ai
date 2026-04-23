/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/restrict-template-expressions */

import fs from "fs";
import path from "path";
import { type GetServerSideProps } from "next";

import { SITEMAP_NAME_PAGES, getNameArtPath } from "~/lib/nameArtSeo";
import { SITE_URL } from "~/lib/seo";
import { STYLE_PRODUCT_SEO_PATHS } from "~/lib/styleProductSeo";
import {
  ARABIC_STYLE_ITEMS,
  COUPLES_STYLE_ITEMS,
  NAME_ART_STYLE_ITEMS,
} from "~/lib/styleTaxonomy";

const normalizePath = (pagePath: string) => {
  if (!pagePath.startsWith("/")) return `/${pagePath}`;
  if (pagePath !== "/" && pagePath.endsWith("/")) {
    return pagePath.slice(0, -1);
  }

  return pagePath;
};

const getPriority = (rawPage: string) => {
  const page = normalizePath(rawPage);

  if (page === "/") return "1.0";

  const primaryLandingPages = new Set([
    "/name-art",
    "/arabic-name-art",
    "/couples-art",
    "/personalized-gifts",
    "/personalized-name-mugs",
    "/custom-name-shirts",
    "/personalized-name-wall-art",
    "/couple-gifts",
  ]);

  if (primaryLandingPages.has(page)) return "0.9";
  if (/^\/(name-art|arabic-name-art|couples-art)\/products$/.test(page)) {
    return "0.8";
  }
  if (
    /^\/(name-art|arabic-name-art|couples-art)\/products\/(mugs|shirts|wall-art)$/.test(
      page,
    )
  ) {
    return "0.7";
  }
  // Arabic gifts page is secondary — lower priority to avoid crowding out main product hubs
  if (page === "/arabic-name-gifts") return "0.7";
  if (
    page === "/community" ||
    page === "/name-art/styles" ||
    page === "/couples-art/styles" ||
    page === "/arabic-name-art/styles"
  ) {
    return "0.8";
  }
  if (/^\/name-art\/[^/]+$/.test(page)) return "0.7";
  if (
    /^\/name-art\/styles\/[^/]+$/.test(page) ||
    /^\/couples-art\/styles\/[^/]+$/.test(page)
  ) {
    return "0.7";
  }
  // Arabic style detail pages attract calligraphy-tool searchers who don't convert — reduce priority
  if (/^\/arabic-name-art\/styles\/[^/]+$/.test(page)) return "0.3";
  if (page === "/blog") return "0.6";
  if (/^\/blog\/[^/]+$/.test(page)) return "0.5";

  return "0.3";
};

const getBlogPostPaths = () => {
  const postsDirectory = path.join(process.cwd(), "_posts");

  return fs
    .readdirSync(postsDirectory)
    .filter((filename) => filename.endsWith(".mdx") || filename.endsWith(".md"))
    .map((filename) => `/blog/${filename.replace(/\.mdx?$/, "")}`);
};

// Pages whose content changes frequently — get today's lastmod
const isDynamicPage = (page: string) =>
  page === "/" ||
  page === "/blog" ||
  /^\/blog\/[^/]+$/.test(page) ||
  /^\/name-art\/[^/]+$/.test(page) ||
  /^\/name-art\/styles\/[^/]+$/.test(page) ||
  /^\/couples-art\/styles\/[^/]+$/.test(page) ||
  /^\/arabic-name-art\/styles\/[^/]+$/.test(page);

const getChangefreq = (page: string) => {
  if (page === "/") return "daily";
  const priority = getPriority(page);
  if (priority === "0.9" || priority === "0.8") return "weekly";
  if (priority === "0.7" || priority === "0.6") return "monthly";
  return "yearly";
};

const STATIC_LASTMOD = "2025-01-01";

const generateSiteMap = (allPages: string[]) => {
  const today = new Date().toISOString().split("T")[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map((rawPage) => {
    const page = normalizePath(rawPage);
    const lastmod = isDynamicPage(page) ? today : STATIC_LASTMOD;
    return `
  <url>
    <loc>${SITE_URL}${page}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${getChangefreq(page)}</changefreq>
    <priority>${getPriority(page)}</priority>
  </url>`;
  })
  .join("")}
</urlset>`;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const staticPages = [
    "/",
    "/blog",
    "/community",
    "/name-art",
    "/name-art-generator",
    "/name-art/styles",
    "/arabic-name-art",
    "/arabic-name-art-generator",
    "/arabic-name-art/styles",
    "/couples-art",
    "/couples-name-art-generator",
    "/couples-art/styles",
    "/products",
    "/personalized-gifts",
    "/personalized-name-mugs",
    "/custom-name-shirts",
    "/personalized-name-wall-art",
    "/arabic-name-gifts",
    "/couple-gifts",
    ...STYLE_PRODUCT_SEO_PATHS,
    "/privacy-policy",
    "/terms-of-service",
    "/refund",
  ];

  const blogPages = getBlogPostPaths();
  const nameArtPages = SITEMAP_NAME_PAGES.map((item) => getNameArtPath(item.name));
  const nameArtStylePages = NAME_ART_STYLE_ITEMS.map((item) => `/name-art/styles/${item.slug}`);
  const couplesStylePages = COUPLES_STYLE_ITEMS.map((item) => `/couples-art/styles/${item.slug}`);
  const arabicStylePages = ARABIC_STYLE_ITEMS.map((item) => `/arabic-name-art/styles/${item.slug}`);
  const allPages = Array.from(new Set([
    ...staticPages,
    ...blogPages,
    ...nameArtPages,
    ...nameArtStylePages,
    ...couplesStylePages,
    ...arabicStylePages,
  ]));

  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=3600");
  res.write(generateSiteMap(allPages));
  res.end();

  return { props: {} };
};

const Sitemap = () => null;

export default Sitemap;
