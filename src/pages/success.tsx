import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { trackEvent } from "~/lib/ga";

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
            const parsed = JSON.parse(raw) as { credits?: number; value?: number };
            if (typeof parsed?.credits === "number" && typeof parsed?.value === "number") {
              trackEvent("purchase_credits", {
                credits: parsed.credits,
                value: parsed.value,
              });
              trackEvent("credit_purchase_completed", {
                credits: parsed.credits,
                value: parsed.value,
              });
              fireMetaCustomEvent("credit_purchase_completed", {
                credits: parsed.credits,
                value: parsed.value,
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
  }, []);

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
