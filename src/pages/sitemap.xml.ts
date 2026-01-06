/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
// pages/sitemap.xml.ts

import { type GetServerSideProps } from 'next';
import { popularNames } from '~/lib/names';

const BASE_URL = 'https://www.namedesignai.com';

/**
 * Normalize paths:
 * - remove trailing slash (except '/')
 * - ensure leading slash
 */
const normalizePath = (path: string) => {
  if (!path.startsWith('/')) path = `/${path}`;
  if (path !== '/' && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
};

const getPriority = (rawPage: string): string => {
  const page = normalizePath(rawPage);

  // 1.0 — Homepage
  if (page === '/') return '1.0';

  // 0.9 — Main product landing pages ONLY (exact match)
  const mainLandingPages = new Set([
    '/name-art',
    '/pro-logo',
    '/couples-art',
    '/arabic-name-art',
    '/ar/arabic-name-art',
  ]);

  if (mainLandingPages.has(page)) return '0.9';

  // 0.7 — Programmatic SEO pages ONLY: /name-art/{slug}
  if (/^\/name-art\/[^/]+$/.test(page)) return '0.7';

  // 0.6 — Generators & hubs
  if (
    page.endsWith('-generator') ||
    page === '/community' ||
    page === '/blog'
  ) {
    return '0.6';
  }

  // 0.5 — Blog posts
  if (/^\/blog\/[^/]+$/.test(page)) return '0.5';

  // 0.3 — Legal & misc
  return '0.3';
};

const generateSiteMap = (allPages: string[]) => {
  const today = new Date().toISOString().split('T')[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map((rawPage) => {
    const page = normalizePath(rawPage);
    return `
  <url>
    <loc>${BASE_URL}${page}</loc>
    <lastmod>${today}</lastmod>
    <priority>${getPriority(page)}</priority>
  </url>`;
  })
  .join('')}
</urlset>`;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // --- 1. STATIC PAGES ---
  const staticPages = [
    '/',
    '/community',
    '/collection',
    '/buy-credits',
    '/blog',

    '/name-art',
    '/name-art-generator',
    '/couples-art',
    '/couples-name-art-generator',

    '/arabic-name-art',
    '/arabic-name-art-generator',
    '/ar/arabic-name-art',
    '/ar/arabic-name-art-generator',

    '/blog/how-to-give-a-thoughtful-gift',
    '/blog/why-couple-name-art-is-the-perfect-keepsake',

    '/privacy-policy',
    '/terms-of-service',
    '/refund',
  ];

  // --- 2. DYNAMIC PROGRAMMATIC PAGES ---
  const nameArtPages = popularNames.map(
    (item) => `/name-art/${item.name.toLowerCase()}`
  );

  const allPages = [...staticPages, ...nameArtPages];

  const sitemap = generateSiteMap(allPages);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return { props: {} };
};

const Sitemap = () => null;
export default Sitemap;
