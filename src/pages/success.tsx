import React, { useEffect } from "react";
import { useRouter } from "next/router";

const SuccessPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Inject Google Ads conversion tracking script
    const gtagEvent = () => {
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag('event', 'conversion', {
          'send_to': 'AW-794176708/x-pvCNj1_IMaEMTZ2PoC',
          'value': 1.0,
          'currency': 'MAD',
          'transaction_id': '' // Pass the transaction ID if available
        });
      }
    };
    
    gtagEvent();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-50 shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-green-500 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your credits have been added to your account.
        </p>
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
          onClick={() => { void router.push("/") }}
        >
          Start Generating Designs
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
