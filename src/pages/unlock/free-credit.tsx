/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { CPX_DAILY_REWARD_CREDITS } from "~/config/cpa";

export default function FreeCreditUnlock() {
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [dailyLimitMessage, setDailyLimitMessage] = useState<string | null>(null);
  const defaultTotalCreditsAfterReward = CPX_DAILY_REWARD_CREDITS + 1;

  const unlock = async () => {
    setUnlocking(true);
    setError(null);
    setRetryAfter(null);
    setDailyLimitMessage(null);

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

      if (!res.ok && data?.code === "DAILY_LIMIT") {
        setDailyLimitMessage(
          data?.error ??
            "You already claimed free credits today. Try again tomorrow or buy credits.",
        );
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
        <title>Get {CPX_DAILY_REWARD_CREDITS} Extra Credits - Name Design AI</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-[#f8f3ea] via-[#f1f7f2] to-[#eef6ff] dark:from-[#0b111a] dark:via-[#0b1524] dark:to-[#0a1a2b]">
        <div className="relative w-full max-w-3xl">
          <div className="pointer-events-none absolute -top-10 -left-12 h-40 w-40 rounded-full bg-[#ffe6c7] blur-2xl opacity-70 dark:bg-[#2a1f18]" />
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-[#cfe9ff] blur-2xl opacity-70 dark:bg-[#0b2a3f]" />

          <div className="relative rounded-3xl border border-black/10 bg-white/90 p-8 shadow-[0_25px_60px_-30px_rgba(0,0,0,0.35)] backdrop-blur md:p-10 dark:border-white/10 dark:bg-[#0f172a]/90 dark:shadow-[0_25px_60px_-30px_rgba(0,0,0,0.7)]">
            <div className="flex flex-col gap-6 text-left">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-slate-300">
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 dark:border-white/15 dark:bg-slate-900/60">
                  No payment required
                </span>
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 dark:border-white/15 dark:bg-slate-900/60">
                  Optional
                </span>
                <span className="rounded-full border border-black/10 bg-white px-3 py-1 dark:border-white/15 dark:bg-slate-900/60">
                  Instant credit after completion
                </span>
              </div>

              {/* Header */}
              <h1
                className="text-4xl font-semibold text-gray-900 md:text-5xl dark:text-white"
                style={{ fontFamily: '"Cormorant Garamond", "Times New Roman", serif' }}
              >
                Get {CPX_DAILY_REWARD_CREDITS} extra credits
              </h1>

              <p className="text-base text-gray-700 md:text-lg dark:text-slate-200">
                Complete an optional survey and receive {CPX_DAILY_REWARD_CREDITS} extra
                credits immediately after a successful completion. If you are on the
                default 1-credit balance, that brings you to {defaultTotalCreditsAfterReward}{" "}
                total credits.
              </p>

              {/* What it unlocks */}
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">
                  What {CPX_DAILY_REWARD_CREDITS} extra credits unlock
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-slate-900/60">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {CPX_DAILY_REWARD_CREDITS} standard Name Art designs
                    </p>
                    <p className="mt-2 text-xs text-gray-600 dark:text-slate-300">
                      Try multiple styles or names without paying.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-slate-900/60">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Or {CPX_DAILY_REWARD_CREDITS} background removals
                    </p>
                    <p className="mt-2 text-xs text-gray-600 dark:text-slate-300">
                      Clean exports for print, editing, or sharing.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-slate-900/60">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {defaultTotalCreditsAfterReward} total credits on a new account
                    </p>
                    <p className="mt-2 text-xs text-gray-600 dark:text-slate-300">
                      Enough for 1 Flux Dev generation if you start from the default balance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-black/10 bg-[#f7f7f2] p-4 text-sm text-gray-700 md:grid-cols-3 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">1.</span> Start the survey
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">2.</span> Complete it successfully
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">3.</span> Credits are added instantly
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={unlock}
                disabled={unlocking}
                className="w-full rounded-2xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-brand-700 disabled:opacity-60"
              >
                {unlocking ? "Opening survey..." : `Get ${CPX_DAILY_REWARD_CREDITS} Extra Credits`}
              </button>

              {/* Login required */}
              {error === "login_required" && (
                <p className="text-sm text-gray-700 dark:text-slate-200">
                  Please{" "}
                  <Link href="/api/auth/signin" className="text-brand-700 underline">
                    sign in
                  </Link>{" "}
                  to earn {CPX_DAILY_REWARD_CREDITS} extra credits.
                </p>
              )}

              {/* Cooldown */}
              {error === "cooldown" && retryAfter !== null && (
                <p className="text-sm text-gray-700 dark:text-slate-200">
                  You already started a survey.
                  Try again in {retryAfter} minute{retryAfter > 1 ? "s" : ""}.
                </p>
              )}

              {dailyLimitMessage && (
                <p className="text-sm text-gray-700 dark:text-slate-200">
                  {dailyLimitMessage}
                </p>
              )}

              {/* Other errors */}
              {error &&
                error !== "login_required" &&
                error !== "cooldown" &&
                !dailyLimitMessage && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

              {/* Footer note */}
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Surveys are optional and provided by a trusted research partner.
                VPNs and proxies must be disabled to ensure survey availability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
