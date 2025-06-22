import { GetServerSideProps } from 'next';

// This function generates the XML content for your sitemap.
const generateSiteMap = (pages: string[]) => {
  const baseUrl = 'https://www.namedesignai.com'; // Your website's base URL

  // Define priorities for specific page types
  const getPriority = (page: string) => {
    if (page === '/') return '1.0';
    if (page.endsWith('-generator')) return '0.6';
    if (['/community', '/collection'].includes(page)) return '0.7';
    if (['/privacy-policy', '/terms-of-service', '/refund'].includes(page)) return '0.3';
    // Default priority for landing pages like /name-art, /pro-logo etc.
    return '0.8'; 
  };
  
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     ${pages
       .map((page) => {
         return `
       <url>
           <loc>${`${baseUrl}${page}`}</loc>
           <lastmod>${new Date().toISOString()}</lastmod>
           <priority>${getPriority(page)}</priority>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
};

// This is the server-side function that Next.js will run.
// eslint-disable-next-line @typescript-eslint/require-await
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // --- This is where you list all the pages on your site ---
  const pages = [
    '/',
    '/personalized-gifts',
    '/personalized-gifts-generator',
    '/name-art',
    '/name-art-generator',
    '/pro-logo',
    '/pro-logo-generator',
    '/community',
    '/collection',
    '/privacy-policy',
    '/terms-of-service',
    '/refund',
    // TODO: Add new landing pages here as you create them.
    // e.g., '/anniversary-art', '/gaming-logos', etc.
  ];

  // We generate the sitemap XML
  const sitemap = generateSiteMap(pages);

  // We send the XML to the browser
  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

// Default export to prevent errors. This component itself does nothing.
// eslint-disable-next-line @typescript-eslint/no-empty-function
const Sitemap = () => {};
export default Sitemap;