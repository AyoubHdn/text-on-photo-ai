/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from 'next/link';
import { api } from "~/utils/api";
import { useSession, signIn } from "next-auth/react";
import { Button } from "~/component/Button";
import { Key } from "react";
import { env } from "~/env.mjs";

// Main Component
const HomePage: NextPage = () => {
  return (
    <>
      <Head>
      <title>Name Design AI – Personalized Name Art & Arabic Calligraphy</title>

      <meta
        name="description"
        content="Create beautiful personalized name art, Arabic calligraphy, and couple name designs with AI. Perfect for meaningful gifts, home decor, and personal keepsakes."
      />

      <meta
        name="keywords"
        content="name art generator, personalized name art, arabic name art, couple name art, custom name gifts"
      />

        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg-white dark:bg-gray-900">
        <HeroBanner />
        <ProductsSection />
        <HowItWorksSection />
        <PopularTodaySection />
        <FinalCTASection />
        <FAQSection />
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">Turn Names Into Meaningful Art</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Create personalized name art, Arabic calligraphy, and couple designs in minutes. Perfect for gifts, home decor, and special moments.
          </p>
          <div className="mt-4">
            <Button
              onClick={handleScrollToProducts}
              className="px-10 py-4 text-lg"
              id="try-it-free-button-heroBanner"
            >
              Explore Name Art Styles
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
          <Image
            src="/banner.webp" // This image should be high quality
            alt="A collage of beautiful name art and logo designs"
            width={500}
            height={400}
            priority // Load this image first
            className="rounded-lg shadow-2xl"
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
      title: "Name Art Generator",
      description: "Turn any name into stunning visual art using dozens of creative styles. Perfect for decor, profiles, and gifts.",
      href: "/name-art",
      image: "/icons/name-art.webp",
      id: "product-name-art",
    },
    {
      title: "Arabic Name Art",
      description: "Create beautiful Arabic name art with authentic calligraphy styles and modern artistic designs.",
      href: "/arabic-name-art",
      image: "/icons/arabic-name-art.webp",
      id: "product-arabic-name-art",
    },
    {
      title: "Couples Name Art",
      description: "Design romantic couple name art for anniversaries, weddings, and meaningful personalized gifts.",
      href: "/couples-art",
      image: "/icons/couples-art.webp",
      id: "product-couples-art",
    },
  ];

  return (
    <section id="products-section" className="py-24">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold">Personalized Name Art Tools</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 max-w-3xl mx-auto">
            Choose a style that fits your story. Every design is created around names, meaning, and personal expression.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link
              key={product.href}
              href={product.href}
              id={product.id}
              className="group block"
            >
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg h-full flex flex-col items-center text-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <Image
                  src={product.image}
                  alt={`${product.title} AI tool`}
                  width={80}
                  height={80}
                  className="mb-6"
                />
                <h3 className="text-2xl font-bold mb-3">{product.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 flex-grow mb-6">
                  {product.description}
                </p>
                <span className="font-semibold text-blue-500 group-hover:underline">
                  Try Now →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      title: "Choose a Name Art Style",
      description:
        "Pick from name art, Arabic calligraphy, or couple designs-each built around personal meaning.",
    },
    {
      title: "Enter the Name(s)",
      description:
        "Type a name or two. No design skills needed-our AI handles the creativity.",
    },
    {
      title: "Generate & Refine",
      description:
        "Explore multiple styles, colors, and variations until it feels just right.",
    },
    {
      title: "Download or Gift",
      description:
        "Download high-resolution artwork ready for printing, framing, or sharing.",
    },
  ];

  const trustPoints = [
    "Used by thousands of customers worldwide",
    "High-resolution downloads included",
    "No design experience required",
    "Perfect for gifts, branding, and personal use",
  ];

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold">
            How Name Design AI Works
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
            Create beautiful, personalized designs in minutes using AI-no design skills required.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg text-center"
            >
              <div className="text-4xl font-bold text-blue-500 mb-4">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Trust Signals */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {trustPoints.map((point, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md"
              >
                <span className="text-green-500 text-2xl">✓</span>
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PopularTodaySection() {
  const { data: icons, isLoading } =
    api.icons.getPopularPaidIcons.useQuery({ limit: 12 });

  if (isLoading || !icons?.length) return null;

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold">Popular Today</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
            Real name art designs created by our community.
          </p>
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {icons.map((icon: { id: string; prompt: string | null }) => (
            <li
              key={icon.id}
              className="group overflow-hidden rounded-lg shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
            >
              <Link href="/community">
                <div className="relative aspect-square w-full bg-gray-200 dark:bg-gray-800">
                  <Image
                    src={`https://${env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${icon.id}`}
                    alt={icon.prompt ?? "Design created by a paid user"}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
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
        <h2 className="text-3xl md:text-4xl font-bold">Create a Name That Means Something</h2>
        <p className="mt-4 text-lg dark:text-blue-100 text-blue-500 max-w-xl mx-auto">
          A personalized design can be a memory, a gift, or a keepsake. Start creating your name art today.
        </p>
        <div className="mt-8">
          <Link href={isLoggedIn ? "/name-art" : "#"} passHref>
             <button 
                className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                onClick={!isLoggedIn ? () => signIn().catch(console.error) : undefined}
            >
                {isLoggedIn ? "Create Name Art" : "Sign Up & Create Your First Design"}
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
function FAQSection() {
  const faqs = [
        {
      question: "What is Name Design AI?",
      answer:
        "Name Design AI is a platform that creates personalized name art, Arabic calligraphy, and couple name designs using artificial intelligence. It’s designed for meaningful gifts, decor, and personal keepsakes."
    },
    {
      question: "Can I create Arabic name art online?",
      answer:
        "Yes. We offer a dedicated Arabic Name Art tool that creates beautiful designs using authentic Arabic calligraphy styles combined with modern artistic layouts."
    },
    {
      question: "Is Name Design AI good for personalized gifts?",
      answer:
        "Absolutely. Many customers use Name Design AI to create meaningful gifts such as name art, couples designs, birthdays, anniversaries, and special occasions."
    },
    {
      question: "Do I need design skills to use Name Design AI?",
      answer:
        "No design skills are required. Our AI tools guide you step by step and automatically generate high-quality designs in just a few minutes."
    },
    {
      question: "Can I download my designs in high resolution?",
      answer:
        "Yes. All designs can be downloaded in high resolution, making them perfect for printing, framing, or using online."
    }
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-8 max-w-4xl">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
            Everything you need to know before creating your first design.
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-md"
            >
              <summary className="cursor-pointer list-none flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {faq.question}
                </h3>
                <span className="text-2xl font-bold transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HomePage;