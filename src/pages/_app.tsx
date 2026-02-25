import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import Script from "next/script";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { Header } from "~/component/Header";
import { Footer } from "~/component/Footer";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter();
  const [isRamadanMugAdUser, setIsRamadanMugAdUser] = useState(false);
  const isCancelPage =
    router.pathname === "/cancel" || router.pathname === "/order/cancel";
  const isRamadanMugRoute = router.pathname === "/ramadan-mug";
  const isRamadanAdLayout = isRamadanMugRoute && isRamadanMugAdUser;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  useEffect(() => {
    if (!isRamadanMugRoute) {
      setIsRamadanMugAdUser(false);
      return;
    }
    try {
      const params = new URLSearchParams(window.location.search);
      const source = (params.get("source") ?? "").toLowerCase();
      const utmSource = (params.get("utm_source") ?? "").toLowerCase();
      const campaign = (params.get("campaign") ?? "").toLowerCase();
      const hasFbclid = params.has("fbclid");
      const isAdUser =
        source === "facebook" ||
        source === "instagram" ||
        utmSource === "facebook" ||
        utmSource === "instagram" ||
        campaign === "ramadan-mug" ||
        hasFbclid;

      if (isAdUser) {
        window.sessionStorage.setItem("isRamadanMugAdUser", "true");
      }
    } catch {
      // ignore storage/query errors
    }
    try {
      setIsRamadanMugAdUser(
        window.sessionStorage.getItem("isRamadanMugAdUser") === "true",
      );
    } catch {
      setIsRamadanMugAdUser(false);
    }
  }, [isRamadanMugRoute, router.asPath]);

  return (
    <SessionProvider session={session}>
      {/* Google Tag Manager Script */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id=GTM-5XCP3CRN'+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-5XCP3CRN');
          `,
        }}
      />

      {metaPixelId && (
        <Script
          id="meta-pixel-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}
      
      {/* Google Tag Manager NoScript Fallback */}
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-5XCP3CRN"
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        ></iframe>
      </noscript>

      {/* Main App */}
      {isCancelPage ? (
        <div className="min-h-screen flex flex-col">
          <Header minimal={isRamadanAdLayout} />
          <main className="flex-grow">
            <Component {...pageProps} />
          </main>
          <Footer minimal={isRamadanAdLayout} />
        </div>
      ) : (
        <>
          <Header minimal={isRamadanAdLayout} />
          <Component {...pageProps} />
          <Footer minimal={isRamadanAdLayout} />
        </>
      )}
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
