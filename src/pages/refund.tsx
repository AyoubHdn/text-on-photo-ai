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
            Last updated: <strong>March 4, 2026</strong>
          </p>
          <div className="prose prose-lg mx-auto space-y-8">
            <p>
              This Refund Policy explains how refunds, replacements, and cancellations are handled
              for digital credits and physical products purchased through Name Design AI.
            </p>

            <h2 className="text-2xl font-bold mt-10">1. Digital Credits</h2>
            <p>
              Digital credits are used to access platform features and generation services. Credits
              are generally non-refundable once used, except where required by applicable law.
            </p>

            <h2 className="text-2xl font-bold mt-10">2. Unused Credits</h2>
            <p>
              If credits remain completely unused after purchase, You may contact support to request
              a review. Approval is at our discretion and may depend on account history, fraud checks,
              payment status, and legal requirements in Your region.
            </p>

            <h2 className="text-2xl font-bold mt-10">3. Custom Printed Products</h2>
            <p>
              Custom printed products are made to order. Because items are personalized, they are
              generally non-refundable and non-returnable once production has started, except for
              damaged, defective, or incorrect items.
            </p>

            <h2 className="text-2xl font-bold mt-10">4. Damaged or Incorrect Orders</h2>
            <p>
              If Your order arrives damaged, defective, or does not match the confirmed order details,
              contact us within 14 days of delivery with clear photos and order information. If the
              issue is verified, we may offer a replacement, store credit, or refund.
            </p>

            <h2 className="text-2xl font-bold mt-10">5. Shipping Issues</h2>
            <p>
              Delivery timelines are estimates and may be affected by carriers, customs, or external
              events. Refunds are not guaranteed for carrier delays. For lost shipments confirmed by
              the carrier or fulfillment partner, we will review and provide an appropriate resolution.
            </p>

            <h2 className="text-2xl font-bold mt-10">6. Order Cancellation</h2>
            <p>
              Orders may be canceled only before production begins. Once an order enters production
              or shipping, cancellation is no longer possible. If You need help urgently, contact
              support as soon as possible after placing Your order.
            </p>

            <h2 className="text-2xl font-bold mt-10">Contact Us</h2>
            <p>
              If you have any questions or concerns about this policy, you can reach us at:
            </p>
            <p>
              <a href="mailto:support@namedesignai.com" className="dark:text-gray-200 underline">
                support@namedesignai.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
};

export default RefundPolicy;
