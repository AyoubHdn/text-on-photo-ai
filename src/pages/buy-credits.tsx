import Head from "next/head";
import Link from "next/link";
import React, { useState } from "react";
import { useBuyCredits } from "~/hook/useBuyCredits";
import { useSession, signIn } from "next-auth/react";

const BuyCredits: React.FC = () => {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const { buyCredits } = useBuyCredits();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null); // Track loading state for each plan

  type Offer = {
    name: string;
    images: number;
    price: number;  // current (discounted) price
    description: string;
    plan: "starter" | "pro" | "elite";
    popular?: boolean;
    pricePerImage?: string; // Add pricePerImage as an optional property
  };

  const offers: Offer[] = [
    {
      name: "Starter Plan",
      images: 20,
      price: 1.99,
      description: "Perfect for beginners to get started.",
      plan: "starter",
    },
    {
      name: "Pro Plan",
      images: 50,
      price: 3.99,
      description: "Best for regular users who need more designs.",
      plan: "pro",
      popular: true,
    },
    {
      name: "Elite Plan",
      images: 100,
      price: 6.99,
      description: "Ideal for power users and businesses.",
      plan: "elite",
    },
  ].map((offer) => ({
    ...offer,
    pricePerImage: (offer.price / offer.images).toFixed(2),
  })) as Offer[]; // Use type assertion here  

  const handleBuy = async (plan: "starter" | "pro" | "elite") => {
    if (!isLoggedIn) {
      // If not, trigger the sign-in flow.
      // After they sign in, they will be redirected back to this page.
      void signIn();
      return; // Stop the function here
    }
    try {
      setLoadingPlan(plan); // Set loading state
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
      }
      await buyCredits(plan); // Trigger buyCredits with the selected plan
    } catch (error) {
      console.error("Error during purchase:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null); // Reset loading state
    }
  };

  return (
    <>
      <Head>
        <title>Buy Credits | Name Design AI</title>
        <meta
          name="description"
          content="Explore affordable pricing plans and buy credits to unlock premium features on Name Design AI. Start creating stunning name designs today!"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen mt-24 flex-col container mx-auto gap-4 px-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-6">Buy Credits</h1>
          <p className="text-center dark:text-gray-200 mb-4">
            Please review our{" "}
            <Link href="/refund" className="dark:text-gray-100 underline">
              Refund Policy
            </Link>{" "}
            before buying credits.
          </p>
          <p className="text-center dark:text-gray-300 mb-10">
            Choose the perfect plan for your design needs.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {offers.map((offer, index) => {
              // Calculate the old price as double the current (discounted) price
              const oldPrice = (offer.price * 2).toFixed(2);
              return (
                <div
                  key={index}
                  className={`relative border rounded-lg p-6 shadow-lg bg-white ${
                    offer.popular ? "border-blue-500" : "border-gray-300"
                  }`}
                >
                  {/* Discount badge */}
                  <div className="absolute top-0 right-0 m-2">
                    <span className="bg-red-600 text-white text-xs font-bold uppercase px-2 py-1 rounded">
                      50% Off
                    </span>
                  </div>
                  {offer.popular && (
                    <div className="bg-blue-500 text-white text-xs uppercase px-2 py-1 rounded-full inline-block mb-4">
                      Most Popular
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {offer.name}
                  </h2>
                  <p className="text-gray-600 mb-4">{offer.description}</p>
                  <div className="mb-6">
                    <p className="text-lg text-gray-500 line-through">
                      Old Price: ${oldPrice}
                    </p>
                    <p className="text-4xl font-bold text-gray-800">
                      Now: ${offer.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-gray-600 mb-2">
                    {offer.images} Credits / {offer.images} Images
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Only ${offer.pricePerImage}/image
                  </p>
                  <p className="text-center text-sm text-red-600 mb-4 font-bold">
                    Limited Offer
                  </p>
                  <button
                    id={`plan_${offer.plan}`}
                    onClick={() => {
                      void handleBuy(offer.plan);
                    }}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
                    disabled={loadingPlan === offer.plan} // Disable if this plan is loading
                  >
                    {loadingPlan === offer.plan ? "Processing..." : "Buy Now"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
};

export default BuyCredits;
