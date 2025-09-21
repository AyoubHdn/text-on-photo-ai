// pages/name-art/[name].tsx
import { type GetStaticPaths, type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { popularNames } from "~/lib/names"; // Your master blueprint
import { FiEdit3, FiHeart, FiDownload } from "react-icons/fi"; // Icons for "How it works"

// Define the type for the data our page will receive
interface ShowcaseData {
  [niche: string]: { src: string; }[];
}

interface NameArtPageProps {
  name: string;
  niches: string[];
  showcaseData: ShowcaseData;
  otherStyles: string[];
}

const NameArtPage: NextPage<NameArtPageProps> = ({ name, niches, showcaseData, otherStyles }) => {
  return (
    <>
      <Head>
        <title>{name} Name Art: {niches.join(', ')} & More Styles</title>
        <meta
          name="description"
          content={`Explore beautiful, hand-picked examples of ${name} name art in styles like ${niches.join(', ')}. Generate your own custom design in seconds.`}
        />
      </Head>
      <main className="bg-white dark:bg-gray-900">
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-800">
            <h1 className="text-4xl md:text-5xl font-bold">{name} Name Art: Create Your Custom Design</h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Bring the name &quot;{name}&quot; to life with our AI generator. Below is a showcase of popular styles. Click the button to start creating your own unique masterpiece!
            </p>
            <div className="mt-10">
                <Link href="/name-art-generator">
                <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Start Creating Art for {name}</button>
                </Link>
            </div>
        </section>

        <div className="container mx-auto px-8 py-16 space-y-16">
          {Object.entries(showcaseData).map(([niche, styles]) => (
            <section key={niche} className="text-center">
              <h2 className="text-3xl font-bold mb-8">{niche} Styles for {name}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 lg:px-40 gap-4">
                {styles.map(style => (
                  <div key={style.src} className="group relative overflow-hidden rounded-lg shadow-lg">
                    <Image 
                      src={style.src} 
                      alt={`${name} in ${niche} style`} 
                      width={512} 
                      height={512} 
                      className="w-full h-auto aspect-square object-cover"
                      unoptimized={true}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* --- START: NEW "How It Works" Section --- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-16">Making Your {name} Name Art is Easy</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
              <div className="flex flex-col items-center p-6">
                <FiEdit3 className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">1. Choose a Style</h3>
                <p className="text-gray-600 dark:text-gray-400">Pick any style from our gallery. The name &quot;{name}&quot; will be automatically ready for you in our generator.</p>
              </div>
              <div className="flex flex-col items-center p-6 border-y md:border-y-0 md:border-x border-gray-200 dark:border-gray-700">
                <FiHeart className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">2. Generate Your Design</h3>
                <p className="text-gray-600 dark:text-gray-400">Select your preferred quality and click &quot;Generate&quot; to see your unique creation in seconds.</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <FiDownload className="text-blue-500 text-5xl mb-4"/>
                <h3 className="text-xl font-semibold mb-2">3. Download Your Art</h3>
                <p className="text-gray-600 dark:text-gray-400">Save your high-resolution image, ready for printing, sharing, or using as a profile picture.</p>
              </div>
            </div>
          </div>
        </section>
        {/* --- END: NEW "How It Works" Section --- */}
        
        {/* --- THE NEW, CORRECT "OTHER STYLES" SECTION --- */}
        <section className="container mx-auto px-8 py-16">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-8">More Name Art Ideas for {name}</h2>
                <div className="flex flex-wrap justify-center gap-3">
                    {otherStyles.map(styleName => (
                        <Link key={styleName} href={`/name-art-generator?name=${name}#${styleName}`}>
                            <span className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-500 hover:text-white transition-colors">
                                {styleName} for {name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
        {/* --- END: NEW "Similar Styles" Section --- */}
        
        {/* --- START: NEW "Credits" Section --- */}
        <section className="py-24 bg-gray-50 dark:bg-gray-800">
            <div className="container mx-auto px-8 text-center max-w-3xl">
                <h2 className="text-3xl font-bold">Simple, Credit-Based Creation</h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                    Creating your {name} name art is affordable and straightforward. Our standard designs cost just 1 credit, with higher-quality &quot;Optimized&quot; versions available for 4 credits. Get started with a free credit or choose a pack that fits your needs.
                </p>
                <div className="mt-8">
                    <Link href="/buy-credits">
                        <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">View Pricing & Buy Credits</button>
                    </Link>
                </div>
            </div>
        </section>
        {/* --- END: NEW "Credits" Section --- */}

        {/* --- START: THE CRITICAL ON-PAGE SEO TEXT --- */}
        <section className="container mx-auto px-8 py-16 text-gray-700 dark:text-gray-300">
            <div className="max-w-3xl mx-auto space-y-8 bg-gray-50 dark:bg-gray-800 p-8 rounded-lg">
                <h2 className="text-3xl font-bold">Designing Your {name} Name Art</h2>
                <p className="text-lg leading-relaxed">
                    Finding the perfect design for the name **{name}** is a creative journey. Whether you&apos;re looking for a personalized gift, a unique logo, or a custom piece of decor, our AI name art generator offers endless possibilities. The styles you see above are just a starting point, hand-picked to fit the classic feel of the name {name}.
                </p>
                <h3 className="text-2xl font-semibold">Popular Styles for {name} Name Art</h3>
                <p className="text-lg leading-relaxed">
                    Many users creating art for **{name}** are drawn to specific themes. For a modern and edgy look, **{name} graffiti name art** is a fantastic choice, perfect for social media profiles or a cool poster. For something more timeless and elegant, **{name} calligraphy name art** provides a beautiful, flowing script that works wonderfully for gifts and prints.
                </p>
                <h3 className="text-2xl font-semibold">How to Create Your {name} Name Art</h3>
                <p className="text-lg leading-relaxed">
                    Creating your design is simple. Just click the button below to go to our generator, where the name &quot;{name}&quot; will already be filled in for you. From there, you can experiment with any style in our library, adjust colors, and find the perfect look. The final image is a high-resolution file, ready to download, print, and share.
                </p>
            </div>
        </section>

        <section className="relative bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white py-24">
            <div className="container mx-auto text-center px-4">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Create Your Own {name} Masterpiece?</h2>
                <div className="mt-8">
                    <Link href={`/name-art-generator`}>
                        <button className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                            Generate Art with the Name &apos;{name}&apos;!
                        </button>
                    </Link>
                </div>
            </div>
        </section>
      </main>
    </>
  );
};

// eslint-disable-next-line @typescript-eslint/require-await
export const getStaticPaths: GetStaticPaths = async () => {
  const paths = popularNames.map((item) => ({
    params: { name: item.name.toLowerCase() },
  }));
  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps = (context) => {
  const nameParam = context.params?.name as string;
  const nameBlueprint = popularNames.find(p => p.name.toLowerCase() === nameParam);

  if (!nameBlueprint) {
    return { notFound: true };
  }

  const showcaseData: ShowcaseData = {};

  // Loop through the curated niches for this name (e.g., "Cute", "Fantasy")
  nameBlueprint.niches.forEach(nicheName => {
    // This is the key: it gets the manually picked image list from the blueprint
    const imagesForNiche = nameBlueprint.images[nicheName as keyof typeof nameBlueprint.images];
    if (imagesForNiche) {
      // Build the full image path for each image
      showcaseData[nicheName] = imagesForNiche.map(imageFile => ({
        src: `/styles/name-art/${nicheName}/${imageFile}`,
      }));
    }
  });

  return {
    props: {
      name: nameBlueprint.name,
      niches: nameBlueprint.niches,
      showcaseData,
      otherStyles: nameBlueprint.otherStyles, 
    },
    revalidate: 60 * 60 * 24, // Re-generate the page once a day
  };
};

export default NameArtPage;