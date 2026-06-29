import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { SeoHead } from "~/component/SeoHead";
import {
  clearPendingCreditPurchase,
  hasTrackedCreditPurchaseCompletion,
  markTrackedCreditPurchaseCompletion,
  readPendingCreditPurchase,
} from "~/lib/creditPurchaseTracking";
import { trackEvent } from "~/lib/ga";
import { getFunnelContext } from "~/lib/tracking/funnel";
import { useLocale } from "~/hook/useLocale";
import { t } from "~/lib/funnelStrings";

function fireMetaCustomEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof maybeFbq === "function") {
    maybeFbq("trackCustom", eventName, params ?? {});
  }
}

function mapSourceToGenerator(sourcePage: string): string {
  const p = sourcePage.toLowerCase();
  if (p.includes("arabic")) return "/arabic-calligraphy-generator";
  if (p.includes("couple")) return "/couples-name-art-generator";
  return "/name-art-generator";
}

type PurchaseData = {
  plan?: "starter" | "pro" | "elite";
  context?: string;
  source_page?: string;
  language?: "ar" | "en";
  variant?: "A" | "B";
  funnel?: string;
  product_type?: string;
  niche?: string | null;
  traffic_type?: "paid" | "organic";
  country?: string | null;
  credits?: number;
  value?: number;
  session_id?: string | null;
};

const SuccessPage: React.FC = () => {
  const router = useRouter();
  const { locale, isArabic } = useLocale();

  const switchLocale = (newLang: "en" | "ar") => {
    const query = { ...router.query };
    if (newLang === "ar") {
      query.lang = "ar";
    } else {
      delete query.lang;
    }
    void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

  // Read purchase data synchronously before any useEffect can clear it
  const [purchaseData] = useState<PurchaseData | null>(() => {
    return readPendingCreditPurchase() as PurchaseData | null;
  });

  const creditsCount = purchaseData?.credits ?? null;
  const generatorHref = mapSourceToGenerator(purchaseData?.source_page ?? "");

  useEffect(() => {
    const gtagEvent = () => {
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "conversion", {
          send_to: "AW-794176708/x-pvCNj1_IMaEMTZ2PoC",
          value: 1.0,
          currency: "USD",
          transaction_id: "",
        });
      }
    };

    gtagEvent();

    const parsed = readPendingCreditPurchase() as PurchaseData | null;
    if (!parsed) return;

    if (
      typeof parsed.credits !== "number" ||
      typeof parsed.value !== "number"
    ) {
      clearPendingCreditPurchase();
      return;
    }

    if (!hasTrackedCreditPurchaseCompletion(parsed.session_id)) {
      const funnelContext = getFunnelContext({
        route: router.pathname,
        sourcePage: parsed.source_page ?? "success",
        productType: parsed.product_type ?? "credits",
        country: parsed.country ?? null,
        query: router.query as Record<string, unknown>,
      });

      trackEvent("credit_purchase_completed", {
        ...funnelContext,
        context:
          parsed.context ??
          (typeof router.query.credits_context === "string"
            ? router.query.credits_context
            : null),
        variant: parsed.variant ?? null,
        language: parsed.language ?? null,
        source_page: parsed.source_page ?? funnelContext.source_page,
        plan: parsed.plan ?? null,
        credits: parsed.credits,
        value: parsed.value,
        previous_credits: null,
        updated_credits: null,
      });
      fireMetaCustomEvent("credit_purchase_completed", {
        ...funnelContext,
        context:
          parsed.context ??
          (typeof router.query.credits_context === "string"
            ? router.query.credits_context
            : null),
        variant: parsed.variant ?? null,
        language: parsed.language ?? null,
        source_page: parsed.source_page ?? funnelContext.source_page,
        plan: parsed.plan ?? null,
        credits: parsed.credits,
        value: parsed.value,
        previous_credits: null,
        updated_credits: null,
      });
      markTrackedCreditPurchaseCompletion(parsed.session_id);
    }

    clearPendingCreditPurchase();
  }, [router.pathname, router.query]);

  return (
    <>
      <SeoHead
        title="Credits Purchase Success | Name Design AI"
        description="Credits purchase success page."
        path="/success"
        noindex
      />
      <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-white dark:bg-gray-950">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16">
          <div className="mb-4 flex w-full justify-end gap-1 text-xs text-gray-400">
            <button onClick={() => switchLocale("en")} className={locale === "en" ? "font-semibold text-gray-600 dark:text-gray-300" : "opacity-60 hover:opacity-100"}>English</button>
            <span className="opacity-40">|</span>
            <button onClick={() => switchLocale("ar")} className={locale === "ar" ? "font-semibold text-gray-600 dark:text-gray-300" : "opacity-60 hover:opacity-100"}>العربية</button>
          </div>

          {/* Confirmation card */}
          <div className="w-full rounded-2xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950/30">
            <div className="mb-4 text-5xl">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {creditsCount
                ? t("successHeading", locale, { count: creditsCount })
                : t("successHeadingGeneric", locale)}
            </h1>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              {t("successBody", locale)}
            </p>
            <Link
              href={generatorHref}
              className="mt-6 inline-block w-full rounded-lg bg-brand-600 px-6 py-3 text-base font-bold text-white transition hover:bg-brand-700"
            >
              {t("continueBtn", locale)}
            </Link>
          </div>

          {/* Product quick-links */}
          <div className="mt-8 w-full">
            <p className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Explore gift product ideas
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Mugs", href: "/personalized-gifts", emoji: "☕" },
                { label: "Wall art", href: "/personalized-gifts", emoji: "🖼️" },
                { label: "Shirts", href: "/personalized-gifts", emoji: "👕" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center rounded-xl border border-cream-200 bg-white p-4 text-center transition hover:border-brand-300 hover:bg-brand-50"
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="mt-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  );
};

export default SuccessPage;
