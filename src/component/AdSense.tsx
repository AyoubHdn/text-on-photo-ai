import Script from "next/script";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import {
  getAdSenseClientId,
  getAdSenseContentSlotId,
  shouldShowAdSenseForPath,
} from "~/lib/adsense";
import { api } from "~/utils/api";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSenseUnitProps = {
  className?: string;
  label?: string;
  slotId?: string;
};

const adClient = getAdSenseClientId();
const PAID_TRAFFIC_SESSION_KEY = "isPaidTrafficUser";

function useCanShowAdsForAccount() {
  const session = useSession();
  const buyerState = api.user.getCreditUpgradeState.useQuery(undefined, {
    enabled: session.status === "authenticated",
    refetchOnWindowFocus: true,
  });

  return (
    session.status === "unauthenticated" ||
    (session.status === "authenticated" &&
      buyerState.data?.hasPurchasedCreditsBefore === false)
  );
}

export function AdSenseScript({ enabled }: { enabled: boolean }) {
  if (process.env.NODE_ENV !== "production" || !enabled || !adClient)
    return null;

  return (
    <Script
      id="google-adsense"
      strategy="afterInteractive"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
      crossOrigin="anonymous"
    />
  );
}

export function BuyerAwareAdSenseScript() {
  const canShowAdsForAccount = useCanShowAdsForAccount();
  return <AdSenseScript enabled={canShowAdsForAccount} />;
}

export function AdSenseUnit({
  className = "",
  label = "Advertisement",
  slotId = getAdSenseContentSlotId(),
}: AdSenseUnitProps) {
  const router = useRouter();
  const canShowAdsForAccount = useCanShowAdsForAccount();
  const [canRenderAd, setCanRenderAd] = useState(false);

  useEffect(() => {
    if (!adClient || !slotId || !canShowAdsForAccount) {
      setCanRenderAd(false);
      return;
    }

    let isPaidTrafficUser = false;
    try {
      isPaidTrafficUser =
        window.sessionStorage.getItem(PAID_TRAFFIC_SESSION_KEY) === "true";
    } catch {
      isPaidTrafficUser = false;
    }

    setCanRenderAd(
      shouldShowAdSenseForPath(router.pathname, isPaidTrafficUser)
    );
  }, [canShowAdsForAccount, router.pathname, slotId]);

  useEffect(() => {
    if (!adClient || !slotId || !canRenderAd) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // AdSense can throw when an ad blocker or duplicate render intervenes.
    }
  }, [canRenderAd, slotId]);

  if (!adClient || !slotId || !canRenderAd) return null;

  return (
    <aside
      className={`mx-auto my-12 w-full max-w-5xl px-4 ${className}`}
      aria-label={label}
    >
      <div className="min-h-[120px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50/70 p-2 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
        <ins
          className="adsbygoogle block"
          style={{ display: "block" }}
          data-ad-client={adClient}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
