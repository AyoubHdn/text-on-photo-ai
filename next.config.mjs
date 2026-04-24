// @ts-check

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "name-design-ai.s3.us-east-1.amazonaws.com",
      },
    ],
  },

  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },

  async redirects() {
    return [
      // Arabic section rename - 301 redirects
      {
        source: "/arabic-name-art",
        destination: "/arabic-calligraphy",
        permanent: true,
      },
      {
        source: "/arabic-name-art-generator",
        destination: "/arabic-calligraphy-generator",
        permanent: true,
      },
      {
        source: "/ar/arabic-name-art",
        destination: "/arabic-calligraphy",
        permanent: true,
      },
      {
        source: "/ar/arabic-name-art-generator",
        destination: "/ar/arabic-calligraphy-generator",
        permanent: true,
      },
      {
        source: "/arabic-name-art/styles",
        destination: "/arabic-calligraphy/styles",
        permanent: true,
      },
      {
        source: "/arabic-name-art/styles/:style",
        destination: "/arabic-calligraphy/styles/:style",
        permanent: true,
      },
      {
        source: "/arabic-name-art/products",
        destination: "/arabic-calligraphy/products",
        permanent: true,
      },
      {
        source: "/arabic-name-art/products/:product",
        destination: "/arabic-calligraphy/products/:product",
        permanent: true,
      },
      {
        source: "/couples-art-generator",
        destination: "/couples-name-art-generator",
        permanent: true,
      },
      {
        source: "/ramadan-mug",
        destination: "/ramadan-mug-v2",
        permanent: true,
      },
      {
        source: "/ramadan-mug-men",
        destination: "/ramadan-mug-v2",
        permanent: true,
      },
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
