import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { SeoHead } from "~/component/SeoHead";
import { trackEvent } from "~/lib/ga";
import { getFunnelContext } from "~/lib/tracking/funnel";

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
  funnel?: string;
  product_type?: string;
  niche?: string | null;
  traffic_type?: "paid" | "organic";
  country?: string | null;
  credits?: number;
  value?: number;
};

const SuccessPage: React.FC = () => {
  const router = useRouter();

  // Read purchase data synchronously before any useEffect can clear it
  const [purchaseData] = useState<PurchaseData | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem("last_credit_purchase");
      if (!raw) return null;
      return JSON.parse(raw) as PurchaseData;
    } catch {
      return null;
    }
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

    if (typeof window !== "undefined") {
      const trackedKey = "ga4_purchase_credits";
      if (!window.sessionStorage.getItem(trackedKey)) {
        const raw = window.sessionStorage.getItem("last_credit_purchase");
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as PurchaseData;
            if (typeof parsed?.credits === "number" && typeof parsed?.value === "number") {
              const funnelContext = getFunnelContext({
                route: router.pathname,
                sourcePage: parsed.source_page ?? "success",
                productType: parsed.product_type ?? "credits",
                country: parsed.country ?? null,
                query: router.query as Record<string, unknown>,
              });

              trackEvent("credit_purchase_completed", {
                context:
                  parsed.context ??
                  (typeof router.query.credits_context === "string"
                    ? router.query.credits_context
                    : null),
                plan: parsed.plan ?? null,
                credits: parsed.credits,
                value: parsed.value,
                previous_credits: null,
                updated_credits: null,
                ...funnelContext,
              });
              fireMetaCustomEvent("credit_purchase_completed", {
                context:
                  parsed.context ??
                  (typeof router.query.credits_context === "string"
                    ? router.query.credits_context
                    : null),
                plan: parsed.plan ?? null,
                credits: parsed.credits,
                value: parsed.value,
                previous_credits: null,
                updated_credits: null,
                ...funnelContext,
              });
              window.sessionStorage.setItem(trackedKey, "1");
              window.sessionStorage.removeItem("last_credit_purchase");
            }
          } catch {
            // ignore invalid storage
          }
        }
      }
    }
  }, [router.pathname, router.query]);

  return (
    <>
      <SeoHead
        title="Credits Purchase Success | Name Design AI"
        description="Credits purchase success page."
        path="/success"
        noindex
      />
      <main className="min-h-screen bg-white dark:bg-gray-950">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16">

          {/* Confirmation card */}
          <div className="w-full rounded-2xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950/30">
            <div className="mb-4 text-5xl">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {creditsCount
                ? `${creditsCount} credits added to your account`
                : "Credits added to your account"}
            </h1>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Jump back in and keep creating. Preview your design on a mug, shirt, or wall art — free from inside the generator.
            </p>
            <Link
              href={generatorHref}
              className="mt-6 inline-block w-full rounded-lg bg-brand-600 px-6 py-3 text-base font-bold text-white transition hover:bg-brand-700"
            >
              Continue creating
            </Link>
          </div>

          {/* Product quick-links */}
          <div className="mt-8 w-full">
            <p className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Explore gift product ideas
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Mugs", href: "/personalized-name-mugs", emoji: "☕" },
                { label: "Wall art", href: "/personalized-name-wall-art", emoji: "🖼️" },
                { label: "Shirts", href: "/custom-name-shirts", emoji: "👕" },
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
