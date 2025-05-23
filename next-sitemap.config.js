/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.namedesignai.com', // YOUR PRODUCTION DOMAIN
  generateRobotsTxt: true, // Optional: will generate a robots.txt file
  // Optional:
  // exclude: ['/server-sitemap.xml'], // <= Exclude server-side sitemap (if you have one)
  // robotsTxtOptions: {
  //   additionalSitemaps: [
  //     'https://www.namedesignai.com/server-sitemap.xml', // <==== Add server-side sitemap if you have one
  //   ],
  // },
  // You can add more configuration options here if needed:
  // changefreq: 'weekly',
  // priority: 0.7,
  // transform: async (config, path) => {
  //   return {
  //     loc: path, // => this will be exported as http(s)://<siteUrl>/<path>
  //     changefreq: config.changefreq,
  //     priority: config.priority,
  //     lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
  //     alternateRefs: config.alternateRefs ?? [],
  //   }
  // },
};