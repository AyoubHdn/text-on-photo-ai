/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
// pages/sitemap.xml.ts
import { type GetServerSideProps } from 'next';
import { popularNames } from '~/lib/names'; // <-- 1. Import your master name list

// This function generates the XML content for your sitemap.
const generateSiteMap = (allPages: string[]) => {
  const baseUrl = 'https://www.namedesignai.com';

  const getPriority = (page: string) => {
    // Give the highest priority to the homepage
    if (page === '/') return '1.0';
    // Give high priority to your main product landing pages
    if (['/name-art', '/pro-logo', '/personalized-gifts', '/couples-art', '/wedding-invitations'].includes(page)) return '0.9';
    // --- START: NEW RULE FOR PSEO PAGES ---
    // Give your programmatic name pages a solid priority
    if (page.startsWith('/name-art/')) return '0.7';
    // --- END: NEW RULE FOR PSEO PAGES ---
    // Give generator and other pages a medium priority
    if (page.endsWith('-generator') || page === '/community' || page === '/blog') return '0.6';
    // Give individual blog posts a lower priority
    if (page.startsWith('/blog/')) return '0.5';
    // Legal pages have the lowest priority
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
  // --- This is the list of your STATIC pages ---
  const staticPages = [
    '/', '/community', '/collection', '/buy-credits', '/blog',
    '/personalized-gifts', '/name-art', '/pro-logo', '/couples-art', '/wedding-invitations',
    '/personalized-gifts-generator', '/name-art-generator', '/pro-logo-generator',
    '/couples-name-art-generator', '/wedding-invitation-generator',
    '/blog/how-to-give-a-thoughtful-gift',
    '/blog/why-couple-name-art-is-the-perfect-keepsake',
    '/privacy-policy', '/terms-of-service', '/refund',
  ];

  // --- 2. DYNAMICALLY GENERATE the pSEO pages ---
  const nameArtPages = popularNames.map(item => `/name-art/${item.name.toLowerCase()}`);
  
  // TODO: In the future, when you build the [name]/[style] pages, you will add another block here:
  // const nameArtStylePages = popularNames.flatMap(nameItem => 
  //   styles.map(styleItem => `/name-art/${nameItem.name.toLowerCase()}/${styleItem.id}`)
  // );

  // --- 3. COMBINE all pages into one final list ---
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