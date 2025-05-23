// @ts-check

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  images: {
    domains: [
      "name-design-ai.s3.us-east-1.amazonaws.com",
    ],
  },

  /**
   * If you have the "experimental: { appDir: true }" setting enabled, then you
   * must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  async redirects() {
    return [
      {
        source: '/gaming-logo', // The old path on namedesignai.com
        destination: 'https://www.gaminglogoai.com/gaming-logo-maker', // New permanent location
        permanent: true, // This makes it a 301 redirect
      },
      // Add redirects for any other removed gaming-specific pages
      // For example, if you had /gaming-logo/styles/mascot :
      // {
      //   source: '/gaming-logo/styles/:slug',
      //   destination: 'https://www.gaminglogoai.com/gaming-logo-maker', // Or a more specific new path
      //   permanent: true,
      // },
    ];
  },
};

export default config;