import Head from "next/head";

const RefundPolicy: React.FC = () => {
  return (
    <>
      <Head>
        <title>Refund Policy - Name Design AI</title>
        <meta
          name="description"
          content="Understand our refund policy at Name Design AI."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center py-10">
        <div className="w-full max-w-4xl px-6">
          <h1 className="text-4xl font-bold text-center mb-8">Refund Policy</h1>
          <p className="text-sm text-center mb-12">
            Last updated: <strong>December 30, 2024</strong>
          </p>
          <div className="prose prose-lg mx-auto space-y-8">
            <p>
              At Name Design AI, we strive to provide high-quality AI-generated designs. However,
              due to the inherent nature of AI and the costs involved, we are unable to offer
              refunds once credits are used.
            </p>
            <p>
              We encourage you to explore examples on our community page to better understand the
              capabilities and limitations of AI-generated designs.
            </p>

            <h2 className="text-2xl font-bold mt-10">Key Points</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                Refunds are not provided once credits have been used due to the computational costs
                involved.
              </li>
              <li>
                Ensure you review our examples and understand the AI&apos;s limitations before making a
                purchase.
              </li>
            </ul>

            <h2 className="text-2xl font-bold mt-10">Contact Us</h2>
            <p>
              If you have any questions or concerns about this policy, you can reach us at:
            </p>
            <p>
              <a href="mailto:contact@namedesignai.com" className="text-gray-200 underline">
                contact@namedesignai.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default RefundPolicy;
