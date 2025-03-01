import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { PrimaryLinkButton } from "~/component/PrimaryLinkButton";
import { useSession, signIn } from "next-auth/react";

const HomePage: NextPage = () => {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  function HeroBanner() {
    const handleTryItFree = () => {
      if (!isLoggedIn) {
        signIn("google").catch(console.error); // Trigger Google sign-in if not logged in
      } else {
        // Scroll to CategorySection if logged in
        document.getElementById("category-section")?.scrollIntoView({ behavior: "smooth" });
      }
    };

    return (
      <section className="mt-12 mb-24 grid grid-cols-1 gap-12 px-8 sm:mt-24 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold">Create Name Art, Gaming Logos & Pro Designs!</h1>
          <p className="text-2xl text-gray-500 dark:text-gray-300">
            Unleash your creativity with Name Design AI. Design personalized name art, epic gaming logos, or professional branding—all in minutes. Perfect for social media, gifts, or businesses!
          </p>
          <button
            onClick={handleTryItFree}
            className="self-start px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition"
            id="try-it-free-button-heroBanner"
          >
            Try it Free
          </button>
        </div>
        <Image
          className="order-first sm:order-none"
          src="/banner.png"
          alt="Examples of name art, gaming logos, and professional designs"
          width="400"
          height="300"
        />
      </section>
    );
  }

  function CategorySection() {
    return (
      <section className="py-12 px-8 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm mb-12" id="category-section">
        <h2 className="text-4xl font-bold text-center mb-8">What Do You Want to Create?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Name Art */}
          <div className="flex flex-col items-center bg-white dark:bg-gray-700 p-6 rounded-lg shadow transition hover:shadow-lg">
            <Image
              src="/icons/name-art.webp"
              alt="Personalized Name Art Generator"
              width={64}
              height={64}
            />
            <h3 className="text-xl font-bold mt-4">Name Art</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-center">
              Turn any name into stunning art for social media or gifts.
            </p>
            <PrimaryLinkButton
              href="/name-art"
              className="mt-4"
              id="generate-name-art"
            >
              Create Now
            </PrimaryLinkButton>
          </div>
          {/* Gaming Logo */}
          <div className="flex flex-col items-center bg-white dark:bg-gray-700 p-6 rounded-lg shadow transition hover:shadow-lg">
            <Image
              src="/icons/game-logo.webp"
              alt="Gaming Logo Generator"
              width={64}
              height={64}
            />
            <h3 className="text-xl font-bold mt-4">Gaming Logo</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-center">
              Design bold logos for gaming teams or streams.
            </p>
            <PrimaryLinkButton
              href="/gaming-logo"
              className="mt-4"
              id="generate-game-logo"
            >
              Create Now
            </PrimaryLinkButton>
          </div>
          {/* Professional Logo */}
          <div className="flex flex-col items-center bg-white dark:bg-gray-700 p-6 rounded-lg shadow transition hover:shadow-lg">
            <Image
              src="/icons/pro-logo.webp"
              alt="Professional Logo Generator"
              width={64}
              height={64}
            />
            <h3 className="text-xl font-bold mt-4">Professional Logo</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-center">
              Craft custom logos for businesses or brands.
            </p>
            <PrimaryLinkButton
              href="/pro-logo"
              className="mt-4"
              id="generate-pro-logo"
            >
              Create Now
            </PrimaryLinkButton>
          </div>
          {/* Wallpaper (Coming Soon) */}
          <div className="flex flex-col items-center bg-white dark:bg-gray-700 p-6 rounded-lg shadow opacity-50 pointer-events-none">
            <Image
              src="/icons/wallpaper.png"
              alt="Wallpaper Generator (Coming Soon)"
              width={64}
              height={64}
            />
            <h3 className="text-xl font-bold mt-4">Wallpaper</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-center">
              Coming Soon
            </p>
            <button
              disabled
              className="mt-4 bg-gray-300 text-white font-bold py-2 px-4 rounded cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </section>
    );
  }

  function StatisticsSection() {
    return (
      <section className="py-12 text-center">
        <h2 className="text-4xl font-bold">Join Thousands of Creators!</h2>
        <p className="text-xl text-gray-600 mt-4 dark:text-gray-300">
          Over <span className="font-bold text-blue-500">945</span> users have created 
          <span className="font-bold text-blue-500">4,634</span> unique designs with Name Design AI!
        </p>
      </section>
    );
  }

  function DemoSection() {
    return (
      <section className="py-12 px-8">
        <h2 className="text-4xl font-bold text-center">See How Easy It Is</h2>
        <div className="mt-8 flex justify-center">
          <video
            className="rounded-lg shadow-lg"
            controls
            width="640"
            src="/tuto.mp4"
            poster="/video-thumbnail.png"
            muted
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </section>
    );
  }

  function FeaturesSection() {
    return (
      <section className="py-12 mb-12 bg-white shadow-sm dark:bg-gray-900 rounded-lg">
        <h2 className="text-4xl font-bold text-center mb-8">Why Use Name Design AI?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 px-8">
          <div className="flex flex-col items-center text-center max-w-sm mx-auto">
            <Image src="/quick.png" alt="Fast Design Creation" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">Fast & Simple</h3>
            <p className="leading-normal dark:text-gray-200 mt-2">
              Create stunning designs in seconds—no design skills needed.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/styles.png" alt="Variety of Design Styles" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">Endless Styles</h3>
            <p className="leading-normal dark:text-gray-200 mt-2">
              From playful name art to sleek logos, find your perfect style.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/affordable.png" alt="Affordable Design Tool" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">Budget-Friendly</h3>
            <p className="leading-normal dark:text-gray-200 mt-2">
              High-quality designs at a fraction of the cost.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/manage.png" alt="Cloud Design Storage" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">Organize Easily</h3>
            <p className="leading-normal dark:text-gray-200 mt-2">
              Store and access your creations anytime in the cloud.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/hd.png" alt="High-Resolution Designs" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">HD Quality</h3>
            <p className="leading-normal dark:text-gray-200 mt-2">
              Crisp, professional designs for any use.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/share.png" alt="Share Designs Instantly" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">Share Instantly</h3>
            <p className="leading-normal dark:text-gray-200 mt-2">
              Show off your creations on social media with ease.
            </p>
          </div>
        </div>
      </section>
    );
  }

  function UserFeedbackSection() {
    const feedbacks = [
      {
        image: "/user-birthday-design.webp",
        feedback: "I made a name art gift for my friend’s birthday—it was a total hit!",
        name: "Ashley K.",
      },
      {
        image: "/user-game-logo.webp",
        feedback: "The gaming logo I created for my Discord server looks so pro!",
        name: "Ryan L.",
      },
      {
        image: "/user-social-media.webp",
        feedback: "My new name art boosted my social media profile instantly!",
        name: "Samantha B.",
      },
      {
        image: "/user-gift-fiance.webp",
        feedback: "I designed a name art keepsake for my fiancé—he loved it!",
        name: "Emma T.",
      },
      {
        image: "/user-youtube-logo.webp",
        feedback: "Perfect logo for my YouTube gaming channel—super easy to make!",
        name: "Chris D.",
      },
    ];

    return (
      <section className="py-12 px-8">
        <h2 className="text-4xl font-bold text-center mb-8">Hear From Our Users</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {feedbacks.map((item, index) => (
            <div
              key={index}
              className="p-6 border rounded-lg shadow-sm bg-white dark:bg-gray-800"
            >
              <Image
                src={item.image}
                alt={`Feedback from ${item.name} about Name Design AI`}
                width={200}
                height={200}
                className="rounded-lg mb-4"
              />
              <p className="text-gray-600 dark:text-gray-300">{item.feedback}</p>
              <p className="mt-4 font-bold text-gray-800 dark:text-gray-200">— {item.name}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function BenefitsSection() {
    const handleStartGenerating = () => {
      if (!isLoggedIn) {
        signIn("google").catch(console.error); // Trigger Google sign-in if not logged in
      } else {
        // Scroll to CategorySection if logged in
        document.getElementById("category-section")?.scrollIntoView({ behavior: "smooth" });
      }
    };

    const benefits = [
      {
        icon: "/icons/save-time.png",
        title: "Save Time",
        description: "Create designs instantly—no waiting required.",
      },
      {
        icon: "/icons/styles.png",
        title: "Versatile Styles",
        description: "Find the perfect look for name art, logos, and more.",
      },
      {
        icon: "/icons/pricing.png",
        title: "Low Cost",
        description: "Affordable designs without compromising quality.",
      },
      {
        icon: "/icons/unique-designs.png",
        title: "One-of-a-Kind",
        description: "Every design is unique and tailored to you.",
      },
      {
        icon: "/icons/users.png",
        title: "For Everyone",
        description: "Perfect for gamers, gift-givers, and businesses alike.",
      },
    ];

    return (
      <section className="py-12 px-8 bg-gray-100 dark:bg-gray-900 rounded-lg mb-11">
        <h2 className="text-4xl font-bold text-center mb-8">Why Name Design AI?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={benefit.icon}
                  alt={`${benefit.title} benefit icon`}
                  width={40}
                  height={40}
                />
                <h3 className="text-xl font-bold">{benefit.title}</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">{benefit.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <button
            onClick={handleStartGenerating}
            className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            id="start-generating-now-button-benefitsSection"
          >
            Start Generating Now
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <Head>
        <title>Name Design AI – Name Art, Gaming Logos & Professional Designs</title>
        <meta
          name="description"
          content="Create personalized name art, gaming logos, or professional designs with Name Design AI. Perfect for social media, gifts, or branding—try it free!"
        />
        <meta name="keywords" content="name art generator, gaming logo maker, professional logo creator, custom designs, AI design tool" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto">
        <HeroBanner />
        <CategorySection />
        <StatisticsSection />
        <DemoSection />
        <FeaturesSection />
        <UserFeedbackSection />
        <BenefitsSection />
      </main>
    </>
  );
};

export default HomePage;