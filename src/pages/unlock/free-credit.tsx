/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function FreeCreditUnlock() {
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const unlock = async () => {
    setUnlocking(true);
    setError(null);
    setRetryAfter(null);

    try {
      const res = await fetch("/api/cpa/cpx/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (res.status === 401) {
        setError("login_required");
        return;
      }

      if (res.status === 403 && data?.error) {
        setError(data.error);
        return;
      }

      if (!res.ok && data?.retryAfterMinutes) {
        setRetryAfter(data.retryAfterMinutes);
        setError("cooldown");
        return;
      }

      if (!res.ok) {
        throw new Error(data?.error || "Unlock failed");
      }

      window.location.href = data.redirectUrl;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <>
      <Head>
        <title>Get a Free Credit – Name Design AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">

          {/* Header */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Get 1 Free Credit
          </h1>

          <p className="mt-3 text-gray-600 dark:text-gray-300">
            If you can’t buy credits right now, you can earn one instead.
            Complete a short survey and continue creating personalized name art.
          </p>

          {/* What it unlocks */}
          <div className="mt-6 rounded-xl bg-gray-50 dark:bg-gray-900 p-5 text-left">
            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Your free credit can be used to:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Create a personalized name art design</li>
              <li>• Generate Arabic calligraphy for any name</li>
              <li>• Try a romantic couples name art style</li>
            </ul>
          </div>

          {/* CTA */}
          <button
            onClick={unlock}
            disabled={unlocking}
            className="mt-8 w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60"
          >
            {unlocking ? "Opening survey…" : "Earn Free Credit"}
          </button>

          {/* Login required */}
          {error === "login_required" && (
            <p className="mt-4 text-sm text-gray-600">
              Please{" "}
              <Link href="/api/auth/signin" className="text-blue-600 underline">
                sign in
              </Link>{" "}
              to earn free credits.
            </p>
          )}

          {/* Cooldown */}
          {error === "cooldown" && retryAfter !== null && (
            <p className="mt-4 text-sm text-gray-600">
              You already started a survey.
              Try again in {retryAfter} minute{retryAfter > 1 ? "s" : ""}.
            </p>
          )}

          {/* Other errors */}
          {error &&
            error !== "login_required" &&
            error !== "cooldown" && (
              <p className="mt-4 text-sm text-red-500">{error}</p>
            )}

          {/* Footer note */}
          <p className="mt-6 text-xs text-gray-500">
            Surveys are optional and provided by a trusted research partner.
            VPNs and proxies must be disabled to ensure survey availability.
          </p>
        </div>
      </div>
    </>
  );
}
