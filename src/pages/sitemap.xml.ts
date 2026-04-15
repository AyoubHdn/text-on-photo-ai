/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/restrict-template-expressions */

import fs from "fs";
import path from "path";
import { type GetServerSideProps } from "next";

import { SITEMAP_NAME_PAGES, getNameArtPath } from "~/lib/nameArtSeo";
import { SITE_URL } from "~/lib/seo";
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
    "/arabic-name-gifts",
    "/couple-gifts",
  ]);

  if (primaryLandingPages.has(page)) return "0.9";
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
    /^\/couples-art\/styles\/[^/]+$/.test(page) ||
    /^\/arabic-name-art\/styles\/[^/]+$/.test(page)
  ) {
    return "0.7";
  }
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

const generateSiteMap = (allPages: string[]) => {
  const today = new Date().toISOString().split("T")[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map((rawPage) => {
    const page = normalizePath(rawPage);
    return `
  <url>
    <loc>${SITE_URL}${page}</loc>
    <lastmod>${today}</lastmod>
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
    "/name-art/styles",
    "/arabic-name-art",
    "/arabic-name-art/styles",
    "/couples-art",
    "/couples-art/styles",
    "/personalized-gifts",
    "/personalized-name-mugs",
    "/custom-name-shirts",
    "/personalized-name-wall-art",
    "/arabic-name-gifts",
    "/couple-gifts",
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
  res.write(generateSiteMap(allPages));
  res.end();

  return { props: {} };
};

const Sitemap = () => null;

export default Sitemap;
