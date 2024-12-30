import Head from "next/head";

const TermsOfService: React.FC = () => {
  return (
    <>
      <Head>
        <title>Terms of Service - Name Design AI</title>
        <meta
          name="description"
          content="Read our Terms of Service to understand the conditions of using Name Design AI."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center py-10">
        <div className="w-full max-w-4xl px-6">
          <h1 className="text-4xl font-bold text-center mb-8">Terms of Service</h1>
          <p className="text-sm  text-center mb-12">
            Last updated: <strong>December 30, 2024</strong>
          </p>
          <div className="prose prose-lg mx-auto  space-y-8">
            <h2 className="text-2xl font-bold mt-10">Introduction</h2>
            <p>
              These Terms and Conditions govern your use of our website and services. By accessing
              or using our service, you agree to comply with these terms. If you do not agree, you
              should not use the service.
            </p>

            <h2 className="text-2xl font-bold mt-10">Acknowledgment</h2>
            <p>
              These Terms and Conditions constitute the agreement between you and the Company
              regarding the use of our service.
            </p>

            <h2 className="text-2xl font-bold mt-10">Key Definitions</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Affiliate</strong>: An entity that controls, is controlled by, or is under
                common control with another entity.
              </li>
              <li>
                <strong>Service</strong>: Refers to the Name Design AI website and its features.
              </li>
              <li>
                <strong>You</strong>: Refers to the individual accessing or using the service.
              </li>
            </ul>

            <h2 className="text-2xl font-bold mt-10">Refund Policy</h2>
            <p>
              By purchasing credits, you agree to the <a href="/refund" className="text-gray-200 underline">Refund Policy</a>. Ensure you understand the limitations of AI-generated designs before purchasing.
            </p>

            <h2 className="text-2xl font-bold mt-10">Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account without prior notice if you
              breach these Terms.
            </p>

            <h2 className="text-2xl font-bold mt-10">Limitation of Liability</h2>
            <p>
              We assume no responsibility for the outcomes of AI-generated designs and their use.
              Please ensure compliance with relevant copyright laws in your jurisdiction.
            </p>

            <h2 className="text-2xl font-bold mt-10">Contact Us</h2>
            <p>
              If you have any questions about these Terms, you can contact us at:
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

export default TermsOfService;
