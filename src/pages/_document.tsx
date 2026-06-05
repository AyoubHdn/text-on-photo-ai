import {
  Head,
  Html,
  Main,
  NextScript,
  type DocumentProps,
} from "next/document";

import { ADSENSE_PUBLISHER_ID } from "~/lib/adsense";

export default function Document(props: DocumentProps) {
  const pagePath = props.__NEXT_DATA__.page ?? "";
  const isArabicRoute = pagePath.startsWith("/ar/");

  return (
    <Html lang={isArabicRoute ? "ar" : "en"} dir={isArabicRoute ? "rtl" : "ltr"}>
      <Head>
        {process.env.NODE_ENV === "production" ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
            crossOrigin="anonymous"
          />
        ) : null}

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
