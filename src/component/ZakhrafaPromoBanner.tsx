import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useLocale } from "~/hook/useLocale";
import {
  isAndroidUserAgent,
  shouldShowZakhrafaPromo,
} from "~/lib/zakhrafaPromo";

const DISMISSED_SESSION_KEY = "zakhrafaPromoDismissed";

export function ZakhrafaPromoBanner() {
  const router = useRouter();
  const { locale: currentLanguage } = useLocale();
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    setIsAndroid(isAndroidUserAgent(window.navigator.userAgent));

    try {
      setIsDismissed(
        window.sessionStorage.getItem(DISMISSED_SESSION_KEY) === "true"
      );
    } catch {
      setIsDismissed(false);
    }
  }, []);

  const dismissBanner = () => {
    setIsDismissed(true);

    try {
      window.sessionStorage.setItem(DISMISSED_SESSION_KEY, "true");
    } catch {
      // The in-memory state still dismisses the banner when storage is blocked.
    }
  };

  if (
    !router.isReady ||
    !isAndroid ||
    isDismissed ||
    !shouldShowZakhrafaPromo(router.pathname, currentLanguage)
  ) {
    return null;
  }

  const bottomPosition =
    router.pathname === "/ramadan-mug-v2"
      ? "bottom-[calc(env(safe-area-inset-bottom)+6rem)]"
      : "bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]";

  return (
    <aside
      dir="rtl"
      aria-label="تطبيق زخرفة للخط العربي"
      className={`fixed inset-x-2 z-40 md:hidden ${bottomPosition}`}
    >
      <div className="mx-auto flex max-w-lg items-center gap-1.5 overflow-hidden rounded-2xl border border-brand-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-sm">
        <Image
          src="/zakhrafa-ai-icon.webp"
          alt="أيقونة تطبيق زخرفة AI"
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-xl"
        />

        <p className="min-w-0 flex-1 whitespace-nowrap text-xs font-semibold text-slate-800 sm:text-sm">
          حوّل اسمك إلى فن عربي ✨
        </p>

        <a
          href="https://ggl.link/zakhrafa-ai"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 sm:px-3 sm:text-sm"
        >
          جرّب الآن
        </a>

        <button
          type="button"
          onClick={dismissBanner}
          aria-label="إغلاق الإعلان"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="h-5 w-5"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
