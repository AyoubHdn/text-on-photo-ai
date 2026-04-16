import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to image CDN for faster LCP */}
        <link
          rel="preconnect"
          href="https://name-design-ai.s3.us-east-1.amazonaws.com"
        />
        <link
          rel="dns-prefetch"
          href="https://name-design-ai.s3.us-east-1.amazonaws.com"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
