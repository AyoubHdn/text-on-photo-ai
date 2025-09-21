import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { Button } from "~/component/Button";
import { FaQuoteLeft } from "react-icons/fa";
import { FiEdit3, FiHeart, FiDownload } from "react-icons/fi"; 

// --- Data for the Curated "Name Art" Gallery ---
const galleryItems = [
  { src: "/styles/name-art/Cute/s34e.webp", title: "3D Floral", tags: ["artistic", "playful"] },
  { src: "/styles/name-art/Graffiti/s118e.webp", title: "Graffiti Art", tags: ["modern", "playful"] },
  { src: "/styles/name-art/Landscapes/s251e.webp", title: "Carved Wood", tags: ["artistic"] },
  { src: "/styles/name-art/Gaming/s18e.webp", title: "Neon Sign", tags: ["modern"] },
  { src: "/styles/name-art/Abstract/s184e.webp", title: "Golden Glitter", tags: ["playful", "artistic"] },
  { src: "/styles/name-art/Abstract/s179e.webp", title: "Abstract Ink", tags: ["artistic", "modern"] },
  { src: "/styles/name-art/Floral/s5e.webp", title: "Watercolor Flowers", tags: ["artistic"] },
  { src: "/styles/name-art/Cute/s87e.webp", title: "Pastel Clouds", tags: ["playful"] },
  { src: "/styles/name-art/Typography/s13e.webp", title: "Gold on Marble", tags: ["modern", "artistic"] },
  { src: "/styles/name-art/Vintage/s259e.webp", title: "Vintage Letter", tags: ["artistic"] },
  { src: "/styles/name-art/Cute/s92e.webp", title: "Heart Balloons", tags: ["playful"] },
  { src: "/styles/name-art/Christian/s276e.webp", title: "Celtic Knotwork", tags: ["artistic"] },
];

const galleryTabs = [
    { key: "all", name: "All Styles" },
    { key: "artistic", name: "Artistic" },
    { key: "modern", name: "Modern" },
    { key: "playful", name: "Playful" },
];


const NameArtLandingPage: NextPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredStyles = activeTab === "all"
    ? galleryItems
    : galleryItems.filter(item => item.tags.includes(activeTab));

  return (
    <>
      <Head>
        <title>AI Name Art Generator: Create Custom Designs Online</title>
        <meta
          name="description"
          content="Bring your name to life with our AI Name Art Generator. Create beautiful, custom name art from stunning styles for logos, decor, or social media. Try it free!"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="bg-white dark:bg-gray-900">
        {/* --- Hero Section --- */}
        <section className="text-center py-20 lg:py-32 px-4 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">Transform Your Name into a Work of Art</h1>
            <h2 className="text-xl md:text-2xl mt-4 text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              The Ultimate AI Name Art Generator. Instantly create stunning, personalized designs from any text.
            </h2>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Unleash your creativity! Whether you&apos;re designing a unique logo, a special piece for your home, or a fun profile picture, our AI tool makes it easy to turn your name into a masterpiece.
            </p>
            <div className="mt-10">
              {/* TODO: This link must point to your newly renamed generator page */}
              <Link href="/name-art-generator">
                <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Start Creating Name Art</button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* --- How It Works Section --- */}
        <section className="py-24">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Create Your Design in Seconds</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-16">A simple process for stunning results.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
              <div className="flex flex-col items-center p-6">
                <FiEdit3 className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">1. Enter Your Text</h3>
                <p className="text-gray-600 dark:text-gray-400">Type any name, word, or initials you want to transform.</p>
              </div>
              <div className="flex flex-col items-center p-6 border-y md:border-y-0 md:border-x border-gray-200 dark:border-gray-700">
                <FiHeart className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">2. Pick a Style You Love</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose from dozens of creative styles, from graffiti to elegant calligraphy.</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <FiDownload className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">3. Generate Your Art</h3>
                <p className="text-gray-600 dark:text-gray-400">Our AI creates your design instantly, ready to download and share.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- INTERACTIVE GALLERY SECTION --- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore a World of Creative Styles</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">Find the perfect aesthetic for your name, brand, or project.</p>
            
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
                <h2 className="text-3xl md:text-4xl font-bold mb-12">See What Our Users Are Creating</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left">
                        <FaQuoteLeft className="text-blue-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;Finally, a name art maker that&apos;s actually creative! I designed a new logo for my Etsy shop in about five minutes. The quality is fantastic.&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- Maria S.</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left transform lg:scale-105 shadow-xl">
                        <FaQuoteLeft className="text-blue-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;I use this for all my social media profiles. It&apos;s so much fun to see my name in different styles. The graffiti and abstract ones are my favorite.&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- David L.</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-left">
                        <FaQuoteLeft className="text-blue-400 text-3xl mb-4" />
                        <p className="italic text-gray-600 dark:text-gray-300 mb-6">&quot;I made art with my kids&apos; names for their playroom. They had so much fun picking out the styles with me. A great and simple tool for creative projects.&quot;</p>
                        <p className="font-semibold text-gray-900 dark:text-white">- Carol P.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Final Call to Action Section --- */}
        <section className="relative bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white py-24">
            <div className="relative container mx-auto text-center px-4">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to See Your Name in a New Light?</h2>
                <p className="mt-4 text-lg text-gray-700 dark:text-gray-300 max-w-xl mx-auto">Unleash your creativity and start designing your free name art now.</p>
                <div className="mt-8">
                    {/* TODO: This link must point to your newly renamed generator page */}
                    <Link href="/name-art-generator">
                        <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Start Name Art Generator</button>
                    </Link>
                </div>
            </div>
        </section>
      </main>
    </>
  );
};

export default NameArtLandingPage;