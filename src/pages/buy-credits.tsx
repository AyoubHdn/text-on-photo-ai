import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { useSession, signIn } from "next-auth/react";
import { SeoHead } from "~/component/SeoHead";
import { trackEvent } from "~/lib/ga";
import { getFunnelContext } from "~/lib/tracking/funnel";
import { useBuyCredits } from "~/hook/useBuyCredits";

const BuyCredits: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const { buyCredits } = useBuyCredits();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

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
      name: "Starter Plan",
      images: 20,
      price: 1.99,
      description: "Perfect for getting started quickly.",
      plan: "starter",
    },
    {
      name: "Pro Plan",
      images: 50,
      price: 3.99,
      description: "Best for regular creators and testing variations.",
      plan: "pro",
      popular: true,
    },
    {
      name: "Elite Plan",
      images: 100,
      price: 6.99,
      description: "Ideal for power users and heavier sessions.",
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
      });
    } catch (error) {
      console.error("Error during purchase:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <SeoHead
        title="Buy Credits | Name Design AI"
        description="Explore affordable pricing plans and buy credits to unlock premium features on Name Design AI. Start creating stunning name designs today."
        path="/buy-credits"
        noindex
      />

      <main className="container mx-auto mt-20 min-h-screen px-4 pb-16 sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <section className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-6 text-center dark:border-blue-900 dark:from-blue-950/30 dark:to-gray-950">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Unlock More Designs Instantly
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-gray-700 dark:text-gray-200 sm:text-base">
              Choose a credit pack and continue generating, previewing, and refining your design without interruptions.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
              <span>⚡ Instant activation</span>
              <span>🔒 Secure payment via Stripe</span>
              <span>💳 All major cards accepted</span>
            </div>
          </section>

          <section className="mb-8 grid gap-5 md:grid-cols-3">
            {offers.map((offer, index) => {
              const badgeLabel =
                offer.plan === "elite"
                  ? "Best Value"
                  : offer.plan === "pro"
                  ? "Most Popular"
                  : null;

              return (
                <div
                  key={index}
                  className={`relative flex h-full flex-col rounded-xl border p-6 shadow-lg ${
                    offer.popular
                      ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-300 dark:bg-blue-950/20 dark:ring-blue-800"
                      : "border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
                  }`}
                >
                  {badgeLabel && (
                    <span className={`mb-4 inline-block self-start rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${offer.plan === "elite" ? "bg-emerald-600" : "bg-blue-500"}`}>
                      {badgeLabel}
                    </span>
                  )}

                  <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">{offer.name}</h2>
                  <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">{offer.description}</p>

                  <div className="mb-2">
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">${offer.price.toFixed(2)}</p>
                  </div>

                  <p className="mb-1 text-gray-700 dark:text-gray-200">
                    {offer.images} AI designs included
                  </p>
                  <p className="mb-5 text-sm font-semibold text-blue-700 dark:text-blue-300">
                    ${offer.pricePerImage} per design
                  </p>

                  <button
                    id={`plan_${offer.plan}`}
                    onClick={() => { void handleBuy(offer.plan); }}
                    className={`mt-auto w-full rounded-lg px-4 py-3 font-semibold text-white transition ${
                      offer.popular
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
                    }`}
                    disabled={loadingPlan === offer.plan}
                  >
                    {loadingPlan === offer.plan ? "Processing..." : `Get ${offer.images} Credits`}
                  </button>
                </div>
              );
            })}
          </section>

          <p className="mb-6 text-center text-xs text-gray-600 dark:text-gray-300">
            Please review our{" "}
            <Link href="/refund" className="underline dark:text-gray-100">
              Refund Policy
            </Link>{" "}
            before buying credits.
          </p>

          <section className="mb-5 rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900 dark:bg-blue-950/30">
            <h2 className="mb-4 text-lg font-semibold">What you can do with credits</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: "🎨", label: "Generate AI name art", detail: "1 credit per Standard design" },
                { icon: "✂️", label: "Remove background", detail: "1 credit — makes designs print-ready" },
                { icon: "🖼️", label: "Preview on products", detail: "Free — no credits needed" },
                { icon: "⬇️", label: "High-res download", detail: "Free — always included" },
              ].map((item) => (
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

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900 dark:bg-blue-950/30">
              <h2 className="mb-2 text-lg font-semibold">From Idea to Product</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Use credits to preview your design on real mugs, t-shirts, and posters before ordering.
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900 dark:bg-blue-950/30">
              <h2 className="mb-2 text-lg font-semibold">Typical Session Usage</h2>
              <div className="grid gap-1 text-sm text-gray-700 dark:text-gray-300">
                <div>Cost per design: about 1 credit</div>
                <div>Cost per preview: Free</div>
                <div>Most customers use 10-20 credits per session</div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
};

export default BuyCredits;
