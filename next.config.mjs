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

  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },

  async redirects() {
    return [
      {
        source: "/wedding-invitations",
        destination: "https://www.bloominvite.com/",
        permanent: true, // 301
      },
      {
        source: "/wedding-invitation-generator",
        destination: "https://www.bloominvite.com/generator",
        permanent: true, // 301
      },
    ];
  },
};

export default config;
