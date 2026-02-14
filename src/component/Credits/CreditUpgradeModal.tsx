import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { useBuyCredits } from "~/hook/useBuyCredits";
import { trackEvent } from "~/lib/ga";

type UpgradeContext = "generate" | "preview" | "remove_background";

type Props = {
  isOpen: boolean;
  requiredCredits: number;
  currentCredits: number;
  context: UpgradeContext;
  sourcePage?: string;
  country?: string;
  onSuccess: () => void;
  onClose: () => void;
};

type Offer = {
  title: string;
  subtitle: string;
  plan: "starter" | "pro" | "elite";
  credits: number;
  price: number;
  popular?: boolean;
};

const OFFERS: Offer[] = [
  {
    title: "Starter Boost",
    subtitle: "Great for quick top-ups",
    plan: "starter",
    credits: 20,
    price: 1.99,
  },
  {
    title: "Popular Choice",
    subtitle: "Best for regular sessions",
    plan: "pro",
    credits: 50,
    price: 3.99,
    popular: true,
  },
  {
    title: "Best Value",
    subtitle: "Maximum flexibility",
    plan: "elite",
    credits: 100,
    price: 6.99,
  },
];

const CONTEXT_COPY: Record<UpgradeContext, string> = {
  generate: "You're just one step away from creating your personalized design.",
  preview: "See your design on a real product before ordering.",
  remove_background: "Make your design print-ready in one click.",
};

function fireMetaCustomEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof maybeFbq === "function") {
    maybeFbq("trackCustom", eventName, params ?? {});
  }
}

function fireMetaInitiateCheckout(params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof maybeFbq === "function") {
    maybeFbq("track", "InitiateCheckout", params ?? {});
  }
}

export function CreditUpgradeModal({
  isOpen,
  requiredCredits,
  currentCredits,
  context,
  sourcePage,
  country,
  onSuccess,
  onClose,
}: Props) {
  const router = useRouter();
  const { buyCredits } = useBuyCredits();
  const creditsQuery = api.user.getCredits.useQuery(undefined, {
    enabled: isOpen,
    refetchOnWindowFocus: true,
  });
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | "elite" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const hasFiredViewedRef = useRef(false);
  const hasFiredCompletedRef = useRef(false);
  const baselineCreditsRef = useRef<number>(currentCredits);

  const needed = useMemo(() => {
    const delta = requiredCredits - currentCredits;
    return delta > 0 ? delta : 0;
  }, [requiredCredits, currentCredits]);

  useEffect(() => {
    if (!isOpen) {
      hasFiredViewedRef.current = false;
      hasFiredCompletedRef.current = false;
      setSelectedPlan(null);
      setIsProcessing(false);
      setIsPolling(false);
      setStatusMessage(null);
      return;
    }

    baselineCreditsRef.current = currentCredits;

    if (!hasFiredViewedRef.current) {
      trackEvent("credit_upgrade_viewed", {
        context,
        source_page: sourcePage,
        user_credits_before_action: currentCredits,
        required_credits: requiredCredits,
        current_credits: currentCredits,
        country: country ?? null,
      });
      fireMetaCustomEvent("credit_upgrade_viewed", {
        context,
        source_page: sourcePage,
        required_credits: requiredCredits,
        country: country ?? null,
      });
      fireMetaInitiateCheckout({
        content_category: "credits_upgrade",
        source_page: sourcePage,
        context,
      });
      hasFiredViewedRef.current = true;
    }
  }, [isOpen, context, requiredCredits, currentCredits, sourcePage, country]);

  useEffect(() => {
    if (!isOpen || !isPolling) return;

    const poll = setInterval(() => {
      void creditsQuery.refetch();
    }, 2500);

    return () => clearInterval(poll);
  }, [isOpen, isPolling, creditsQuery]);

  useEffect(() => {
    if (!isOpen || !isPolling) return;

    const updatedCredits = creditsQuery.data ?? currentCredits;
    const baseline = baselineCreditsRef.current;
    if (updatedCredits <= baseline) return;

    if (!hasFiredCompletedRef.current) {
      trackEvent("credit_purchase_completed", {
        context,
        previous_credits: baseline,
        updated_credits: updatedCredits,
      });
      fireMetaCustomEvent("credit_purchase_completed", { context });
      hasFiredCompletedRef.current = true;
    }

    setIsPolling(false);
    setIsProcessing(false);
    setStatusMessage(null);
    onClose();
    onSuccess();
  }, [isOpen, isPolling, creditsQuery.data, currentCredits, onClose, onSuccess, context]);

  useEffect(() => {
    if (!isOpen) return;
    if (router.query.credits_success !== "1") return;
    setIsPolling(true);
    setStatusMessage("Payment detected. Activating credits...");
  }, [isOpen, router.query.credits_success]);

  if (!isOpen) return null;

  const handleSelectPlan = async (offer: Offer) => {
    try {
      setSelectedPlan(offer.plan);
      setIsProcessing(true);
      setStatusMessage("Opening secure payment...");

      trackEvent("credit_purchase_initiated", {
        context,
        plan: offer.plan,
        credits: offer.credits,
        value: offer.price,
        source_page: sourcePage,
        user_credits_before_action: currentCredits,
        required_credits: requiredCredits,
        country: country ?? null,
      });
      fireMetaCustomEvent("credit_purchase_initiated", {
        context,
        plan: offer.plan,
        source_page: sourcePage,
        required_credits: requiredCredits,
        country: country ?? null,
      });

      await buyCredits(offer.plan, {
        purchaseContext: context,
        returnPath: router.asPath,
        openInNewTab: true,
      });

      setStatusMessage("Checkout opened in a new tab. Complete payment, credits activate instantly.");
      setIsPolling(true);
    } catch (error) {
      console.error("[CREDIT_UPGRADE_MODAL]", error);
      setStatusMessage("Could not start checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-blue-900 bg-gray-950 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h3 className="text-lg font-semibold">Upgrade Credits</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={isProcessing}
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-blue-300">
            You need {needed.toFixed(1)} more credits to continue.
          </p>
          <p className="mt-2 text-sm text-gray-300">{CONTEXT_COPY[context]}</p>
          <p className="mt-2 text-xs text-gray-400">Instant activation after payment.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {OFFERS.map((offer) => (
              <button
                key={offer.plan}
                type="button"
                onClick={() => void handleSelectPlan(offer)}
                disabled={isProcessing}
                className={`relative rounded-lg border p-3 text-left transition ${
                  offer.popular
                    ? "border-blue-500 bg-blue-950/50"
                    : "border-gray-700 bg-gray-900 hover:border-blue-500"
                } ${selectedPlan === offer.plan ? "ring-2 ring-blue-500" : ""}`}
              >
                {offer.popular && (
                  <span className="absolute -top-2 left-3 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    Most Popular
                  </span>
                )}
                <div className="text-sm font-semibold">{offer.title}</div>
                <div className="mt-1 text-xs text-gray-300">{offer.subtitle}</div>
                <div className="mt-3 text-sm font-medium">{offer.credits} credits</div>
                <div className="text-xl font-bold">${offer.price.toFixed(2)}</div>
              </button>
            ))}
          </div>

          {statusMessage && (
            <div className="mt-4 rounded-lg border border-blue-900 bg-blue-950/40 px-3 py-2 text-xs text-blue-200">
              {statusMessage}
            </div>
          )}

          {isPolling && (
            <button
              type="button"
              onClick={() => void creditsQuery.refetch()}
              className="mt-3 rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:border-blue-500"
            >
              I completed payment
            </button>
          )}

          <div className="mt-4 grid gap-1 text-xs text-gray-400">
            <div>🔒 Secure payment via Stripe</div>
            <div>⚡ Instant credit activation</div>
            <div>💳 All major cards accepted</div>
          </div>
        </div>
      </div>
    </div>
  );
}
