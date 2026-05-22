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

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Legacy Arabic "name art" routes were permanently renamed to
      // "arabic-calligraphy" about one month ago. The old pages are
      // intentionally deleted and must not be recreated. Keep these
      // redirects in place so old URLs continue resolving correctly.
      {
        source: "/arabic-name-art",
        destination: "/arabic-calligraphy",
        permanent: true,
      },
      {
        source: "/ar/arabic-name-art",
        destination: "/ar/arabic-calligraphy",
        permanent: true,
      },
      {
        source: "/arabic-name-art-generator",
        destination: "/arabic-calligraphy-generator",
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
        source: "/ar/arabic-name-art/styles",
        destination: "/arabic-calligraphy/styles",
        permanent: true,
      },
      {
        source: "/arabic-name-art/styles/:style",
        destination: "/arabic-calligraphy/styles/:style",
        permanent: true,
      },
      {
        source: "/ar/arabic-name-art/styles/:style",
        destination: "/arabic-calligraphy/styles/:style",
        permanent: true,
      },
      {
        source: "/arabic-name-art/products",
        destination: "/arabic-calligraphy/products",
        permanent: true,
      },
      {
        source: "/ar/arabic-name-art/products",
        destination: "/arabic-calligraphy/products",
        permanent: true,
      },
      {
        source: "/arabic-name-art/products/:product",
        destination: "/arabic-calligraphy/products/:product",
        permanent: true,
      },
      {
        source: "/ar/arabic-name-art/products/:product",
        destination: "/arabic-calligraphy/products/:product",
        permanent: true,
      },
      {
        source: "/couples-art-generator",
        destination: "/couples-name-art-generator",
        permanent: true,
      },
      {
        source: "/name-art/styles/gifts",
        destination: "/personalized-gifts",
        permanent: true,
      },
      {
        source: "/personalized-name-mugs",
        destination: "/personalized-gifts",
        permanent: true,
      },
      {
        source: "/custom-name-shirts",
        destination: "/personalized-gifts",
        permanent: true,
      },
      {
        source: "/personalized-name-wall-art",
        destination: "/personalized-gifts",
        permanent: true,
      },
      {
        source: "/arabic-name-gifts",
        destination: "/personalized-gifts",
        permanent: true,
      },
      {
        source: "/couple-gifts",
        destination: "/personalized-gifts",
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
