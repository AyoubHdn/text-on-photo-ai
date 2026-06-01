import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { useBuyCredits } from "~/hook/useBuyCredits";
import { CPX_DAILY_REWARD_CREDITS } from "~/config/cpa";
import { trackEvent } from "~/lib/ga";
import { getFunnelContext } from "~/lib/tracking/funnel";

type UpgradeContext = "generate" | "preview" | "remove_background";

type Props = {
  isOpen: boolean;
  requiredCredits: number;
  currentCredits: number;
  context: UpgradeContext;
  sourcePage?: string;
  country?: string;
  onSuccess: () => void;
  onClose: () => void;
};

type OfferTitleKey = "starterTitle" | "popularTitle" | "bestValueTitle";
type OfferSubtitleKey = "starterSubtitle" | "popularSubtitle" | "bestValueSubtitle";

type Offer = {
  titleKey: OfferTitleKey;
  subtitleKey: OfferSubtitleKey;
  plan: "starter" | "pro" | "elite";
  credits: number;
  price: number;
  popular?: boolean;
};

type LocalizedCopy = {
  title: string;
  neededCredits: (credits: string) => string;
  context: Record<UpgradeContext, string>;
  instantActivation: string;
  offerTitles: Record<OfferTitleKey | OfferSubtitleKey, string>;
  mostPopular: string;
  cheaperWay: string;
  surveyUnlock: (credits: string) => string;
  surveyButton: (credits: string) => string;
  checkingPaymentStatus: string;
  paymentNotDetected: string;
  paymentDetected: string;
  openingSecurePayment: string;
  checkoutOpened: string;
  checkoutStartFailed: string;
  surveyOpenFailedOrBuy: string;
  surveyOpenFailed: string;
  openingSurvey: string;
  completedPayment: string;
  checking: string;
  securePayment: string;
  instantCreditActivation: string;
  cardsAccepted: string;
};

const OFFERS: Offer[] = [
  {
    titleKey: "starterTitle",
    subtitleKey: "starterSubtitle",
    plan: "starter",
    credits: 20,
    price: 1.99,
  },
  {
    titleKey: "popularTitle",
    subtitleKey: "popularSubtitle",
    plan: "pro",
    credits: 50,
    price: 3.99,
    popular: true,
  },
  {
    titleKey: "bestValueTitle",
    subtitleKey: "bestValueSubtitle",
    plan: "elite",
    credits: 100,
    price: 6.99,
  },
];

const ENGLISH_COPY: LocalizedCopy = {
  title: "Upgrade Credits",
  neededCredits: (credits) => `You need ${credits} more to continue.`,
  context: {
    generate: "You're just one step away from creating your personalized design.",
    preview: "See your design on a real product before ordering.",
    remove_background: "Make your design print-ready in one click.",
  },
  instantActivation: "Instant activation after payment.",
  offerTitles: {
    starterTitle: "Starter Boost",
    starterSubtitle: "Great for quick top-ups",
    popularTitle: "Popular Choice",
    popularSubtitle: "Best for regular sessions",
    bestValueTitle: "Best Value",
    bestValueSubtitle: "Maximum flexibility",
  },
  mostPopular: "Most Popular",
  cheaperWay: "Need a cheaper way to continue?",
  surveyUnlock: (credits) =>
    `Unlock ${credits} with a survey. Available once per day.`,
  surveyButton: (credits) => `Unlock ${credits}`,
  checkingPaymentStatus: "Checking payment status...",
  paymentNotDetected:
    "Payment not detected yet. Please complete checkout, then try again.",
  paymentDetected: "Payment detected. Activating credits...",
  openingSecurePayment: "Opening secure payment...",
  checkoutOpened:
    "Checkout opened in a new tab. Complete payment, credits activate instantly.",
  checkoutStartFailed: "Could not start checkout. Please try again.",
  surveyOpenFailedOrBuy:
    "Could not open the survey right now. Please try again or buy credits.",
  surveyOpenFailed: "Could not open the survey right now. Please try again.",
  openingSurvey: "Opening survey...",
  completedPayment: "I completed payment",
  checking: "Checking...",
  securePayment: "Secure payment via Stripe",
  instantCreditActivation: "Instant credit activation",
  cardsAccepted: "All major cards accepted",
};

function fireMetaCustomEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof maybeFbq === "function") {
    maybeFbq("trackCustom", eventName, params ?? {});
  }
}

function isArabicSurveyEligible(params: {
  context: UpgradeContext;
  sourcePage?: string;
}) {
  return (
    params.context === "generate" &&
    (params.sourcePage ?? "").trim().toLowerCase() === "arabic-calligraphy-generator"
  );
}

function formatWesternNumber(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1).replace(/\.0$/, "");
}

function formatEnglishCredits(value: number) {
  const unit = value === 1 ? "credit" : "credits";
  return `${formatWesternNumber(value)} ${unit}`;
}

function formatArabicCredits(value: number) {
  return `${formatWesternNumber(value)} رصيد`;
}

export function CreditUpgradeModal({
  isOpen,
  requiredCredits,
  currentCredits,
  context,
  sourcePage,
  country,
  onSuccess,
  onClose,
}: Props) {
  const router = useRouter();
  const { buyCredits } = useBuyCredits();
  const creditsQuery = api.user.getCredits.useQuery(undefined, {
    enabled: isOpen,
    refetchOnWindowFocus: true,
  });
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | "elite" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isSurveyUnlocking, setIsSurveyUnlocking] = useState(false);
  const [surveyMessage, setSurveyMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const hasFiredViewedRef = useRef(false);
  const hasFiredCompletedRef = useRef(false);
  const baselineCreditsRef = useRef<number>(currentCredits);
  const isArabic = router.pathname.startsWith("/ar/");

  const needed = useMemo(() => {
    const delta = requiredCredits - currentCredits;
    return delta > 0 ? delta : 0;
  }, [requiredCredits, currentCredits]);

  const copy = useMemo<LocalizedCopy>(() => {
    if (!isArabic) {
      return ENGLISH_COPY;
    }

    return {
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      title: "ترقية الرصيد",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      neededCredits: (credits) => `تحتاج إلى ${credits} إضافي للمتابعة.`,
      context: {
        // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
        generate: "أنت على بُعد خطوة واحدة من إنشاء تصميمك المخصص.",
        // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
        preview: "شاهد تصميمك على منتج حقيقي قبل إتمام الطلب.",
        // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
        remove_background: "اجعل تصميمك جاهزًا للطباعة بضغطة واحدة.",
      },
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      instantActivation: "يتم تفعيل الرصيد فورًا بعد الدفع.",
      offerTitles: {
        // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
        starterTitle: "باقة البداية",
        // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
        starterSubtitle: "مناسبة للشحن السريع",
        // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
        popularTitle: "الخيار الأكثر شيوعًا",
        // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
        popularSubtitle: "الأفضل للجلسات المتكررة",
        // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
        bestValueTitle: "أفضل قيمة",
        // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
        bestValueSubtitle: "أكبر مرونة",
      },
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      mostPopular: "الأكثر شيوعًا",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      cheaperWay: "هل تريد طريقة أقل تكلفة للمتابعة؟",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      surveyUnlock: (credits) =>
        `احصل على ${credits} إضافي عبر استبيان. متاح مرة واحدة يوميًا.`,
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      surveyButton: (credits) => `احصل على ${credits} إضافي`,
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      checkingPaymentStatus: "جارٍ التحقق من حالة الدفع...",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      paymentNotDetected:
        "لم يتم رصد الدفع بعد. يرجى إكمال الدفع ثم المحاولة مرة أخرى.",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      paymentDetected: "تم رصد الدفع. جارٍ تفعيل الرصيد...",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      openingSecurePayment: "جارٍ فتح صفحة الدفع الآمنة...",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      checkoutOpened:
        "تم فتح صفحة الدفع في علامة تبويب جديدة. أكمل الدفع وسيتم تفعيل الرصيد فورًا.",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      checkoutStartFailed: "تعذر بدء الدفع. يرجى المحاولة مرة أخرى.",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      surveyOpenFailedOrBuy:
        "تعذر فتح الاستبيان الآن. يرجى المحاولة مرة أخرى أو شراء رصيد.",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      surveyOpenFailed: "تعذر فتح الاستبيان الآن. يرجى المحاولة مرة أخرى.",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      openingSurvey: "جارٍ فتح الاستبيان...",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      completedPayment: "أكملت الدفع",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      checking: "جارٍ التحقق...",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      securePayment: "دفع آمن عبر Stripe",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      instantCreditActivation: "تفعيل فوري للرصيد",
      // REVIEW_AR: Native-speaker review recommended for this revenue-critical purchase modal copy.
      cardsAccepted: "جميع البطاقات الرئيسية مقبولة",
    };
  }, [isArabic]);

  const neededCreditsLabel = isArabic
    ? formatArabicCredits(needed)
    : formatEnglishCredits(needed);
  const surveyCreditsLabel = isArabic
    ? formatArabicCredits(CPX_DAILY_REWARD_CREDITS)
    : formatEnglishCredits(CPX_DAILY_REWARD_CREDITS);

  const funnelContext = useMemo(
    () =>
      getFunnelContext({
        route: router.pathname,
        sourcePage,
        country: country ?? null,
        productType: "credits",
        query: router.query as Record<string, unknown>,
      }),
    [router.pathname, router.query, sourcePage, country],
  );
  const showArabicSurveyUnlock = useMemo(
    () => isArabicSurveyEligible({ context, sourcePage }),
    [context, sourcePage],
  );

  useEffect(() => {
    if (!isOpen) {
      hasFiredViewedRef.current = false;
      hasFiredCompletedRef.current = false;
      setSelectedPlan(null);
      setIsProcessing(false);
      setIsPolling(false);
      setIsCheckingPayment(false);
      setIsSurveyUnlocking(false);
      setSurveyMessage(null);
      setStatusMessage(null);
      return;
    }

    baselineCreditsRef.current = currentCredits;

    if (!hasFiredViewedRef.current) {
      trackEvent("credit_upgrade_viewed", {
        context,
        user_credits_before_action: currentCredits,
        required_credits: requiredCredits,
        current_credits: currentCredits,
        ...funnelContext,
      });
      fireMetaCustomEvent("credit_upgrade_viewed", {
        context,
        required_credits: requiredCredits,
        ...funnelContext,
      });
      hasFiredViewedRef.current = true;
    }
  }, [isOpen, context, requiredCredits, currentCredits, funnelContext]);

  useEffect(() => {
    if (!isOpen || !isPolling) return;

    const poll = setInterval(() => {
      void creditsQuery.refetch();
    }, 2500);

    return () => clearInterval(poll);
  }, [isOpen, isPolling, creditsQuery]);

  useEffect(() => {
    if (!isOpen || !isPolling) return;

    const updatedCredits = creditsQuery.data ?? currentCredits;
    const baseline = baselineCreditsRef.current;
    if (updatedCredits <= baseline) return;
    const completionKey =
      typeof window !== "undefined" ? window.sessionStorage.getItem("ga4_purchase_credits") : null;
    if (completionKey === "1") {
      setIsPolling(false);
      setIsProcessing(false);
      setStatusMessage(null);
      onClose();
      onSuccess();
      return;
    }

    if (!hasFiredCompletedRef.current) {
      const selectedOffer = OFFERS.find((offer) => offer.plan === selectedPlan);
      trackEvent("credit_purchase_completed", {
        context,
        plan: selectedPlan ?? null,
        credits: selectedOffer?.credits ?? null,
        value: selectedOffer?.price ?? null,
        previous_credits: baseline,
        updated_credits: updatedCredits,
        ...funnelContext,
      });
      fireMetaCustomEvent("credit_purchase_completed", {
        context,
        plan: selectedPlan ?? null,
        credits: selectedOffer?.credits ?? null,
        value: selectedOffer?.price ?? null,
        previous_credits: baseline,
        updated_credits: updatedCredits,
        ...funnelContext,
      });
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("ga4_purchase_credits", "1");
      }
      hasFiredCompletedRef.current = true;
    }

    setIsPolling(false);
    setIsProcessing(false);
    setStatusMessage(null);
    onClose();
    onSuccess();
  }, [
    isOpen,
    isPolling,
    creditsQuery.data,
    currentCredits,
    onClose,
    onSuccess,
    context,
    funnelContext,
    selectedPlan,
  ]);

  const handleManualPaymentCheck = async () => {
    if (!isOpen) return;
    setIsCheckingPayment(true);
    setStatusMessage(copy.checkingPaymentStatus);
    try {
      const result = await creditsQuery.refetch();
      const latestCredits = result.data ?? currentCredits;
      if (latestCredits <= baselineCreditsRef.current) {
        setStatusMessage(copy.paymentNotDetected);
      }
    } finally {
      setIsCheckingPayment(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (router.query.credits_success !== "1") return;
    setIsPolling(true);
    setStatusMessage(copy.paymentDetected);
  }, [copy.paymentDetected, isOpen, router.query.credits_success]);

  if (!isOpen) return null;

  const handleSelectPlan = async (offer: Offer) => {
    try {
      setSelectedPlan(offer.plan);
      setIsProcessing(true);
      setStatusMessage(copy.openingSecurePayment);

      trackEvent("credit_purchase_initiated", {
        context,
        plan: offer.plan,
        credits: offer.credits,
        value: offer.price,
        user_credits_before_action: currentCredits,
        required_credits: requiredCredits,
        ...funnelContext,
      });
      fireMetaCustomEvent("credit_purchase_initiated", {
        context,
        plan: offer.plan,
        credits: offer.credits,
        value: offer.price,
        required_credits: requiredCredits,
        ...funnelContext,
      });

      await buyCredits(offer.plan, {
        purchaseContext: context,
        returnPath: router.asPath,
        openInNewTab: true,
        sourcePage: funnelContext.source_page,
        country: funnelContext.country ?? undefined,
        paidTrafficUser: funnelContext.traffic_type === "paid",
      });

      setIsProcessing(false);
      setStatusMessage(copy.checkoutOpened);
      setIsPolling(true);
    } catch (error) {
      console.error("[CREDIT_UPGRADE_MODAL]", error);
      setStatusMessage(copy.checkoutStartFailed);
      setIsProcessing(false);
    }
  };

  const handleArabicSurveyUnlock = async () => {
    try {
      setIsSurveyUnlocking(true);
      setSurveyMessage(null);

      const res = await fetch("/api/cpa/cpx/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = (await res.json()) as {
        code?: string;
        error?: string;
        redirectUrl?: string;
      };

      if (!res.ok) {
        setSurveyMessage(data.error ?? copy.surveyOpenFailedOrBuy);
        return;
      }

      if (!data.redirectUrl) {
        setSurveyMessage(copy.surveyOpenFailed);
        return;
      }

      const opened = window.open(data.redirectUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error("[ARABIC_SURVEY_UNLOCK]", error);
      setSurveyMessage(copy.surveyOpenFailed);
    } finally {
      setIsSurveyUnlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
      <div
        dir={isArabic ? "rtl" : "ltr"}
        lang={isArabic ? "ar" : "en"}
        className={`w-full max-w-2xl rounded-xl border border-brand-900 bg-gray-950 text-white shadow-2xl ${
          isArabic ? "text-right" : "text-left"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h3 className="text-lg font-semibold">{copy.title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={isProcessing}
          >
            X
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-brand-300">{copy.neededCredits(neededCreditsLabel)}</p>
          <p className="mt-2 text-sm text-gray-300">{copy.context[context]}</p>
          <p className="mt-2 text-xs text-gray-400">{copy.instantActivation}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {OFFERS.map((offer) => (
              <button
                key={offer.plan}
                type="button"
                onClick={() => void handleSelectPlan(offer)}
                disabled={isProcessing}
                className={`relative rounded-lg border p-3 transition ${
                  isArabic ? "text-right" : "text-left"
                } ${
                  offer.popular
                    ? "border-brand-500 bg-brand-950/50"
                    : "border-gray-700 bg-gray-900 hover:border-brand-500"
                } ${selectedPlan === offer.plan ? "ring-2 ring-brand-500" : ""}`}
              >
                {offer.popular && (
                  <span
                    className={`absolute -top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white ${
                      isArabic ? "right-3" : "left-3"
                    }`}
                  >
                    {copy.mostPopular}
                  </span>
                )}
                <div className="text-sm font-semibold">{copy.offerTitles[offer.titleKey]}</div>
                <div className="mt-1 text-xs text-gray-300">
                  {copy.offerTitles[offer.subtitleKey]}
                </div>
                <div className="mt-3 text-sm font-medium">
                  {isArabic
                    ? formatArabicCredits(offer.credits)
                    : formatEnglishCredits(offer.credits)}
                </div>
                <div className="text-xl font-bold">${offer.price.toFixed(2)}</div>
              </button>
            ))}
          </div>

          {statusMessage && (
            <div className="mt-4 rounded-lg border border-brand-900 bg-brand-950/40 px-3 py-2 text-xs text-brand-200">
              {statusMessage}
            </div>
          )}

          {showArabicSurveyUnlock && (
            <div className="mt-4 rounded-lg border border-emerald-900 bg-emerald-950/30 px-4 py-3">
              <div className="text-sm font-semibold text-emerald-200">{copy.cheaperWay}</div>
              <div className="mt-1 text-xs text-emerald-100/90">
                {copy.surveyUnlock(surveyCreditsLabel)}
              </div>
              <button
                type="button"
                onClick={() => void handleArabicSurveyUnlock()}
                disabled={isSurveyUnlocking}
                className="mt-3 rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
              >
                {isSurveyUnlocking ? copy.openingSurvey : copy.surveyButton(surveyCreditsLabel)}
              </button>
              {surveyMessage && <div className="mt-2 text-xs text-emerald-100">{surveyMessage}</div>}
            </div>
          )}

          {isPolling && (
            <button
              type="button"
              onClick={() => void handleManualPaymentCheck()}
              disabled={isCheckingPayment}
              className="mt-3 rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-200 hover:border-brand-500"
            >
              {isCheckingPayment ? copy.checking : copy.completedPayment}
            </button>
          )}

          <div className="mt-4 grid gap-1 text-xs text-gray-400">
            <div>{copy.securePayment}</div>
            <div>{copy.instantCreditActivation}</div>
            <div>{copy.cardsAccepted}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
