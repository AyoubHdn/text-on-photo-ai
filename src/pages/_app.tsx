import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import Script from "next/script";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { Header } from "~/component/Header";
import { Footer } from "~/component/Footer";

const PAID_TRAFFIC_SESSION_KEY = "isPaidTrafficUser";
const PAID_TRAFFIC_SOURCE_PAGE_KEY = "paidTrafficSourcePage";
const PAID_TRAFFIC_PROMOTED_PRODUCT_KEY = "paidTrafficPromotedProduct";

const PAID_TRAFFIC_PAGE_PRODUCT_MAP: Record<
  string,
  { sourcePage: string; promotedProduct: string }
> = {
  "/ramadan-mug": { sourcePage: "ramadan-mug", promotedProduct: "mug" },
  "/ramadan-mug-men": { sourcePage: "ramadan-mug-men", promotedProduct: "mug" },
};

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter();
  const [isPaidTrafficUser, setIsPaidTrafficUser] = useState(false);
  const hasMarkedPaidTrafficUserRef = useRef(false);
  const markPaidTrafficUser = api.user.markPaidTrafficUser.useMutation();
  const isCancelPage =
    router.pathname === "/cancel" || router.pathname === "/order/cancel";
  const isRamadanMugRoute =
    router.pathname === "/ramadan-mug" || router.pathname === "/ramadan-mug-men";
  const isRamadanAdLayout = isRamadanMugRoute && isPaidTrafficUser;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const source = (params.get("source") ?? "").toLowerCase();
      const utmSource = (params.get("utm_source") ?? "").toLowerCase();
      const campaign = (params.get("campaign") ?? "").toLowerCase();
      const utmCampaign = (params.get("utm_campaign") ?? "").toLowerCase();
      const utmMedium = (params.get("utm_medium") ?? "").toLowerCase();
      const hasFbclid = params.has("fbclid");
      const hasGclid = params.has("gclid");
      const campaignTag = `${campaign} ${utmCampaign}`;
      const isAdUser =
        source === "facebook" ||
        source === "instagram" ||
        utmSource === "facebook" ||
        utmSource === "instagram" ||
        utmMedium === "cpc" ||
        utmMedium === "paid" ||
        utmMedium === "paid-social" ||
        campaignTag.length > 0 ||
        hasFbclid ||
        hasGclid;

      if (isAdUser) {
        window.sessionStorage.setItem(PAID_TRAFFIC_SESSION_KEY, "true");
        const offerMeta = PAID_TRAFFIC_PAGE_PRODUCT_MAP[router.pathname];
        if (offerMeta) {
          window.sessionStorage.setItem(
            PAID_TRAFFIC_SOURCE_PAGE_KEY,
            offerMeta.sourcePage,
          );
          window.sessionStorage.setItem(
            PAID_TRAFFIC_PROMOTED_PRODUCT_KEY,
            offerMeta.promotedProduct,
          );
        }
      }
    } catch {
      // ignore storage/query errors
    }
    try {
      setIsPaidTrafficUser(
        window.sessionStorage.getItem(PAID_TRAFFIC_SESSION_KEY) === "true",
      );
    } catch {
      setIsPaidTrafficUser(false);
    }
  }, [router.asPath]);

  useEffect(() => {
    if (!session?.user?.id || !isPaidTrafficUser) return;
    if (hasMarkedPaidTrafficUserRef.current) return;

    let sourcePage: string | undefined;
    let promotedProduct: string | undefined;
    try {
      sourcePage =
        window.sessionStorage.getItem(PAID_TRAFFIC_SOURCE_PAGE_KEY) ?? undefined;
      promotedProduct =
        window.sessionStorage.getItem(PAID_TRAFFIC_PROMOTED_PRODUCT_KEY) ??
        undefined;
    } catch {
      sourcePage = undefined;
      promotedProduct = undefined;
    }

    hasMarkedPaidTrafficUserRef.current = true;
    markPaidTrafficUser.mutate({
      sourcePage,
      promotedProduct,
    });
  }, [isPaidTrafficUser, markPaidTrafficUser, session?.user?.id]);

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
