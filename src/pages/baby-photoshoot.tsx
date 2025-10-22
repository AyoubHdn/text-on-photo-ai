// src/pages/ai-photo-gifts/baby.tsx

import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { FiUpload, FiStar, FiDownload, FiGift, FiCalendar, FiHome } from "react-icons/fi";

// --- Data for the Showcase Gallery ---
// TODO: Replace these with your absolute best generated images. This is your most powerful selling tool.
const galleryItems = [
  { src: "/images/photo-styles/baby/1-month-flowers.webp", title: "Floral One Month" },
  { src: "/images/photo-styles/baby/astronaut.webp", title: "Little Astronaut" },
  { src: "/images/photo-styles/baby/12-months-cake.webp", title: "First Birthday Smash" },
  { src: "/images/photo-styles/baby/watercolor.webp", title: "Watercolor Portrait" },
  { src: "/images/photo-styles/baby/newborn-moon.webp", title: "Sleeping on the Moon" },
  { src: "/images/photo-styles/baby/superhero.webp", title: "Superhero Baby" },
  { src: "/images/photo-styles/baby/6-months-chef.webp", title: "Little Baker" },
  { src: "/images/photo-styles/baby/princess.webp", title: "Fairytale Princess" },
];

const AIBabyPhotoshootLandingPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>AI Baby Photoshoot Generator | Create Custom Milestone Photos</title>
        <meta
          name="description"
          content="Generate professional AI baby photoshoots in seconds. Create themed milestone pictures, newborn announcements, and unique gifts without a photographer. Try it now!"
        />
        <meta 
          name="keywords" 
          content="ai baby photoshoot, ai baby generator, monthly baby pictures, ai newborn photos, custom birth announcement, 1st birthday photo ideas, baby milestone photos" 
        />
        <link rel="canonical" href="https://www.namedesignai.com/baby-photoshoot" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="bg-white dark:bg-gray-900">
        {/* --- Hero Section --- */}
        <section className="text-center py-20 lg:py-28 px-4 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
              Create AI Baby Photoshoots With Ease
            </h1>
            <h2 className="text-xl md:text-2xl mt-4 text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Generate studio-quality baby photos for every milestone, without leaving home.
            </h2>
            <div className="mt-10">
              <Link href="/baby-photoshoot-generator">
                <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Upload Photo & Create Now
                </button>
              </Link>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Get started in seconds. No setup required.</p>
            </div>
          </div>
        </section>
        
        {/* --- How It Works Section --- */}
        <section className="py-24">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-16">How to Create Your AI Photoshoot</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
              <div className="flex flex-col items-center p-6">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
                  <FiUpload className="text-blue-500 text-3xl"/>
                </div>
                <h3 className="text-xl font-semibold mb-2">Step 1: Upload Photo</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose any photo of your baby from your phone or computer.</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
                  <FiStar className="text-blue-500 text-3xl"/>
                </div>
                <h3 className="text-xl font-semibold mb-2">Step 2: Choose a Theme</h3>
                <p className="text-gray-600 dark:text-gray-400">Select from dozens of creative styles for milestones, holidays, and fun.</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4">
                  <FiDownload className="text-blue-500 text-3xl"/>
                </div>
                <h3 className="text-xl font-semibold mb-2">Step 3: Download & Share</h3>
                <p className="text-gray-600 dark:text-gray-400">Your custom photoshoot is ready instantly to download and cherish.</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Showcase Gallery Section (Inspired by LightX "Custom Shoots") --- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A Style for Every Precious Moment</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">From their first month to their first birthday, and all the fun in between.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {galleryItems.map((style) => (
                    <div key={style.src} className="group relative overflow-hidden rounded-lg shadow-lg">
                        <Image src={style.src} alt={style.title} width={512} height={512} className="w-full h-full object-cover aspect-square transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-white text-lg font-semibold text-center px-2">{style.title}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-12">
              <Link href="/baby-photoshoot-generator">
                <button className="inline-block px-8 py-3 text-md font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg">
                  Explore All Styles
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* --- Use Cases / Benefits Section --- */}
        <section className="py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold">Never Miss a Moment</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">Create beautiful, professional-quality keepsakes without the cost or hassle of a photographer.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-10 text-center">
                    <div className="flex flex-col items-center">
                        <FiCalendar className="text-5xl text-blue-500 mb-4"/>
                        <h3 className="text-2xl font-bold mb-2">Celebrate Milestones</h3>
                        <p className="text-gray-600 dark:text-gray-400">Effortlessly create monthly photos, first birthday announcements, and holiday cards that will wow your family and friends.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <FiGift className="text-5xl text-blue-500 mb-4"/>
                        <h3 className="text-2xl font-bold mb-2">Create the Perfect Gift</h3>
                        <p className="text-gray-600 dark:text-gray-400">Turn a simple phone picture into a stunning, artistic portrait. The ideal personalized gift for grandparents, family, and loved ones.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <FiHome className="text-5xl text-blue-500 mb-4"/>
                        <h3 className="text-2xl font-bold mb-2">Decorate Your Home</h3>
                        <p className="text-gray-600 dark:text-gray-400">Generate beautiful, print-ready art for your baby&apos;s nursery or your family&apos;s living room. Preserve your memories in a unique and creative way.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FAQ Section --- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
            <div className="container mx-auto px-4 max-w-4xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Your Questions, Answered</h2>
                <div className="space-y-8">
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Is the AI-generated photography safe for my baby?</h3>
                        <p className="text-gray-600 dark:text-gray-400">Absolutely. Our process is 100% safe as it involves no physical setup or direct contact. You use a photo you&apos;ve already taken in the comfort of your home. We also prioritize data privacy and security, ensuring a worry-free experience.</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">What kind of photos should I upload?</h3>
                        <p className="text-gray-600 dark:text-gray-400">For the best results, use a clear, well-lit photo where your baby&apos;s face is easily visible. Simple photos taken with your smartphone work perfectly! The AI is designed to focus on your baby&apos;s unique features.</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Do I need to be a professional photographer?</h3>
                        <p className="text-gray-600 dark:text-gray-400">Not at all! Our tool is designed for everyone. If you can upload a photo, you can create a masterpiece. We handle all the complex artistic work for you.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Final Call to Action Section --- */}
        <section className="text-center py-20 lg:py-24 px-4 bg-blue-600 text-white">
            <div className="container mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Create a Magical Photoshoot?</h2>
                <p className="text-xl mt-4 max-w-2xl mx-auto text-blue-100">
                  Turn a simple photo into a cherished memory. Get started now and see what our AI can create for your little one.
                </p>
                <div className="mt-10">
                  <Link href="/baby-photoshoot-generator">
                    <button className="inline-block px-8 py-4 text-lg font-bold bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition shadow-2xl hover:shadow-none transform hover:-translate-y-1">
                      Start Your Baby Photoshoot
                    </button>
                  </Link>
                </div>
            </div>
        </section>
      </main>
    </>
  );
};

export default AIBabyPhotoshootLandingPage;