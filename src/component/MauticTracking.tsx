import Script from "next/script";
import { useRouter } from "next/router";
import { useEffect } from "react";

type MauticTracker = ((...args: unknown[]) => void) & {
  q?: unknown[][];
};

declare global {
  interface Window {
    MauticTrackingObject?: string;
    mt?: MauticTracker;
  }
}

const MAUTIC_TRACKING_SCRIPT_ID = "mautic-tracking";
const MAUTIC_TRACKING_URL = "https://mautic.namedesignai.com/mtc.js";

/**
 * Loads Mautic once and records one page view for each Next.js route change.
 * The initial page view is queued by the official Mautic bootstrap snippet.
 */
export function MauticTracking() {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      window.mt?.("send", "pageview");
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return (
    <Script id={MAUTIC_TRACKING_SCRIPT_ID} strategy="afterInteractive">
      {`(function(w,d,t,u,n,a,m){w['MauticTrackingObject']=n;
  w[n]=w[n]||function(){(w[n].q=w[n].q||[]).push(arguments)},a=d.createElement(t),
  m=d.getElementsByTagName(t)[0];a.async=1;a.src=u;m.parentNode.insertBefore(a,m)
  })(window,document,'script','${MAUTIC_TRACKING_URL}','mt');
  mt('send', 'pageview');`}
    </Script>
  );
}
