import Head from "next/head";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { CreditUpgradeModal } from "~/component/Credits/CreditUpgradeModal";
import {
  COUPLE_NAME_MUG_V1_STYLES,
  DEFAULT_COUPLE_NAME_MUG_V1_STYLE_ID,
  getCoupleNameMugV1Style,
  type CoupleNameMugMode,
  type CoupleNameMugStyleId,
} from "~/config/coupleNameMugV1Style";
import { trackEvent } from "~/lib/ga";
import { createGenerationRequestId } from "~/lib/generationRequest";
import { getFunnelContext } from "~/lib/tracking/funnel";
import { api } from "~/utils/api";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type LockedDisplayStep = 1 | 2 | 3 | 4 | 5 | 6;
type PreviewVariant = "original" | "transparent";

export type CoupleNameMugFunnelSourcePage =
  | "couple-name-mug-v1"
  | "couple-avatar-name-mug-v1"
  | "couple-names-only-mug-v1";

type CoupleNameMugFunnelName =
  | "couple_name_mug_v1"
  | "couple_avatar_name_mug_v1"
  | "couple_names_only_mug_v1";

type CoupleNameMugFunnelProps = {
  sourcePage: CoupleNameMugFunnelSourcePage;
  funnel: CoupleNameMugFunnelName;
  pageTitle: string;
  lockedMode?: CoupleNameMugMode;
};

type SavedState = {
  step: Step;
  mode: CoupleNameMugMode;
  style: CoupleNameMugStyleId;
  generatedStyleId?: CoupleNameMugStyleId | null;
  quantity: number;
  herName: string;
  hisName: string;
  centerText: string;
  herPhotoUrl: string | null;
  hisPhotoUrl: string | null;
  herDesignUrl: string | null;
  hisDesignUrl: string | null;
  wrapUrl: string | null;
  transparentWrapUrl: string | null;
  useTransparentDesign: boolean;
  mockupOriginal: string | null;
  mockupOriginalSecondary?: string | null;
  mockupOriginalCenter?: string | null;
  mockupTransparent: string | null;
  mockupTransparentSecondary?: string | null;
  mockupTransparentCenter?: string | null;
  mockupUrl?: string | null;
  email: string;
  freeGenerationUsed: boolean;
};

const REGEN_CREDITS = 9;
const MUG_VARIANT_ID = 1320;
const STEP_NAMES: Record<Step, string> = {
  1: "intro",
  2: "version",
  3: "details",
  4: "style",
  5: "generation",
  6: "result",
  7: "preview",
};
const STEP_TITLES: Record<Step, string> = {
  1: "Start",
  2: "Choose Version",
  3: "Personalize",
  4: "Choose Style",
  5: "Generating",
  6: "Choose Design",
  7: "Mug Preview",
};
const LOCKED_STEP_NAMES: Record<LockedDisplayStep, string> = {
  1: "intro",
  2: "details",
  3: "style",
  4: "generation",
  5: "result",
  6: "preview",
};
const LOCKED_STEP_TITLES: Record<LockedDisplayStep, string> = {
  1: "Start",
  2: "Personalize",
  3: "Choose Style",
  4: "Generating",
  5: "Choose Design",
  6: "Mug Preview",
};
const DESIGN_LOADING_STEPS = [
  "Preparing your couple design",
  "Generating the wrap artwork",
  "Refining names and details",
  "Saving the final result",
] as const;
const DESIGN_PROGRESS_SEQUENCE = [12, 18, 27, 39, 51, 64, 76, 86, 93, 97] as const;
const PREVIEW_PROGRESS_SEQUENCE = [12, 18, 26, 35, 47, 60, 74, 86, 95, 99] as const;
const SURFACE_CARD_CLASS = "rounded-2xl border border-gray-200 bg-[#F8F8F8] p-4 shadow-sm";
const WHITE_CARD_CLASS = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm";
const PRIMARY_BUTTON_CLASS =
  "inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50";
const SECONDARY_BUTTON_CLASS =
  "inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-4 text-base font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

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

function getLockedDisplayStep(step: Step): LockedDisplayStep {
  if (step === 1) return 1;
  if (step === 3) return 2;
  if (step === 4) return 3;
  if (step === 5) return 4;
  if (step === 6) return 5;
  return 6;
}

function getProgressPct(step: Step, lockedMode?: CoupleNameMugMode) {
  if (lockedMode) {
    const lockedStep = getLockedDisplayStep(step);
    return lockedStep === 1
      ? 16
      : lockedStep === 2
      ? 32
      : lockedStep === 3
      ? 50
      : lockedStep === 4
      ? 68
      : lockedStep === 5
      ? 84
      : 100;
  }

  return step === 1
    ? 10
    : step === 2
    ? 24
    : step === 3
    ? 38
    : step === 4
    ? 54
    : step === 5
    ? 70
    : step === 6
    ? 86
    : 100;
}

export function CoupleNameMugFunnel({
  sourcePage,
  funnel,
  pageTitle,
  lockedMode,
}: CoupleNameMugFunnelProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user?.id);
  const credits = api.user.getCredits.useQuery(undefined, { enabled: isLoggedIn });
  const generateCoupleMug = api.generate.generateCoupleNameMugDesign.useMutation();
  const createPublicImageUploadUrl = api.s3.createPublicImageUploadUrl.useMutation();
  const capturePaidTrafficLead = api.user.capturePaidTrafficLead.useMutation();
  const createOrder = api.productOrder.createPendingOrder.useMutation();
  const captureCheckoutEmail = api.productOrder.captureCheckoutEmail.useMutation();
  const storageKey = `${sourcePage}:funnel:v1`;
  const defaultMode = lockedMode ?? "names_only";
  const isModeLocked = Boolean(lockedMode);
  const headerTitle =
    lockedMode === "avatar_name"
      ? "Couple Avatar + Name Mug"
      : lockedMode === "names_only"
      ? "Couple Names Mug"
      : "Couple Name Mug";
  const heroTitle =
    lockedMode === "avatar_name"
      ? "Turn Two Photos Into A Matching Couple Mug"
      : lockedMode === "names_only"
      ? "Create A Romantic Full-Wrap Name Mug"
      : "Build A Romantic Full-Wrap Mug In Minutes";
  const heroDescription =
    lockedMode === "avatar_name"
      ? "Upload one photo for her and one for him. We turn them into matching AI avatars inside one coordinated full-wrap mug design."
      : lockedMode === "names_only"
      ? "Place her name and his name inside one matching romantic full-wrap design."
      : "Create one full-wrap romantic mug design with either two names or two matching AI avatars.";
  const heroHighlights =
    lockedMode === "avatar_name"
      ? [
          "One coordinated full-wrap avatar design",
          "Her portrait and his portrait in one matching style",
          "Gift-ready mug preview before checkout",
        ]
      : lockedMode === "names_only"
      ? [
          "One coordinated full-wrap name design",
          "Her name and his name in one matching style",
          "Gift-ready mug preview before checkout",
        ]
      : [
          "One full-wrap design across the mug",
          "Names-only or AI avatar + name version",
          "Gift-ready mug preview before checkout",
        ];
  const startStep = isModeLocked ? 3 : 2;
  const viewEventName = `view_${sourcePage.replace(/-/g, "_")}`;

  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<CoupleNameMugMode>(defaultMode);
  const [style, setStyle] = useState<CoupleNameMugStyleId>(DEFAULT_COUPLE_NAME_MUG_V1_STYLE_ID);
  const [generatedStyleId, setGeneratedStyleId] = useState<CoupleNameMugStyleId | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [herName, setHerName] = useState("");
  const [hisName, setHisName] = useState("");
  const [centerText, setCenterText] = useState("");
  const [herPhotoUrl, setHerPhotoUrl] = useState<string | null>(null);
  const [hisPhotoUrl, setHisPhotoUrl] = useState<string | null>(null);
  const [herDesignUrl, setHerDesignUrl] = useState<string | null>(null);
  const [hisDesignUrl, setHisDesignUrl] = useState<string | null>(null);
  const [wrapUrl, setWrapUrl] = useState<string | null>(null);
  const [transparentWrapUrl, setTransparentWrapUrl] = useState<string | null>(null);
  const [useTransparentDesign, setUseTransparentDesign] = useState(false);
  const [mockupOriginal, setMockupOriginal] = useState<string | null>(null);
  const [mockupOriginalSecondary, setMockupOriginalSecondary] = useState<string | null>(null);
  const [mockupOriginalCenter, setMockupOriginalCenter] = useState<string | null>(null);
  const [mockupTransparent, setMockupTransparent] = useState<string | null>(null);
  const [mockupTransparentSecondary, setMockupTransparentSecondary] = useState<string | null>(null);
  const [mockupTransparentCenter, setMockupTransparentCenter] = useState<string | null>(null);
  const [freeGenerationUsed, setFreeGenerationUsed] = useState(false);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busyDesign, setBusyDesign] = useState(false);
  const [busyPreview, setBusyPreview] = useState(false);
  const [busyCheckout, setBusyCheckout] = useState(false);
  const [designProgress, setDesignProgress] = useState(12);
  const [previewProgress, setPreviewProgress] = useState(8);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [hasHydratedSavedState, setHasHydratedSavedState] = useState(false);
  const [uploadingSide, setUploadingSide] = useState<"her" | "his" | null>(null);
  const lockedDisplayStep = isModeLocked ? getLockedDisplayStep(step) : null;
  const displayStep = lockedDisplayStep ?? step;
  const displayStepTitle = lockedDisplayStep
    ? LOCKED_STEP_TITLES[lockedDisplayStep]
    : STEP_TITLES[step];
  const displayStepName = lockedDisplayStep
    ? LOCKED_STEP_NAMES[lockedDisplayStep]
    : STEP_NAMES[step];
  const totalSteps = isModeLocked ? 6 : 7;

  const generationLockRef = useRef(false);
  const previewLockRef = useRef(false);
  const inFlightGenerationRef = useRef<Promise<void> | null>(null);
  const viewedRef = useRef(false);
  const retryRef = useRef<null | (() => void)>(null);
  const lastCapturedLeadEmailRef = useRef<string | null>(null);
  const lastCapturedCheckoutLeadEmailRef = useRef<string | null>(null);

  const hasSavedDesign = Boolean(herDesignUrl && hisDesignUrl && wrapUrl);
  const guestFreeDesignUsed = freeGenerationUsed && !isLoggedIn;
  const guestFreeDesignLocked = guestFreeDesignUsed && hasSavedDesign;
  const canAffordRegen = (credits.data ?? 0) >= REGEN_CREDITS;
  const showPhotoInputs = mode === "avatar_name";
  const effectiveStyleId = guestFreeDesignLocked ? (generatedStyleId ?? style) : style;
  const selectedStyle = getCoupleNameMugV1Style(effectiveStyleId);
  const originalDesign = wrapUrl;
  const selectedDesign =
    useTransparentDesign && transparentWrapUrl ? transparentWrapUrl : originalDesign;
  const selectedPreviewKey: PreviewVariant =
    useTransparentDesign && transparentWrapUrl ? "transparent" : "original";
  const selectedMockupUrl =
    selectedPreviewKey === "transparent" ? mockupTransparent : mockupOriginal;
  const selectedSecondaryMockupUrl =
    selectedPreviewKey === "transparent"
      ? mockupTransparentSecondary
      : mockupOriginalSecondary;
  const selectedCenterMockupUrl =
    selectedPreviewKey === "transparent"
      ? mockupTransparentCenter
      : mockupOriginalCenter;
  const hasTransparentOption = Boolean(transparentWrapUrl);
  const hasPreviewForSelectedDesign = Boolean(selectedMockupUrl);
  const isBackgroundRemoved = Boolean(useTransparentDesign && transparentWrapUrl);
  const progressPct = getProgressPct(step, lockedMode);

  const trackBase = useMemo(
    () => ({
      ...getFunnelContext({
        route: router.pathname,
        sourcePage,
        paidTrafficUser: true,
        productType: "physical_product",
        query: router.query as Record<string, unknown>,
      }),
      funnel,
      product_type: "physical_product",
      niche: "romantic",
      traffic_type: "paid" as const,
      source_page: sourcePage,
    }),
    [funnel, router.pathname, router.query, sourcePage],
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

  const resetDesignAssets = () => {
    setHerDesignUrl(null);
    setHisDesignUrl(null);
    setWrapUrl(null);
    setTransparentWrapUrl(null);
    setUseTransparentDesign(false);
    setMockupOriginal(null);
    setMockupOriginalSecondary(null);
    setMockupOriginalCenter(null);
    setMockupTransparent(null);
    setMockupTransparentSecondary(null);
    setMockupTransparentCenter(null);
  };

  const resetBuilder = () => {
    setMode(defaultMode);
    setStyle(DEFAULT_COUPLE_NAME_MUG_V1_STYLE_ID);
    setGeneratedStyleId(null);
    setQuantity(1);
    setHerName("");
    setHisName("");
    setCenterText("");
    setHerPhotoUrl(null);
    setHisPhotoUrl(null);
    resetDesignAssets();
    setErr("");
  };

  useEffect(() => {
    try {
      window.localStorage.setItem("last-generator", sourcePage);
      window.sessionStorage.setItem("isPaidTrafficUser", "true");
      window.sessionStorage.setItem("paidTrafficSourcePage", sourcePage);
      window.sessionStorage.setItem("paidTrafficPromotedProduct", "mug");
    } catch {
      // ignore storage errors
    }
  }, [sourcePage]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedState;
      setStep(isModeLocked && saved.step === 2 ? 3 : saved.step ?? 1);
      setMode(lockedMode ?? saved.mode ?? "names_only");
      setStyle(saved.style ?? DEFAULT_COUPLE_NAME_MUG_V1_STYLE_ID);
      setGeneratedStyleId(saved.generatedStyleId ?? saved.style ?? null);
      setQuantity(
        typeof saved.quantity === "number" && Number.isFinite(saved.quantity)
          ? Math.max(1, Math.min(6, Math.floor(saved.quantity)))
          : 1,
      );
      setHerName(saved.herName ?? "");
      setHisName(saved.hisName ?? "");
      setCenterText(saved.centerText ?? "");
      setHerPhotoUrl(saved.herPhotoUrl ?? null);
      setHisPhotoUrl(saved.hisPhotoUrl ?? null);
      setHerDesignUrl(saved.herDesignUrl ?? null);
      setHisDesignUrl(saved.hisDesignUrl ?? null);
      setWrapUrl(saved.wrapUrl ?? null);
      setTransparentWrapUrl(saved.transparentWrapUrl ?? null);
      setUseTransparentDesign(saved.useTransparentDesign ?? Boolean(saved.transparentWrapUrl));
      const legacyOriginalMockup =
        saved.mockupUrl && saved.wrapUrl ? saved.mockupUrl : null;
      setMockupOriginal(saved.mockupOriginal ?? legacyOriginalMockup ?? null);
      setMockupOriginalSecondary(saved.mockupOriginalSecondary ?? null);
      setMockupOriginalCenter(saved.mockupOriginalCenter ?? null);
      setMockupTransparent(saved.mockupTransparent ?? null);
      setMockupTransparentSecondary(saved.mockupTransparentSecondary ?? null);
      setMockupTransparentCenter(saved.mockupTransparentCenter ?? null);
      setEmail(saved.email ?? "");
      setFreeGenerationUsed(Boolean(saved.freeGenerationUsed));
    } catch {
      // ignore invalid cached state
    } finally {
      setHasHydratedSavedState(true);
    }
  }, [isModeLocked, lockedMode, storageKey]);

  useEffect(() => {
    if (!lockedMode) return;
    setMode(lockedMode);
  }, [lockedMode]);

  useEffect(() => {
    if (!guestFreeDesignLocked || !generatedStyleId) return;
    if (style === generatedStyleId) return;
    setStyle(generatedStyleId);
  }, [generatedStyleId, guestFreeDesignLocked, style]);

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
      mode,
      style,
      generatedStyleId,
      quantity,
      herName,
      hisName,
      centerText,
      herPhotoUrl,
      hisPhotoUrl,
      herDesignUrl,
      hisDesignUrl,
      wrapUrl,
      transparentWrapUrl,
      useTransparentDesign,
      mockupOriginal,
      mockupOriginalSecondary,
      mockupOriginalCenter,
      mockupTransparent,
      mockupTransparentSecondary,
      mockupTransparentCenter,
      email,
      freeGenerationUsed,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(saved));
  }, [
    storageKey,
    email,
    freeGenerationUsed,
    generatedStyleId,
    quantity,
    hasHydratedSavedState,
    herDesignUrl,
    herName,
    herPhotoUrl,
    hisDesignUrl,
    hisName,
    centerText,
    hisPhotoUrl,
    mockupOriginal,
    mockupOriginalSecondary,
    mockupOriginalCenter,
    mockupTransparent,
    mockupTransparentSecondary,
    mockupTransparentCenter,
    mode,
    style,
    step,
    transparentWrapUrl,
    useTransparentDesign,
    wrapUrl,
  ]);

  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    fireEvent(viewEventName);
  }, [viewEventName]);

  useEffect(() => {
    fireEvent("mug_funnel_step_selected", { step_name: displayStepName });
  }, [displayStepName]);

  useEffect(() => {
    if (!busyDesign) {
      setDesignProgress(12);
      return;
    }

    setDesignProgress(DESIGN_PROGRESS_SEQUENCE[0]);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      const next = DESIGN_PROGRESS_SEQUENCE[index];
      if (typeof next === "number") {
        setDesignProgress(next);
        return;
      }
      window.clearInterval(timer);
    }, 1600);

    return () => window.clearInterval(timer);
  }, [busyDesign]);

  useEffect(() => {
    if (!busyPreview) {
      setPreviewProgress(8);
      return;
    }

    setPreviewProgress(PREVIEW_PROGRESS_SEQUENCE[0]);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      const next = PREVIEW_PROGRESS_SEQUENCE[index];
      if (typeof next === "number") {
        setPreviewProgress(next);
        return;
      }
      window.clearInterval(timer);
    }, 1400);

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

  useEffect(() => {
    if (step !== 7 || busyPreview) return;
    if (hasPreviewForSelectedDesign) return;
    setStep(6);
  }, [busyPreview, hasPreviewForSelectedDesign, step]);

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
        sourcePage,
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
      console.error("Failed to capture couple mug lead email:", captureErr);
    }
  };

  const uploadPhotoFile = async (file: File) => {
    const uploadConfig = await createPublicImageUploadUrl.mutateAsync({
      filename: file.name,
      filetype: file.type || "image/jpeg",
    });
    const formData = new FormData();
    Object.entries(uploadConfig.fields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("file", file);

    const response = await fetch(uploadConfig.url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Unable to upload your photo. Please try another image.");
    }

    return uploadConfig.publicUrl;
  };

  const handlePhotoSelected = async (
    side: "her" | "his",
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    if (guestFreeDesignLocked) {
      event.target.value = "";
      startGeneratorSignIn();
      return;
    }

    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setUploadingSide(side);
      setErr("");
      const uploadedUrl = await uploadPhotoFile(file);
      if (side === "her") {
        setHerPhotoUrl(uploadedUrl);
      } else {
        setHisPhotoUrl(uploadedUrl);
      }
      resetDesignAssets();
    } catch (uploadErr) {
      setErr(uploadErr instanceof Error ? uploadErr.message : "Photo upload failed.");
    } finally {
      setUploadingSide(null);
    }
  };

  const startGeneratorSignIn = () => {
    void signIn(undefined, { callbackUrl: router.asPath });
  };

  const showGuestFreeDesignLockedError = (message: string) => {
    setErr(message);
  };

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
      console.warn("[COUPLE_NAME_MUG_V1_REMOVE_BG]", data.error || "Background removal failed");
      return null;
    }

    return data.transparentImageUrl ?? null;
  };

  const runGeneration = async () => {
    if (inFlightGenerationRef.current) {
      await inFlightGenerationRef.current;
      return;
    }
    if (generationLockRef.current || busyDesign) return;
    if (herName.trim().length < 2 || hisName.trim().length < 2) {
      setErr("Enter both names to continue.");
      return;
    }
    if (mode === "avatar_name" && (!herPhotoUrl || !hisPhotoUrl)) {
      setErr("Upload both photos for the avatar version.");
      return;
    }
    if (guestFreeDesignUsed) {
      setErr("Your free design is already saved. Sign in to create another version.");
      return;
    }
    if (isLoggedIn && !canAffordRegen) {
      retryRef.current = () => {
        void runGeneration();
      };
      setUpgradeOpen(true);
      return;
    }

    generationLockRef.current = true;
    retryRef.current = null;
    setBusyDesign(true);
    setErr("");
    setStep(5);
    const generationRequestId = createGenerationRequestId();
    const modeLabel = freeGenerationUsed && isLoggedIn ? "paid_regenerate" : "free";

    const generationTask = (async () => {
      try {
        fireEvent("generate_design_started", {
          mode: modeLabel,
          version: mode,
          style,
        });

        const result = await generateCoupleMug.mutateAsync({
          generationRequestId,
          herName: herName.trim(),
          hisName: hisName.trim(),
          centerText: centerText.trim() || undefined,
          mode,
          style,
          herPhotoUrl: herPhotoUrl ?? undefined,
          hisPhotoUrl: hisPhotoUrl ?? undefined,
          sourcePage,
        });

        if (!result.herDesignUrl || !result.hisDesignUrl || !result.wrapUrl) {
          throw new Error("No generated artwork was returned.");
        }

        let nextTransparent: string | null = null;
        try {
          nextTransparent = await removeBg(result.wrapUrl);
        } catch (removeBgErr) {
          console.error("[COUPLE_NAME_MUG_V1_REMOVE_BG]", removeBgErr);
        }

        setHerDesignUrl(result.herDesignUrl);
        setHisDesignUrl(result.hisDesignUrl);
        setWrapUrl(result.wrapUrl);
        setGeneratedStyleId(style);
        setTransparentWrapUrl(nextTransparent);
        setUseTransparentDesign(Boolean(nextTransparent));
        setMockupOriginal(null);
        setMockupTransparent(null);
        setFreeGenerationUsed(true);
        setStep(6);

        fireEvent("generate_design_completed", {
          mode: modeLabel,
          version: mode,
          style,
          wrap_url: result.wrapUrl,
          transparent_design_url: nextTransparent,
        });
      } catch (generationErr) {
        setErr(generationErr instanceof Error ? generationErr.message : "Generation failed.");
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

  const makePreview = async (
    imageUrl: string,
    previewMode: "center" | "full-wrap",
  ): Promise<{
    primaryMockupUrl: string;
    secondaryMockupUrl: string | null;
    centerMockupUrl: string | null;
  }> => {
    if (!imageUrl) {
      throw new Error("Generate your design first.");
    }

    const response = await fetch("/api/printful/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productKey: "mug",
        imageUrl,
        variantId: MUG_VARIANT_ID,
        previewMode,
        paidTrafficUser: true,
      }),
    });
    const data = (await response.json()) as {
      mockupUrl?: string;
      extraMockupUrls?: string[];
      error?: string;
    };

    if (!response.ok || !data.mockupUrl) {
      throw new Error(data.error || "Unable to generate mug preview");
    }

    return {
      primaryMockupUrl: data.mockupUrl,
      secondaryMockupUrl: data.extraMockupUrls?.[0] ?? null,
      centerMockupUrl: data.extraMockupUrls?.[1] ?? null,
    };
  };

  const goStep7 = async () => {
    if (previewLockRef.current || busyPreview) return;
    if (!selectedDesign) {
      setErr("Generate your design first.");
      return;
    }

    setErr("");
    setStep(7);
    if (hasPreviewForSelectedDesign && selectedCenterMockupUrl) return;

    try {
      previewLockRef.current = true;
      setBusyPreview(true);
      const [fullWrapResult, centerResult] = await Promise.allSettled([
        hasPreviewForSelectedDesign
          ? Promise.resolve(null)
          : makePreview(selectedDesign, "full-wrap"),
        selectedCenterMockupUrl ? Promise.resolve(null) : makePreview(selectedDesign, "center"),
      ]);
      setPreviewProgress(100);

      if (fullWrapResult.status === "fulfilled" && fullWrapResult.value) {
        if (selectedPreviewKey === "transparent") {
          setMockupTransparent(fullWrapResult.value.primaryMockupUrl);
          setMockupTransparentSecondary(fullWrapResult.value.secondaryMockupUrl);
          if (fullWrapResult.value.centerMockupUrl) {
            setMockupTransparentCenter(fullWrapResult.value.centerMockupUrl);
          }
        } else {
          setMockupOriginal(fullWrapResult.value.primaryMockupUrl);
          setMockupOriginalSecondary(fullWrapResult.value.secondaryMockupUrl);
          if (fullWrapResult.value.centerMockupUrl) {
            setMockupOriginalCenter(fullWrapResult.value.centerMockupUrl);
          }
        }
      }

      const hasCenterFromFullWrap =
        fullWrapResult.status === "fulfilled" && Boolean(fullWrapResult.value?.centerMockupUrl);

      if (!hasCenterFromFullWrap && centerResult.status === "fulfilled" && centerResult.value) {
        if (selectedPreviewKey === "transparent") {
          setMockupTransparentCenter(centerResult.value.primaryMockupUrl);
        } else {
          setMockupOriginalCenter(centerResult.value.primaryMockupUrl);
        }
      } else if (!hasCenterFromFullWrap && centerResult.status === "rejected") {
        console.warn("[COUPLE_NAME_MUG_CENTER_PREVIEW_FAILED]", centerResult.reason);
      }

      if (!hasPreviewForSelectedDesign) {
        const fullWrapPreviewFailed =
          fullWrapResult.status === "rejected" || !fullWrapResult.value?.primaryMockupUrl;
        if (fullWrapPreviewFailed) {
          throw new Error("Unable to generate mug preview");
        }
      }

      fireEvent("mug_preview_generated", {
        version: mode,
        style,
        variant: selectedPreviewKey,
      });
    } catch (previewErr) {
      setErr(previewErr instanceof Error ? previewErr.message : "Unable to generate preview.");
      setStep(6);
    } finally {
      setBusyPreview(false);
      previewLockRef.current = false;
    }
  };

  const checkout = async () => {
    if (!selectedDesign || !selectedMockupUrl) {
      setErr("Preview is required before checkout.");
      return;
    }
    if (!isLoggedIn && !emailOk(email)) {
      setErr("Enter a valid email address.");
      return;
    }

    setErr("");
    setBusyCheckout(true);

    try {
      const order = await createOrder.mutateAsync({
        productKey: "mug",
        variantId: MUG_VARIANT_ID,
        quantity,
        variantName: "White Glossy Mug 11 oz",
        size: "11 oz",
        imageUrl: selectedDesign,
        mockupUrl: selectedMockupUrl,
        pricingVariant: "11 oz",
        previewMode: "full-wrap",
        previewVariantId: MUG_VARIANT_ID,
        isBackgroundRemoved,
        snapshotVariantId: MUG_VARIANT_ID,
        snapshotSize: "11 oz",
        snapshotColor: "White",
        snapshotPrintPosition: "full-wrap",
        snapshotBackgroundRemoved: isBackgroundRemoved,
        shippingCountry: "US",
        funnelSource: "paid-traffic-offer",
      });

      const checkoutResumeUrl = `${window.location.origin}/checkout?orderId=${encodeURIComponent(
        order.orderId,
      )}&sourcePage=${encodeURIComponent(sourcePage)}&generator=${encodeURIComponent(
        sourcePage,
      )}${order.accessToken ? `&accessToken=${encodeURIComponent(order.accessToken)}` : ""}`;

      await capturePaidTrafficLeadIfNeeded(email, "checkout", checkoutResumeUrl);

      if (!isLoggedIn) {
        try {
          await captureCheckoutEmail.mutateAsync({
            orderId: order.orderId,
            accessToken: order.accessToken ?? undefined,
            email: email.trim().toLowerCase(),
            sourcePage,
            promotedProduct: "mug",
          });
        } catch (captureErr) {
          console.error("Failed to capture couple mug checkout email:", captureErr);
        }
      }

      const payload = { ...trackBase, value: 0, currency: "USD", quantity };
      trackEvent("begin_checkout", payload);
      fireMetaCustomEvent("begin_checkout", payload);

      await router.push(
        `/checkout?orderId=${encodeURIComponent(order.orderId)}&sourcePage=${encodeURIComponent(
          sourcePage,
        )}&generator=${encodeURIComponent(sourcePage)}${
          order.accessToken ? `&accessToken=${encodeURIComponent(order.accessToken)}` : ""
        }`,
      );
    } catch (checkoutErr) {
      setErr(checkoutErr instanceof Error ? checkoutErr.message : "Unable to start checkout.");
    } finally {
      setBusyCheckout(false);
    }
  };

  const goBack = () => {
    if (busyDesign || busyPreview || busyCheckout) return;
    setErr("");
    setStep((current) =>
      isModeLocked
        ? current === 7
          ? 6
          : current === 6
          ? 4
          : current === 5
          ? 4
          : current === 4
          ? 3
          : 1
        : current === 7
        ? 6
        : current === 6
        ? 4
        : current === 5
        ? 4
        : current === 4
        ? 3
        : current === 3
        ? 2
        : 1,
    );
  };

  const renderStep1 = () => (
    <section className="space-y-4">
      <div className={`${SURFACE_CARD_CLASS} overflow-hidden`}>
        <div className="overflow-hidden rounded-2xl border border-white/70 bg-white">
          <img
            src={selectedStyle.previewSrc}
            alt={selectedStyle.name}
            className="h-52 w-full object-cover"
          />
        </div>

        <div className="mt-5 text-center">
          <div className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-800">
            Personalized Couple Mug
          </div>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-950">
            {heroTitle}
          </h1>
          <p className="mt-3 text-base leading-7 text-gray-600">
            {heroDescription}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Both sides are now designed together in one matching mug wrap.
          </p>
          <p className="mt-2 text-sm font-semibold text-brand-700">
            1 free design pair included
          </p>
        </div>

        {!hasSavedDesign && (
          <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-4 text-sm text-brand-900">
            {heroHighlights.map((highlight) => (
              <div key={highlight}>{highlight}</div>
            ))}
          </div>
        )}

        {hasSavedDesign ? (
          <div className={`${WHITE_CARD_CLASS} mt-4`}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
              Saved design
            </p>
            <div className="mt-4 overflow-hidden rounded-xl bg-[#F8F8F8] p-3">
              <img
                src={wrapUrl ?? ""}
                alt="Saved couple mug wrap design"
                className="h-48 w-full object-contain"
              />
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-900">
              {herName && hisName ? `${herName} & ${hisName}` : "Your couple mug design"}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {mode === "avatar_name" ? "Avatar + Name" : "Names Only"} • {selectedStyle.name}
            </p>
            {centerText.trim().length > 0 && (
              <p className="mt-1 text-sm text-gray-500">Center text: {centerText.trim()}</p>
            )}
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
                  resetBuilder();
                  setStep(startStep);
                }}
                className={SECONDARY_BUTTON_CLASS}
              >
                {guestFreeDesignUsed ? "Sign in to start a new design" : "Start a new design"}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setStep(startStep)} className={`${PRIMARY_BUTTON_CLASS} mt-4`}>
            Start Designing
          </button>
        )}
      </div>
    </section>
  );

  const renderStep2 = () => (
    <section className="space-y-4">
      <div className={SURFACE_CARD_CLASS}>
        <h2 className="text-3xl font-bold text-slate-950">Choose your version</h2>
        <p className="mt-2 text-sm text-gray-600">
          Both versions generate one coordinated wrap so both sides stay in the same style.
        </p>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() => {
              if (guestFreeDesignLocked) {
                startGeneratorSignIn();
                return;
              }
              setMode("names_only");
              setErr("");
              setStep(3);
            }}
            className="rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-brand-500 hover:shadow-sm"
          >
            <div className="text-sm font-semibold text-brand-700">Names Only</div>
            <div className="mt-1 text-xl font-semibold text-slate-950">
              Side 1: her name, Side 2: his name
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Best for a clean romantic gift with both names generated together in one style.
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              if (guestFreeDesignLocked) {
                startGeneratorSignIn();
                return;
              }
              setMode("avatar_name");
              setErr("");
              setStep(3);
            }}
            className="rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-brand-500 hover:shadow-sm"
          >
            <div className="text-sm font-semibold text-brand-700">Avatar + Name</div>
            <div className="mt-1 text-xl font-semibold text-slate-950">
              Side 1: her avatar + name, Side 2: his avatar + name
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Upload two photos and we&apos;ll turn them into matching AI-styled portraits in one shared design.
            </div>
          </button>
        </div>
      </div>
    </section>
  );

  const renderStep3 = () => (
    <section className="space-y-4">
      <div className={SURFACE_CARD_CLASS}>
        <h2 className="text-3xl font-bold text-slate-950">Choose your style</h2>
        <p className="mt-2 text-sm text-gray-600">
          Pick the look for your final design, then generate the result.
        </p>

        {guestFreeDesignLocked && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold text-amber-950">
              You already used your 1 free design on this page.
            </p>
            <p className="mt-1">
              Continue with your saved style below, or sign in to unlock more styles.
            </p>
          </div>
        )}

        <div className="mt-5 grid gap-3">
          {COUPLE_NAME_MUG_V1_STYLES.map((styleOption) => {
            const isSelected = styleOption.id === effectiveStyleId;
            return (
              <button
                key={styleOption.id}
                type="button"
                disabled={guestFreeDesignLocked}
                onClick={() => {
                  if (guestFreeDesignLocked) {
                    startGeneratorSignIn();
                    return;
                  }
                  setStyle(styleOption.id);
                  setErr("");
                  resetDesignAssets();
                }}
                className={`overflow-hidden rounded-2xl border bg-white text-left transition ${
                  isSelected
                    ? "border-brand-500 shadow-md"
                    : guestFreeDesignLocked
                    ? "border-gray-200 opacity-70"
                    : "border-gray-200 hover:border-brand-500 hover:shadow-sm"
                } ${guestFreeDesignLocked ? "cursor-not-allowed" : ""}`}
              >
                <div className="relative">
                  {guestFreeDesignLocked && (
                    <div className="absolute left-4 top-4 z-10 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700 shadow-sm">
                      {isSelected ? "Saved design" : "Sign in to unlock"}
                    </div>
                  )}
                  <img
                    src={styleOption.previewSrc}
                    alt={styleOption.name}
                    className="h-40 w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="text-sm font-semibold text-brand-700">{styleOption.name}</div>
                  <div className="mt-1 text-sm text-gray-600">{styleOption.blurb}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-3">
          {guestFreeDesignLocked && (
            <>
              <div className="rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-3 text-sm text-brand-900">
                Sign in to generate more styles. Your current free design is already saved and
                ready for preview.
              </div>
              <button onClick={startGeneratorSignIn} className={SECONDARY_BUTTON_CLASS}>
                Sign in to generate more designs
              </button>
            </>
          )}

          {hasSavedDesign && isLoggedIn && freeGenerationUsed && (
            <button
              onClick={() => {
                setErr("");
                if (!canAffordRegen) {
                  retryRef.current = () => {
                    void runGeneration();
                  };
                  setUpgradeOpen(true);
                  return;
                }
                void runGeneration();
              }}
              disabled={busyDesign || uploadingSide !== null}
              className={SECONDARY_BUTTON_CLASS}
            >
              Generate Another Version ({REGEN_CREDITS} credits)
            </button>
          )}

          <button
            onClick={() => {
              setErr("");
              if (hasSavedDesign) {
                setStep(6);
                return;
              }
              void runGeneration();
            }}
            disabled={busyDesign || uploadingSide !== null}
            className={PRIMARY_BUTTON_CLASS}
          >
            {guestFreeDesignLocked
              ? "Continue with saved design"
              : hasSavedDesign
              ? "Continue with current design"
              : freeGenerationUsed && isLoggedIn
              ? `Generate Another Version (${REGEN_CREDITS} credits)`
              : isLoggedIn
              ? `Generate Design (${REGEN_CREDITS} credits)`
              : "Generate My Free Design"}
          </button>

          {isLoggedIn && !hasSavedDesign && (
            <p className="text-center text-xs text-gray-500">
              Each new generation on this funnel costs {REGEN_CREDITS} credits.
            </p>
          )}
        </div>
      </div>
    </section>
  );

  const renderStep5 = () => (
    <section className="space-y-4">
      <div className={SURFACE_CARD_CLASS}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold text-slate-950">Personalize the mug</h2>
            <p className="mt-2 text-sm text-gray-600">
              {mode === "avatar_name"
                ? "Upload both photos and add both names."
                : "Add both names for the final full-wrap mug design."}
            </p>
          </div>
          <div className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800">
            {mode === "avatar_name" ? "Avatar + Name" : "Names Only"}
          </div>
        </div>

        {guestFreeDesignLocked && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold text-amber-950">
              You already used your 1 free design on this page.
            </p>
            <p className="mt-1">
              Continue with your saved details below, or sign in to create another version.
            </p>
          </div>
        )}

        <div className="mt-5 grid gap-3">
          <div className={WHITE_CARD_CLASS}>
            <label className="text-sm font-semibold text-slate-900">Her name</label>
            <input
              value={herName}
              onChange={(event) => {
                if (guestFreeDesignLocked) {
                  showGuestFreeDesignLockedError(
                    "Your free design is already saved. Sign in to create another version.",
                  );
                  return;
                }
                setHerName(event.target.value);
                resetDesignAssets();
              }}
              readOnly={guestFreeDesignLocked}
              placeholder="Sara"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-brand-500"
            />
          </div>

          <div className={WHITE_CARD_CLASS}>
            <label className="text-sm font-semibold text-slate-900">His name</label>
            <input
              value={hisName}
              onChange={(event) => {
                if (guestFreeDesignLocked) {
                  showGuestFreeDesignLockedError(
                    "Your free design is already saved. Sign in to create another version.",
                  );
                  return;
                }
                setHisName(event.target.value);
                resetDesignAssets();
              }}
              readOnly={guestFreeDesignLocked}
              placeholder="Adam"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-brand-500"
            />
          </div>

          <div className={WHITE_CARD_CLASS}>
            <label className="text-sm font-semibold text-slate-900">
              Date or short message
              <span className="ml-1 font-normal text-gray-500">(optional)</span>
            </label>
            <input
              value={centerText}
              onChange={(event) => {
                if (guestFreeDesignLocked) {
                  showGuestFreeDesignLockedError(
                    "Your free design is already saved. Sign in to create another version.",
                  );
                  return;
                }
                setCenterText(event.target.value);
                resetDesignAssets();
              }}
              readOnly={guestFreeDesignLocked}
              maxLength={50}
              placeholder="Forever & Always • 12.06.2024"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-brand-500"
            />
            <p className="mt-2 text-xs text-gray-500">
              This text will be placed in the center below both names.
            </p>
          </div>
        </div>

        {showPhotoInputs && (
          <div className="mt-5 grid gap-3">
            <div className={WHITE_CARD_CLASS}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Her photo</div>
                  <div className="mt-1 text-xs text-gray-500">Clear portrait photos work best.</div>
                </div>
                <label
                  onClick={(event) => {
                    if (!guestFreeDesignLocked) return;
                    event.preventDefault();
                    startGeneratorSignIn();
                  }}
                  className={`inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 transition ${
                    guestFreeDesignLocked
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:bg-gray-50"
                  }`}
                >
                  {uploadingSide === "her" ? "Uploading..." : herPhotoUrl ? "Replace photo" : "Upload photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => void handlePhotoSelected("her", event)}
                  />
                </label>
              </div>
              {herPhotoUrl && (
                <div className="mt-3 overflow-hidden rounded-xl bg-[#F8F8F8] p-2">
                  <img
                    src={herPhotoUrl}
                    alt="Her uploaded photo"
                    className="aspect-square w-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className={WHITE_CARD_CLASS}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">His photo</div>
                  <div className="mt-1 text-xs text-gray-500">Clear portrait photos work best.</div>
                </div>
                <label
                  onClick={(event) => {
                    if (!guestFreeDesignLocked) return;
                    event.preventDefault();
                    startGeneratorSignIn();
                  }}
                  className={`inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 transition ${
                    guestFreeDesignLocked
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:bg-gray-50"
                  }`}
                >
                  {uploadingSide === "his" ? "Uploading..." : hisPhotoUrl ? "Replace photo" : "Upload photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => void handlePhotoSelected("his", event)}
                  />
                </label>
              </div>
              {hisPhotoUrl && (
                <div className="mt-3 overflow-hidden rounded-xl bg-[#F8F8F8] p-2">
                  <img
                    src={hisPhotoUrl}
                    alt="His uploaded photo"
                    className="aspect-square w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {showPhotoInputs && guestFreeDesignLocked && (
          <p className="mt-3 text-xs text-gray-500">
            Sign in to replace photos or generate another version.
          </p>
        )}

        <div className="mt-5 space-y-3">
          <button
            onClick={() => {
              if (herName.trim().length < 2 || hisName.trim().length < 2) {
                setErr("Enter both names to continue.");
                return;
              }
              if (mode === "avatar_name" && (!herPhotoUrl || !hisPhotoUrl)) {
                setErr("Upload both photos for the avatar version.");
                return;
              }
              setErr("");
              setStep(4);
            }}
            disabled={uploadingSide !== null}
            className={PRIMARY_BUTTON_CLASS}
          >
            Next: Choose Style
          </button>
        </div>
      </div>
    </section>
  );

  const renderStep4 = () => (
    <section className="space-y-4">
      <div className={`${SURFACE_CARD_CLASS} text-center`}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-current border-t-transparent" />
        </div>
        <h2 className="mt-4 text-3xl font-bold text-slate-950">Creating your mug design</h2>
        <p className="mt-2 text-sm text-gray-600">
          We&apos;re generating one coordinated wrap and then preparing the review sides.
        </p>

        <div className="mt-5 h-2 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-brand-600 transition-all duration-300"
            style={{ width: `${designProgress}%` }}
          />
        </div>

        <div className="mt-5 space-y-3 text-left">
          {DESIGN_LOADING_STEPS.map((label, index) => {
            const stepSize = 100 / DESIGN_LOADING_STEPS.length;
            const relativeProgress = ((designProgress - stepSize * index) / stepSize) * 100;
            return (
              <div key={label} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-900">{label}</span>
                  <span className={relativeProgress > 0 ? "text-brand-700" : "text-gray-400"}>
                    {Math.max(0, Math.min(100, Math.round(relativeProgress)))}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-brand-600 transition-all duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, relativeProgress))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );

  const renderStep6 = () => (
    <section className="space-y-4">
      <div className={SURFACE_CARD_CLASS}>
        <h2 className="text-3xl font-bold text-slate-950">Choose your final design</h2>
        <p className="mt-2 text-sm text-gray-600">
          Select the original image or the transparent version before generating the mug preview.
        </p>

        <div className={`${WHITE_CARD_CLASS} mt-4`}>
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => setUseTransparentDesign(false)}
              className={`overflow-hidden rounded-2xl border bg-white p-3 text-left transition ${
                !useTransparentDesign
                  ? "border-brand-500 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-950">Original Image</div>
                  <div className="text-xs text-gray-500">
                    Use the full wrap artwork with its original background.
                  </div>
                </div>
                {!useTransparentDesign && (
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-800">
                    Selected
                  </span>
                )}
              </div>

              <div className="overflow-hidden rounded-xl bg-[#F8F8F8] p-3">
                {originalDesign ? (
                  <img
                    src={originalDesign}
                    alt="Original couple mug wrap design"
                    className="h-48 w-full object-contain"
                  />
                ) : (
                  <div className="h-48 w-full bg-[#F8F8F8]" />
                )}
              </div>
            </button>

            {hasTransparentOption && (
              <button
                type="button"
                onClick={() => setUseTransparentDesign(true)}
                className={`overflow-hidden rounded-2xl border bg-white p-3 text-left transition ${
                  useTransparentDesign
                    ? "border-brand-500 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-950">
                      Transparent Image
                    </div>
                    <div className="text-xs text-gray-500">
                      Best if you want the artwork isolated on the mug.
                    </div>
                  </div>
                  {useTransparentDesign && (
                    <span className="rounded-full bg-brand-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-800">
                      Selected
                    </span>
                  )}
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%,#f8fafc),linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%,#f8fafc)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] p-3">
                  {transparentWrapUrl ? (
                    <img
                      src={transparentWrapUrl}
                      alt="Transparent couple mug wrap design"
                      className="h-48 w-full object-contain"
                    />
                  ) : (
                    <div className="h-48 w-full" />
                  )}
                </div>
              </button>
            )}
          </div>

          <p className="mt-4 text-xs text-gray-500">
            The selected version will be used for the mug preview and checkout.
          </p>
          <p className="mt-4 text-lg font-semibold text-slate-900">
            {herName && hisName ? `${herName} & ${hisName}` : "Your couple mug design"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {mode === "avatar_name" ? "Avatar + Name" : "Names Only"} in {selectedStyle.name}.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Quantity: {quantity} mug{quantity > 1 ? "s" : ""}
          </p>
          {centerText.trim().length > 0 && (
            <p className="mt-1 text-sm text-gray-500">Center text: {centerText.trim()}</p>
          )}
        </div>

        <div className="mt-5 grid gap-3">
          <button onClick={() => void goStep7()} className={PRIMARY_BUTTON_CLASS}>
            Generate Mug Preview
          </button>
        </div>
      </div>
    </section>
  );

  const renderStep7 = () => (
    <section className="space-y-4">
      <div className={SURFACE_CARD_CLASS}>
        <h2 className="text-3xl font-bold text-slate-950">Your mug preview</h2>
        <p className="mt-2 text-sm text-gray-600">
          Review the final mug and continue to secure checkout.
        </p>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {busyPreview || !selectedMockupUrl ? (
            <div className="p-5">
              <div className="text-sm font-semibold text-slate-900">Generating preview</div>
              <div className="mt-3 h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-brand-600 transition-all duration-300"
                  style={{ width: `${previewProgress}%` }}
                />
              </div>
            </div>
          ) : selectedCenterMockupUrl ? (
            <div className="grid gap-3 p-3 sm:grid-cols-3">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {selectedSecondaryMockupUrl ? (
                  <img
                    src={selectedSecondaryMockupUrl}
                    alt="Couple mug alternate preview"
                    className="w-full object-cover"
                  />
                ) : (
                  <img
                    src={selectedMockupUrl}
                    alt="Couple mug preview side"
                    className="w-full object-cover"
                  />
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <img
                  src={selectedCenterMockupUrl}
                  alt="Couple mug center preview"
                  className="w-full object-cover"
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <img
                  src={selectedMockupUrl}
                  alt="Couple mug primary preview"
                  className="w-full object-cover"
                />
              </div>
            </div>
          ) : selectedSecondaryMockupUrl ? (
            <div className="grid gap-3 p-3 sm:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <img
                  src={selectedSecondaryMockupUrl}
                  alt="Couple mug alternate preview"
                  className="w-full object-cover"
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <img
                  src={selectedMockupUrl}
                  alt="Couple mug primary preview"
                  className="w-full object-cover"
                />
              </div>
            </div>
          ) : (
            <img
              src={selectedMockupUrl}
              alt="Couple mug preview"
              className="w-full object-cover"
            />
          )}
        </div>

        <div className={`${WHITE_CARD_CLASS} mt-5`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">Quantity</div>
              <div className="mt-1 text-xs text-gray-500">
                Order up to 6 mugs with this same design.
              </div>
            </div>

            <div className="inline-flex items-center rounded-xl border border-gray-300 bg-white">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1 || busyCheckout}
                className="px-4 py-3 text-lg font-semibold text-slate-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <div className="min-w-[3.25rem] border-x border-gray-300 px-4 py-3 text-center text-base font-semibold text-slate-900">
                {quantity}
              </div>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.min(6, current + 1))}
                disabled={quantity >= 6 || busyCheckout}
                className="px-4 py-3 text-lg font-semibold text-slate-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {!isLoggedIn && (
          <div className={`${WHITE_CARD_CLASS} mt-5`}>
            <label className="text-sm font-semibold text-slate-900">Email for your order</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-brand-500"
            />
            <p className="mt-2 text-xs text-gray-500">
              We&apos;ll use this for checkout access and order updates.
            </p>
          </div>
        )}

        <div className="mt-5 grid gap-3">
          <button
            onClick={() => void checkout()}
            disabled={busyPreview || busyCheckout || !selectedMockupUrl}
            className={PRIMARY_BUTTON_CLASS}
          >
            {busyCheckout ? "Starting Checkout..." : "Continue To Checkout"}
          </button>
        </div>
      </div>
    </section>
  );

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
      </Head>

      <main className="min-h-screen bg-white text-slate-900" style={{ colorScheme: "light" }}>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex w-full max-w-md items-center justify-center gap-3 px-4 py-4 sm:max-w-lg">
            <img src="/logo.webp" alt="Name Design AI" className="h-10 w-10 rounded-xl" />
            <div className="text-left">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              Name Design AI
            </div>
            <div className="text-sm font-semibold text-slate-900">{headerTitle}</div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md px-4 pb-20 pt-4 sm:max-w-lg">
        <div className={`${SURFACE_CARD_CLASS} mb-4`}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-900">
                Step {displayStep}: {displayStepTitle}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
                {displayStep}/{totalSteps}
            </span>
          </div>
            <div className="mt-3 h-2 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-brand-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              disabled={busyDesign || busyPreview || busyCheckout}
              className="mb-4 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
          )}

          {step === 1 && renderStep1()}
          {!isModeLocked && step === 2 && renderStep2()}
          {step === 3 && renderStep5()}
          {step === 4 && renderStep3()}
          {step === 5 && renderStep4()}
          {step === 6 && renderStep6()}
          {step === 7 && renderStep7()}

          {err && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}
        </div>
      </main>

      <CreditUpgradeModal
        isOpen={upgradeOpen}
        requiredCredits={REGEN_CREDITS}
        currentCredits={credits.data ?? 0}
        context="generate"
        sourcePage={sourcePage}
        onClose={() => setUpgradeOpen(false)}
        onSuccess={() => {
          setUpgradeOpen(false);
          retryRef.current?.();
        }}
      />
    </>
  );
}
