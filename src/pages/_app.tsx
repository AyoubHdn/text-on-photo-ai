import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import Script from "next/script";
import { useRouter } from "next/router";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { Header } from "~/component/Header";
import { Footer } from "~/component/Footer";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const router = useRouter();
  const isCancelPage =
    router.pathname === "/cancel" || router.pathname === "/order/cancel";

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
          <Header />
          <main className="flex-grow">
            <Component {...pageProps} />
          </main>
          <Footer />
        </div>
      ) : (
        <>
          <Header />
          <Component {...pageProps} />
          <Footer />
        </>
      )}
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
