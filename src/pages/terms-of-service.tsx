import Head from "next/head";
import Link from "next/link";

const TermsOfService: React.FC = () => {
  return (
    <>
      <Head>
        <title>Terms of Service | Name Design AI</title>
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
            Last updated: <strong>March 4, 2026</strong>
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
              By purchasing credits, you agree to the <Link href="/refund" className="dark:text-gray-200 underline">Refund Policy</Link>. Ensure you understand the limitations of AI-generated designs before purchasing.
            </p>

            <h2 className="text-2xl font-bold mt-10">Account Responsibility</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activity that occurs under your account. You must provide accurate account
              information and promptly notify us of any unauthorized use.
            </p>

            <h2 className="text-2xl font-bold mt-10">AI Content Disclaimer</h2>
            <p>
              The Service uses AI to generate content, which may be inaccurate, incomplete, similar
              to third-party works, or unsuitable for specific legal/commercial purposes. You are
              responsible for reviewing all generated outputs before use.
            </p>

            <h2 className="text-2xl font-bold mt-10">User Content Responsibility</h2>
            <p>
              You are solely responsible for prompts, text, images, and any other content you upload
              or submit. You must not submit content that infringes rights, violates law, or breaches
              third-party terms.
            </p>

            <h2 className="text-2xl font-bold mt-10">Credits Rules</h2>
            <p>
              Credits are digital service units used within the platform. Unless required by law,
              credits are non-refundable once used, non-transferable, and may expire or be adjusted
              if abuse, fraud, chargebacks, or technical correction is required.
            </p>

            <h2 className="text-2xl font-bold mt-10">Physical Product Fulfillment</h2>
            <p>
              Physical product manufacturing and shipping are fulfilled by third-party partners. We
              coordinate order processing but do not directly manufacture products. Delivery times,
              carrier operations, and fulfillment availability may vary by destination and provider.
            </p>

            <h2 className="text-2xl font-bold mt-10">Order Accuracy</h2>
            <p>
              You are responsible for verifying order details, including product variant, design,
              size, color, shipping address, and contact details before purchase. We are not liable
              for losses caused by incorrect information provided at checkout.
            </p>

            <h2 className="text-2xl font-bold mt-10">Design Ownership</h2>
            <p>
              Subject to these Terms and applicable law, you retain rights in content you submit and
              generated outputs associated with your account. You grant us the rights needed to host,
              process, display, and deliver the Service (including previews, fulfillment, and support).
            </p>

            <h2 className="text-2xl font-bold mt-10">Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account without prior notice if you
              breach these Terms.
            </p>

            <h2 className="text-2xl font-bold mt-10">Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, the Service is provided on an &quot;as is&quot; and
              &quot;as available&quot; basis without warranties of any kind. We are not liable for indirect,
              incidental, special, consequential, or punitive damages, or for loss of data, profits,
              revenue, goodwill, business interruption, delivery delays, third-party service failures,
              or outcomes arising from use of AI-generated content. Our total liability for any claim
              related to the Service will not exceed the amount you paid to us in the 12 months before
              the event giving rise to the claim.
            </p>

            <h2 className="text-2xl font-bold mt-10">Service Modification</h2>
            <p>
              We may modify, suspend, or discontinue any part of the Service (including features,
              pricing, product availability, and integrations) at any time, with or without notice,
              as permitted by law.
            </p>

            <h2 className="text-2xl font-bold mt-10">Contact Us</h2>
            <p>
              If you have any questions about these Terms, you can contact us at:
            </p>
            <p>
              <a href="mailto:contact@namedesignai.com" className="dark:text-gray-200 underline">
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
