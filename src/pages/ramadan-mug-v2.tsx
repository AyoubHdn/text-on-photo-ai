import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CreditUpgradeModal } from "~/component/Credits/CreditUpgradeModal";
import { RAMADAN_MUG_V2_STYLES } from "~/config/ramadanMugV2Styles";
import { trackEvent } from "~/lib/ga";
import { getFunnelContext } from "~/lib/tracking/funnel";
import { api } from "~/utils/api";

type Recipient =
  | "My Husband"
  | "My Wife"
  | "My Father"
  | "My Mother"
  | "Someone Special";
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Variant = "original" | "transparent";
type Saved = {
  step: Step;
  recipient: Recipient | "";
  name: string;
  styleId: string;
  designUrl: string | null;
  transparentUrl: string | null;
  variant: Variant;
  hasFree: boolean;
  mockupOriginal: string | null;
  mockupTransparent: string | null;
  email: string;
};

const STORAGE_KEY = "ramadan-mug-v2:funnel:v4";
const PENDING_REGEN_KEY = "ramadan-mug-v2:pending-regenerate";
const CLAIMED_DESIGN_KEY = "ramadan-mug-v2:claimed-design-id";
const REGEN_CREDITS = 4;
const MUG_VARIANT_ID = 1320;
const RECIPIENTS: Recipient[] = [
  "My Husband",
  "My Wife",
  "My Father",
  "My Mother",
  "Someone Special",
];
const STEP_NAMES: Record<Step, string> = {
  1: "intro",
  2: "recipient",
  3: "name",
  4: "style",
  5: "generation",
  6: "variant",
  7: "checkout",
};
const STEP_TITLES: Record<Step, string> = {
  1: "Start",
  2: "Who Is This For?",
  3: "Enter Name",
  4: "Choose Style",
  5: "Generating Design",
  6: "Choose Version",
  7: "Mug Preview",
};
const DESIGN_LOADING_STEPS = [
  "Generating your design",
  "Removing background",
  "Enhancing quality",
  "Preparing final result",
] as const;
const DESIGN_PROGRESS_SEQUENCE = [
  12, 14, 17, 20, 23, 25, 28, 31, 34, 38, 42, 46, 50, 55, 60, 65, 69, 73, 77,
  81, 84, 87, 89, 91, 93, 94, 95,
] as const;
const PREVIEW_PROGRESS_SEQUENCE = [
  12, 15, 19, 24, 29, 34, 39, 45, 51, 57, 63, 69, 74, 79, 83, 87, 91, 94, 96,
] as const;
const PREVIEW_TESTIMONIAL_IMAGES = [
  { name: "Ahmed", thumbnail: "/images/products/Ahmed.webp" },
  { name: "Yusuf", thumbnail: "/images/products/Yusuf.webp" },
  { name: "Omar", thumbnail: "/images/products/Omar.webp" },
  { name: "Ramadan", thumbnail: "/images/products/Ramadan.webp" },
] as const;
const PREVIEW_TESTIMONIALS = [
  "He smiled the moment he opened it. The quality is amazing.",
  "Beautiful print, fast shipping, and the name design felt truly personal.",
  "It looked even better in person. Perfect Ramadan gift.",
] as const;

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const imageIdFromUrl = (u: string) => {
  try {
    const x = new URL(u);
    const p = x.pathname.split("/").filter(Boolean);
    return p[p.length - 1] ?? "";
  } catch {
    const p = u.split("/").filter(Boolean);
    return p[p.length - 1] ?? "";
  }
};

const RamadanMugV2Page: NextPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user?.id);
  const utils = api.useContext();
  const credits = api.user.getCredits.useQuery(undefined, { enabled: isLoggedIn });
  const genGuest = api.generate.generateGuestDesign.useMutation();
  const genIcon = api.generate.generateIcon.useMutation();
  const createOrder = api.productOrder.createPendingOrder.useMutation();
  const captureCheckoutEmail = api.productOrder.captureCheckoutEmail.useMutation();
  const claimGuestDesign = api.icons.claimGuestRamadanMugV2Design.useMutation();

  const [step, setStep] = useState<Step>(1);
  const [recipient, setRecipient] = useState<Recipient | "">("");
  const [name, setName] = useState("");
  const [styleId, setStyleId] = useState("");
  const [designUrl, setDesignUrl] = useState<string | null>(null);
  const [transparentUrl, setTransparentUrl] = useState<string | null>(null);
  const [variant, setVariant] = useState<Variant>("original");
  const [hasFree, setHasFree] = useState(false);
  const [mockupOriginal, setMockupOriginal] = useState<string | null>(null);
  const [mockupTransparent, setMockupTransparent] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [busyDesign, setBusyDesign] = useState(false);
  const [busyPreview, setBusyPreview] = useState(false);
  const [busyCheckout, setBusyCheckout] = useState(false);
  const [progress, setProgress] = useState(8);
  const [designLoadingStage, setDesignLoadingStage] = useState(0);
  const [designLoadingProgress, setDesignLoadingProgress] = useState(12);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [styleUnlockPromptOpen, setStyleUnlockPromptOpen] = useState(false);
  const [resumeRegenPending, setResumeRegenPending] = useState(false);
  const [hasHydratedSavedState, setHasHydratedSavedState] = useState(false);
  const retryRef = useRef<null | (() => void)>(null);
  const pendingSignInRegen = useRef(false);
  const pendingStyleAfterSignInRef = useRef<string | null>(null);
  const pendingStyleUnlockRegenRef = useRef(false);
  const generationLockRef = useRef(false);
  const viewedRef = useRef(false);

  const style = useMemo(
    () => RAMADAN_MUG_V2_STYLES.find((s) => s.id === styleId) ?? null,
    [styleId],
  );
  const hasSavedDesign = Boolean(designUrl || transparentUrl);
  const selectedDesign =
    variant === "transparent" && transparentUrl ? transparentUrl : designUrl;
  const selectedMockup =
    variant === "transparent" ? mockupTransparent : mockupOriginal;
  const isPaidTraffic = useMemo(() => {
    const c =
      typeof router.query.utm_campaign === "string"
        ? router.query.utm_campaign.toLowerCase()
        : "";
    const m =
      typeof router.query.utm_medium === "string"
        ? router.query.utm_medium.toLowerCase()
        : "";
    return c === "ramadan_mug_women" && m === "paid_social";
  }, [router.query.utm_campaign, router.query.utm_medium]);
  const trackBase = useMemo(
    () => ({
      ...getFunnelContext({
        route: router.pathname,
        sourcePage: "ramadan-mug-v2",
        paidTrafficUser: true,
        query: router.query as Record<string, unknown>,
      }),
      funnel: "ramadan_mug_v2",
      traffic_type: "paid",
      source_page: "ramadan-mug-v2",
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

  const fireMetaStandardEvent = (
    eventName: "InitiateCheckout" | "Purchase",
    params: Record<string, unknown>,
  ) => {
    const fireMeta = () => {
      const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
      if (typeof maybeFbq !== "function") return false;
      maybeFbq("track", eventName, params);
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

  const fireEvent = (event: string, extra?: Record<string, unknown>) => {
    const payload = { ...trackBase, ...(extra ?? {}) };
    trackEvent(event, payload);
    fireMetaCustomEvent(event, payload);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Saved;
      setStep(s.step ?? 1);
      setRecipient(s.recipient ?? "");
      setName(s.name ?? "");
      setStyleId(s.styleId ?? "");
      setDesignUrl(s.designUrl ?? null);
      setTransparentUrl(s.transparentUrl ?? null);
      setVariant(s.variant ?? "original");
      setHasFree(Boolean(s.hasFree));
      setMockupOriginal(s.mockupOriginal ?? null);
      setMockupTransparent(s.mockupTransparent ?? null);
      setEmail(s.email ?? "");
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
    const s: Saved = {
      step,
      recipient,
      name,
      styleId,
      designUrl,
      transparentUrl,
      variant,
      hasFree,
      mockupOriginal,
      mockupTransparent,
      email,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }, [
    hasHydratedSavedState,
    step,
    recipient,
    name,
    styleId,
    designUrl,
    transparentUrl,
    variant,
    hasFree,
    mockupOriginal,
    mockupTransparent,
    email,
  ]);

  useEffect(() => {
    if (!viewedRef.current) {
      viewedRef.current = true;
      fireEvent("view_ramadan_mug_v2");
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !designUrl) return;
    const iconId = imageIdFromUrl(designUrl);
    if (!iconId) return;
    if (typeof window !== "undefined") {
      const claimedId = window.sessionStorage.getItem(CLAIMED_DESIGN_KEY);
      if (claimedId === iconId) return;
    }
    void claimGuestDesign
      .mutateAsync({ iconId })
      .then(() => {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(CLAIMED_DESIGN_KEY, iconId);
        }
      })
      .catch(() => {
        // Ignore claim failures here; the funnel can continue with local state.
      });
  }, [claimGuestDesign, designUrl, isLoggedIn]);

  useEffect(() => {
    fireEvent("mug_funnel_step_selected", { step_name: STEP_NAMES[step] });
  }, [step]);

  useEffect(() => {
    if (step === 5 && !busyDesign && designUrl) setStep(6);
  }, [step, busyDesign, designUrl]);

  useEffect(() => {
    if (!busyPreview) {
      setProgress(8);
      return;
    }
    setProgress(PREVIEW_PROGRESS_SEQUENCE[0]);
    let idx = 0;
    const t = window.setInterval(() => {
      idx += 1;
      const next = PREVIEW_PROGRESS_SEQUENCE[idx];
      if (typeof next === "number") {
        setProgress(next);
        return;
      }
      window.clearInterval(t);
    }, 2400);
    return () => window.clearInterval(t);
  }, [busyPreview]);

  useEffect(() => {
    if (!busyDesign) {
      setDesignLoadingStage(0);
      setDesignLoadingProgress(12);
      return;
    }
    setDesignLoadingStage(0);
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
    }, 2200);
    const timers = [12000, 25000, 39000].map((delay, index) =>
      window.setTimeout(() => {
        setDesignLoadingStage(index + 1);
      }, delay),
    );
    return () => {
      window.clearInterval(progressTimer);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [busyDesign]);

  const removeBg = async (url: string) => {
    const imageId = imageIdFromUrl(url);
    const res = await fetch("/api/image/remove-background", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, paidTrafficUser: true }),
    });
    const data = (await res.json()) as {
      transparentImageUrl?: string;
      error?: string;
    };
    if (!res.ok) {
      console.warn("[RAMADAN_MUG_V2_REMOVE_BG]", data.error || "Background removal failed");
      return null;
    }
    return data.transparentImageUrl ?? null;
  };

  const buildPrompt = () => {
    const base = (style?.basePrompt ?? "Elegant Arabic calligraphy of 'Text'.")
      .replace(/'Text'/g, `'${name.trim()}'`)
      .replace(/\bText\b/g, name.trim());
    return `${base} Recipient context: ${
      recipient || "Someone Special"
    }. Keep only the provided name.`;
  };

  const canAffordRegen = (credits.data ?? 0) >= REGEN_CREDITS;
  const styleSelectionRequiresSignIn = hasFree && !!designUrl && !isLoggedIn;

  const selectStyle = (nextStyleId: string) => {
    if (styleSelectionRequiresSignIn) {
      pendingStyleAfterSignInRef.current = nextStyleId;
      pendingStyleUnlockRegenRef.current = false;
      setStyleUnlockPromptOpen(true);
      return;
    }
    setStyleId(nextStyleId);
    setErr("");
  };

  const continueStyleUnlockSignIn = async () => {
    if (pendingStyleUnlockRegenRef.current && typeof window !== "undefined") {
      window.sessionStorage.setItem(PENDING_REGEN_KEY, "1");
    }
    pendingSignInRegen.current = pendingStyleUnlockRegenRef.current;
    setStyleUnlockPromptOpen(false);
    await signIn(undefined, { callbackUrl: router.asPath });
  };

  const runGeneration = async (paid: boolean) => {
    if (generationLockRef.current || busyDesign || !styleId || name.trim().length < 2) {
      return;
    }
    const requiresPaidGeneration = paid || isLoggedIn;
    if (requiresPaidGeneration && (credits.data ?? 0) < REGEN_CREDITS) {
      retryRef.current = () => {
        void runGeneration(true);
      };
      setUpgradeOpen(true);
      return;
    }
    generationLockRef.current = true;
    retryRef.current = null;
    setBusyDesign(true);
    setErr("");
    setStep(5);
    try {
      fireEvent("generate_design_started", {
        style_id: styleId,
        mode: requiresPaidGeneration ? "paid_regenerate" : "free",
      });
      const nextDesign = requiresPaidGeneration
        ? (await genIcon.mutateAsync({
            prompt: buildPrompt(),
            numberOfImages: 1,
            aspectRatio: "1:1",
            model: "google/nano-banana-pro",
            metadata: {
              category: "ramadan-mug-v2",
              subcategory: style?.name,
            },
            sourcePage: "ramadan-mug-v2",
          }))[0]?.imageUrl ?? ""
        : (
            await genGuest.mutateAsync({
              name: name.trim(),
              style: styleId,
              recipient: (recipient || "Someone Special") as Recipient,
            })
          ).design_url;
      if (!nextDesign) throw new Error("No generated image returned");
      let nextTransparent: string | null = null;
      try {
        nextTransparent = await removeBg(nextDesign);
      } catch (removeBgError) {
        console.error("[RAMADAN_MUG_V2_REMOVE_BG]", removeBgError);
      }
      setDesignUrl(nextDesign);
      setTransparentUrl(nextTransparent);
      setVariant(nextTransparent ? "transparent" : "original");
      setHasFree(true);
      setMockupOriginal(null);
      setMockupTransparent(null);
      setStep(6);
      fireEvent("generate_design_completed", {
        style_id: styleId,
        design_url: nextDesign,
        transparent_design_url: nextTransparent,
        mode: requiresPaidGeneration ? "paid_regenerate" : "free",
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Generation failed");
      setStep(4);
    } finally {
      setBusyDesign(false);
      generationLockRef.current = false;
    }
  };

  const requestRegen = async () => {
    if (!isLoggedIn) {
      pendingSignInRegen.current = true;
      sessionStorage.setItem(PENDING_REGEN_KEY, "1");
      await signIn(undefined, { callbackUrl: router.asPath });
      return;
    }
    if ((credits.data ?? 0) < REGEN_CREDITS) {
      retryRef.current = () => {
        void runGeneration(true);
      };
      setUpgradeOpen(true);
      return;
    }
    await runGeneration(true);
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const pending =
      pendingSignInRegen.current ||
      (typeof window !== "undefined" &&
        window.sessionStorage.getItem(PENDING_REGEN_KEY) === "1");
    if (!pending) return;

    pendingSignInRegen.current = false;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(PENDING_REGEN_KEY);
    }
    setResumeRegenPending(true);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const pendingStyleId = pendingStyleAfterSignInRef.current;
    if (!pendingStyleId) return;

    setStyleId(pendingStyleId);
    setErr("");
    pendingStyleAfterSignInRef.current = null;
    pendingStyleUnlockRegenRef.current = false;
  }, [isLoggedIn]);

  useEffect(() => {
    if (!resumeRegenPending || !isLoggedIn || credits.isLoading) return;

    retryRef.current = () => {
      void runGeneration(true);
    };

    if ((credits.data ?? 0) >= REGEN_CREDITS) {
      setResumeRegenPending(false);
      void runGeneration(true);
      return;
    }

    setUpgradeOpen(true);
    setResumeRegenPending(false);
  }, [resumeRegenPending, isLoggedIn, credits.isLoading, credits.data]);

  useEffect(() => {
    const shouldBlockBack = busyDesign || busyPreview;

    router.beforePopState(() => !shouldBlockBack);

    return () => {
      router.beforePopState(() => true);
    };
  }, [router, busyDesign, busyPreview]);

  const makePreview = async () => {
    if (!selectedDesign) throw new Error("No selected design");
    const r = await fetch("/api/printful/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productKey: "mug",
        imageUrl: selectedDesign,
        variantId: MUG_VARIANT_ID,
        previewMode: "two-side",
        paidTrafficUser: true,
      }),
    });
    const d = (await r.json()) as { mockupUrl?: string; error?: string };
    if (!r.ok || !d.mockupUrl) {
      throw new Error(d.error || "Unable to generate mug preview");
    }
    return d.mockupUrl;
  };

  const goStep7 = async () => {
    if (!selectedDesign) {
      setErr("Choose a design version first.");
      return;
    }
    setErr("");
    setStep(7);
    setProgress(8);
    const cached = variant === "transparent" ? mockupTransparent : mockupOriginal;
    if (cached) return;
    try {
      setBusyPreview(true);
      const m = await makePreview();
      setProgress(100);
      if (variant === "transparent") setMockupTransparent(m);
      else setMockupOriginal(m);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unable to generate preview");
      setStep(6);
    } finally {
      setBusyPreview(false);
    }
  };

  const checkout = async () => {
    if (!selectedDesign || !selectedMockup) {
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
        mockupUrl: selectedMockup,
        pricingVariant: "11 oz",
        previewMode: "two-side",
        previewVariantId: MUG_VARIANT_ID,
        isBackgroundRemoved: variant === "transparent",
        snapshotVariantId: MUG_VARIANT_ID,
        snapshotSize: "11 oz",
        snapshotColor: "White",
        snapshotPrintPosition: "two-side",
        snapshotBackgroundRemoved: variant === "transparent",
        shippingCountry: "US",
        funnelSource: "paid-traffic-offer",
      });
      if (!isLoggedIn) {
        try {
          await captureCheckoutEmail.mutateAsync({
            orderId: order.orderId,
            accessToken: order.accessToken ?? undefined,
            email: email.trim().toLowerCase(),
            sourcePage: "ramadan-mug-v2",
            promotedProduct: "mug",
          });
        } catch (captureErr) {
          console.error("Failed to capture Ramadan mug checkout email:", captureErr);
        }
      }
      const payload = { ...trackBase, value: 0, currency: "USD" };
      trackEvent("begin_checkout", payload);
      fireMetaStandardEvent("InitiateCheckout", payload);
      await router.push(
        `/checkout?orderId=${encodeURIComponent(order.orderId)}${
          order.accessToken
            ? `&accessToken=${encodeURIComponent(order.accessToken)}`
            : ""
        }`,
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unable to start checkout.");
    } finally {
      setBusyCheckout(false);
    }
  };

  const progressPct =
    step === 1
      ? 10
      : step === 2
      ? 25
      : step === 3
      ? 40
      : step === 4
      ? 60
      : step === 5
      ? 75
      : step === 6
      ? 88
      : 100;
  const getDesignRowProgress = (index: number) => {
    const ranges = [
      { start: 0, end: 35 },
      { start: 35, end: 60 },
      { start: 60, end: 80 },
      { start: 80, end: 97 },
    ] as const;
    const range = ranges[index];
    if (!range) return 0;
    if (designLoadingProgress >= range.end) return 100;
    if (designLoadingProgress <= range.start) return 0;
    return Math.max(
      6,
      Math.min(
        99,
        Math.round(
          ((designLoadingProgress - range.start) / (range.end - range.start)) * 100,
        ),
      ),
    );
  };

  return (
    <>
      <Head>
        <title>Ramadan Mug Funnel V2</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
      </Head>
      <main className="min-h-screen bg-white text-[#111111]">
        <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-6">
          {isLoggedIn && (
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm">
              <span className="font-medium text-[#111111]">Your credits balance</span>
              <span className="font-semibold text-[#2563EB]">
                {credits.data ?? 0} credits
              </span>
            </div>
          )}
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-[#111111]">
              Step {step}: {STEP_TITLES[step]}
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
              {step}/7
            </span>
          </div>
          <div className="mb-4 h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-[#2563EB]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {step > 1 && (
            <button
              type="button"
              onClick={() =>
                setStep(
                  step === 7
                    ? 6
                    : step === 6
                    ? 4
                    : step === 5
                    ? 4
                    : step === 4
                    ? 3
                    : step === 3
                    ? 2
                    : 1,
                )
              }
              disabled={busyDesign || busyPreview}
              className="mb-4 rounded-xl border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
          )}

          {step === 1 && (
            <section className="flex min-h-[70vh] flex-col items-center justify-center text-center">
              <h1 className="text-3xl font-bold">
                A Personalized Ramadan Mug for Someone You Love
              </h1>
              {hasSavedDesign ? (
                <>
                  <p className="mt-3 text-gray-600">
                    Your personalized Ramadan mug design is ready. Review it and continue to create a beautiful gift.
                  </p>
                  <div className="mt-5 w-full max-w-sm overflow-hidden rounded-3xl border border-gray-200 bg-white p-3 text-left shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2563EB]">
                      Your personalized design
                    </p>
                    <img
                      src={transparentUrl ?? designUrl ?? ""}
                      alt="Saved Ramadan mug design"
                      className="mt-3 h-56 w-full rounded-2xl object-contain"
                    />
                    <p className="mt-3 text-sm font-semibold text-[#111111]">
                      {name ? `"${name}"` : "Your saved design"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {style?.name ?? "Saved style"}
                    </p>
                    <p className="mt-3 text-xs text-gray-600">
                      Created just for your name - printed only after you order.
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(6)}
                    className="mt-6 w-full rounded-2xl bg-[#2563EB] px-4 py-4 font-semibold text-white"
                  >
                    Continue with my design
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="mt-3 w-full rounded-2xl border border-[#2563EB] px-4 py-4 font-semibold text-[#2563EB]"
                  >
                    Create a new one
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-3 text-gray-600">
                    Enter a name, pick a style, and get your custom design instantly.
                    <br />
                    Free premium design + free shipping.
                  </p>
              {hasSavedDesign ? (
                <>
                  <p className="mt-3 text-gray-600">
                    Your last design is saved here. Continue with it or start a new one.
                  </p>
                  <div className="mt-5 w-full max-w-sm overflow-hidden rounded-3xl border border-gray-200 bg-white p-3 text-left shadow-sm">
                    <img
                      src={transparentUrl ?? designUrl ?? ""}
                      alt="Saved Ramadan mug design"
                      className="h-56 w-full rounded-2xl object-contain"
                    />
                    <p className="mt-3 text-sm font-semibold text-[#111111]">
                      {name ? `"${name}"` : "Your saved design"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {style?.name ?? "Saved style"}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep(selectedMockup ? 7 : 6)}
                    className="mt-6 w-full rounded-2xl bg-[#2563EB] px-4 py-4 font-semibold text-white"
                  >
                    Continue with my design
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="mt-3 w-full rounded-2xl border border-[#2563EB] px-4 py-4 font-semibold text-[#2563EB]"
                  >
                    Create a new one
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setStep(2)}
                  className="mt-8 w-full rounded-2xl bg-[#2563EB] px-4 py-4 font-semibold text-white"
                >
                  Start Designing
                </button>
              )}
                </>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="space-y-3">
              <h2 className="text-2xl font-bold">Who is this mug for?</h2>
              <p className="text-sm text-gray-600">
                This helps us tailor the design preview.
              </p>
              {RECIPIENTS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRecipient(r)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left ${
                    recipient === r ? "border-[#2563EB] bg-blue-50" : "border-gray-300"
                  }`}
                >
                  {r}
                </button>
              ))}
              <button
                disabled={!recipient}
                onClick={() => setStep(3)}
                className="w-full rounded-2xl bg-[#2563EB] px-4 py-4 font-semibold text-white disabled:opacity-50"
              >
                Continue
              </button>
            </section>
          )}

          {step === 3 && (
            <section>
              <h2 className="text-2xl font-bold">
                Enter the name you want on the mug
              </h2>
              <input
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErr("");
                }}
                placeholder="Example: Ahmed, Fatima, Omar"
                className="mt-4 w-full rounded-2xl border border-gray-300 px-4 py-4"
              />
              <p className="mt-3 text-sm text-gray-600">
                Your name will appear in Arabic calligraphy on the mug.
              </p>
              <button
                onClick={() =>
                  name.trim().length < 2
                    ? setErr("Name must be at least 2 characters.")
                    : (fireEvent("mug_name_entered", { entered_name: name.trim() }),
                      setStep(4))
                }
                className="mt-6 w-full rounded-2xl bg-[#2563EB] px-4 py-4 font-semibold text-white"
              >
                Next: Choose Style
              </button>
            </section>
          )}

          {step === 4 && (
            <section className="pb-40">
              <h2 className="text-2xl font-bold">Choose a style</h2>
              {hasFree && designUrl && (
                <div className="mt-3 flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
                  <span>One design already generated. Continue with that design.</span>
                  <button
                    onClick={() => setStep(6)}
                    className="rounded-lg bg-amber-400 px-3 py-1 font-semibold"
                  >
                    Next
                  </button>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {RAMADAN_MUG_V2_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      selectStyle(s.id);
                    }}
                    className={`overflow-hidden rounded-2xl border text-left ${
                      styleId === s.id ? "border-[#2563EB]" : "border-gray-200"
                    }`}
                  >
                    <div className="relative h-24">
                      <Image
                        src={s.src}
                        alt="Ramadan mug style preview"
                        fill
                        className="h-auto w-full aspect-square object-cover"
                        sizes="50vw"
                      />
                      {hasFree && designUrl && !isLoggedIn && (
                        <div className="absolute inset-x-2 bottom-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                          Sign in to unlock
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 5 && (
            <section className="flex min-h-[65vh] flex-col items-center justify-center text-center">
              <h2 className="mt-5 text-2xl font-bold">
                We&apos;re creating your personalized mug design...
              </h2>
              <p className="mt-2 text-gray-600">
                Hang on a moment while we finish each step.
              </p>
              <div className="mt-8 w-full max-w-md space-y-3 text-left">
                {DESIGN_LOADING_STEPS.map((label, index) => {
                  const isDone = designLoadingStage > index;
                  const isActive = designLoadingStage === index;
                  const rowProgress = isDone ? 100 : isActive ? getDesignRowProgress(index) : 0;
                  return (
                    <div
                      key={label}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-[#111111]">{label}</span>
                        <span
                          className={`text-xs font-semibold ${
                            isDone
                              ? "text-green-600"
                              : isActive
                              ? "text-[#2563EB]"
                              : "text-gray-400"
                          }`}
                        >
                          {isDone
                            ? "100%"
                            : isActive
                            ? `${rowProgress}%`
                            : "Waiting"}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full transition-all duration-700 ${
                            isDone
                              ? "bg-green-500"
                              : isActive
                              ? "bg-[#2563EB]"
                              : "bg-gray-300"
                          }`}
                          style={{ width: `${rowProgress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {step === 6 && (
            <section>
              <h2 className="text-2xl font-bold">Choose your design version</h2>
              <p className="mt-2 text-sm text-gray-600">
                Select the version that will appear on your mug.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setVariant("original")}
                  className={`rounded-2xl border p-2 ${
                    variant === "original" ? "border-[#2563EB]" : "border-gray-200"
                  }`}
                >
                  {designUrl ? (
                    <img
                      src={designUrl}
                      alt="Original"
                      className="h-52 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-52 rounded-xl bg-gray-100" />
                  )}
                  <div className="pt-2 text-sm font-semibold">Original design</div>
                </button>
                <button
                  disabled={!transparentUrl}
                  onClick={() => setVariant("transparent")}
                  className={`rounded-2xl border p-2 ${
                    variant === "transparent"
                      ? "border-[#2563EB]"
                      : "border-gray-200"
                  }`}
                >
                  {transparentUrl ? (
                    <img
                      src={transparentUrl}
                      alt="Transparent"
                      className="h-52 w-full rounded-xl object-contain"
                    />
                  ) : (
                    <div className="h-52 rounded-xl bg-gray-100" />
                  )}
                  <div className="pt-2 text-sm font-semibold">
                    Transparent background (best for mug printing)
                  </div>
                </button>
              </div>
              <button
                onClick={() => void goStep7()}
                className="mt-6 w-full rounded-2xl bg-[#2563EB] px-4 py-4 font-semibold text-white"
              >
                See Mug Preview
              </button>
            </section>
          )}

          {step === 7 && !busyPreview && (
            <section>
              <h2 className="text-2xl font-bold">Preview Your Personalized Mug</h2>
              <div className="mt-4 rounded-2xl border p-3">
                {selectedMockup ? (
                  <img
                    src={selectedMockup}
                    alt="Mug preview"
                    className="w-full rounded-xl"
                  />
                ) : (
                  <div className="h-52 rounded-xl bg-gray-100" />
                )}
              </div>
              <p className="mt-3 text-sm text-gray-600">
                This is how your mug will look when printed.
              </p>
              <div className="mt-3 rounded-2xl border bg-[#FFFBEB] p-4 text-sm">
                <p className="font-semibold">Mug details</p>
                <p>Size: 11 oz white glossy ceramic mug</p>
                <p>High-quality ceramic mug</p>
                <p>Dishwasher & microwave safe</p>
                <p>Printed with premium inks</p>
                <p>Print mode: Two-side wrap</p>
              </div>
              {!isLoggedIn && (
                <>
                  <label className="mt-4 block text-sm font-semibold">Email</label>
                  <input
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErr("");
                    }}
                    placeholder="you@example.com"
                    className="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-4"
                  />
                </>
              )}
              <button
                disabled={busyCheckout || !selectedMockup}
                onClick={() => void checkout()}
                className="mt-6 w-full rounded-2xl bg-[#2563EB] px-4 py-4 font-semibold text-white disabled:opacity-50"
              >
                {busyCheckout ? "Loading checkout..." : "Continue to Secure Checkout →"}
              </button>
              <p className="mt-3 text-center text-xs text-gray-500">
                Secure payment powered by Stripe
              </p>
              <p className="mt-2 text-center text-sm font-medium text-[#7C5A00]">
                Perfect gift before Eid.
              </p>
            </section>
          )}

          {step === 7 && busyPreview && (
            <section className="flex min-h-[65vh] flex-col items-center justify-center">
              <h2 className="text-2xl font-bold">Generating your mug preview...</h2>
              <p className="mt-2 text-sm text-gray-600">
                While we prepare the mockup, here are reviews from other customers.
              </p>
              <div className="mt-4 w-full rounded-2xl border p-4">
                <div className="mb-2 flex justify-between text-xs">
                  <span>Preparing preview</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-3 rounded-full bg-gray-200">
                  <div
                    className="h-3 rounded-full bg-[#2563EB]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="mt-6 w-full overflow-hidden rounded-3xl border border-gray-200 bg-white py-4 shadow-sm">
                <div className="preview-review-track flex w-max gap-4 px-4">
                  {[...PREVIEW_TESTIMONIAL_IMAGES, ...PREVIEW_TESTIMONIAL_IMAGES].map(
                    (item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="w-48 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-[#FFFBEB]"
                      >
                        <img
                          src={item.thumbnail}
                          alt={`Customer review for ${item.name}`}
                          className="h-36 w-full object-cover"
                        />
                        <div className="px-3 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">
                            Review
                          </p>
                          <p className="mt-2 text-sm font-medium text-[#111111]">
                            &ldquo;{PREVIEW_TESTIMONIALS[index % PREVIEW_TESTIMONIALS.length]}&rdquo;
                          </p>
                          <p className="mt-2 text-xs text-gray-500">{item.name}</p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </section>
          )}

          {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        </div>

        {step === 4 && (
          <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white px-4 pb-4 pt-3">
            <div className="mx-auto w-full max-w-xl space-y-2">
              {hasFree && designUrl && (
                <button
                  disabled={busyDesign || !styleId || name.trim().length < 2}
                  onClick={() => {
                    if (!isLoggedIn) {
                      pendingStyleAfterSignInRef.current = styleId || null;
                      pendingStyleUnlockRegenRef.current = true;
                      setStyleUnlockPromptOpen(true);
                      return;
                    }
                    if (!canAffordRegen) {
                      retryRef.current = () => {
                        void runGeneration(true);
                      };
                      setUpgradeOpen(true);
                      return;
                    }
                    void requestRegen();
                  }}
                  className="w-full rounded-2xl border border-[#2563EB] px-4 py-4 font-semibold text-[#2563EB] disabled:opacity-50"
                >
                  {!isLoggedIn
                    ? "Sign in to unlock more styles"
                    : canAffordRegen
                    ? `Regenerate with credits (${REGEN_CREDITS} credits)`
                    : "Buy credits to generate again"}
                </button>
              )}
              <button
                disabled={busyDesign || !styleId}
                onClick={() => {
                  setErr("");
                  fireEvent("mug_style_selected", { style_id: styleId });
                  if (hasFree && designUrl) return setStep(6);
                  void runGeneration(false);
                }}
                className="w-full rounded-2xl bg-[#2563EB] px-4 py-4 font-semibold text-white disabled:opacity-50"
              >
                {hasFree && designUrl
                  ? "Continue with my design"
                  : isLoggedIn
                  ? `Generate My Design (${REGEN_CREDITS} credits)`
                  : "Generate My Design"}
              </button>
            </div>
          </div>
        )}

        <CreditUpgradeModal
          isOpen={upgradeOpen}
          requiredCredits={REGEN_CREDITS}
          currentCredits={credits.data ?? 0}
          context="generate"
          sourcePage="ramadan-mug-v2"
          onClose={() => setUpgradeOpen(false)}
          onSuccess={() => {
            setUpgradeOpen(false);
            void utils.user.getCredits.invalidate();
            void credits.refetch().then(() => {
              const fn = retryRef.current;
              retryRef.current = null;
              fn?.();
            });
          }}
        />
        {styleUnlockPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6 pt-10 sm:items-center">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-[#111111]">Unlock more styles</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Your free design is already saved. Sign in to choose another style and continue future generations from your account.
              </p>
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#1E3A8A]">
                After sign-in, you can keep this design, switch styles, and then buy credits if you want more generations.
              </div>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => void continueStyleUnlockSignIn()}
                  className="w-full rounded-2xl bg-[#2563EB] px-4 py-4 font-semibold text-white"
                >
                  Sign in to continue
                </button>
                <button
                  onClick={() => {
                    pendingStyleAfterSignInRef.current = null;
                    pendingStyleUnlockRegenRef.current = false;
                    setStyleUnlockPromptOpen(false);
                  }}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-4 font-semibold text-[#111111]"
                >
                  Keep my current design
                </button>
              </div>
            </div>
          </div>
        )}
        <style jsx>{`
          .preview-review-track {
            animation: preview-review-scroll 40s linear infinite;
          }

          @keyframes preview-review-scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
        `}</style>
      </main>
    </>
  );
};

export default RamadanMugV2Page;
