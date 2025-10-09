// src/pages/ai-photo-gifts/index.tsx

import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { FiUpload, FiDownload, FiGift, FiUser, FiHeart } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";

// --- Data for the Showcase Gallery ---
// TODO: Replace these with your best generated images for a stunning first impression.
const galleryItems = [
  { src: "/images/photo-styles/men/professional/ceo.webp", title: "Professional Headshot" },
  { src: "/images/photo-styles/women/artistic/fairy.webp", title: "Fantasy Art" },
  { src: "/images/photo-styles/men/cinematic/dark-knight.webp", title: "Cinematic Hero" },
  { src: "/images/photo-styles/women/bridal/rose-bouquet.webp", title: "Bridal Portrait" },
  { src: "/images/photo-styles/men/fashion/rolls-royce.webp", title: "Luxury Lifestyle" },
  { src: "/images/photo-styles/women/natural/satin-sunset.webp", title: "Golden Hour Glow" },
  { src: "/images/photo-styles/men/creative/out-of-phone.webp", title: "Creative Concept" },
  { src: "/images/photo-styles/women/fashion/butter-yellow.webp", title: "Vogue Editorial" }, // Assuming you have a placeholder
];

const AIPortraitLandingPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>AI Portrait Generator | Turn Photos into Art | NameDesignAI</title>
        <meta
          name="description"
          content="Create stunning, personalized portraits with our AI Portrait Generator. Turn any photo into a masterpiece in seconds. Perfect for unique gifts, social media, and more."
        />
        <meta 
          name="keywords" 
          content="ai portrait generator, turn photo into art, ai photo generator, custom photo gifts, personalized portrait from photo, ai headshot generator, photo to painting ai" 
        />
        <link rel="canonical" href="https://www.namedesignai.com/ai-image-generator" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="bg-white dark:bg-gray-900">
        {/* --- Hero Section --- */}
        <section className="text-center py-20 lg:py-32 px-4 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
              AI Portrait Generator
            </h1>
            <h2 className="text-xl md:text-2xl mt-4 text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Turn Your Favorite Photos into Timeless Works of Art.
            </h2>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Create stunning, personalized portraits from any photo. The perfect gift for loved ones, or a unique new profile picture for you.
            </p>
            <div className="mt-10">
              <Link href="/ai-portrait-generator">
                <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Create Your AI Portrait Now
                </button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* --- "As Seen On" / Trust Bar --- */}
        <div className="py-8 bg-white dark:bg-gray-900">
            <div className="container mx-auto">
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 font-semibold tracking-wider">A SIMPLE, POWERFUL TOOL FOR CREATING LASTING MEMORIES</p>
            </div>
        </div>

        {/* --- How It Works Section --- */}
        <section className="py-24">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Create Your Masterpiece in 3 Simple Steps</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-16">An effortless process for breathtaking results.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
              <div className="flex flex-col items-center p-6">
                <FiUpload className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">1. Upload a Photo</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose any photo from your device. Clear, well-lit photos work best!</p>
              </div>
              <div className="flex flex-col items-center p-6 border-y md:border-y-0 md:border-x border-gray-200 dark:border-gray-700">
                <HiSparkles className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">2. Pick a Style You Love</h3>
                <p className="text-gray-600 dark:text-gray-400">Select from dozens of artistic styles—from cinematic to classic painting.</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <FiDownload className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">3. Generate & Download</h3>
                <p className="text-gray-600 dark:text-gray-400">Our AI creates your portrait instantly, ready to share, print, and cherish.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Showcase Gallery Section --- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A Style for Every Story</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">Discover the endless possibilities. What will you create today?</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {galleryItems.map((style) => (
                    <div key={style.src} className="group relative overflow-hidden rounded-lg shadow-lg cursor-pointer">
                        <Image src={style.src} alt={style.title} width={512} height={512} className="w-full h-full object-cover aspect-square transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-white text-lg font-semibold text-center px-2">{style.title}</span>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </section>

        {/* --- Use Cases / For Who? Section --- */}
        <section className="py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">Endless Possibilities, One Powerful Tool</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">From heartfelt gifts to a stunning new profile picture.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-10 text-center">
                    <div className="flex flex-col items-center">
                        <FiGift className="text-5xl text-blue-500 mb-4"/>
                        <h3 className="text-2xl font-bold mb-2">The Perfect Personalized Gift</h3>
                        <p className="text-gray-600 dark:text-gray-400">Turn a cherished photo into a stunning work of art. The ideal gift for birthdays, anniversaries, holidays, or just to say &quot;I love you.&quot;</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <FiUser className="text-5xl text-blue-500 mb-4"/>
                        <h3 className="text-2xl font-bold mb-2">Elevate Your Social Profile</h3>
                        <p className="text-gray-600 dark:text-gray-400">Stand out online with a unique AI-generated headshot or profile picture. Create professional, artistic, or fun versions of yourself in seconds.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <FiHeart className="text-5xl text-blue-500 mb-4"/>
                        <h3 className="text-2xl font-bold mb-2">Create Cherished Memories</h3>
                        <p className="text-gray-600 dark:text-gray-400">Transform photos of your children, pets, or favorite places into beautiful art for your home. Preserve your memories in a new and creative way.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Section --- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
            <div className="container mx-auto px-4 max-w-4xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                <div className="space-y-8">
                    <div>
                        <h3 className="text-xl font-semibold mb-2">What kind of photos work best?</h3>
                        <p className="text-gray-600 dark:text-gray-400">For the best results, use a clear, well-lit photo where the face is easily visible. High-resolution photos from your phone work perfectly!</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Is it easy to use?</h3>
                        <p className="text-gray-600 dark:text-gray-400">Absolutely. We&apos;ve designed the process to be as simple as possible. Just upload your photo, click the style you like, and our AI does the rest. No technical skills required.</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">How do credits work?</h3>
                        <p className="text-gray-600 dark:text-gray-400">Each portrait generation costs a small number of credits. You receive free credits when you sign up, and you can easily purchase more if you need them. It&apos;s a simple, pay-as-you-go system.</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Can I add text to my portrait?</h3>
                        <p className="text-gray-600 dark:text-gray-400">Yes! Our generator includes an optional field to add a name, date, or short message. The AI will cleverly integrate the text into the chosen artistic style for a seamless look.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Final Call to Action Section --- */}
        <section className="text-center py-20 lg:py-24 px-4 bg-blue-600 text-white">
            <div className="container mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Create Your Masterpiece?</h2>
                <p className="text-xl mt-4 max-w-2xl mx-auto text-blue-100">
                  Turn your memories into art. Get started now and see what our AI can create for you.
                </p>
                <div className="mt-10">
                  <Link href="/ai-portrait-generator">
                    <button className="inline-block px-8 py-4 text-lg font-bold bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition shadow-2xl hover:shadow-none transform hover:-translate-y-1">
                      Start AI Portrait Generator
                    </button>
                  </Link>
                </div>
            </div>
        </section>
      </main>
    </>
  );
};

export default AIPortraitLandingPage;