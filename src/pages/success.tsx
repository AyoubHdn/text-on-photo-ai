import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { trackEvent } from "~/lib/ga";
import { getFunnelContext } from "~/lib/tracking/funnel";

function fireMetaCustomEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof maybeFbq === "function") {
    maybeFbq("trackCustom", eventName, params ?? {});
  }
}

const SuccessPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Inject Google Ads conversion tracking script
    const gtagEvent = () => {
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag('event', 'conversion', {
          'send_to': 'AW-794176708/x-pvCNj1_IMaEMTZ2PoC',
          'value': 1.0,
          'currency': 'MAD',
          'transaction_id': '' // Pass the transaction ID if available
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
            const parsed = JSON.parse(raw) as {
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
            if (typeof parsed?.credits === "number" && typeof parsed?.value === "number") {
              const funnelContext = getFunnelContext({
                route: router.pathname,
                sourcePage: parsed.source_page ?? "success",
                productType: parsed.product_type ?? "credits",
                country: parsed.country ?? null,
                query: router.query as Record<string, unknown>,
              });

              trackEvent("credit_purchase_completed", {
                context: parsed.context ?? (typeof router.query.credits_context === "string" ? router.query.credits_context : null),
                plan: parsed.plan ?? null,
                credits: parsed.credits,
                value: parsed.value,
                previous_credits: null,
                updated_credits: null,
                ...funnelContext,
              });
              fireMetaCustomEvent("credit_purchase_completed", {
                context: parsed.context ?? (typeof router.query.credits_context === "string" ? router.query.credits_context : null),
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-50 shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-green-500 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your credits have been added to your account.
        </p>
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
          onClick={() => { void router.push("/") }}
        >
          Start Generating Designs
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
