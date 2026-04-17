import React from "react";
import { useRouter } from "next/router";

import { SeoHead } from "~/component/SeoHead";

const CancelPage: React.FC = () => {
  const router = useRouter();

  return (
    <>
      <SeoHead
        title="Credits Purchase Canceled | Name Design AI"
        description="Credits purchase canceled page."
        path="/cancel"
        noindex
      />
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-cream-50 border border-cream-200 shadow-lg rounded-lg p-8 text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Payment Canceled</h1>
          <p className="text-gray-600 mb-6">
            It seems like you canceled your payment. You can try again anytime.
          </p>
          <button
            className="bg-brand-600 text-white py-2 px-4 rounded-lg hover:bg-brand-700 transition"
            onClick={() => {
              void router.push("/buy-credits");
            }}
          >
            Return to Buy Credits
          </button>
        </div>
      </div>
    </>
  );
};

export default CancelPage;
