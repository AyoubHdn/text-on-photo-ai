// pages/index.tsx (HomePage.tsx)
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from 'next/link';
import { useSession, signIn } from "next-auth/react";
import { Button } from "~/component/Button";
import { MdFilterFrames } from "react-icons/md";
import { FiGift, FiHeart, FiShield } from "react-icons/fi"; // New icons
import { MdOutlineInsertInvitation } from "react-icons/md";

// --- Main Component ---
const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Name Design AI: Your All-in-One AI Design Suite</title>
        <meta
          name="description"
          content="Create stunning designs with AI. Generate custom name art, professional logos, face logos, personalized gifts, and beautiful wedding invitations in minutes."
        />
        <meta name="keywords" content="ai design tool, name art generator, logo maker, wedding invitation maker, face logo generator, personalized gifts" />
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

// --- Page Sections ---

function HeroBanner() {
  const handleScrollToProducts = () => {
    document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 px-8 py-20 items-center">
        <div className="flex flex-col gap-6 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">The AI Design Suite for Every Occasion</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            From heartfelt gifts and wedding invitations to professional logos and unique name art, bring your creative vision to life with the power of AI.
          </p>
          <div className="mt-4">
            <Button onClick={handleScrollToProducts} className="px-10 py-4 text-lg">
              Explore Our AI Tools
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
          <Image
            src="/banner.webp"
            alt="A collage of AI-generated name art, logos, and wedding invitations"
            width={500} height={400}
            priority className="rounded-lg shadow-2xl"
            unoptimized={true}
          />
        </div>
      </div>
    </section>
  );
}

function ProductsSection() {
  const products = [
    {
      title: "Name Art",
      description: "Turn your name into a masterpiece with creative styles, from graffiti to elegant calligraphy.",
      href: "/name-art",
      icon: <MdFilterFrames className="h-10 w-10 text-purple-500" />,
      id: "product-name-art"
    },
    {
      title: "Wedding Invitations",
      description: "Design beautiful, custom photo and text invitations for your special day. Perfect text, guaranteed.",
      href: "/wedding-invitation",
      icon: <MdOutlineInsertInvitation className="h-10 w-10 text-pink-500" />,
      id: "product-wedding-invitations"
    },
    {
      title: "Professional Logos",
      description: "Craft a unique, high-quality logo for your business, brand, or project in minutes.",
      href: "/pro-logo",
      icon: <FiShield className="h-10 w-10 text-blue-500" />,
      id: "product-pro-logo"
    },
    {
      title: "Personalized Gifts",
      description: "Create heartfelt art for anniversaries, birthdays, and special occasions they'll never forget.",
      href: "/personalized-gifts",
      icon: <FiGift className="h-10 w-10 text-red-500" />,
      id: "product-personalized-gifts"
    },
    {
      title: "Couples Name Art",
      description: "Celebrate your partnership. Create a romantic piece of art with both of your names for anniversaries or home decor.",
      href: "/couples-art", // You will need to create this landing page
      icon: <FiHeart className="h-10 w-10 text-yellow-500" />,
      id: "product-couple-art"
    },
  ];

  return (
    <section id="products-section" className="py-24">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold">What Do You Want to Create Today?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
            Choose a tool to start your creative journey. Each is powered by AI to deliver amazing results.
          </p>
        </div>
        {/* We use a more flexible grid that wraps nicely */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map((product) => (
            <Link key={product.href} href={product.href} id={product.id} className="group block">
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg h-full flex flex-col items-center text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <div className="mb-6">{product.icon}</div>
                <h3 className="text-2xl font-bold mb-3">{product.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 flex-grow mb-6">
                  {product.description}
                </p>
                <span className="font-semibold text-blue-500 group-hover:underline">
                  Start Designing →
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
      title: "Pixel-Perfect Text, Guaranteed",
      description: "Unlike other AI tools that produce messy text, our advanced Hybrid Engine ensures your names, dates, and details are always perfectly clear and beautifully styled.",
      image: "/features/perfect-text-feature.webp",
    },
    {
      title: "Wedding Invitations Made Easy",
      description: "Create stunning, personalized wedding invitations with our AI-powered generator. Choose from elegant templates or start from scratch to design the perfect invite for your special day.",
      image: "/features/wedding-invitation.webp",
    },
    {
      title: "One-of-a-Kind AI Art Styles",
      description: "Go beyond templates. Our unique AI enhancement can transform your photos into stunning cartoons, watercolor paintings, and more for a truly magical touch.",
      image: "/features/ai-styles-feature.webp",
    },
    {
      title: "From Idea to Finished Design in Minutes",
      description: "Our intuitive, step-by-step generators make it easy for anyone to create professional-quality designs. No design experience needed.",
      image: "/features/fast-easy-feature.webp",
    }
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold">The Name Design AI Difference</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
            We combine the best of AI creativity with professional design precision.
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
                <Image src={feature.image} alt={feature.title} width={500} height={400} className="rounded-lg shadow-xl" unoptimized={true}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function UserFeedbackSection() {
  // We can now add a more diverse set of testimonials
  const feedbacks = [
    { image: "/user-wedding-invite.webp", feedback: "We used the Wedding Invitation generator and were blown away. The AI cartoon style was a huge hit with our guests!", name: "Sarah & Tom" },
    { image: "/user-gift-fiance.webp", feedback: "I designed a personalized name art keepsake for my fiancé—he absolutely loved it! So much more personal than a store-bought gift.", name: "Emma T." },
    {
      image: "/user-couple-art.webp",
      feedback: "My husband and I wanted something special for the wall above our bed. We designed a beautiful piece with our names in a romantic script, and it's perfect. It feels so much more personal than a generic print.",
      name: "Mark & Sarah",
    },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-8 text-center">
        <h2 className="text-4xl font-bold mb-12">Hear From Our Happy Creators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {feedbacks.map((item, index) => (
            <div key={index} className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <Image src={item.image} alt={`Feedback from ${item.name}`} width={512} height={512} className="rounded-lg mb-6 w-full aspect-square object-cover" unoptimized={true}/>
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
    <section className="relative bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white py-24">
      <div className="container mx-auto text-center px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold">Ready to Create Something Amazing?</h2>
        <p className="mt-4 text-lg text-blue-100 max-w-xl mx-auto">
          Your perfect design is just a few clicks away. Explore our tools and bring your ideas to life.
        </p>
        <div className="mt-8">
          <Link href={isLoggedIn ? "#products-section" : "/api/auth/signin"} passHref>
             <button
                className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                onClick={isLoggedIn ? () => document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" }) : undefined}
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