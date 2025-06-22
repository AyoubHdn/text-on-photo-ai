import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/component/Button";
import { FaQuoteLeft } from "react-icons/fa";
import { FiGift, FiHeart, FiStar } from "react-icons/fi"; // Icons for "How it works"

// --- DATA STRUCTURE FOR THE NEW INTERACTIVE GALLERY ---
// We use tags to filter styles, which is much more flexible and scalable.
const galleryItems = [
  { src: "/styles/s114e.webp", title: "Flowers letters", tags: ["birthday", "family", "thoughtful"] },
  { src: "/styles/s63e.webp", title: "3D Cute Bear", tags: ["anniversary", "thoughtful"] },
  { src: "/styles/s57e.webp", title: "Heart Balloons", tags: ["anniversary", "family"] },
  { src: "/styles/s276e.webp", title: "Celtic Knotwork", tags: ["family", "thoughtful"] },
  { src: "/styles/s274e.webp", title: "Stained Glass Grace", tags: ["family", "thoughtful"] },
  { src: "/styles/s70e.webp", title: "Golden Glitter", tags: ["birthday"] },
  { src: "/styles/s42e.webp", title: "Baby Mobile", tags: ["new-baby", "family"] },
  { src: "/styles/s62e.webp", title: "Elegant Gold on Marble", tags: ["anniversary", "thoughtful"] },
  { src: "/styles/s73e.webp", title: "Pastel Sky & Clouds", tags: ["new-baby"] },
  { src: "/styles/s176e.webp", title: "Vintage Paper & Wax Seal", tags: ["family", "thoughtful"] },
  { src: "/styles/s43e.webp", title: "Happy Birthday Cake", tags: ["birthday", "thoughtful"] },
  { src: "/styles/s55e.webp", title: "Majestic Pink Butterfly", tags: ["anniversary", "family"] },
  // Add more styles here with their respective tags
];

const galleryTabs = [
    { key: "all", name: "All Gifts" },
    { key: "anniversary", name: "Anniversaries" },
    { key: "birthday", name: "Birthdays" },
    { key: "new-baby", name: "New Baby" },
    { key: "family", name: "For Family" },
    { key: "thoughtful", name: "Just Because" },
];


const PersonalizedGiftsPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredStyles = activeTab === "all"
    ? galleryItems
    : galleryItems.filter(item => item.tags.includes(activeTab));

  return (
    <>
      <Head>
        <title>Personalized Gifts: Create Beautiful Custom Art in Seconds</title>
        <meta
          name="description"
          content="Give a gift they'll truly cherish. Turn any name, date, or special word into beautiful, personalized art in just a few clicks. The perfect thoughtful gift."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="bg-white dark:bg-gray-900">
        {/* --- Hero Section --- */}
        <section className="text-center py-20 lg:py-32 px-4 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">Gifts That Tell Their Story</h1>
            <h2 className="text-xl md:text-2xl mt-4 text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Turn any name, date, or meaningful word into beautiful, one-of-a-kind art in seconds.
            </h2>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Some gifts are opened, and others are felt. Our AI-powered tool helps you create a truly personal work of art that captures a special memory, celebrates a unique personality, or honors a family bond.
            </p>
            <div className="mt-10">
              {/* TODO: Update this link to your actual generator page */}
              <Link href="/personalized-gifts-generator">
                <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Create Your Gift Now</button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* --- How It Works Section (Redesigned) --- */}
        <section className="py-24">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Masterpiece in Three Simple Steps</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-16">Creating a memorable gift has never been easier.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center p-6">
                <FiGift className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">1. Add Your Personal Touch</h3>
                <p className="text-gray-600 dark:text-gray-400">Start with a special name, a cherished date, or a word that tells your story.</p>
              </div>
              <div className="flex flex-col items-center p-6 border-y md:border-y-0 md:border-x border-gray-200 dark:border-gray-700">
                <FiHeart className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">2. Choose The Perfect Style</h3>
                <p className="text-gray-600 dark:text-gray-400">Browse our beautiful library of designs to find the look that matches their personality.</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <FiStar className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">3. Create Your Art</h3>
                <p className="text-gray-600 dark:text-gray-400">In seconds, your custom design is ready to be saved, shared, or printed for framing.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- INTERACTIVE GALLERY SECTION (Replaces "Inspiration" and "Perfect For") --- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Find the Perfect Gift for Any Occasion</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">Select a category to discover styles curated for your special event.</p>
            
            {/* Tab Navigation */}
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

            {/* Filtered Image Grid */}
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
                <h2 className="text-3xl md:text-4xl font-bold mb-12">Loved by Thoughtful Gift-Givers Like You</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Testimonial 1 */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left">
                        <FaQuoteLeft className="text-blue-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;I made a beautiful piece with my granddaughter’s name for her bedroom. She adores it, and I couldn&apos;t believe how easy it was to create something so professional-looking.&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- Susan M.</p>
                    </div>
                    {/* Testimonial 2 */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left transform lg:scale-105 shadow-xl">
                        <FaQuoteLeft className="text-blue-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;I was struggling to find a unique anniversary gift for my husband. I created an art piece with our wedding date, and he was so touched. It’s now hanging in our living room. Thank you!&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- Pamela R.</p>
                    </div>
                    {/* Testimonial 3 */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left">
                        <FaQuoteLeft className="text-blue-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;My best friend is impossible to shop for! I used her favorite flower style to create a design with her name. She said it was the most thoughtful gift she received all year.&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- Brenda K.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Final Call to Action Section --- */}
        <section className="relative bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white py-24">
            <div className="relative container mx-auto text-center px-4">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Give a Gift They&apos;ll Never Forget?</h2>
                <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 max-w-xl mx-auto">Start creating a beautiful, personal piece of art in just a few clicks.</p>
                <div className="mt-8">
                    {/* TODO: Update this link to your actual generator page */}
                    <Link href="/personalized-gifts-generator">
                        <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Start Designing Now</button>
                    </Link>
                </div>
            </div>
        </section>
      </main>
    </>
  );
};

export default PersonalizedGiftsPage;