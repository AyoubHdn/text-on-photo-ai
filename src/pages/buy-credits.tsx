import Head from "next/head";
import Link from "next/link";
import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { trackEvent } from "~/lib/ga";
import { useBuyCredits } from "~/hook/useBuyCredits";

const BuyCredits: React.FC = () => {
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

      if (typeof window !== "undefined" && selectedOffer) {
        window.sessionStorage.setItem(
          "last_credit_purchase",
          JSON.stringify({
            credits: selectedOffer.images,
            value: selectedOffer.price,
          })
        );
        window.sessionStorage.removeItem("ga4_purchase_credits");
        trackEvent("credit_purchase_initiated", {
          plan,
          credits: selectedOffer.images,
          value: selectedOffer.price,
        });
      }

      await buyCredits(plan);
    } catch (error) {
      console.error("Error during purchase:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <Head>
        <title>Buy Credits | Name Design AI</title>
        <meta
          name="description"
          content="Explore affordable pricing plans and buy credits to unlock premium features on Name Design AI. Start creating stunning name designs today."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto mt-20 min-h-screen px-4 pb-16 sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <section className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50 to-white p-6 text-center dark:border-blue-900 dark:from-blue-950/30 dark:to-gray-950">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Unlock More Designs Instantly
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-gray-700 dark:text-gray-200 sm:text-base">
              Choose a credit pack and continue generating, previewing, and refining your design without interruptions.
            </p>
          </section>

          <section className="mb-8 grid gap-5 md:grid-cols-3">
            {offers.map((offer, index) => {
              const oldPrice = (offer.price * 2).toFixed(2);

              return (
                <div
                  key={index}
                  className={`relative flex h-full flex-col rounded-xl border p-6 shadow-lg ${
                    offer.popular
                      ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-300 dark:bg-blue-950/20 dark:ring-blue-800"
                      : "border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
                  }`}
                >
                  <span className="absolute right-3 top-3 rounded bg-blue-600 px-2 py-1 text-xs font-bold uppercase text-white">
                    50% Off
                  </span>

                  {offer.popular && (
                    <span className="mb-4 inline-block rounded-full bg-blue-500 px-2 py-1 text-xs uppercase text-white">
                      Most Popular
                    </span>
                  )}

                  <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{offer.name}</h2>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">{offer.description}</p>

                  <div className="mb-5">
                    <p className="text-base text-gray-500 line-through dark:text-gray-400">${oldPrice}</p>
                    <p className="text-4xl font-bold text-gray-900 dark:text-white">${offer.price.toFixed(2)}</p>
                  </div>

                  <p className="mb-1 text-gray-700 dark:text-gray-200">
                    {offer.images} Credits / {offer.images} Images
                  </p>
                  <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Only ${offer.pricePerImage}/image</p>
                  <p className="mb-4 text-center text-sm font-bold text-blue-700 dark:text-blue-300">Limited-time pricing</p>

                  <button
                    id={`plan_${offer.plan}`}
                    onClick={() => {
                      void handleBuy(offer.plan);
                    }}
                    className="mt-auto w-full rounded-lg bg-blue-600 px-4 py-2.5 text-white transition hover:bg-blue-500"
                    disabled={loadingPlan === offer.plan}
                  >
                    {loadingPlan === offer.plan ? "Processing..." : "Buy Now"}
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
            <h2 className="mb-3 text-lg font-semibold">Why Credits Matter</h2>
            <ul className="grid gap-1 text-sm text-gray-700 dark:text-gray-300 sm:grid-cols-2">
              <li>High-quality generation</li>
              <li>Product previews</li>
              <li>Background removal</li>
              <li>Premium styles</li>
            </ul>
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
                <div>Cost per preview: 0.1 credit</div>
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
