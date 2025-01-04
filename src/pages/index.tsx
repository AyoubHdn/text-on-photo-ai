import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { PrimaryLinkButton } from "~/component/PrimaryLinkButton";

const HomePage: NextPage = () => {
  function HeroBanner() {
    return (
      <section className="mt-12 mb-24 grid grid-cols-1 gap-12 px-8 sm:mt-24 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold">Create Stunning Name Images!</h1>
          <p className="text-2xl text-gray-500 dark:text-gray-300">
            Transform your name into art with Name Design AI! Create stunning, personalized designs perfect for social media, branding, or self-expression. Unleash your creativity today!
          </p>
          <PrimaryLinkButton href={"/generate"} className="self-start">
            Generate your image
          </PrimaryLinkButton>
        </div>
        <Image
          className="order-first sm:order-none"
          src="/banner.png"
          alt="bunch of nice looking icons"
          width="400"
          height="300"
        />
      </section>
    );
  }

  {/*function StatisticsSection() {
    return (
      <section className="py-12 text-center">
        <h2 className="text-4xl font-bold">Join Thousands of Creators!</h2>
        <p className="text-xl text-gray-600 mt-4">
          Over <span className="font-bold text-blue-500">153,341</span> users have created <span className="font-bold text-blue-500">184,185</span> name designs so far!
        </p>
      </section>
    );
  }*/}

  function DemoSection() {
    return (
      <section className="py-12 px-8">
        <h2 className="text-4xl font-bold text-center">See How It Works</h2>
        <div className="mt-8 flex justify-center">
          <video
            className="rounded-lg shadow-lg"
            controls
            width="640"
            src="/tuto.mp4"
            poster="/video-thumbnail.png"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </section>
    );
  }

  function FeaturesSection() {
    return (
      <section className="py-12 mb-12 bg-gray-300 dark:bg-gray-900 rounded">
        <h2 className="text-4xl font-bold text-center mb-8">Why Choose Us?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 px-8">
          <div className="flex flex-col items-center text-center">
            <Image src="/quick.png" alt="Quick" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">Fast & Easy</h3>
            <p className="dark:text-gray-200 mt-2">Generate designs in seconds with just a few clicks.</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/styles.png" alt="Customizable" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">Diverse Styles</h3>
            <p className="dark:text-gray-200 mt-2">Choose from 100+ styles and unleash your creativity!</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/affordable.png" alt="Affordable" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">Affordable Pricing</h3>
            <p className="dark:text-gray-200 mt-2">Get high-quality designs at unbeatable prices.</p>
          </div>
        </div>
        <div className="mt-12 text-center">
          <PrimaryLinkButton href="/generate" className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            Start Generating Now
          </PrimaryLinkButton>
        </div>
      </section>
    );
  }

  {/*function TestimonialsSection() {
    return (
      <section className="py-12 px-8">
        <h2 className="text-4xl font-bold text-center mb-8">What Our Users Are Saying</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg shadow-sm">
            <p className="text-gray-600">“This tool is amazing! I love how easy it is to create unique designs.”</p>
            <p className="mt-4 font-bold">— John Doe</p>
          </div>
          <div className="p-6 border rounded-lg shadow-sm">
            <p className="text-gray-600">“Affordable and powerful. Perfect for my small business branding.”</p>
            <p className="mt-4 font-bold">— Jane Smith</p>
          </div>
          <div className="p-6 border rounded-lg shadow-sm">
            <p className="text-gray-600">“The best design tool I&apos;ve used. Highly recommend it!”</p>
            <p className="mt-4 font-bold">— Alex Johnson</p>
          </div>
        </div>
      </section>
    );
  }*/}

  return (
    <>
      <Head>
        <title>Name Design AI</title>
        <meta name="description" content="Transform your name into art with Name Design AI!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto">
        <HeroBanner />
        {/*<StatisticsSection />*/}
        <DemoSection />
        <FeaturesSection />
        {/*<TestimonialsSection />*/}
      </main>
    </>
  );
};

export default HomePage;
