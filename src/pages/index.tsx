import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from 'next/link';
import { useSession, signIn } from "next-auth/react";
import { Button } from "~/component/Button";

// Main Component
const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Name Design AI – Create Custom Name Art & Professional Logos</title>
        <meta
          name="description"
          content="Transform your words into stunning art. Create personalized name art, meaningful gifts, and professional logos with the power of AI. Simple, fast, and beautiful."
        />
        <meta name="keywords" content="name art generator, personalized gifts, custom logo maker, AI design tool" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg-white dark:bg-gray-900">
        <HeroBanner />
        <ProductsSection />
        <WhyChooseUsSection />
        <UserFeedbackSection />
        <FinalCTASection />
      </main>
    </>
  );
};

// --- Page Sections (Components) ---

function HeroBanner() {
  const handleScrollToProducts = () => {
    document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 px-8 py-20 items-center">
        <div className="flex flex-col gap-6 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">Where Your Words Become Art</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Instantly create beautiful, one-of-a-kind designs from any name, text, or idea. Perfect for personalized gifts, unique logos, and stunning home decor.
          </p>
          <div className="mt-4">
            <Button
              onClick={handleScrollToProducts}
              className="px-10 py-4 text-lg"
              id="try-it-free-button-heroBanner"
            >
              Explore Our Designs
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
          <Image
            src="/banner.png" // This image should be high quality
            alt="A collage of beautiful name art and logo designs"
            width={500}
            height={400}
            priority // Load this image first
            className="rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  // --- STRATEGIC CHANGE: This array now drives the main product offerings ---
  const products = [
    {
      title: "Personalized Gifts",
      description: "Create heartfelt art for anniversaries, birthdays, and special occasions they'll never forget.",
      href: "/personalized-gifts", // Links to the new LANDING PAGE
      image: "/icons/gift-icon.png", // Suggest creating new, high-quality icons
      id: "product-personalized-gifts"
    },
    {
      title: "Name Art",
      description: "Turn your name into a masterpiece with creative styles, from graffiti to elegant calligraphy.",
      href: "/name-art", // Links to the new LANDING PAGE
      image: "/icons/name-art.png",
      id: "product-name-art"
    },
    {
      title: "Professional Logos",
      description: "Design a unique, high-quality logo for your business, brand, or project in minutes.",
      href: "/pro-logo", // This will eventually be a landing page too
      image: "/icons/pro-logo.png",
      id: "product-pro-logo"
    },
  ];

  return (
    <section id="products-section" className="py-24">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold">What Do You Want to Create?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
            Choose a category to start your creative journey. Each is packed with unique styles tailored to your needs.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link key={product.href} href={product.href} id={product.id} className="group block">
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg h-full flex flex-col items-center text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <Image
                  src={product.image}
                  alt={`${product.title} icon`}
                  width={80}
                  height={80}
                  className="mb-6"
                />
                <h3 className="text-2xl font-bold mb-3">{product.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 flex-grow mb-6">
                  {product.description}
                </p>
                <span className="font-semibold text-blue-500 group-hover:underline">
                  Explore Styles →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSection() {
  const features = [
    {
      title: "Create a Cherished Gift in Minutes",
      description: "No design experience? No problem. Our intuitive tools make it simple to create something beautiful and personal, perfect for surprising loved ones.",
      image: "/features/gift-feature.png", // Suggest creating new feature images
    },
    {
      title: "Endless Inspiration, Unique Results",
      description: "With a massive library of artistic styles, you'll never run out of ideas. From modern logos to heartfelt name art, every design you create is one-of-a-kind.",
      image: "/features/styles-feature.png",
    },
    {
      title: "Professional Quality for Any Project",
      description: "Download your creations in high-resolution, ready for printing, framing, or using online. Get premium-quality results without the premium price tag.",
      image: "/features/quality-feature.png",
    }
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold">Why Name Design AI?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
            We empower you to create meaningful designs with ease and confidence.
          </p>
        </div>
        <div className="flex flex-col gap-20">
          {features.map((feature, index) => (
            <div key={feature.title} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className={`order-2 ${index % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}>
                <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
                <p className="text-lg text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
              <div className={`order-1 ${index % 2 === 0 ? 'md:order-2' : 'md:order-1'}`}>
                <Image
                  src={feature.image}
                  alt={feature.title}
                  width={500}
                  height={400}
                  className="rounded-lg shadow-xl"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function UserFeedbackSection() {
  const feedbacks = [
    { image: "/user-gift-fiance.webp", feedback: "I designed a name art keepsake for my fiancé—he absolutely loved it! It was so personal and looked amazing.", name: "Emma T." },
    { image: "/user-birthday-design.webp", feedback: "I made a gift for my friend’s birthday and it was a total hit! So much better than a generic store-bought present.", name: "Ashley K." },
    { image: "/user-social-media.webp", feedback: "My new name art boosted my social media profile instantly! I've gotten so many compliments on the unique design.", name: "Samantha B." },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-8 text-center">
        <h2 className="text-4xl font-bold mb-12">Hear From Our Happy Creators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {feedbacks.map((item, index) => (
            <div key={index} className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <Image src={item.image} alt={`Feedback from ${item.name}`} width={1024} height={1024} className="rounded-lg mb-6 w-full aspect-square object-cover" />
              <p className="text-gray-600 dark:text-gray-300 italic flex-grow">&quot;{item.feedback}&quot;</p>
              <p className="mt-4 font-bold text-gray-800 dark:text-white">— {item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  return (
    <section className="relative bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white">
      <div className="container mx-auto text-center px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold">Ready to Create Something Amazing?</h2>
        <p className="mt-4 text-lg dark:text-blue-100 text-blue-500 max-w-xl mx-auto">
          Your perfect design is just a few clicks away. Explore our tools and bring your ideas to life.
        </p>
        <div className="mt-8">
          <Link href={isLoggedIn ? "/personalized-gifts" : "#"} passHref>
             <button 
                className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                onClick={!isLoggedIn ? () => signIn().catch(console.error) : undefined}
            >
                {isLoggedIn ? "Start Creating Now" : "Sign Up & Get Started"}
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HomePage;