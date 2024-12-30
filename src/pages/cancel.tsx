import React from "react";
import { useRouter } from "next/router";

const CancelPage: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-gray-50 shadow-lg rounded-lg p-8 text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Payment Canceled</h1>
        <p className="text-gray-600 mb-6">
          It seems like you canceled your payment. Don’t worry, you can try again anytime.
        </p>
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
          onClick={() => { void router.push("/buy-credits")}}
        >
          Return to Buy Credits
        </button>
      </div>
    </div>
  );
};

export default CancelPage;
