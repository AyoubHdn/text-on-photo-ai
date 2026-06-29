import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { useSession, signIn } from "next-auth/react";
import { SeoHead } from "~/component/SeoHead";
import { trackEvent } from "~/lib/ga";
import { getFunnelContext } from "~/lib/tracking/funnel";
import { useBuyCredits } from "~/hook/useBuyCredits";
import { useLocale } from "~/hook/useLocale";
import { t } from "~/lib/funnelStrings";

const BuyCredits: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const { buyCredits } = useBuyCredits();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
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

  type Offer = {
    name: string;
    images: number;
    price: number;
    description: string;
    plan: "starter" | "pro" | "elite";
    popular?: boolean;
    pricePerImage?: string;
  };

  const offers: Offer[] = [
    {
      name: t("planStarterName", locale),
      images: 20,
      price: 1.99,
      description: t("planStarterDesc", locale),
      plan: "starter",
    },
    {
      name: t("planProName", locale),
      images: 50,
      price: 3.99,
      description: t("planProDesc", locale),
      plan: "pro",
      popular: true,
    },
    {
      name: t("planEliteName", locale),
      images: 100,
      price: 6.99,
      description: t("planEliteDesc", locale),
      plan: "elite",
    },
  ].map((offer) => ({
    ...offer,
    pricePerImage: (offer.price / offer.images).toFixed(2),
  })) as Offer[];

  const handleBuy = async (plan: "starter" | "pro" | "elite") => {
    if (!isLoggedIn) {
      void signIn();
      return;
    }

    try {
      setLoadingPlan(plan);
      const selectedOffer = offers.find((offer) => offer.plan === plan);
      const funnelContext = getFunnelContext({
        route: router.pathname,
        sourcePage: "buy-credits",
        productType: "credits",
        query: router.query as Record<string, unknown>,
      });

      if (typeof window !== "undefined" && selectedOffer) {
        window.sessionStorage.setItem(
          "last_credit_purchase",
          JSON.stringify({
            plan,
            context: "buy_credits_page",
            source_page: funnelContext.source_page,
            funnel: funnelContext.funnel,
            product_type: funnelContext.product_type,
            niche: funnelContext.niche,
            traffic_type: funnelContext.traffic_type,
            country: funnelContext.country,
            credits: selectedOffer.images,
            value: selectedOffer.price,
          })
        );
        window.sessionStorage.removeItem("ga4_purchase_credits");
        trackEvent("credit_purchase_initiated", {
          plan,
          credits: selectedOffer.images,
          value: selectedOffer.price,
          context: "buy_credits_page",
          ...funnelContext,
        });
      }

      await buyCredits(plan, {
        sourcePage: funnelContext.source_page,
        returnPath:
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : undefined,
      });
    } catch (error) {
      console.error("Error during purchase:", error);
      alert(t("purchaseError", locale));
    } finally {
      setLoadingPlan(null);
    }
  };

  const features = [
    { icon: "🎨", label: t("featureGenerateLabel", locale), detail: t("featureGenerateDetail", locale) },
    { icon: "✂️", label: t("featureRemoveBgLabel", locale), detail: t("featureRemoveBgDetail", locale) },
    { icon: "⬇️", label: t("featureDownloadLabel", locale), detail: t("featureDownloadDetail", locale) },
  ];

  return (
    <>
      <SeoHead
        title="Buy Credits | Name Design AI"
        description="Explore affordable pricing plans and buy credits to unlock premium features on Name Design AI. Start creating stunning name designs today."
        path="/buy-credits"
        noindex
      />

      <main
        dir={isArabic ? "rtl" : "ltr"}
        className="container mx-auto mt-20 min-h-screen px-4 pb-16 sm:px-8"
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-3 flex justify-end gap-1 text-xs text-gray-500">
            <button onClick={() => switchLocale("en")} className={locale === "en" ? "font-semibold text-gray-800" : "opacity-60 hover:opacity-100"}>English</button>
            <span className="opacity-40">|</span>
            <button onClick={() => switchLocale("ar")} className={locale === "ar" ? "font-semibold text-gray-800" : "opacity-60 hover:opacity-100"}>العربية</button>
          </div>
          <section className="mb-6 rounded-2xl border border-brand-200 bg-gradient-to-b from-brand-50 to-white p-6 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              {t("buyCreditsHeading", locale)}
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-gray-700 dark:text-gray-200 sm:text-base">
              {t("pageSubtitle", locale)}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
              <span>{t("trustInstant", locale)}</span>
              <span>{t("trustSecure", locale)}</span>
              <span>{t("trustCards", locale)}</span>
            </div>
          </section>

          <section className="mb-8 grid gap-5 md:grid-cols-3">
            {offers.map((offer, index) => {
              const badgeLabel =
                offer.plan === "elite"
                  ? t("badgeBestValue", locale)
                  : offer.plan === "pro"
                  ? t("badgeMostPopular", locale)
                  : null;

              return (
                <div
                  key={index}
                  className={`relative flex h-full flex-col rounded-xl border p-6 shadow-lg ${
                    offer.popular
                      ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-300"
                      : "border-cream-200 bg-white"
                  }`}
                >
                  {badgeLabel && (
                    <span className={`mb-4 inline-block self-start rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${offer.plan === "elite" ? "bg-emerald-600" : "bg-brand-600"}`}>
                      {badgeLabel}
                    </span>
                  )}

                  <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">{offer.name}</h2>
                  <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">{offer.description}</p>

                  <div className="mb-2">
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">${offer.price.toFixed(2)}</p>
                  </div>

                  <p className="mb-1 text-gray-700 dark:text-gray-200">
                    {t("designsIncluded", locale, { n: offer.images })}
                  </p>
                  <p className="mb-5 text-sm font-semibold text-brand-700">
                    {t("pricePerDesign", locale, { price: offer.pricePerImage! })}
                  </p>

                  <button
                    id={`plan_${offer.plan}`}
                    onClick={() => { void handleBuy(offer.plan); }}
                    className={`mt-auto w-full rounded-lg px-4 py-3 font-semibold text-white transition ${
                      offer.popular
                        ? "bg-brand-600 hover:bg-brand-700"
                        : "bg-slate-800 hover:bg-slate-700"
                    }`}
                    disabled={loadingPlan === offer.plan}
                  >
                    {loadingPlan === offer.plan
                      ? t("planCtaLoading", locale)
                      : t("planCta", locale, { n: offer.images })}
                  </button>
                </div>
              );
            })}
          </section>

          <p className="mb-6 text-center text-xs text-gray-600 dark:text-gray-300">
            {isArabic ? (
              t("refundNote", locale)
            ) : (
              <>
                Please review our{" "}
                <Link href="/refund" className="underline dark:text-gray-100">
                  Refund Policy
                </Link>{" "}
                before buying credits.
              </>
            )}
          </p>

          <section className="mb-5 rounded-xl border border-brand-200 bg-brand-50/60 p-5">
            <h2 className="mb-4 text-lg font-semibold">{t("whatYouCanDoHeading", locale)}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-5">
              <h2 className="mb-2 text-lg font-semibold">{t("typicalUsageHeading", locale)}</h2>
              <div className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                <div>{t("typicalCostDesign", locale)}</div>
                <div>{t("typicalSession", locale)}</div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default BuyCredits;
