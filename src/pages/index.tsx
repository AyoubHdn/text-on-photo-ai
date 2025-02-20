import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { PrimaryLinkButton } from "~/component/PrimaryLinkButton";

const HomePage: NextPage = () => {
  function HeroBanner() {
    return (
      <section className="mt-12 mb-24 grid grid-cols-1 gap-12 px-8 sm:mt-24 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold">Create Stunning Name Art & Game Logos!</h1>
          <p className="text-2xl text-gray-500 dark:text-gray-300">
            Transform your name into art or design an epic game logo! 
            With Name Design AI, you can easily create personalized designs perfect for social media, branding, or gaming. 
            (Wallpaper and Pro Logo coming soon!)
          </p>
          <PrimaryLinkButton
            href={"/generate"}
            className="self-start"
            id="generate-your-image-button-heroBanner"
          >
            Try it Free
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

  function CategorySection() {
    return (
      <section className="py-12 px-8 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm mb-12">
        <h2 className="text-4xl font-bold text-center mb-8">What Do You Want To Create?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Name Art */}
          <div className="flex flex-col items-center bg-white dark:bg-gray-700 p-6 rounded-lg shadow transition hover:shadow-lg">
            <Image
              src="/icons/name-art.webp"
              alt="Name Art"
              width={64}
              height={64}
            />
            <h3 className="text-xl font-bold mt-4">Name Art</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-center">
              Generate custom name art for any occasion.
            </p>
            <PrimaryLinkButton
              href="/generate"
              className="mt-4"
              id="generate-name-art"
            >
              Create
            </PrimaryLinkButton>
          </div>
          {/* Game Logo */}
          <div className="flex flex-col items-center bg-white dark:bg-gray-700 p-6 rounded-lg shadow transition hover:shadow-lg">
            <Image
              src="/icons/game-logo.webp"
              alt="Game Logo"
              width={64}
              height={64}
            />
            <h3 className="text-xl font-bold mt-4">Game Logo</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-center">
              Design a unique game logo for your brand or community.
            </p>
            <PrimaryLinkButton
              href="/generate"
              className="mt-4"
              id="generate-game-logo"
            >
              Create
            </PrimaryLinkButton>
          </div>
          {/* Wallpaper (Coming Soon) */}
          <div className="flex flex-col items-center bg-white dark:bg-gray-700 p-6 rounded-lg shadow opacity-50 pointer-events-none">
            <Image
              src="/icons/wallpaper.png"
              alt="Wallpaper"
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
          {/* Pro Logo (Coming Soon) */}
          <div className="flex flex-col items-center bg-white dark:bg-gray-700 p-6 rounded-lg shadow opacity-50 pointer-events-none">
            <Image
              src="/icons/pro-logo.png"
              alt="Pro Logo"
              width={64}
              height={64}
            />
            <h3 className="text-xl font-bold mt-4">Pro Logo</h3>
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
        <h2 className="text-4xl font-bold">Join the Creative Revolution!</h2>
        <p className="text-xl text-gray-600 mt-4 dark:text-gray-300">
          More than <span className="font-bold text-blue-500">945</span> creators
          have generated <span className="font-bold text-blue-500">4,634</span> unique designs using our tool!
        </p>
      </section>
    );
  }

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
        <h2 className="text-4xl font-bold text-center mb-8">Why Choose Us?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 px-8">
          <div className="flex flex-col items-center text-center max-w-sm mx-auto">
            <Image src="/quick.png" alt="Quick" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">Fast & Easy</h3>
            <p className="leading-normal dark:text-gray-200 mt-2">
              Generate stunning designs in seconds with just a few clicks.
              No design skills required—our AI-powered tool does the hard work for you.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/styles.png" alt="Customizable" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">Variety of Styles</h3>
            <p className="leading-normal dark:text-gray-200 mt-2">
              Choose from +1000 unique styles, from elegant and modern to playful and festive. 
              No matter the occasion, we have a style that fits your needs.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/affordable.png" alt="Affordable" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">Affordable Pricing</h3>
            <p className="leading-normal dark:text-gray-200 mt-2">
              Get high-quality designs at unbeatable prices. 
              Save money compared to hiring professional designers.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/manage.png" alt="Manage Creations" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">Manage Your Creations</h3>
            <p className="leading-normal dark:text-gray-200 mt-2">
              We store all your generated designs in the cloud, 
              so you can easily access and organize them anytime.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/hd.png" alt="High Resolution" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">High Resolution</h3>
            <p className="leading-normal dark:text-gray-200 mt-2">
              All designs are delivered in high resolution, 
              ensuring they look sharp and professional in both print and digital.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Image src="/share.png" alt="Social Sharing" width={64} height={64} />
            <h3 className="text-xl font-bold mt-4">Social Presence</h3>
            <p className="leading-normal dark:text-gray-200 mt-2">
              Easily share your creations on social media. 
              Perfect for showcasing your creativity or getting feedback.
            </p>
          </div>
        </div>
      </section>
    );
  }

  function UserFeedbackSection() {
    const feedbacks = [
      {
        image: "/user-youtube-logo.webp",
        feedback:
          "I used this tool to create a logo for my YouTube channel, and it turned out incredible! My subscribers love it!",
        name: "Chris D.",
      },
      {
        image: "/user-birthday-design.webp",
        feedback:
          "I created a custom name design for my friend’s birthday, and it was a huge hit! They absolutely loved it!",
        name: "Ashley K.",
      },
      {
        image: "/user-wallpaper-design.webp",
        feedback:
          "I generated a name wallpaper for my desktop, and it looks so cool! The high-resolution quality is amazing.",
        name: "Jordan P.",
      },
      {
        image: "/user-gift-fiance.webp",
        feedback:
          "I made a personalized name design as a gift for my fiancé. He was so touched—it was the perfect keepsake!",
        name: "Emma T.",
      },
      {
        image: "/user-game-logo.webp",
        feedback:
          "This tool helped me create a professional-looking logo for my game channel Discord. The styles available are perfect for gaming!",
        name: "Ryan L.",
      },
      {
        image: "/user-social-media.webp",
        feedback:
          "I designed a name for my social media profile, and it boosted my brand identity! It's so easy to use and looks amazing.",
        name: "Samantha B.",
      },
    ];

    return (
      <section className="py-12 px-8">
        <h2 className="text-4xl font-bold text-center mb-8">What Our Users Are Saying</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {feedbacks.map((item, index) => (
            <div
              key={index}
              className="p-6 border rounded-lg shadow-sm bg-white dark:bg-gray-800"
            >
              <Image
                src={item.image}
                alt={`User feedback from ${item.name}`}
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
    const benefits = [
      {
        icon: "/icons/save-time.png",
        title: "Save Time and Money",
        description:
          "Why spend hours negotiating with freelancers or paying high fees for simple tasks? Our AI handles it instantly.",
      },
      {
        icon: "/icons/styles.png",
        title: "Variety of Styles",
        description:
          "Whether you need a thoughtful gift, a new profile picture, or a logo for your business, we’ve got you covered.",
      },
      {
        icon: "/icons/pricing.png",
        title: "Affordable Pricing",
        description:
          "Generating designs with our tool is significantly cheaper than hiring a designer or using premium services.",
      },
      {
        icon: "/icons/unique-designs.png",
        title: "Unique Designs",
        description:
          "Every design is one-of-a-kind, tailored to your preferences. Stand out from the crowd with custom artwork.",
      },
      {
        icon: "/icons/users.png",
        title: "Who Can Use This Tool?",
        description:
          "From creatives and entrepreneurs to gift-givers and gamers, it’s perfect for anyone seeking personalized designs.",
      },
    ];

    return (
      <section className="py-12 px-8 bg-gray-100 dark:bg-gray-900 rounded-lg mb-11">
        <h2 className="text-4xl font-bold text-center mb-8">Benefits of Using Our Tool</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  className="shadow-current"
                  src={benefit.icon}
                  alt={`${benefit.title} icon`}
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
          <PrimaryLinkButton
            id="start-generating-now-button-benefitsSection"
            href="/generate"
            className="inline-block px-8 py-4 text-lg font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Start Generating Now
          </PrimaryLinkButton>
        </div>
      </section>
    );
  }

  return (
    <>
      <Head>
        <title>Name Design AI – Generate Name Art & Game Logos.</title>
        <meta
          name="description"
          content="Transform your name into art (or design an epic game logo) with Name Design AI!"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto">
        <HeroBanner />
        {/* New Category Section for Name Art, Game Logo, Wallpaper, Pro Logo */}
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
