import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/component/Button";
import { FaQuoteLeft } from "react-icons/fa";
import { FiHeart, FiGift, FiStar, FiEdit3 } from "react-icons/fi"; 

// --- Data for the Curated "Couples Art" Gallery ---
// The tags correspond to the tabs for filtering.
const galleryItems = [
  // Romantic & Classic
  { src: "/styles/couples/c012e.webp", title: "Vintage Love Letter", tags: ["romantic"] },
  { src: "/styles/couples/c002e.webp", title: "Floral Watercolor", tags: ["romantic"] },
  { src: "/styles/couples/c008e.webp", title: "Elegant Calligraphy Heart", tags: ["romantic"] },
  { src: "/styles/couples/c016e.webp", title: "Starlight Silhouettes", tags: ["romantic"] },
  
  // Modern & Minimalist
  { src: "/styles/couples/c018e.webp", title: "Clean Sans-Serif", tags: ["modern"] },
  { src: "/styles/couples/c019e.webp", title: "Single Line Art", tags: ["modern"] },
  { src: "/styles/couples/c024e.webp", title: "Abstract Watercolor", tags: ["modern", "playful"] },
  { src: "/styles/couples/c020e.webp", title: "Marble & Gold", tags: ["modern", "romantic"] },

  // Playful & Fun
  { src: "/styles/couples/c028e.webp", title: "Kawaii Characters", tags: ["playful"] },
  { src: "/styles/couples/c030e.webp", title: "Pixel art robots", tags: ["playful"] },
  { src: "/styles/couples/c033e.webp", title: "Cat Lovers", tags: ["playful", "modern"] },
  { src: "/styles/couples/c032e.webp", title: "Comic Pop Art", tags: ["playful"] },
];

const galleryTabs = [
    { key: "all", name: "All Styles" },
    { key: "romantic", name: "Romantic & Classic" },
    { key: "modern", name: "Modern & Minimalist" },
    { key: "playful", name: "Playful & Fun" },
];


const CouplesArtLandingPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredStyles = activeTab === "all"
    ? galleryItems
    : galleryItems.filter(item => item.tags.includes(activeTab));

  return (
    <>
      <Head>
        <title>Couples Name Art Generator: Create Custom Romantic Designs</title>
        <meta
          name="description"
          content="Celebrate your love story. Turn your couple names into beautiful, personalized art for anniversaries, weddings, or a special gift. Easy to create, lovely to cherish."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="bg-white dark:bg-gray-900">
        {/* --- Hero Section --- */}
        <section className="text-center py-20 lg:py-32 px-4 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">Where Two Names Become One Art</h1>
            <h2 className="text-xl md:text-2xl mt-4 text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              The perfect way to celebrate your connection. Design beautiful, custom art with both of your names.
            </h2>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Create a unique keepsake for your anniversary, a stunning piece for your wedding, or a heartfelt gift that tells your love story. Our AI makes it simple to design a beautiful couple name painting or calligraphy piece.
            </p>
            <div className="mt-10">
              <Link href="/couples-name-art-generator">
                <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Design Your Couples Art</button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* --- How It Works Section --- */}
        <section className="py-24">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Create Your Couples Art in 3 Simple Steps</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-16">Design a beautiful symbol of your partnership in minutes.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
              <div className="flex flex-col items-center p-6">
                <FiEdit3 className="text-pink-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">1. Enter Your Names</h3>
                <p className="text-gray-600 dark:text-gray-400">Start with both of your names to celebrate your unique connection.</p>
              </div>
              <div className="flex flex-col items-center p-6 border-y md:border-y-0 md:border-x border-gray-200 dark:border-gray-700">
                <FiHeart className="text-pink-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">2. Choose a Romantic Style</h3>
                <p className="text-gray-600 dark:text-gray-400">Browse dozens of styles, from elegant calligraphy to modern designs.</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <FiGift className="text-pink-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">3. Generate Your Keepsake</h3>
                <p className="text-gray-600 dark:text-gray-400">Our AI instantly creates your couple name art, ready to download and frame.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- INTERACTIVE GALLERY SECTION --- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A Style for Every Love Story</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">Whether your style is classic, modern, or playful, find the perfect design to represent your bond.</p>
            
            <div className="flex justify-center flex-wrap gap-2 mb-12">
                {galleryTabs.map(tab => (
                    <button 
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                            activeTab === tab.key 
                            ? 'bg-pink-500 text-white shadow' 
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
                <h2 className="text-3xl md:text-4xl font-bold mb-12">Cherished by Couples Everywhere</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left">
                        <FaQuoteLeft className="text-pink-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;I created a piece with our names and wedding date for my wife for our anniversary. She was moved to tears! It&apos;s now the centerpiece of our living room wall.&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- Mark T.</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left transform lg:scale-105 shadow-xl">
                        <FaQuoteLeft className="text-pink-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;We wanted a unique guest book alternative for our wedding. We generated a beautiful design with our names and had guests sign the matting around it. It&apos;s perfect!&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- Sarah & Liam</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left">
                        <FaQuoteLeft className="text-pink-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;I got a minimalist design for my boyfriend for Valentine&apos;s Day. It&apos;s chic, modern, and looks so much more expensive than it was. A perfect, personal gift.&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- Chloe J.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Final Call to Action Section --- */}
        <section className="bg-pink-600 text-white">
            <div className="container mx-auto text-center px-6 py-20">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Create Your Love Story in Art?</h2>
                <p className="mt-4 text-lg text-pink-100 max-w-xl mx-auto">Design a beautiful symbol of your connection that you can both treasure forever.</p>
                <div className="mt-8">
                    <Link href="/couples-name-art-generator">
                        <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Start Designing Now</button>
                    </Link>
                </div>
            </div>
        </section>
      </main>
    </>
  );
};

export default CouplesArtLandingPage;