/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

type Result =
  | "loading"
  | "completed"
  | "screenout_no_bonus"
  | "rejected"
  | "pending"
  | "error";

const NAME_DESIGN_TOOLS = [
  {
    href: "/name-art",
    title: "Name Art Generator",
    description: "Turn any name into beautiful personalized artwork.",
  },
  {
    href: "/arabic-name-art",
    title: "Arabic Name Art",
    description: "Create authentic Arabic calligraphy designs.",
  },
  {
    href: "/couples-art",
    title: "Couples Name Art",
    description: "Design romantic couple name artwork.",
  },
];

export default function FreeCreditResult() {
  const [result, setResult] = useState<Result>("loading");

  useEffect(() => {
    fetch("/api/cpa/cpx/result", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data || data.error) {
          setResult("error");
          return;
        }

        if (data.status === "approved") {
          setResult("completed");
          return;
        }

        if (data.status === "screenout") {
          setResult("screenout_no_bonus");
          return;
        }

        if (data.status === "rejected") {
          setResult("rejected");
          return;
        }

        if (data.status === "pending") {
          setResult("pending");
          return;
        }

        setResult("error");
      })
      .catch(() => setResult("error"));
  }, []);

  return (
    <>
      <Head>
        <title>Free Credit Result – Name Design AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">

          {result === "loading" && (
            <p className="text-gray-600">Checking your reward…</p>
          )}

          {result === "pending" && (
            <>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Verifying your reward…
              </h1>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                This usually takes a few moments. Please refresh shortly.
              </p>
            </>
          )}

          {result === "completed" && (
            <>
              <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
                🎉 Free Credit Unlocked
              </h1>
              <p className="mt-3 text-gray-600 dark:text-gray-300">
                Your account has been credited. You can now continue creating.
              </p>

              <div className="mt-6 grid gap-4">
                {NAME_DESIGN_TOOLS.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="block rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left hover:border-blue-600 transition"
                  >
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {tool.description}
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}

          {result === "screenout_no_bonus" && (
            <>
              <h1 className="text-2xl font-bold text-gray-700">
                Survey Not a Match
              </h1>
              <p className="mt-3 text-gray-600">
                This survey wasn’t the right fit for your profile.
                This is normal and happens often.
              </p>

              <Link
                href="/unlock/free-credit"
                className="inline-block mt-6 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Try Another Survey
              </Link>
            </>
          )}

          {result === "rejected" && (
            <>
              <h1 className="text-2xl font-bold text-red-600">
                Reward Reversed
              </h1>
              <p className="mt-3 text-gray-600">
                This reward was canceled by the survey provider.
              </p>

              <Link
                href="/dashboard"
                className="inline-block mt-6 px-6 py-3 rounded-xl bg-gray-700 text-white"
              >
                Back to Dashboard
              </Link>
            </>
          )}

          {result === "error" && (
            <>
              <h1 className="text-2xl font-bold text-red-600">
                Something went wrong
              </h1>
              <p className="mt-3 text-gray-600">
                We couldn’t verify your reward. Please try again later.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
