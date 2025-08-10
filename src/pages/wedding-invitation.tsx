// pages/wedding-invitations.tsx
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/component/Button";
import { FaQuoteLeft } from "react-icons/fa";
import { FiEdit3, FiHeart, FiCamera, FiCheckCircle } from "react-icons/fi";

// --- Data for the Curated Gallery ---
// These are your best styles to showcase the feature's capabilities.
const galleryItems = [
  { src: "/styles/wedding/w-veil-photo-01.webp", title: "Classic Veil Photo", tags: ["photo", "unique"] },
  { src: "/styles/wedding/w-classic-floral-01.webp", title: "Classic Floral", tags: ["text-only", "romantic"] },
  { src: "/styles/wedding/w001.webp", title: "Modern Wreath", tags: ["text-only", "modern"] },
  { src: "/styles/wedding/w-marble-blossom-01.webp", title: "Marble & Blossom", tags: ["text-only", "modern"] },
  { src: "/styles/wedding/w-photo-01.webp", title: "Classic Photo Frame", tags: ["photo", "romantic"] },
  { src: "/styles/wedding/w-pastel-bouquet-01.webp", title: "Pastel Bouquet", tags: ["photo", "unique"] },
  // Add 2-6 more of your best-looking styles here
];

const galleryTabs = [
    { key: "all", name: "All Styles" },
    { key: "photo", name: "Photo Invitations" },
    { key: "text-only", name: "Text-Only Designs" },
    { key: "romantic", name: "Romantic" },
    { key: "modern", name: "Modern" },
];

const WeddingInvitationsLandingPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredStyles = activeTab === "all"
    ? galleryItems
    : galleryItems.filter(item => item.tags.includes(activeTab));

  return (
    <>
      <Head>
        <title>Wedding Invitation Maker | Design Custom Wedding Cards Online</title>
        <meta
          name="description"
          content="Create beautiful, cheap wedding invitations online with our AI wedding invitation maker. Design custom photo wedding invitations, save the date cards, and more."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="bg-white dark:bg-gray-900">
        {/* --- Hero Section --- */}
        <section className="text-center py-20 lg:py-32 px-4 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">The Easiest Way to Design Wedding Invitations</h1>
            <h2 className="text-xl md:text-2xl mt-4 text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Your perfect <span className="text-pink-500">wedding invitation card</span>, created in minutes with AI.
            </h2>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Stop searching for generic <span className="font-semibold">wedding cards</span>. Our intelligent <span className="font-semibold">wedding invitation maker</span> helps you create beautiful, cheap wedding invitations online. From <span className="font-semibold">photo wedding invitations</span> to classic <span className="font-semibold">save the date cards</span>, get a design that tells your unique love story.
            </p>
            <div className="mt-10">
              <Link href="/wedding-invitation-generator">
                <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Design Your Invitation Card</button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* --- How It Works Section --- */}
        <section className="py-24">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-16">Create Your Marriage Invitation Design in 3 Simple Steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
              <div className="flex flex-col items-center p-6">
                <FiHeart className="text-pink-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">1. Choose a Wedding Card Design</h3>
                <p className="text-gray-600 dark:text-gray-400">Explore hundreds of <span className="font-semibold">wedding invitation examples</span>, from modern to romantic, to find your perfect starting point.</p>
              </div>
              <div className="flex flex-col items-center p-6 border-y md:border-y-0 md:border-x border-gray-200 dark:border-gray-700">
                <FiEdit3 className="text-pink-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">2. Personalize Your Invitation</h3>
                <p className="text-gray-600 dark:text-gray-400">Add your names, date, and venue. Our system ensures your text is always perfect, making it the ideal tool to <span className="font-semibold">design invitation cards</span>.</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <FiCheckCircle className="text-pink-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">3. Download & Share</h3>
                <p className="text-gray-600 dark:text-gray-400">Get a high-resolution <span className="font-semibold">digital wedding invitation</span> ready for printing or sending to guests online. It’s that easy!</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Interactive Gallery Section --- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A Wedding Invitation Card Design for Every Style</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">Whether you need <span className="font-semibold">wedding reception invitations</span> or <span className="font-semibold">wedding invitations and save the dates</span>, find the perfect look.</p>
            <div className="flex justify-center flex-wrap gap-2 mb-12">
                {galleryTabs.map(tab => (
                    <button 
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${ activeTab === tab.key ? 'bg-pink-500 text-white shadow' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600' }`}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredStyles.map((style) => (
                    <div key={style.src} className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer">
                        <img src={style.src} alt={style.title} className="w-full h-full object-cover aspect-[9/16] transition-transform duration-300 group-hover:scale-105" />
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
                <h2 className="text-3xl md:text-4xl font-bold mb-12">Loved by Couples & Planners</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left">
                        <FaQuoteLeft className="text-pink-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;I was dreading the invitation process, but this was so easy and fun! We created a photo invitation that felt completely &lsquo;us&apos; in about 15 minutes. The final PNG was perfect for printing.&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- Jessica L.</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left transform lg:scale-105 shadow-xl">
                        <FaQuoteLeft className="text-pink-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;The AI cartoon feature is a game-changer! My fiancé and I wanted something unique, and the result was incredible. Our guests can&apos;t stop talking about how cool our invitations are.&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- Emily R.</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left">
                        <FaQuoteLeft className="text-pink-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;My daughter is getting married, and I used this tool to help her design the invitations. It was a wonderful bonding experience, and the final product looks like we hired a professional designer.&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- Carol P.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Final Call to Action Section --- */}
        <section className="bg-pink-600 text-white">
            <div className="container mx-auto text-center px-6 py-20">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Announce Your Big Day?</h2>
                <p className="mt-4 text-lg text-pink-100 max-w-xl mx-auto">Start designing a beautiful, personal invitation that you and your guests will love. It’s free to try!</p>
                <div className="mt-8">
                    <Link href="/wedding-invitation-generator">
                        <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Start Designing Now</button>
                    </Link>
                </div>
            </div>
        </section>
      </main>
    </>
  );
};

export default WeddingInvitationsLandingPage;