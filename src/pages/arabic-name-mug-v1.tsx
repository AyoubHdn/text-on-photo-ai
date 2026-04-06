import { type NextPage } from "next";
import Head from "next/head";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CreditUpgradeModal } from "~/component/Credits/CreditUpgradeModal";
import { ARABIC_NAME_MUG_V1_STYLES } from "~/config/arabicNameMugV1Styles";
import {
  type ArabicNameMugGiftIntent,
  buildArabicNameMugPrompt,
} from "~/lib/arabicNameMugPrompt";
import { trackEvent } from "~/lib/ga";
import { createGenerationRequestId } from "~/lib/generationRequest";
import { getFunnelContext } from "~/lib/tracking/funnel";
import { api } from "~/utils/api";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type PreviewVariant = "original" | "transparent";

type SavedState = {
  step: Step;
  giftIntent: ArabicNameMugGiftIntent | "";
  name: string;
  styleId: string;
  designUrl: string | null;
  transparentUrl: string | null;
  useTransparentDesign: boolean;
  hasFree: boolean;
  email: string;
  mockupOriginal?: string | null;
  mockupTransparent?: string | null;
  originalMockupUrl?: string | null;
  transparentMockupUrl?: string | null;
  mockupUrl?: string | null;
  mockupSourceUrl?: string | null;
  freeGenerationUsed?: boolean;
  generatedGiftIntent?: ArabicNameMugGiftIntent | "";
  generatedName?: string;
  generatedStyleId?: string;
};

const SOURCE_PAGE = "arabic-name-mug-v1";
const STORAGE_KEY = `${SOURCE_PAGE}:funnel:v1`;
const REGEN_CREDITS = 4;
const MUG_VARIANT_ID = 1320;
const GIFT_INTENTS: ArabicNameMugGiftIntent[] = [
  "Me",
  "My Husband",
  "My Wife",
  "My Mom",
  "Someone Special",
];
const STEP_NAMES: Record<Step, string> = {
  1: "intro",
  2: "gift_intent",
  3: "name",
  4: "style",
  5: "generation",
  6: "review",
  7: "checkout",
};
const STEP_TITLES: Record<Step, string> = {
  1: "Start",
  2: "Gift Intent",
  3: "Enter Name",
  4: "Choose Style",
  5: "Generating",
  6: "Review Design",
  7: "Mug Preview",
};
const GIFT_INTENT_COPY: Record<ArabicNameMugGiftIntent, string> = {
  Me: "Create your own Arabic name mug",
  "My Husband": "Create a thoughtful personalized gift for your husband",
  "My Wife": "Create a beautiful personalized gift for your wife",
  "My Mom": "Create a meaningful personalized gift for your mom",
  "Someone Special": "Create a personalized gift for someone special",
};
const DESIGN_LOADING_STEPS = [
  "Generating Arabic calligraphy",
  "Balancing the composition",
  "Refining fine details",
  "Preparing your final design",
] as const;
const DESIGN_PROGRESS_SEQUENCE = [
  12, 16, 21, 27, 34, 41, 49, 57, 65, 72, 79, 85, 90, 94, 97,
] as const;
const PREVIEW_PROGRESS_SEQUENCE = [12, 18, 26, 35, 46, 58, 69, 79, 88, 94, 98] as const;
const SURFACE_CARD_CLASS = "rounded-2xl border border-gray-200 bg-[#F8F8F8] p-4 shadow-sm";
const WHITE_CARD_CLASS = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm";
const PRIMARY_BUTTON_CLASS =
  "inline-flex w-full items-center justify-center rounded-xl bg-[#2563EB] px-4 py-4 text-base font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-50";
const SECONDARY_BUTTON_CLASS =
  "inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-4 text-base font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

type PreviewTestimonial = {
  quote: string;
  author: string;
  detail: string;
};

const PREVIEW_TESTIMONIAL_IMAGES = [
  {
    src: "/images/products/Ahmed.webp",
    alt: "Arabic name mug customer order example with the name Ahmed",
  },
  {
    src: "/images/products/Yusuf.webp",
    alt: "Arabic name mug customer order example with the name Yusuf",
  },
  {
    src: "/images/products/Omar.webp",
    alt: "Arabic name mug customer order example with the name Omar",
  },
  {
    src: "/images/products/ramadan.webp",
    alt: "Arabic personalized mug product example",
  },
] as const;

const PREVIEW_TESTIMONIALS: Record<ArabicNameMugGiftIntent, readonly PreviewTestimonial[]> = {
  Me: [
    {
      quote: "My name looked elegant in Arabic and the mug felt much more premium than I expected.",
      author: "Nadia",
      detail: "Ordered for herself",
    },
    {
      quote: "The preview matched the final mug really well. It felt personal from the first look.",
      author: "Samira",
      detail: "Gifted herself a morning mug",
    },
    {
      quote: "I wanted something different from the usual custom gifts and this felt meaningful.",
      author: "Layla",
      detail: "Keeps it on her desk",
    },
  ],
  "My Husband": [
    {
      quote: "My husband loved seeing his name in Arabic. It felt thoughtful without being overcomplicated.",
      author: "Mariam",
      detail: "Gift for her husband",
    },
    {
      quote: "The custom calligraphy made it feel like a real keepsake, not just another printed mug.",
      author: "Sahar",
      detail: "Anniversary surprise",
    },
    {
      quote: "I ordered it as a small romantic gift and he used it the next morning right away.",
      author: "Hiba",
      detail: "Personal gift buyer",
    },
  ],
  "My Wife": [
    {
      quote: "My wife smiled the second she saw her name. The Arabic lettering made it feel extra special.",
      author: "Omar",
      detail: "Gift for his wife",
    },
    {
      quote: "The preview gave me confidence before checkout and the final result looked beautiful.",
      author: "Youssef",
      detail: "Ordered for a surprise gift",
    },
    {
      quote: "It felt personal, elegant, and easy to create in just a few minutes.",
      author: "Karim",
      detail: "First-time custom gift buyer",
    },
  ],
  "My Mom": [
    {
      quote: "Seeing my mom's name in Arabic made the gift feel warm and respectful at the same time.",
      author: "Amina",
      detail: "Gift for her mom",
    },
    {
      quote: "The design looked graceful and the mug turned into one of those gifts she actually keeps using.",
      author: "Rania",
      detail: "Family gift order",
    },
    {
      quote: "I wanted something meaningful but simple, and this was exactly that.",
      author: "Imane",
      detail: "Birthday gift buyer",
    },
  ],
  "Someone Special": [
    {
      quote: "It felt like a unique gift idea and the Arabic calligraphy made it stand out instantly.",
      author: "Salma",
      detail: "Gift for someone special",
    },
    {
      quote: "The personalized preview helped me feel sure before ordering. It looked thoughtful and polished.",
      author: "Adel",
      detail: "Custom gift shopper",
    },
    {
      quote: "I wanted a gift that felt personal without being generic, and this did the job perfectly.",
      author: "Nour",
      detail: "Ordered for a loved one",
    },
  ],
};

const PREVIEW_SOCIAL_PROOF_COPY: Record<ArabicNameMugGiftIntent, string> = {
  Me: "People creating an Arabic name mug for themselves say the finished result feels premium and personal.",
  "My Husband":
    "Shoppers creating a personalized Arabic mug for their husbands often mention how thoughtful it feels right away.",
  "My Wife":
    "People ordering for their wives usually want something romantic, elegant, and ready to gift.",
  "My Mom":
    "Customers gifting their moms often choose this because it feels meaningful without being overdone.",
  "Someone Special":
    "Buyers coming through this flow usually want a gift that feels personal, polished, and easy to order.",
};

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const getDesignStepProgress = (stepIndex: number, overallProgress: number) => {
  const stepSize = 100 / DESIGN_LOADING_STEPS.length;
  const relativeProgress = ((overallProgress - stepSize * stepIndex) / stepSize) * 100;
  return Math.max(0, Math.min(100, relativeProgress));
};

const imageIdFromUrl = (value: string) => {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  } catch {
    const parts = value.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  }
};

const ArabicNameMugV1Page: NextPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user?.id);
  const utils = api.useContext();
  const credits = api.user.getCredits.useQuery(undefined, { enabled: isLoggedIn });
  const genGuest = api.generate.generatePaidMugGuestDesign.useMutation();
  const genIcon = api.generate.generateIcon.useMutation();
  const capturePaidTrafficLead = api.user.capturePaidTrafficLead.useMutation();
  const createOrder = api.productOrder.createPendingOrder.useMutation();
  const captureCheckoutEmail = api.productOrder.captureCheckoutEmail.useMutation();

  const [step, setStep] = useState<Step>(1);
  const [giftIntent, setGiftIntent] = useState<ArabicNameMugGiftIntent | "">("");
  const [name, setName] = useState("");
  const [styleId, setStyleId] = useState(ARABIC_NAME_MUG_V1_STYLES[0]?.id ?? "");
  const [designUrl, setDesignUrl] = useState<string | null>(null);
  const [transparentUrl, setTransparentUrl] = useState<string | null>(null);
  const [useTransparentDesign, setUseTransparentDesign] = useState(true);
  const [hasFree, setHasFree] = useState(false);
  const [freeGenerationUsed, setFreeGenerationUsed] = useState(false);
  const [mockupOriginal, setMockupOriginal] = useState<string | null>(null);
  const [mockupTransparent, setMockupTransparent] = useState<string | null>(null);
  const [generatedGiftIntent, setGeneratedGiftIntent] = useState<
    ArabicNameMugGiftIntent | ""
  >("");
  const [generatedName, setGeneratedName] = useState("");
  const [generatedStyleId, setGeneratedStyleId] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busyDesign, setBusyDesign] = useState(false);
  const [busyPreview, setBusyPreview] = useState(false);
  const [busyCheckout, setBusyCheckout] = useState(false);
  const [progress, setProgress] = useState(8);
  const [designLoadingProgress, setDesignLoadingProgress] = useState(12);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [hasHydratedSavedState, setHasHydratedSavedState] = useState(false);

  const generationLockRef = useRef(false);
  const previewLockRef = useRef(false);
  const inFlightGenerationRef = useRef<Promise<void> | null>(null);
  const lastCapturedLeadEmailRef = useRef<string | null>(null);
  const lastCapturedCheckoutLeadEmailRef = useRef<string | null>(null);
  const viewedRef = useRef(false);
  const retryRef = useRef<null | (() => void)>(null);

  const style = useMemo(
    () => ARABIC_NAME_MUG_V1_STYLES.find((item) => item.id === styleId) ?? null,
    [styleId],
  );
  const originalDesign = designUrl ?? transparentUrl;
  const selectedDesign =
    useTransparentDesign && transparentUrl ? transparentUrl : originalDesign;
  const hasSavedDesign = Boolean(designUrl || transparentUrl);
  const hasTransparentOption = Boolean(transparentUrl);
  const selectedPreviewKey: PreviewVariant =
    useTransparentDesign && transparentUrl ? "transparent" : "original";
  const selectedMockupUrl =
    selectedPreviewKey === "transparent" ? mockupTransparent : mockupOriginal;
  const hasPreviewForSelectedDesign = Boolean(selectedMockupUrl);
  const isBackgroundRemoved = Boolean(useTransparentDesign && transparentUrl);
  const effectiveGiftIntent = giftIntent || "Someone Special";
  const intentCopy = GIFT_INTENT_COPY[effectiveGiftIntent];
  const canAffordRegen = (credits.data ?? 0) >= REGEN_CREDITS;
  const guestFreeDesignUsed = freeGenerationUsed && !isLoggedIn;
  const guestFreeDesignLocked = guestFreeDesignUsed && hasSavedDesign;
  const lockedGiftIntent = generatedGiftIntent || giftIntent;
  const lockedName = generatedName || name;
  const previewTestimonialIntent = lockedGiftIntent || effectiveGiftIntent;
  const previewTestimonials = PREVIEW_TESTIMONIALS[previewTestimonialIntent];
  const previewSocialProofCopy = PREVIEW_SOCIAL_PROOF_COPY[previewTestimonialIntent];
  const trackBase = useMemo(
    () => ({
      ...getFunnelContext({
        route: router.pathname,
        sourcePage: SOURCE_PAGE,
        paidTrafficUser: true,
        productType: "physical_product",
        query: router.query as Record<string, unknown>,
      }),
      funnel: "arabic_name_mug_v1",
      product_type: "physical_product",
      niche: "arabic_name_gift",
      traffic_type: "paid" as const,
      source_page: SOURCE_PAGE,
    }),
    [router.pathname, router.query],
  );

  const fireMetaCustomEvent = (eventName: string, params: Record<string, unknown>) => {
    const fireMeta = () => {
      const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
      if (typeof maybeFbq !== "function") return false;
      maybeFbq("trackCustom", eventName, params);
      return true;
    };

    if (typeof window === "undefined") return;
    if (fireMeta()) return;

    let attempts = 0;
    const retryTimer = window.setInterval(() => {
      attempts += 1;
      if (fireMeta() || attempts >= 20) {
        window.clearInterval(retryTimer);
      }
    }, 250);
  };

  const fireEvent = (eventName: string, extra?: Record<string, unknown>) => {
    const payload = { ...trackBase, ...(extra ?? {}) };
    trackEvent(eventName, payload);
    fireMetaCustomEvent(eventName, payload);
  };

  const startGeneratorSignIn = () => {
    void signIn(undefined, { callbackUrl: router.asPath });
  };

  useEffect(() => {
    try {
      window.localStorage.setItem("last-generator", SOURCE_PAGE);
      window.sessionStorage.setItem("isPaidTrafficUser", "true");
      window.sessionStorage.setItem("paidTrafficSourcePage", SOURCE_PAGE);
      window.sessionStorage.setItem("paidTrafficPromotedProduct", "mug");
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedState;
      setStep(saved.step ?? 1);
      setGiftIntent(saved.giftIntent ?? "");
      setName(saved.name ?? "");
      setStyleId(saved.styleId ?? ARABIC_NAME_MUG_V1_STYLES[0]?.id ?? "");
      setDesignUrl(saved.designUrl ?? null);
      setTransparentUrl(saved.transparentUrl ?? null);
      setUseTransparentDesign(saved.useTransparentDesign ?? Boolean(saved.transparentUrl));
      setHasFree(Boolean(saved.hasFree));
      setFreeGenerationUsed(Boolean(saved.freeGenerationUsed ?? saved.hasFree));
      const legacyOriginalMockup =
        saved.mockupUrl && saved.mockupSourceUrl === saved.designUrl ? saved.mockupUrl : null;
      const legacyTransparentMockup =
        saved.mockupUrl && saved.mockupSourceUrl === saved.transparentUrl
          ? saved.mockupUrl
          : null;
      setMockupOriginal(saved.mockupOriginal ?? saved.originalMockupUrl ?? legacyOriginalMockup ?? null);
      setMockupTransparent(
        saved.mockupTransparent ?? saved.transparentMockupUrl ?? legacyTransparentMockup ?? null,
      );
      setGeneratedGiftIntent(saved.generatedGiftIntent ?? saved.giftIntent ?? "");
      setGeneratedName(saved.generatedName ?? saved.name ?? "");
      setGeneratedStyleId(saved.generatedStyleId ?? saved.styleId ?? "");
      setEmail(saved.email ?? "");
    } catch {
      // ignore invalid stored state
    } finally {
      setHasHydratedSavedState(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const sessionEmail = session?.user?.email?.trim() ?? "";
    if (!sessionEmail) return;
    setEmail(sessionEmail);
  }, [isLoggedIn, session?.user?.email]);

  useEffect(() => {
    if (!hasHydratedSavedState) return;
    const saved: SavedState = {
      step,
      giftIntent,
      name,
      styleId,
      designUrl,
      transparentUrl,
      useTransparentDesign,
      hasFree,
      freeGenerationUsed,
      email,
      mockupOriginal,
      mockupTransparent,
      generatedGiftIntent,
      generatedName,
      generatedStyleId,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [
    hasHydratedSavedState,
    step,
    giftIntent,
    name,
    styleId,
    designUrl,
    transparentUrl,
    useTransparentDesign,
    hasFree,
    freeGenerationUsed,
    mockupOriginal,
    mockupTransparent,
    email,
    generatedGiftIntent,
    generatedName,
    generatedStyleId,
  ]);

  useEffect(() => {
    if (step !== 7 || busyPreview) return;
    if (hasPreviewForSelectedDesign) return;
    setStep(6);
  }, [busyPreview, hasPreviewForSelectedDesign, step]);

  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    fireEvent("view_arabic_name_mug_v1");
  }, []);

  useEffect(() => {
    fireEvent("mug_funnel_step_selected", { step_name: STEP_NAMES[step] });
  }, [step]);

  useEffect(() => {
    if (!busyDesign) {
      setDesignLoadingProgress(12);
      return;
    }

    setDesignLoadingProgress(DESIGN_PROGRESS_SEQUENCE[0]);

    let progressIndex = 0;
    const progressTimer = window.setInterval(() => {
      progressIndex += 1;
      const next = DESIGN_PROGRESS_SEQUENCE[progressIndex];
      if (typeof next === "number") {
        setDesignLoadingProgress(next);
        return;
      }
      window.clearInterval(progressTimer);
    }, 1800);

    return () => {
      window.clearInterval(progressTimer);
    };
  }, [busyDesign]);

  useEffect(() => {
    if (!busyPreview) {
      setProgress(8);
      return;
    }

    setProgress(PREVIEW_PROGRESS_SEQUENCE[0]);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      const next = PREVIEW_PROGRESS_SEQUENCE[index];
      if (typeof next === "number") {
        setProgress(next);
        return;
      }
      window.clearInterval(timer);
    }, 1600);

    return () => window.clearInterval(timer);
  }, [busyPreview]);

  useEffect(() => {
    if (step !== 7 || isLoggedIn) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailOk(normalizedEmail)) return;
    if (lastCapturedLeadEmailRef.current === normalizedEmail) return;

    const timer = window.setTimeout(() => {
      void capturePaidTrafficLeadIfNeeded(normalizedEmail, "lead");
    }, 700);

    return () => window.clearTimeout(timer);
  }, [email, isLoggedIn, step]);

  const removeBg = async (url: string) => {
    const imageId = imageIdFromUrl(url);
    const response = await fetch("/api/image/remove-background", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, paidTrafficUser: true }),
    });
    const data = (await response.json()) as {
      transparentImageUrl?: string;
      error?: string;
    };
    if (!response.ok) {
      console.warn("[ARABIC_NAME_MUG_V1_REMOVE_BG]", data.error || "Background removal failed");
      return null;
    }
    return data.transparentImageUrl ?? null;
  };

  const buildPrompt = () =>
    buildArabicNameMugPrompt({
      name: name.trim(),
      giftIntent: effectiveGiftIntent,
      stylePrompt: style?.basePrompt ?? "Elegant Arabic calligraphy of 'Text'.",
    });

  const clearGeneratedState = () => {
    setDesignUrl(null);
    setTransparentUrl(null);
    setUseTransparentDesign(true);
    setHasFree(false);
    setMockupOriginal(null);
    setMockupTransparent(null);
  };

  const showGuestFreeDesignLockedError = (message: string) => {
    setErr(message);
  };

  const selectGiftIntent = (nextGiftIntent: ArabicNameMugGiftIntent) => {
    if (guestFreeDesignUsed && lockedGiftIntent && nextGiftIntent !== lockedGiftIntent) {
      showGuestFreeDesignLockedError(
        "Your free design is already saved. Sign in to create a new version for a different recipient.",
      );
      return;
    }

    setGiftIntent(nextGiftIntent);
    setErr("");
  };

  const capturePaidTrafficLeadIfNeeded = async (
    rawEmail: string,
    stage: "lead" | "checkout",
    checkoutResumeUrl?: string,
  ) => {
    if (isLoggedIn) return;

    const normalizedEmail = rawEmail.trim().toLowerCase();
    if (!emailOk(normalizedEmail)) return;

    const dedupeRef =
      stage === "checkout" ? lastCapturedCheckoutLeadEmailRef : lastCapturedLeadEmailRef;
    if (dedupeRef.current === normalizedEmail && !checkoutResumeUrl) return;

    try {
      await capturePaidTrafficLead.mutateAsync({
        email: normalizedEmail,
        sourcePage: SOURCE_PAGE,
        promotedProduct: "mug",
        checkoutResumeUrl,
        hasGeneratedDesign: true,
        hasVisitedCheckout: stage === "checkout",
      });
      dedupeRef.current = normalizedEmail;
      if (stage === "checkout") {
        lastCapturedLeadEmailRef.current = normalizedEmail;
      }
    } catch (captureErr) {
      console.error("Failed to capture Arabic name mug lead email:", captureErr);
    }
  };

  const runGeneration = async (paid: boolean) => {
    if (inFlightGenerationRef.current) {
      await inFlightGenerationRef.current;
      return;
    }
    if (generationLockRef.current || busyDesign || !styleId || name.trim().length < 2) {
      return;
    }

    const requiresPaidGeneration = paid && isLoggedIn;
    if (requiresPaidGeneration && !canAffordRegen) {
      retryRef.current = () => {
        void runGeneration(true);
      };
      setUpgradeOpen(true);
      return;
    }
    if (!requiresPaidGeneration && guestFreeDesignUsed) {
      setErr("Your free design is already saved. Sign in to generate another style.");
      return;
    }

    generationLockRef.current = true;
    retryRef.current = null;
    setBusyDesign(true);
    setErr("");
    setStep(5);
    const generationRequestId = createGenerationRequestId();

    const generationTask = (async () => {
      try {
        fireEvent("generate_design_started", {
          style_id: styleId,
          gift_intent: effectiveGiftIntent,
          mode: requiresPaidGeneration ? "paid_regenerate" : "free",
        });

        const nextDesign = requiresPaidGeneration
          ? (await genIcon.mutateAsync({
              generationRequestId,
              prompt: buildPrompt(),
              numberOfImages: 1,
              aspectRatio: "1:1",
              model: "google/nano-banana-2",
              metadata: {
                category: SOURCE_PAGE,
                subcategory: style?.name,
              },
              sourcePage: SOURCE_PAGE,
            }))[0]?.imageUrl ?? ""
          : (
              await genGuest.mutateAsync({
                generationRequestId,
                name: name.trim(),
                style: styleId,
                giftIntent: effectiveGiftIntent,
                sourcePage: SOURCE_PAGE,
              })
            ).design_url;

        if (!nextDesign) throw new Error("No generated image returned");

        let nextTransparent: string | null = null;
        try {
          nextTransparent = await removeBg(nextDesign);
        } catch (removeBgErr) {
          console.error("[ARABIC_NAME_MUG_V1_REMOVE_BG]", removeBgErr);
        }

        setDesignUrl(nextDesign);
        setTransparentUrl(nextTransparent);
        setUseTransparentDesign(Boolean(nextTransparent));
        setHasFree(true);
        setFreeGenerationUsed(true);
        setMockupOriginal(null);
        setMockupTransparent(null);
        setGeneratedGiftIntent(effectiveGiftIntent);
        setGeneratedName(name.trim());
        setGeneratedStyleId(styleId);
        setStep(6);

        fireEvent("generate_design_completed", {
          style_id: styleId,
          gift_intent: effectiveGiftIntent,
          design_url: nextDesign,
          transparent_design_url: nextTransparent,
          mode: requiresPaidGeneration ? "paid_regenerate" : "free",
        });
      } catch (generationErr) {
        setErr(generationErr instanceof Error ? generationErr.message : "Generation failed");
        setStep(4);
      } finally {
        setBusyDesign(false);
        generationLockRef.current = false;
      }
    })();

    inFlightGenerationRef.current = generationTask;
    try {
      await generationTask;
    } finally {
      inFlightGenerationRef.current = null;
    }
  };

  const makePreview = async (imageUrl: string) => {
    const response = await fetch("/api/printful/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productKey: "mug",
        imageUrl,
        variantId: MUG_VARIANT_ID,
        previewMode: "two-side",
        paidTrafficUser: true,
      }),
    });
    const data = (await response.json()) as { mockupUrl?: string; error?: string };

    if (!response.ok || !data.mockupUrl) {
      throw new Error(data.error || "Unable to generate mug preview");
    }

    return data.mockupUrl;
  };

  const goStep7 = async () => {
    if (previewLockRef.current || busyPreview) return;
    const previewImageUrl = selectedDesign;
    const previewKey = selectedPreviewKey;

    if (!previewImageUrl) {
      setErr("Generate your design first.");
      return;
    }

    setErr("");
    setStep(7);
    setProgress(8);
    const cached = previewKey === "transparent" ? mockupTransparent : mockupOriginal;
    if (cached) return;

    try {
      previewLockRef.current = true;
      setBusyPreview(true);
      const nextMockup = await makePreview(previewImageUrl);
      setProgress(100);
      if (previewKey === "transparent") {
        setMockupTransparent(nextMockup);
      } else {
        setMockupOriginal(nextMockup);
      }
    } catch (previewErr) {
      setErr(previewErr instanceof Error ? previewErr.message : "Unable to generate preview");
      setStep(6);
    } finally {
      setBusyPreview(false);
      previewLockRef.current = false;
    }
  };

  const goBack = () => {
    if (generationLockRef.current || previewLockRef.current || busyDesign || busyPreview) {
      return;
    }

    setStep((currentStep) =>
      currentStep === 7
        ? 6
        : currentStep === 6
        ? 4
        : currentStep === 5
        ? 4
        : currentStep === 4
        ? 3
        : currentStep === 3
        ? 2
        : 1,
    );
  };

  const checkout = async () => {
    if (!selectedDesign || !selectedMockupUrl) {
      setErr("Preview is required before checkout.");
      return;
    }
    if (!emailOk(email)) {
      setErr("Enter a valid email address.");
      return;
    }

    setErr("");
    setBusyCheckout(true);

    try {
      const order = await createOrder.mutateAsync({
        productKey: "mug",
        variantId: MUG_VARIANT_ID,
        variantName: "White Glossy Mug 11 oz",
        size: "11 oz",
        imageUrl: selectedDesign,
        mockupUrl: selectedMockupUrl,
        pricingVariant: "11 oz",
        previewMode: "two-side",
        previewVariantId: MUG_VARIANT_ID,
        isBackgroundRemoved,
        snapshotVariantId: MUG_VARIANT_ID,
        snapshotSize: "11 oz",
        snapshotColor: "White",
        snapshotPrintPosition: "two-side",
        snapshotBackgroundRemoved: isBackgroundRemoved,
        shippingCountry: "US",
        funnelSource: "paid-traffic-offer",
      });

      const checkoutResumeUrl = `${window.location.origin}/checkout?orderId=${encodeURIComponent(
        order.orderId,
      )}&sourcePage=${encodeURIComponent(SOURCE_PAGE)}&generator=${encodeURIComponent(
        SOURCE_PAGE,
      )}${order.accessToken ? `&accessToken=${encodeURIComponent(order.accessToken)}` : ""}`;

      await capturePaidTrafficLeadIfNeeded(email, "checkout", checkoutResumeUrl);

      if (!isLoggedIn) {
        try {
          await captureCheckoutEmail.mutateAsync({
            orderId: order.orderId,
            accessToken: order.accessToken ?? undefined,
            email: email.trim().toLowerCase(),
            sourcePage: SOURCE_PAGE,
            promotedProduct: "mug",
          });
        } catch (captureErr) {
          console.error("Failed to capture Arabic name mug checkout email:", captureErr);
        }
      }

      const payload = { ...trackBase, value: 0, currency: "USD" };
      trackEvent("begin_checkout", payload);
      fireMetaCustomEvent("begin_checkout", payload);

      await router.push(
        `/checkout?orderId=${encodeURIComponent(order.orderId)}&sourcePage=${encodeURIComponent(
          SOURCE_PAGE,
        )}&generator=${encodeURIComponent(SOURCE_PAGE)}${
          order.accessToken ? `&accessToken=${encodeURIComponent(order.accessToken)}` : ""
        }`,
      );
    } catch (checkoutErr) {
      setErr(checkoutErr instanceof Error ? checkoutErr.message : "Unable to start checkout.");
    } finally {
      setBusyCheckout(false);
    }
  };

  const progressPct =
    step === 1
      ? 10
      : step === 2
      ? 24
      : step === 3
      ? 40
      : step === 4
      ? 58
      : step === 5
      ? 72
      : step === 6
      ? 86
      : 100;

  return (
    <>
      <Head>
        <title>Arabic Name Mug | Name Design AI</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
      </Head>

      <main className="min-h-screen bg-white text-slate-900" style={{ colorScheme: "light" }}>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex w-full max-w-md items-center justify-center gap-3 px-4 py-4 sm:max-w-lg">
            <img src="/logo.webp" alt="Name Design AI" className="h-10 w-10 rounded-xl" />
            <div className="text-left">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
                Name Design AI
              </div>
              <div className="text-sm font-semibold text-slate-900">Personalized Arabic Mug</div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md px-4 pb-20 pt-4 sm:max-w-lg">
          <div className={`${SURFACE_CARD_CLASS} mb-4`}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-900">
                Step {step}: {STEP_TITLES[step]}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2563EB]">
                {step}/7
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-[#2563EB] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              disabled={busyDesign || busyPreview}
              className="mb-4 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
          )}

          {step === 1 && (
            <section className="space-y-4">
              <div className={`${SURFACE_CARD_CLASS} overflow-hidden`}>
                <div className="text-center">
                  <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
                    Personalized Arabic Mug
                  </div>
                  <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-950">
                    Turn Any Name Into Beautiful Arabic Art
                  </h1>
                  <p className="mt-3 text-base leading-7 text-gray-600">
                    Create a personalized Arabic name design and see it printed on a mug in
                    seconds.
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#2563EB]">
                    1 free premium design included
                  </p>
                </div>

                {!hasSavedDesign && (
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-4 text-sm text-blue-900">
                    <div>Personalized Arabic calligraphy design</div>
                    <div>Gift-ready mug preview in a few guided steps</div>
                    <div>No login required to generate 1 free design</div>
                  </div>
                )}

                {hasSavedDesign ? (
                  <div className={`${WHITE_CARD_CLASS} mt-4 text-left`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2563EB]">
                      Saved design
                    </p>
                    <div className="mt-3 overflow-hidden rounded-xl bg-[#F8F8F8] p-3">
                      <img
                        src={selectedDesign ?? ""}
                        alt="Saved Arabic name design"
                        className="h-64 w-full object-contain"
                      />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-900">
                      {name ? `"${name}"` : "Your personalized Arabic design"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{intentCopy}</p>
                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <button
                        onClick={() => setStep(hasPreviewForSelectedDesign ? 7 : 6)}
                        className={PRIMARY_BUTTON_CLASS}
                      >
                        Continue with my design
                      </button>
                      <button
                        onClick={() => {
                          if (guestFreeDesignUsed) {
                            startGeneratorSignIn();
                            return;
                          }
                          clearGeneratedState();
                          setStep(2);
                        }}
                        className={SECONDARY_BUTTON_CLASS}
                      >
                        {guestFreeDesignUsed ? "Sign in to start a new design" : "Start a new design"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setStep(2)} className={`${PRIMARY_BUTTON_CLASS} mt-4`}>
                    Start Designing
                  </button>
                )}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-4">
              <div className={SURFACE_CARD_CLASS}>
                <h2 className="text-3xl font-bold text-slate-950">Who is this mug for?</h2>
                <p className="mt-2 text-sm text-gray-600">
                  We&apos;ll tailor the preview for the right gift angle.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  {GIFT_INTENTS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => selectGiftIntent(option)}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        giftIntent === option
                          ? "border-[#2563EB] bg-[#2563EB] text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]"
                          : "border-gray-200 bg-white text-slate-900 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-base font-semibold">{option}</div>
                      <div
                        className={`mt-1 text-sm ${
                          giftIntent === option ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {GIFT_INTENT_COPY[option]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!giftIntent}
                onClick={() => setStep(3)}
                className={PRIMARY_BUTTON_CLASS}
              >
                Continue
              </button>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <div className={SURFACE_CARD_CLASS}>
                <h2 className="text-3xl font-bold text-slate-950">
                  Enter the name you want in Arabic
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  This name will appear in elegant Arabic calligraphy on the mug.
                </p>

                <div className={`${WHITE_CARD_CLASS} mt-4`}>
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2563EB]">
                    Gift angle
                  </div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{intentCopy}</div>
                </div>

                <div className={`${WHITE_CARD_CLASS} mt-4`}>
                  <label className="text-sm font-semibold text-slate-900">Name</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(event) => {
                      if (guestFreeDesignUsed && lockedName && event.target.value !== lockedName) {
                        showGuestFreeDesignLockedError(
                          "Your free design is already saved. Sign in to create a new version with a different name.",
                        );
                        return;
                      }
                      setName(event.target.value);
                      setErr("");
                    }}
                    readOnly={guestFreeDesignUsed && Boolean(lockedName)}
                    placeholder="Ahmed, Fatima, Omar, Amina"
                    className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-4 text-base text-slate-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  const trimmedName = name.trim();
                  if (trimmedName.length < 2) {
                    setErr("Name must be at least 2 characters.");
                    return;
                  }
                  fireEvent("mug_name_entered", {
                    entered_name: trimmedName,
                    gift_intent: effectiveGiftIntent,
                  });
                  setStep(4);
                }}
                className={PRIMARY_BUTTON_CLASS}
              >
                Next: Choose Style
              </button>
            </section>
          )}

          {step === 4 && (
            <section className="space-y-4 pb-36">
              <div className={SURFACE_CARD_CLASS}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-950">
                      Choose your favorite style
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">{intentCopy}</p>
                  </div>
                  <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2563EB]">
                    {ARABIC_NAME_MUG_V1_STYLES.length} styles
                  </div>
                </div>

                {guestFreeDesignLocked && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                    <p className="font-semibold text-amber-950">
                      You already used your 1 free design on this page.
                    </p>
                    <p className="mt-1">
                      Continue with your saved design below, or sign in to generate a new
                      style.
                    </p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {ARABIC_NAME_MUG_V1_STYLES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={item.name}
                      disabled={guestFreeDesignLocked}
                      onClick={() => {
                        setStyleId(item.id);
                        setErr("");
                      }}
                      className={`overflow-hidden rounded-2xl border bg-white text-left transition ${
                        styleId === item.id
                          ? "border-[#2563EB] shadow-[0_12px_24px_rgba(37,99,235,0.16)]"
                          : guestFreeDesignLocked
                          ? "border-gray-200 opacity-70"
                          : "border-gray-200 hover:border-gray-300"
                      } ${guestFreeDesignLocked ? "cursor-not-allowed" : ""}`}
                    >
                      <div className="relative bg-[#F8F8F8] p-2">
                        {guestFreeDesignLocked && (
                          <div className="absolute left-4 top-4 z-10 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700 shadow-sm">
                            {styleId === item.id ? "Saved design" : "Sign in to unlock"}
                          </div>
                        )}
                        <img
                          src={item.src}
                          alt={item.name}
                          className="h-40 w-full rounded-xl object-cover"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sticky bottom-4 z-20 -mx-1 rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur">
                <div className="space-y-3">
                  {guestFreeDesignLocked && (
                    <>
                      <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
                        Sign in to generate more styles. Your current free design is already
                        saved and ready for preview.
                      </div>
                      <button onClick={startGeneratorSignIn} className={SECONDARY_BUTTON_CLASS}>
                        Sign in to generate more designs
                      </button>
                    </>
                  )}

                  {hasFree && designUrl && isLoggedIn && (
                    <button
                      disabled={busyDesign || !styleId}
                      onClick={() => {
                        setErr("");
                        if (!canAffordRegen) {
                          retryRef.current = () => {
                            void runGeneration(true);
                          };
                          setUpgradeOpen(true);
                          return;
                        }
                        void runGeneration(true);
                      }}
                      className={SECONDARY_BUTTON_CLASS}
                    >
                      Generate another design ({REGEN_CREDITS} credits)
                    </button>
                  )}

                  <button
                    disabled={busyDesign || !styleId}
                    onClick={() => {
                      setErr("");
                      fireEvent("mug_style_selected", {
                        style_id: styleId,
                        gift_intent: effectiveGiftIntent,
                      });
                      if (hasFree && designUrl) {
                        setStep(6);
                        return;
                      }
                      void runGeneration(false);
                    }}
                    className={PRIMARY_BUTTON_CLASS}
                  >
                    {guestFreeDesignLocked
                      ? "Continue with saved design"
                      : hasFree && designUrl
                      ? "Continue with current design"
                      : "Generate My Design"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="flex min-h-[65vh] flex-col items-center justify-center text-center">
              <div className={`${SURFACE_CARD_CLASS} w-full`}>
                <h2 className="text-3xl font-bold text-slate-950">
                  Creating your personalized Arabic design...
                </h2>
                <p className="mt-2 text-sm text-gray-600">Please wait a moment.</p>

                <div className="mt-6 space-y-3 text-left">
                  {DESIGN_LOADING_STEPS.map((label, index) => {
                    const stepProgress = getDesignStepProgress(index, designLoadingProgress);
                    const isDone = stepProgress >= 100;
                    const isActive = stepProgress > 0 && stepProgress < 100;

                    return (
                      <div
                        key={label}
                        className={`rounded-2xl border px-4 py-4 ${
                          isDone
                            ? "border-emerald-200 bg-emerald-50"
                            : isActive
                            ? "border-[#2563EB] bg-white"
                            : "border-gray-200 bg-white/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-900">{label}</div>
                          <div
                            className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                              isDone
                                ? "text-emerald-600"
                                : isActive
                                ? "text-[#2563EB]"
                                : "text-gray-400"
                            }`}
                          >
                            {isDone ? "Done" : isActive ? "Working" : "Queued"}
                          </div>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isDone ? "bg-emerald-500" : "bg-[#2563EB]"
                            }`}
                            style={{ width: `${stepProgress}%` }}
                          />
                        </div>
                        <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-gray-400">
                          Step {index + 1} of {DESIGN_LOADING_STEPS.length}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {step === 6 && (
            <section className="space-y-4">
              <div className={SURFACE_CARD_CLASS}>
                <h2 className="text-3xl font-bold text-slate-950">Your design looks great</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Now see how it looks on your mug.
                </p>

                <div className={`${WHITE_CARD_CLASS} mt-4`}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setUseTransparentDesign(false)}
                      className={`overflow-hidden rounded-2xl border bg-white p-3 text-left transition ${
                        !useTransparentDesign
                          ? "border-[#2563EB] shadow-[0_12px_24px_rgba(37,99,235,0.16)]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-950">Original</div>
                          <div className="text-xs text-gray-500">
                            Use the full design background.
                          </div>
                        </div>
                        {!useTransparentDesign && (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2563EB]">
                            Selected
                          </span>
                        )}
                      </div>

                      <div className="overflow-hidden rounded-xl bg-[#F8F8F8] p-3">
                        {originalDesign ? (
                          <img
                            src={originalDesign}
                            alt="Original Arabic name design preview"
                            className="h-72 w-full object-contain"
                          />
                        ) : (
                          <div className="h-72 w-full bg-[#F8F8F8]" />
                        )}
                      </div>
                    </button>

                    {hasTransparentOption && (
                      <button
                        type="button"
                        onClick={() => setUseTransparentDesign(true)}
                        className={`overflow-hidden rounded-2xl border bg-white p-3 text-left transition ${
                          useTransparentDesign
                            ? "border-[#2563EB] shadow-[0_12px_24px_rgba(37,99,235,0.16)]"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-950">
                              Transparent Background
                            </div>
                            <div className="text-xs text-gray-500">
                              Best if you want the design isolated on the mug.
                            </div>
                          </div>
                          {useTransparentDesign && (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2563EB]">
                              Selected
                            </span>
                          )}
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%,#f8fafc),linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%,#f8fafc)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] p-3">
                          {transparentUrl ? (
                            <img
                              src={transparentUrl}
                              alt="Transparent Arabic name design preview"
                              className="h-72 w-full object-contain"
                            />
                          ) : (
                            <div className="h-72 w-full" />
                          )}
                        </div>
                      </button>
                    )}
                  </div>

                  <p className="mt-4 text-xs text-gray-500">
                    The selected version will be used for your mug preview.
                  </p>
                  <p className="mt-4 text-lg font-semibold text-slate-900">{intentCopy}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Personalized for {name.trim() ? `"${name.trim()}"` : "your chosen name"} in{" "}
                    {style?.name ?? "your selected style"}.
                  </p>
                </div>
              </div>

              <button onClick={() => void goStep7()} className={PRIMARY_BUTTON_CLASS}>
                Preview My Mug
              </button>
            </section>
          )}

          {step === 7 && busyPreview && (
            <section className="flex min-h-[65vh] flex-col items-center justify-center text-center">
              <div className={`${SURFACE_CARD_CLASS} w-full`}>
                <h2 className="text-3xl font-bold text-slate-950">
                  Preview Your Personalized Mug
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  We&apos;re preparing your custom mug preview.
                </p>
                <div className="mt-6 h-3 rounded-full bg-gray-200">
                  <div
                    className="h-3 rounded-full bg-[#2563EB] transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-gray-500">{progress}% complete</p>

                <div className="mt-6 overflow-hidden rounded-3xl border border-amber-100 bg-[linear-gradient(180deg,#fff8eb_0%,#ffffff_100%)] p-4 text-left">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                        Loved by gift buyers
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{previewSocialProofCopy}</p>
                    </div>
                    <div className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                      Real feedback
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden">
                    <div className="arabic-name-mug-preview-review-track flex w-max gap-4 px-1">
                      {[...previewTestimonials, ...previewTestimonials].map((testimonial, index) => {
                        const reviewImage =
                          PREVIEW_TESTIMONIAL_IMAGES[index % PREVIEW_TESTIMONIAL_IMAGES.length] ??
                          PREVIEW_TESTIMONIAL_IMAGES[0]!;

                        return (
                          <article
                            key={`${testimonial.author}-${index}`}
                            className="w-[16.5rem] flex-none overflow-hidden rounded-2xl border border-white bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
                          >
                            <div className="bg-[#f8fafc] p-2">
                              <img
                                src={reviewImage.src}
                                alt={reviewImage.alt}
                                className="h-44 w-full rounded-xl object-cover"
                              />
                            </div>
                            <div className="px-4 py-4">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-600">
                                Verified order
                              </div>
                              <p className="mt-3 text-sm leading-6 text-slate-700">
                                &ldquo;{testimonial.quote}&rdquo;
                              </p>
                              <div className="mt-4 border-t border-slate-100 pt-3">
                                <div className="text-sm font-semibold text-slate-900">
                                  {testimonial.author}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {testimonial.detail}
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 7 && !busyPreview && (
            <section className="space-y-4">
              <div className={SURFACE_CARD_CLASS}>
                <h2 className="text-3xl font-bold text-slate-950">Preview Your Personalized Mug</h2>
                <p className="mt-2 text-sm text-gray-600">
                  This is how your custom mug will look when printed.
                </p>

                <div className={`${WHITE_CARD_CLASS} mt-4 overflow-hidden`}>
                  {selectedMockupUrl ? (
                    <img
                      src={selectedMockupUrl}
                      alt="Personalized Arabic name mug preview"
                      className="w-full rounded-xl"
                    />
                  ) : (
                    <div className="h-64 rounded-xl bg-[#F8F8F8]" />
                  )}
                </div>

                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-4 text-sm text-blue-900">
                  <div className="font-semibold text-slate-900">{intentCopy}</div>
                  <div className="mt-3 space-y-2">
                    <p>Personalized Arabic calligraphy design</p>
                    <p>Free shipping included</p>
                    <p>Printed only after you order</p>
                  </div>
                </div>
              </div>

              {!isLoggedIn && (
                <div className={WHITE_CARD_CLASS}>
                  <label className="text-sm font-semibold text-slate-900">Email</label>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setErr("");
                    }}
                    onBlur={() => {
                      void capturePaidTrafficLeadIfNeeded(email, "lead");
                    }}
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-4 text-base text-slate-900 placeholder:text-gray-400"
                  />
                </div>
              )}

              <button
                disabled={busyCheckout || !hasPreviewForSelectedDesign}
                onClick={() => void checkout()}
                className={PRIMARY_BUTTON_CLASS}
              >
                {busyCheckout ? "Loading checkout..." : "Continue to Secure Checkout"}
              </button>

              <p className="text-center text-xs text-gray-500">
                Secure payment powered by Stripe
              </p>
            </section>
          )}

          {err && <p className="mt-4 text-sm text-red-600">{err}</p>}
        </div>

        <CreditUpgradeModal
          isOpen={upgradeOpen}
          requiredCredits={REGEN_CREDITS}
          currentCredits={credits.data ?? 0}
          context="generate"
          sourcePage={SOURCE_PAGE}
          onClose={() => setUpgradeOpen(false)}
          onSuccess={() => {
            setUpgradeOpen(false);
            void utils.user.getCredits.invalidate();
            void credits.refetch().then(() => {
              const retry = retryRef.current;
              retryRef.current = null;
              retry?.();
            });
          }}
        />
        <style jsx global>{`
          .arabic-name-mug-preview-review-track {
            animation: arabic-name-mug-preview-scroll 38s linear infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .arabic-name-mug-preview-review-track {
              animation: none;
            }
          }

          @keyframes arabic-name-mug-preview-scroll {
            from {
              transform: translateX(0);
            }

            to {
              transform: translateX(calc(-50% - 0.5rem));
            }
          }
        `}</style>
      </main>
    </>
  );
};

export default ArabicNameMugV1Page;
