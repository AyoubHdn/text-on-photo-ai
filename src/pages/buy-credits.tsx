/* eslint-disable @typescript-eslint/no-misused-promises */
// pages/buy-credits.tsx
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import React, { useState } from "react";
import { useBuyCredits } from "~/hook/useBuyCredits";
import { useSession, signIn } from "next-auth/react";
import { Button } from "~/component/Button";
import { FiCheckCircle, FiGift, FiShield, FiHeart, FiUsers, FiStar } from "react-icons/fi";

// --- Type Definition ---
type Offer = {
  name: string;
  credits: number;
  price?: number;
  oldPrice?: number;
  description: string;
  plan: "free" | "starter" | "pro" | "elite";
  popular?: boolean;
  pricePerCredit?: string;
  features: string[];
  ctaText: string;
};

// --- Main Page Component ---
const BuyCreditsPage: NextPage = () => {
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const { buyCredits } = useBuyCredits();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const initialOffers = [
    {
      name: "Free Plan",
      credits: 1,
      price: undefined,
      description: "Perfect for trying out our basic tools.",
      plan: "free",
      features: [ "Create 1 Standard Name Art", "Access to all generator tools" ],
      ctaText: "Sign Up for Free",
    },
    {
      name: "Starter Pack",
      credits: 20,
      price: 1.99,
      description: "Great for a few special projects or gifts.",
      plan: "starter",
      features: [ "Up to 20 Standard Name Arts", "Up to 5 Optimized Logos", "1 Full Wedding Invitation", "Make designs private" ],
      ctaText: "Get Started",
    },
    {
      name: "Pro Pack",
      credits: 50,
      price: 3.99,
      description: "Best for regular users and creative exploration.",
      plan: "pro",
      popular: true,
      features: [ "Up to 50 Standard Name Arts", "Up to 12 Optimized Logos", "3 Full Wedding Invitations with AI Enhance", "Make designs private" ],
      ctaText: "Go Pro",
    },
    {
      name: "Elite Pack",
      credits: 100,
      price: 6.99,
      description: "Ideal for power users, freelancers, and businesses.",
      plan: "elite",
      features: [ "Up to 100 Standard Name Arts", "Up to 25 Optimized Logos", "6 Full Wedding Invitations with AI Enhance", "Make designs private" ],
      ctaText: "Become Elite",
    },
  ] as const;

  const offers: Offer[] = initialOffers.map((offer) => ({
    ...offer,
    features: Array.from(offer.features),
    oldPrice: offer.price ? offer.price * 2 : undefined,
    pricePerCredit: offer.price ? (offer.price / offer.credits).toFixed(2) : undefined,
  }));

  const handleBuy = async (plan: "free" | "starter" | "pro" | "elite") => {
    if (!isLoggedIn) { void signIn(); return; }
    if (plan === 'free') return;
    try {
      setLoadingPlan(plan);
      await buyCredits(plan);
    } catch (error) {
      console.error("Error during purchase:", error);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <Head>
        <title>Pricing & Credits | Name Design AI</title>
        <meta name="description" content="Choose a credit plan that fits your needs. Start for free or select a pack to create name art, logos, and wedding invitations." />
      </Head>
      <main className="flex flex-col container mx-auto gap-4 px-8 mb-24">
        <section className="text-center py-16">
          <h1 className="text-4xl md:text-5xl font-bold">Find the Perfect Plan for Your Creativity</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Our credit system is simple. Choose a pack, and use your credits on any of our AI design tools.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {offers.map((offer) => {
              const isFreePlanAndLoggedIn = offer.plan === 'free' && isLoggedIn;
              return (
                <div key={offer.plan} className={`relative border rounded-xl p-8 flex flex-col ${ offer.popular ? "border-blue-500 border-2" : "border-gray-200 dark:border-gray-700" } ${isFreePlanAndLoggedIn ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-800'}`}>
                  {offer.popular && ( <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center"><span className="bg-blue-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full">Most Popular</span></div> )}
                  <h2 className="text-2xl font-bold text-center">{offer.name}</h2>
                  <p className="text-center text-gray-500 dark:text-gray-400 mt-2 min-h-[40px]">{offer.description}</p>
                  <div className="my-8 text-center">
                    {offer.price !== undefined ? (
                        <>
                            <p className="text-xl text-gray-400 line-through">${offer.oldPrice?.toFixed(2)}</p>
                            <p className="text-5xl font-extrabold text-gray-900 dark:text-white">${offer.price.toFixed(2)}</p>
                        </>
                    ) : (
                        <p className="text-5xl font-extrabold text-gray-900 dark:text-white">Free</p>
                    )}
                    <p className="text-xl font-medium text-gray-500 mt-1"> / {offer.credits} Credits</p>
                    {offer.pricePerCredit && <p className="text-sm text-gray-400 mt-1">Just ${offer.pricePerCredit} per credit</p>}
                  </div>
                  <ul className="space-y-4 mb-8">
                    {offer.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                            <FiCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <Button onClick={() => handleBuy(offer.plan)} className="w-full" variant={offer.popular ? 'primary' : 'secondary'} disabled={loadingPlan === offer.plan || isFreePlanAndLoggedIn}>
                        {loadingPlan === offer.plan ? "Processing..." : isFreePlanAndLoggedIn ? "Claimed" : offer.ctaText}
                    </Button>
                  </div>
                </div>
              );
            })}
        </section>

        <HowCreditsWorkSection />
        <FaqSection />
      </main>
    </>
  );
};

// --- START: THE FINAL, ENHANCED "HOW CREDITS WORK" SECTION ---
function HowCreditsWorkSection() {
  const costs = [
    { 
      name: "Name & Couple Art",
      icon: <FiGift className="text-purple-500" />,
      breakdown: [
        { tier: "Standard", cost: "1 Credit" },
        { tier: "Optimized", cost: "4 Credits" },
      ]
    },
    { 
      name: "Pro Logo",
      icon: <FiShield className="text-blue-500" />,
      breakdown: [
        { tier: "Standard", cost: "1 Credit" },
        { tier: "Optimized", cost: "4 Credits" },
        { tier: "Ultimate", cost: "8 Credits" },
      ]
    },
    { 
      name: "Wedding Invitation",
      icon: <FiHeart className="text-pink-500" />,
      breakdown: [
        { tier: "Text & Photo Preview", cost: "10 Credits" },
        { tier: "AI Style Enhance", cost: "5 Credits" },
      ]
    },
  ];

  return (
    <section className="mt-24 py-16 bg-gray-50 dark:bg-gray-800 rounded-xl">
      <div className="container mx-auto px-8">
        <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">How Credits Work</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Your credits are a flexible currency for creativity. Use them across any of our tools. The cost varies based on the quality and complexity of the design you choose.
            </p>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {costs.map(item => (
            <div key={item.name} className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl">{item.icon}</div>
                <h3 className="text-xl font-bold">{item.name}</h3>
              </div>
              <div className="space-y-3 flex-grow">
                {item.breakdown.map(tier => (
                    <div key={tier.tier} className="flex justify-between items-center text-sm border-t border-gray-100 dark:border-gray-600 pt-3">
                        <span className="text-gray-600 dark:text-gray-300">{tier.tier}</span>
                        <span className="font-bold text-blue-500">{tier.cost}</span>
                    </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
// --- END: THE FINAL, ENHANCED "HOW CREDITS WORK" SECTION ---

function FaqSection() {
  const faqs = [
    { q: "Do my credits expire?", a: "Never! Your credits are yours to keep and use whenever inspiration strikes. They do not have an expiration date." },
    { q: "Can I make my designs private?", a: "Yes! All of our paid credit packs (Starter, Pro, and Elite) give you the ability to set your creations to private in your collection." },
    { q: "What if I'm not happy with my design?", a: "Our AI is powerful, but sometimes it takes a few tries to get the perfect result. We recommend generating a few variations. Please review our Refund Policy for more details." },
    { q: "Can I upgrade my plan later?", a: "Absolutely. You can buy a new credit pack at any time. The new credits will simply be added to your existing balance." },
  ];
  return (
    <section className="mt-24 mb-16">
        <div className="container mx-auto px-8 text-center">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
        </div>
        <div className="mt-12 max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, i) => (
                <div key={i} className="border-b dark:border-gray-700 pb-4">
                    <h3 className="text-xl font-semibold">{faq.q}</h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{faq.a}</p>
                </div>
            ))}
        </div>
    </section>
  );
}
// --- END: NEW SECTIONS ---

export default BuyCreditsPage;