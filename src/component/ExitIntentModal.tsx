import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

const STORAGE_KEY = "exit_intent_dismissed";

// Pages where the modal should never appear
const EXCLUDED_PATHS = new Set([
  "/checkout",
  "/buy-credits",
  "/success",
  "/cancel",
  "/order/success",
  "/order/cancel",
  "/unlock/free-credit",
  "/unlock/result",
]);

export function ExitIntentModal() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const triggered = useRef(false);

  useEffect(() => {
    if (EXCLUDED_PATHS.has(router.pathname)) return;

    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      if (triggered.current) return;
      // Only trigger when cursor exits through the top of the viewport
      if (e.clientY > 20) return;

      triggered.current = true;
      setVisible(true);

      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [router.pathname]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/email-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "exit-intent" }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        const data = (await res.json()) as { error?: string };
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-900">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {status === "success" ? (
          <div className="text-center">
            <div className="mb-4 text-5xl">🎨</div>
            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              You&apos;re on the list!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              We&apos;ll send design ideas and new styles your way. No spam, unsubscribe anytime.
            </p>
            <button
              onClick={handleDismiss}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Continue browsing
            </button>
          </div>
        ) : (
          <>
            <div className="mb-1 text-4xl">✉️</div>
            <h2 className="mb-1 mt-2 text-xl font-bold text-gray-900 dark:text-white">
              Before you go — get design ideas
            </h2>
            <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">
              We occasionally share new name art styles, gift ideas, and creative prompts.
              Drop your email and we&apos;ll send the good stuff only.
            </p>

            <form onSubmit={(e) => { void handleSubmit(e); }} noValidate>
              <label htmlFor="exit-email" className="sr-only">
                Email address
              </label>
              <input
                id="exit-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === "loading"}
                className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />

              {status === "error" && (
                <p className="mb-2 text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {status === "loading" ? "Saving…" : "Send me design ideas"}
              </button>
            </form>

            <button
              onClick={handleDismiss}
              className="mt-3 w-full text-center text-xs text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
            >
              No thanks
            </button>
          </>
        )}
      </div>
    </div>
  );
}
