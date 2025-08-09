import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/component/Button";
import { FaQuoteLeft } from "react-icons/fa";
import { FiBriefcase, FiLayers, FiTarget } from "react-icons/fi"; 

// --- Data for the Curated Pro Logo Gallery ---
// These tags should correspond to the industries in your generator
const galleryItems = [
  { src: "/pro-logo/abstract-opt.webp", title: "Abstract & Modern", tags: ["technology", "finance"] },
  { src: "/pro-logo/combination-opt.webp", title: "Combination Mark", tags: ["food", "retail", "technology"] },
  { src: "/pro-logo/wordmark-opt.webp", title: "Elegant Wordmark", tags: ["fashion", "finance", "services"] },
  { src: "/pro-logo/brandmark-opt.webp", title: "Iconic Brandmark", tags: ["technology", "sports"] },
  { src: "/pro-logo/emblem-opt.webp", title: "Classic Emblem", tags: ["food", "sports"] },
  { src: "/pro-logo/lettermark-opt.webp", title: "Minimalist Lettermark", tags: ["fashion", "services", "technology"] },
  // Add 2-4 more strong, diverse examples to fill out the grid
  { src: "/pro-logo/food.webp", title: "Handcrafted Look", tags: ["food", "retail"] }, // Example from another set
  { src: "/pro-logo/finance.webp", title: "Luxury & Premium", tags: ["fashion", "finance"] }, // Example from another set
];

const galleryTabs = [
    { key: "all", name: "All Industries" },
    { key: "technology", name: "Technology" },
    { key: "food", name: "Food & Beverage" },
    { key: "finance", name: "Finance" },
    { key: "fashion", name: "Fashion & Retail" },
    { key: "services", name: "Professional Services" },
];


const ProLogoLandingPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredStyles = activeTab === "all"
    ? galleryItems
    : galleryItems.filter(item => item.tags.includes(activeTab));

  return (
    <>
      <Head>
        <title>AI Professional Logo Maker: Create a Custom Brand Logo</title>
        <meta
          name="description"
          content="Design a unique, high-quality logo in minutes with our AI generator. Get a professional brand identity without the high cost. Perfect for startups & businesses."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="bg-white dark:bg-gray-900">
        {/* --- Hero Section --- */}
        <section className="text-center py-20 lg:py-32 px-4 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">Your Professional Logo, Created in Minutes</h1>
            <h2 className="text-xl md:text-2xl mt-4 text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              The AI-powered tool for startups, entrepreneurs, and brands who need a standout identity.
            </h2>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Stop paying thousands for a designer. Our intelligent logo maker helps you craft a unique, high-quality logo that builds trust and sets you apart from the competition.
            </p>
            <div className="mt-10">
              {/* TODO: This link must point to your newly renamed generator page */}
              <Link href="/pro-logo-generator">
                <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Design Your Logo Now</button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* --- How It Works Section --- */}
        <section className="py-24">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A Professional Identity in 3 Steps</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-16">Our guided process makes logo design fast, simple, and effective.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
              <div className="flex flex-col items-center p-6">
                <FiBriefcase className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">1. Define Your Brand</h3>
                <p className="text-gray-600 dark:text-gray-400">Enter your company name and select your industry to tailor the results.</p>
              </div>
              <div className="flex flex-col items-center p-6 border-y md:border-y-0 md:border-x border-gray-200 dark:border-gray-700">
                <FiLayers className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">2. Select Your Style</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose from professional logo styles like Wordmark, Abstract, or Emblem.</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <FiTarget className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">3. Generate & Perfect</h3>
                <p className="text-gray-600 dark:text-gray-400">Our AI generates unique options. Pick your favorite and it&apos;s ready for use.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- INTERACTIVE GALLERY SECTION --- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Find a Look That Fits Your Industry</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">See how our AI adapts to create stunning logos for any type of business.</p>
            
            <div className="flex justify-center flex-wrap gap-2 mb-12">
                {galleryTabs.map(tab => (
                    <button 
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                            activeTab === tab.key 
                            ? 'bg-blue-500 text-white shadow' 
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredStyles.map((style) => (
                    <div key={style.src} className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer">
                        <img src={style.src} alt={style.title} className="w-full h-full object-cover aspect-square transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-white text-lg font-semibold text-center px-2">{style.title}</span>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </section>

        {/* --- Social Proof Section --- */}
        <section className="py-24">
            <div className="container mx-auto text-center px-4">
                <h2 className="text-3xl md:text-4xl font-bold mb-12">Trusted by Startups and Entrepreneurs</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left">
                        <FaQuoteLeft className="text-blue-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;I launched my tech startup and needed a logo fast. I got a professional, modern design in minutes for a fraction of what a design agency quoted me. Highly recommended!&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- Alex G., Founder of Innovatech</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left transform lg:scale-105 shadow-xl">
                        <FaQuoteLeft className="text-blue-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;As a freelance consultant, I needed a brand that looked credible. This tool helped me create a sleek lettermark logo that gives me the professional edge I was looking for.&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- Jessica R., Marketing Consultant</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left">
                        <FaQuoteLeft className="text-blue-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;I opened a small cafe and had no budget for a big design firm. I was amazed at the quality and the number of great options I got. My new emblem logo looks amazing on my menus!&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- David Chen, Owner of The Daily Grind</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Final Call to Action Section --- */}
        <section className="bg-gray-900 text-white">
            <div className="container mx-auto text-center px-6 py-20">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Build Your Brand Identity?</h2>
                <p className="mt-4 text-lg text-gray-300 max-w-xl mx-auto">Your perfect logo is just a few clicks away. Start designing now and see what our AI can create for you.</p>
                <div className="mt-8">
                    {/* TODO: This link must point to your newly renamed generator page */}
                    <Link href="/pro-logo-generator">
                        <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Get Started with the Logo Maker</button>
                    </Link>
                </div>
            </div>
        </section>
      </main>
    </>
  );
};

export default ProLogoLandingPage;