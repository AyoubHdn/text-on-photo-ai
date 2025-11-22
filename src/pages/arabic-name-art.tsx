// src/pages/arabic-name-art.tsx

import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { FiPenTool, FiLayers, FiDownload, FiStar, FiGlobe, FiCpu } from "react-icons/fi";

// --- Showcase Gallery Data ---
// Use the paths from your arabicStylesData.ts for consistency
const galleryItems = [
  { src: "/styles/arabic/thuluth-gold.webp", title: "Golden Thuluth" },
  { src: "/styles/arabic/wireframe.webp", title: "Wireframe" },
  { src: "/styles/arabic/diwani-ink.webp", title: "Royal Diwani" },
  { src: "/styles/arabic/gold-3d.webp", title: "3D Gold Luxury" },
  { src: "/styles/arabic/smoke-art.webp", title: "Mystical Smoke" },
  { src: "/styles/arabic/sand-desert.webp", title: "Desert Sand" },
  { src: "/styles/arabic/diamond.webp", title: "Diamond Encrusted" },
  { src: "/styles/arabic/kufic-geo.webp", title: "Geometric Kufic" },
];

const ArabicArtLandingPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>AI Arabic Calligraphy Generator | Islamic Name Art | NameDesignAI</title>
        <meta
          name="description"
          content="Turn your name into a stunning Arabic calligraphy masterpiece using AI. Create Thuluth, Diwani, Kufic, and 3D Arabic art in seconds. Perfect for logos, tattoos, and gifts."
        />
        <meta 
          name="keywords" 
          content="arabic calligraphy generator, ai islamic art, arabic name design, thuluth maker, diwani calligraphy, 3d arabic text, islamic logo maker, arabic tattoo design" 
        />
        <link rel="canonical" href="https://namedesignai.com/arabic-name-art" />
      </Head>

      <main className="bg-white dark:bg-gray-900">
        {/* --- Hero Section --- */}
        <section className="relative text-center py-24 lg:py-32 px-4 overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          {/* Background Decoration */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 dark:opacity-5 pointer-events-none">
             {/* You can add a subtle geometric islamic pattern image here as a background tile */}
          </div>

          <div className="container mx-auto relative z-10">
            {/* --- ADD THIS BUTTON HERE --- */}
            <div className="flex justify-end mb-4">
            <Link href="/ar/arabic-name-art">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all shadow-sm">
                <FiGlobe className="text-blue-600" /> 
                <span>العربية</span>
                </button>
            </Link>
            </div>
            {/* --------------------------- */}
            <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 text-sm font-semibold mb-6 tracking-wide uppercase">
              The #1 AI Calligraphy Tool
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">
              Turn Your Name into an <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600">Arabic Masterpiece</span>
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Blend ancient tradition with modern AI. Create breathtaking Thuluth, Diwani, and 3D Arabic art in seconds.
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/arabic-name-art-generator">
                <button className="px-8 py-4 text-lg font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-xl hover:shadow-2xl hover:-translate-y-1 w-full sm:w-auto">
                  Create Arabic Art Now
                </button>
              </Link>
              <Link href="#gallery">
                <button className="px-8 py-4 text-lg font-bold bg-white text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 w-full sm:w-auto">
                  View Examples
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* --- How It Works Section --- */}
        <section className="py-24 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Calligraphy Made Simple</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">No design skills needed. Just type and create.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center max-w-5xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 mb-6">
                  <FiPenTool className="text-4xl"/>
                </div>
                <h3 className="text-xl font-bold mb-3">1. Type Your Name</h3>
                <p className="text-gray-600 dark:text-gray-400">Enter your name in Arabic. Don&apos;t have an Arabic keyboard? You can copy-paste it!</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mb-6">
                  <FiLayers className="text-4xl"/>
                </div>
                <h3 className="text-xl font-bold mb-3">2. Choose a Style</h3>
                <p className="text-gray-600 dark:text-gray-400">Select from royal Gold, traditional Ink, futuristic Neon, or 3D Luxury styles.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mb-6">
                  <FiDownload className="text-4xl"/>
                </div>
                <h3 className="text-xl font-bold mb-3">3. Download High-Res</h3>
                <p className="text-gray-600 dark:text-gray-400">Get a stunning, high-quality image ready for social media, printing, or framing.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Showcase Gallery Section --- */}
        <section id="gallery" className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Styles That Speak Tradition & Future</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">Explore our diverse collection of AI-generated Arabic art.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {galleryItems.map((style) => (
                    <div key={style.title} className="group relative overflow-hidden rounded-xl shadow-lg cursor-pointer bg-white dark:bg-gray-700">
                        <div className="aspect-square relative">
                            <Image 
                                src={style.src} 
                                alt={style.title} 
                                fill 
                                className="object-cover transition-transform duration-500 group-hover:scale-110" 
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                            <span className="text-white font-bold text-lg">{style.title}</span>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="text-center mt-12">
              <Link href="/arabic-name-art-generator">
                <button className="inline-block px-10 py-4 text-lg font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                  Try These Styles Now
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* --- Use Cases Section --- */}
        <section className="py-24 bg-white dark:bg-gray-900">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">More Than Just a Name</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Discover endless possibilities for your Arabic designs.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Card 1 */}
                    <div className="p-8 border rounded-2xl hover:shadow-xl transition duration-300 dark:border-gray-700">
                        <FiStar className="text-4xl text-amber-500 mb-4" />
                        <h3 className="text-2xl font-bold mb-3">Logos & Branding</h3>
                        <p className="text-gray-600 dark:text-gray-400">Create a unique, culturally rich logo for your business or personal brand using geometric Kufic or flowing Thuluth scripts.</p>
                    </div>
                    {/* Card 2 */}
                    <div className="p-8 border rounded-2xl hover:shadow-xl transition duration-300 dark:border-gray-700">
                        <FiGlobe className="text-4xl text-blue-500 mb-4" />
                        <h3 className="text-2xl font-bold mb-3">Social Media</h3>
                        <p className="text-gray-600 dark:text-gray-400">Stand out on Instagram, TikTok, and Twitter with a profile picture that blends your identity with stunning artistic flair.</p>
                    </div>
                    {/* Card 3 */}
                    <div className="p-8 border rounded-2xl hover:shadow-xl transition duration-300 dark:border-gray-700">
                        <FiCpu className="text-4xl text-purple-500 mb-4" />
                        <h3 className="text-2xl font-bold mb-3">Tattoos & Decor</h3>
                        <p className="text-gray-600 dark:text-gray-400">Design meaningful tattoo concepts or print high-resolution art to frame in your living room or office.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Section --- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
            <div className="container mx-auto px-4 max-w-3xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold mb-2">Do I need an Arabic keyboard?</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            No! Our AI is smart enough to understand English names (e.g., typing &quot;Ayoub&ldquo;) and automatically convert them into stunning Arabic calligraphy. You can type in English or Arabic.
                        </p>                   
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold mb-2">Can I use the images for a logo?</h3>
                        <p className="text-gray-600 dark:text-gray-300">Yes! The images you generate are yours to use for personal or commercial projects, including logos, branding, and merchandise.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold mb-2">What AI model do you use?</h3>
                        <p className="text-gray-600 dark:text-gray-300">We use advanced AI models specifically fine-tuned for artistic rendering and calligraphy to ensure high-quality, intricate results.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Final CTA --- */}
        <section className="py-24 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-center">
            <div className="container mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Create Your Masterpiece?</h2>
                <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">Join thousands of users creating stunning Islamic art today.</p>
                <Link href="/arabic-name-art-generator">
                    <button className="px-10 py-5 text-lg font-bold bg-white text-blue-700 rounded-full hover:bg-blue-50 transition shadow-2xl transform hover:-translate-y-1">
                        Generate Arabic Art Now
                    </button>
                </Link>
            </div>
        </section>
      </main>
    </>
  );
};

export default ArabicArtLandingPage;