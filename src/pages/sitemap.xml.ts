/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
// pages/sitemap.xml.ts
import { type GetServerSideProps } from 'next';
import { popularNames } from '~/lib/names';

const generateSiteMap = (allPages: string[]) => {
  const baseUrl = 'https://www.namedesignai.com';

  const getPriority = (page: string) => {
    // 1.0: Homepage
    if (page === '/') return '1.0';
    
    // 0.9: Main Product Landing Pages
    if ([
      '/name-art', 
      '/pro-logo', 
      '/couples-art', 
      '/wedding-invitations', 
      '/ai-portrait',
      '/baby-photoshoot', 
      '/arabic-name-art',    // English Landing
      '/ar/arabic-name-art'  // Arabic Landing
    ].includes(page)) return '0.9';

    // 0.7: Programmatic SEO Pages
    if (page.startsWith('/name-art/')) return '0.7';

    // 0.6: Generators, Community, Blog Hub
    if (page.endsWith('-generator') || page === '/community' || page === '/blog') return '0.6';

    // 0.5: Individual Blog Posts
    if (page.startsWith('/blog/')) return '0.5';

    // 0.3: Legal & Misc
    return '0.3';
  };
  
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     ${allPages
       .map((page) => {
         return `
       <url>
           <loc>${`${baseUrl}${page}`}</loc>
           <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
           <priority>${getPriority(page)}</priority>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // --- 1. STATIC PAGES ---
  const staticPages = [
    // Core
    '/', 
    '/community', 
    '/collection', 
    '/buy-credits', 
    '/blog',
    
    // Original Products
    '/name-art', 
    '/name-art-generator',
    '/pro-logo', 
    '/pro-logo-generator',
    '/couples-art', 
    '/couples-name-art-generator',

    // New AI Photo Products
    '/ai-portrait', 
    '/ai-portrait-generator', 
    '/baby-photoshoot', 
    '/baby-photoshoot-generator',

    // Arabic Name Art
    '/arabic-name-art', 
    '/arabic-name-art-generator',
    '/ar/arabic-name-art', 
    '/ar/arabic-name-art-generator',

    // Blog Posts
    '/blog/how-to-give-a-thoughtful-gift',
    '/blog/why-couple-name-art-is-the-perfect-keepsake',
    
    // Legal
    '/privacy-policy', 
    '/terms-of-service', 
    '/refund',
  ];

  // --- 2. DYNAMIC PAGES ---
  const nameArtPages = popularNames.map(item => `/name-art/${item.name.toLowerCase()}`);
  
  // --- 3. COMBINE ---
  const allPages = [...staticPages, ...nameArtPages];

  const sitemap = generateSiteMap(allPages);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

const Sitemap = () => {};
export default Sitemap;