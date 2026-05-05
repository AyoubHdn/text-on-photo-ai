import { type NextPage } from "next";
import Image from "next/image";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "~/component/Input";
// --- STRATEGIC CHANGE: Import the new couple-specific styles ---
import { coupleStylesData } from "~/data/coupleStylesData"; 
import { useSession, signIn } from "next-auth/react";
import {
  AiOutlineDownload,
  AiOutlineEye,
  AiOutlineLeft,
  AiOutlineRight,
  AiOutlineShareAlt,
} from "react-icons/ai";
import { useRouter } from "next/router";
import Link from "next/link";
import { ShareModal } from '~/component/ShareModal';
import { ProductPreviewModal } from "~/component/printful/ProductPreviewModal";
import { SeoHead } from "~/component/SeoHead";
import { createGenerationRequestId } from "~/lib/generationRequest";
import { trackEvent } from "~/lib/ga";
import { buildFAQSchema, buildWebApplicationSchema } from "~/lib/seo";
import {
  buildCommunityAltFromStyle,
  buildCommunityTitleFromStyle,
  buildPromptImageAlt,
} from "~/lib/styleImageAlt";
import { getFunnelContext } from "~/lib/tracking/funnel";
import { GeneratorNudge } from "~/component/Nudge/GeneratorNudge";
import { CreditUpgradeModal } from "~/component/Credits/CreditUpgradeModal";
import { GENERATOR_PRODUCT_THUMBNAILS } from "~/config/generatorProductThumbnails";
import {
  findGeneratorStyleSelection,
  getStringQueryValue,
} from "~/lib/generatorStyleSelection";

type AIModel = "flux-schnell" | "flux-dev" | "ideogram-ai/ideogram-v2-turbo";
type AspectRatio = "1:1" | "4:5" | "3:2" | "16:9";

const MODEL_CREDITS: Record<AIModel, number> = {
  "flux-schnell": 1,
  "flux-dev": 3,
  "ideogram-ai/ideogram-v2-turbo": 5,
};
const MODEL_OPTIONS: [
  { name: string; value: AIModel; cost: number },
  { name: string; value: AIModel; cost: number },
] = [
  {
    name: "Standard",
    value: "flux-schnell",
    cost: MODEL_CREDITS["flux-schnell"],
  },
  {
    name: "Optimized",
    value: "flux-dev",
    cost: MODEL_CREDITS["flux-dev"],
  },
];

type SavedDesign = {
  imageUrl: string;
  prompt: string;
  model: AIModel;
  createdAt: string;
  hasBackgroundRemoved: boolean;
};
type GeneratorDraft = {
  form: {
    name1: string;
    name2: string;
    basePrompt: string;
    numberofImages: string;
  };
  selectedImage: string | null;
  selectedModel: AIModel;
  selectedAspectRatio: AspectRatio;
  selectedStyleImage: string | null;
  selectedStyleAltText: string | null;
  selectedStyleLabel: string | null;
  activeTab: string;
  activeSubTab: string;
  allowCustomColors: boolean;
  createdAt: number;
};

const LAST_DESIGN_STORAGE_KEY = "couples-name-art:last-design:v1";
const GENERATOR_DRAFT_STORAGE_KEY = "couples-name-art:auth-draft:v1";
const DIGITAL_ART_INTENT_STORAGE_KEY = "digital-art-interest:intent";
const GENERATOR_DRAFT_TTL_MS = 1000 * 60 * 60 * 24;
const isAIModel = (value: unknown): value is AIModel =>
  typeof value === "string" && value in MODEL_CREDITS;
const isAspectRatio = (value: unknown): value is AspectRatio =>
  value === "1:1" || value === "4:5" || value === "3:2" || value === "16:9";

const couplesGeneratorFaqs = [
  {
    question: "How does a couple name generator work?",
    answer:
      "Enter two names, pick a style (romantic, modern, calligraphy, or playful), and our couple name generator combines both names into a single stylish design. Preview multiple styles before downloading.",
  },
  {
    question: "Is this couple name generator free?",
    answer:
      "Yes, previewing is free. Generating high-resolution, print-ready designs uses credits from our pricing plans, starting at $1.99.",
  },
  {
    question: "What's the difference between a couple name generator and a couple name maker?",
    answer:
      "They describe the same thing — a tool that turns two names into a shared visual design. 'Couple name generator,' 'couple name maker,' and 'couple name creator' are interchangeable terms used by different audiences.",
  },
  {
    question: "Can I make a couple name DP for WhatsApp or Instagram?",
    answer:
      "Yes. Choose a square format style and the stylish couple name maker generates a design ready for use as a DP, profile picture, or social media post in high resolution.",
  },
  {
    question: "What styles work best for anniversaries and weddings?",
    answer:
      "Romantic styles — floral, watercolor hearts, cursive calligraphy, gold foil — are most popular for anniversaries and wedding gifts. Modern styles like neon and geometric suit younger couples or casual keepsakes.",
  },
  {
    question: "Can I turn the couple name design into a mug or print?",
    answer:
      "Yes. Every couple name design can be ordered on a personalized mug, framed print, wall art, or shirt. Two-sided mugs featuring one name on each side are especially popular as anniversary gifts.",
  },
  {
    question: "What names work best in a couple name design?",
    answer:
      "Any combination of names works — short, long, different lengths, or different languages. The stylish couple name maker handles balance and spacing automatically so both names feel visually equal in the design.",
  },
];

const CouplesNameArtGeneratorPage: NextPage = () => {
  const SOURCE_PAGE = "couples-art-generator";
  const hasTrackedViewRef = useRef(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const router = useRouter();

  // --- STRATEGIC CHANGE: Form state now handles two names ---
  const [form, setForm] = useState({
    name1: "",
    name2: "",
    basePrompt: "",
    numberofImages: "1",
  });
  const [error, setError] = useState<string>("");
  const [imagesUrl, setImagesUrl] = useState<{ imageUrl: string }[]>([]);
  const [allowCustomColors, setAllowCustomColors] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [popupImage, setPopupImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<string>("");
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const subcategoryScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftCategoryArrow, setShowLeftCategoryArrow] = useState<boolean>(false);
  const [showRightCategoryArrow, setShowRightCategoryArrow] = useState<boolean>(false);
  const [showLeftSubCategoryArrow, setShowLeftSubCategoryArrow] = useState<boolean>(false);
  const [showRightSubCategoryArrow, setShowRightSubCategoryArrow] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>("flux-schnell");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>("1:1");
  const [selectedStyleImage, setSelectedStyleImage] = useState<string | null>(null);
  const [selectedStyleAltText, setSelectedStyleAltText] = useState<string | null>(null);
  const [selectedStyleLabel, setSelectedStyleLabel] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<"poster" | "tshirt" | "mug" | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewCooldown, setPreviewCooldown] = useState<number | null>(null);
  const [generatedAspect, setGeneratedAspect] = useState<AspectRatio | null>(null);
  const [transparentUrls, setTransparentUrls] = useState<Record<string, string>>({});
  const [useTransparentMap, setUseTransparentMap] = useState<Record<string, boolean>>({});
  const [removingBackgroundMap, setRemovingBackgroundMap] = useState<Record<string, boolean>>({});
  const [removeBgCreditAlertMap, setRemoveBgCreditAlertMap] = useState<Record<string, boolean>>({});
  const [creditUpgradeOpen, setCreditUpgradeOpen] = useState(false);
  const [creditUpgradeContext, setCreditUpgradeContext] = useState<"generate" | "preview" | "remove_background">("generate");
  const [creditUpgradeRequired, setCreditUpgradeRequired] = useState(0);
  const pendingCreditActionRef = useRef<null | (() => void)>(null);
  const generationSubmitLockRef = useRef(false);
  const [isSubmittingGeneration, setIsSubmittingGeneration] = useState(false);
  const productsSectionRef = useRef<HTMLElement>(null);
  const hasScrolledToProducts = useRef(false);
  const hasRestoredDraftRef = useRef(false);
  const restoredAuthDraftRef = useRef(false);
  const creditsQuery = api.user.getCredits.useQuery(undefined, { enabled: isLoggedIn });
  const digitalArtInterestIntent = api.user.recordDigitalArtInterestIntent.useMutation({
    onSuccess: () => {
      try {
        window.localStorage.removeItem(DIGITAL_ART_INTENT_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    },
  });
  const intentSyncStartedRef = useRef(false);
  const currentCredits = creditsQuery.data ?? 0;
  const hasKnownCreditBalance = isLoggedIn && creditsQuery.data !== undefined;
  const hasBackgroundCredits = currentCredits >= 1;
  const isCreditLocked = isLoggedIn && currentCredits <= 0 && imagesUrl.length > 0;
  const generatedImagesGridClass =
    imagesUrl.length === 1
      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12"
      : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12";
  const getRequiredGenerateCredits = () => {
    const imagesCount = Number.parseInt(form.numberofImages, 10);
    const count = Number.isFinite(imagesCount) && imagesCount > 0 ? imagesCount : 1;
    const perImage = MODEL_CREDITS[selectedModel] ?? 1;
    return perImage * count;
  };
  const isModelCreditLocked = (credits: number) =>
    hasKnownCreditBalance && currentCredits < credits;
  const getModelCreditShortfall = (credits: number) =>
    Math.max(0, credits - currentCredits);
  const openCreditUpgrade = (
    context: "generate" | "preview" | "remove_background",
    requiredCredits: number,
    retryAction: () => void,
  ) => {
    pendingCreditActionRef.current = retryAction;
    setCreditUpgradeContext(context);
    setCreditUpgradeRequired(requiredCredits);
    setCreditUpgradeOpen(true);
  };
  const funnelContext = getFunnelContext({
    route: router.pathname,
    sourcePage: SOURCE_PAGE,
    query: router.query as Record<string, unknown>,
  });
  const getSignInCallbackUrl = () => {
    if (typeof window === "undefined") return "/couples-name-art-generator";
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  };
  const saveAuthDraft = () => {
    const draft: GeneratorDraft = {
      form,
      selectedImage,
      selectedModel,
      selectedAspectRatio,
      selectedStyleImage,
      selectedStyleAltText,
      selectedStyleLabel,
      activeTab,
      activeSubTab,
      allowCustomColors,
      createdAt: Date.now(),
    };

    try {
      window.localStorage.setItem(
        GENERATOR_DRAFT_STORAGE_KEY,
        JSON.stringify(draft),
      );
    } catch {
      // ignore storage errors
    }
  };

  const [shareModalData, setShareModalData] = useState<{ isOpen: boolean; imageUrl: string | null }>({
    isOpen: false,
    imageUrl: null,
  });

  const aspectRatios: { label: string; value: AspectRatio; description: string }[] = [
    { label: "1:1", value: "1:1", description: "Best for posters, profile images, and square designs" },
    { label: "4:5", value: "4:5", description: "Best choice for posters and wall art" },
    { label: "3:2", value: "3:2", description: "Ideal for wide posters and horizontal designs" },
    { label: "16:9", value: "16:9", description: "Best for screens, wallpapers, and digital use" },
  ];
  const aspectVisualMap: Record<AspectRatio, string> = {
    "1:1": "aspect-[1/1]",
    "4:5": "aspect-[4/5]",
    "3:2": "aspect-[3/2]",
    "16:9": "aspect-[16/9]",
  };

  useEffect(() => {
    if (hasTrackedViewRef.current) return;
    trackEvent("view_couples_name_art_generator", {
      user_credits: creditsQuery.data ?? null,
      ...funnelContext,
    });
    const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof maybeFbq === "function") {
      maybeFbq("trackCustom", "view_couples_name_art_generator", {
        user_credits: creditsQuery.data ?? null,
        ...funnelContext,
      });
    }
    hasTrackedViewRef.current = true;
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("last-generator", "couples");
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn || intentSyncStartedRef.current) return;

    try {
      const pendingSourcePage = window.localStorage.getItem(
        DIGITAL_ART_INTENT_STORAGE_KEY,
      );
      if (pendingSourcePage !== SOURCE_PAGE) return;

      intentSyncStartedRef.current = true;
      digitalArtInterestIntent.mutate(
        { sourcePage: SOURCE_PAGE },
        {
          onSettled: () => {
            intentSyncStartedRef.current = false;
          },
        },
      );
    } catch {
      // ignore storage errors
    }
  }, [SOURCE_PAGE, digitalArtInterestIntent, isLoggedIn]);

  useEffect(() => {
    if (imagesUrl.length > 0) return;
    try {
      if (
        restoredAuthDraftRef.current ||
        window.localStorage.getItem(GENERATOR_DRAFT_STORAGE_KEY)
      ) {
        return;
      }
      const raw = window.localStorage.getItem(LAST_DESIGN_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedDesign;
      if (parsed?.imageUrl) {
        setImagesUrl([{ imageUrl: parsed.imageUrl }]);
        setSelectedModel(parsed.model ?? "flux-schnell");
      }
    } catch {
      // ignore invalid cache
    }
  }, [imagesUrl.length]);

  useEffect(() => {
    if (!router.isReady) return;

    const style = getStringQueryValue(router.query.style);
    const styleImage = getStringQueryValue(router.query.styleImage);
    const styleSelection = findGeneratorStyleSelection(coupleStylesData, {
      style,
      styleImage,
    });

    if (styleSelection) {
      const { category, subcategory, item } = styleSelection;
      setActiveTab(category);
      setActiveSubTab(subcategory);
      setSelectedImage(item.src);
      setSelectedStyleImage(item.src);
      setSelectedStyleAltText(item.altText);
      setSelectedStyleLabel(subcategory || category);
      setForm((prev) => ({ ...prev, basePrompt: item.basePrompt }));
      setError("");
      setAllowCustomColors(item.allowCustomColors ?? true);
      return;
    }

    const categoryKeys = Object.keys(coupleStylesData);
    if (categoryKeys.length > 0) setActiveTab(categoryKeys[0] ?? "");
  }, [router.isReady, router.query.style, router.query.styleImage]);

  useEffect(() => {
    if (!activeTab) return;
    const subKeys = Object.keys(coupleStylesData[activeTab] ?? {});
    if (activeSubTab && subKeys.includes(activeSubTab)) return;
    if (subKeys.length > 0) setActiveSubTab(subKeys[0] ?? "");
  }, [activeSubTab, activeTab]);

  useLayoutEffect(() => {
    handleCategoryScroll();
    handleSubCategoryScroll();
  }, [activeTab]);

  useEffect(() => {
    if (!isLoggedIn || !router.isReady || hasRestoredDraftRef.current) return;
    hasRestoredDraftRef.current = true;

    try {
      const raw = window.localStorage.getItem(GENERATOR_DRAFT_STORAGE_KEY);
      if (!raw) return;

      const draft = JSON.parse(raw) as Partial<GeneratorDraft>;
      if (
        typeof draft.createdAt !== "number" ||
        Date.now() - draft.createdAt > GENERATOR_DRAFT_TTL_MS
      ) {
        window.localStorage.removeItem(GENERATOR_DRAFT_STORAGE_KEY);
        return;
      }

      restoredAuthDraftRef.current = true;
      setForm((prev) => ({
        ...prev,
        name1:
          typeof draft.form?.name1 === "string" ? draft.form.name1 : prev.name1,
        name2:
          typeof draft.form?.name2 === "string" ? draft.form.name2 : prev.name2,
        basePrompt:
          typeof draft.form?.basePrompt === "string"
            ? draft.form.basePrompt
            : prev.basePrompt,
        numberofImages:
          typeof draft.form?.numberofImages === "string"
            ? draft.form.numberofImages
            : prev.numberofImages,
      }));
      setSelectedImage(
        typeof draft.selectedImage === "string" ? draft.selectedImage : null,
      );
      if (isAIModel(draft.selectedModel)) setSelectedModel(draft.selectedModel);
      if (isAspectRatio(draft.selectedAspectRatio)) {
        setSelectedAspectRatio(draft.selectedAspectRatio);
      }
      setSelectedStyleImage(
        typeof draft.selectedStyleImage === "string"
          ? draft.selectedStyleImage
          : null,
      );
      setSelectedStyleAltText(
        typeof draft.selectedStyleAltText === "string"
          ? draft.selectedStyleAltText
          : null,
      );
      setSelectedStyleLabel(
        typeof draft.selectedStyleLabel === "string"
          ? draft.selectedStyleLabel
          : null,
      );
      if (typeof draft.activeTab === "string") setActiveTab(draft.activeTab);
      if (typeof draft.activeSubTab === "string") {
        setActiveSubTab(draft.activeSubTab);
      }
      if (typeof draft.allowCustomColors === "boolean") {
        setAllowCustomColors(draft.allowCustomColors);
      }
      window.localStorage.removeItem(GENERATOR_DRAFT_STORAGE_KEY);
    } catch {
      try {
        window.localStorage.removeItem(GENERATOR_DRAFT_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    }
  }, [isLoggedIn, router.isReady]);

  useEffect(() => {
    if (previewCooldown === null) return;

    if (previewCooldown <= 0) {
      setPreviewCooldown(null);
      return;
    }

    const timer = setInterval(() => {
      setPreviewCooldown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [previewCooldown]);

  useEffect(() => {
    if (imagesUrl.length > 0 && !hasScrolledToProducts.current) {
      hasScrolledToProducts.current = true;
      const timer = setTimeout(() => {
        productsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [imagesUrl.length]);

  useEffect(() => {
    if (!hasKnownCreditBalance) return;
    const selectedModelCredits = MODEL_CREDITS[selectedModel] ?? 1;
    if (currentCredits >= selectedModelCredits) return;

    const fallbackModel =
      MODEL_OPTIONS.find((model) => currentCredits >= model.cost) ??
      MODEL_OPTIONS[0];
    if (fallbackModel.value !== selectedModel) {
      setSelectedModel(fallbackModel.value);
    }
  }, [currentCredits, hasKnownCreditBalance, selectedModel]);

  const openShareModal = (imageUrl: string) => setShareModalData({ isOpen: true, imageUrl });
  const closeShareModal = () => setShareModalData({ isOpen: false, imageUrl: null });

  const handleCategoryScroll = () => {
    if (!categoryScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
    setShowLeftCategoryArrow(scrollLeft > 0);
    setShowRightCategoryArrow(scrollLeft + clientWidth < scrollWidth - 1);
  };
  const scrollCategoriesLeft = () => {
    categoryScrollRef.current?.scrollBy({ left: -150, behavior: "smooth" });
  };
  const scrollCategoriesRight = () => {
    categoryScrollRef.current?.scrollBy({ left: 150, behavior: "smooth" });
  };
  const handleSubCategoryScroll = () => {
    if (!subcategoryScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = subcategoryScrollRef.current;
    setShowLeftSubCategoryArrow(scrollLeft > 0);
    setShowRightSubCategoryArrow(scrollLeft + clientWidth < scrollWidth - 1);
  };
  const scrollSubCategoriesLeft = () => {
    subcategoryScrollRef.current?.scrollBy({ left: -150, behavior: "smooth" });
  };
  const scrollSubCategoriesRight = () => {
    subcategoryScrollRef.current?.scrollBy({ left: 150, behavior: "smooth" });
  };

  const startGeneratorSignIn = () => {
    saveAuthDraft();
    try {
      window.localStorage.setItem(DIGITAL_ART_INTENT_STORAGE_KEY, SOURCE_PAGE);
    } catch {
      // ignore storage errors
    }
    signIn(undefined, { callbackUrl: getSignInCallbackUrl() }).catch(console.error);
  };

  const generateIcon = api.generate.generateIcon.useMutation({
    onSuccess: (data) => {
      setImagesUrl(data);
      setGeneratedAspect(selectedAspectRatio);
      setTransparentUrls({});
      setUseTransparentMap({});
      setRemovingBackgroundMap({});
      setRemoveBgCreditAlertMap({});

      const imagesCount = Number.parseInt(form.numberofImages, 10);
      const perImageCredits = MODEL_CREDITS[selectedModel] ?? 1;
      const creditsUsed =
        perImageCredits * (Number.isFinite(imagesCount) && imagesCount > 0 ? imagesCount : 1);

      trackEvent("generate_design", {
        model: selectedModel,
        credits_used: creditsUsed,
        user_credits_before_action: creditsQuery.data ?? null,
        required_credits: creditsUsed,
        ...funnelContext,
      });

      const firstImageUrl = data?.[0]?.imageUrl;
      if (firstImageUrl) {
        const saved: SavedDesign = {
          imageUrl: firstImageUrl,
          prompt: form.basePrompt
            .replace(/\[NAME1\]/gi, form.name1)
            .replace(/\[NAME2\]/gi, form.name2),
          model: selectedModel,
          createdAt: new Date().toISOString(),
          hasBackgroundRemoved: false,
        };
        try {
          window.localStorage.setItem(LAST_DESIGN_STORAGE_KEY, JSON.stringify(saved));
        } catch {
          // ignore storage errors
        }
      }
    },
    onSettled: () => {
      generationSubmitLockRef.current = false;
      setIsSubmittingGeneration(false);
    },
    onError: (error) => {
      if (error.message.toLowerCase().includes("enough credits")) {
        setError("");
        openCreditUpgrade("generate", getRequiredGenerateCredits(), () => {
          triggerGeneration();
        });
        return;
      }
      console.error(error);
      setError(error.message);
    },
  });

  const buildGenerationInput = () => {
    let finalPrompt = form.basePrompt
      .replace(/\[NAME1\]/gi, form.name1)
      .replace(/\[NAME2\]/gi, form.name2);
    finalPrompt += ", beautiful romantic art, high resolution";

    return {
      generationRequestId: createGenerationRequestId(),
      prompt: finalPrompt,
      numberOfImages: Number.parseInt(form.numberofImages, 10),
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
      sourcePage: SOURCE_PAGE,
      metadata: {
        category: activeTab || undefined,
        subcategory: activeSubTab || undefined,
        communityAlt: selectedStyleAltText
          ? buildCommunityAltFromStyle({
              kind: "couple",
              templateAlt: selectedStyleAltText,
              primaryText: form.name1,
              secondaryText: form.name2,
              styleLabel: selectedStyleLabel,
            })
          : undefined,
        communityTitle: buildCommunityTitleFromStyle({
          kind: "couple",
          primaryText: form.name1,
          secondaryText: form.name2,
          styleLabel: selectedStyleLabel ?? activeSubTab ?? activeTab,
        }),
      },
    };
  };

  const triggerGeneration = () => {
    if (generationSubmitLockRef.current || generateIcon.isLoading) return;
    generationSubmitLockRef.current = true;
    setIsSubmittingGeneration(true);
    setError("");
    generateIcon.mutate(buildGenerationInput());
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn) {
      startGeneratorSignIn();
      return;
    }
    // --- STRATEGIC CHANGE: Validate both names are entered ---
    if (!form.name1 || !form.name2 || !form.basePrompt) {
      setError("Please enter both names and select a style.");
      return;
    }

    (window.dataLayer = window.dataLayer || []).push({
      event: "form_submission",
      designType: "CouplesArt", // For analytics tracking
      category: activeTab,
      subcategory: activeSubTab,
      styleImage: selectedImage || "none",
    });

    triggerGeneration();
  };

  const handleImageSelect = (
    basePrompt: string,
    src: string,
    altText: string,
    styleLabel: string,
    allowColors = true,
  ) => {
    setSelectedImage(src);
    setForm((prev) => ({ ...prev, basePrompt }));
    setSelectedStyleImage(src);
    setSelectedStyleAltText(altText);
    setSelectedStyleLabel(styleLabel);
    setError("");
    setAllowCustomColors(allowColors);
  };

  const handleDownload = async (imageUrl: string) => { /* ... (no changes needed, just filename) ... */
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "couples-art-design.png";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error downloading the image:", error);
    }
  };

  const extractImageId = (value: string | null) => {
    if (!value) return null;
    try {
      const url = new URL(value);
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] ?? null;
    } catch {
      const parts = value.split("/").filter(Boolean);
      return parts[parts.length - 1] ?? null;
    }
  };

  const getDisplayImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    const imageId = extractImageId(imageUrl);
    if (imageId && useTransparentMap[imageId] && transparentUrls[imageId]) {
      return transparentUrls[imageId] ?? null;
    }
    return imageUrl;
  };

  const handleToggleBackground = async (imageUrl: string) => {
    const imageId = extractImageId(imageUrl);
    if (!imageId) return;

    if (removingBackgroundMap[imageId]) return;

    const currentlyTransparent = useTransparentMap[imageId] ?? false;
    if (currentlyTransparent) {
      setUseTransparentMap((prev) => ({ ...prev, [imageId]: false }));
      setRemoveBgCreditAlertMap((prev) => ({ ...prev, [imageId]: false }));
      return;
    }

    const existingTransparent = transparentUrls[imageId];
    if (existingTransparent) {
      setUseTransparentMap((prev) => ({ ...prev, [imageId]: true }));
      setRemoveBgCreditAlertMap((prev) => ({ ...prev, [imageId]: false }));
      return;
    }

    if (!hasBackgroundCredits) {
      setRemoveBgCreditAlertMap((prev) => ({ ...prev, [imageId]: true }));
      openCreditUpgrade("remove_background", 1, () => {
        void handleToggleBackground(imageUrl);
      });
      return;
    }

    try {
      setRemovingBackgroundMap((prev) => ({ ...prev, [imageId]: true }));
      setRemoveBgCreditAlertMap((prev) => ({ ...prev, [imageId]: false }));

      const res = await fetch("/api/image/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Background removal failed");
      }

      const nextTransparentUrl = data?.transparentImageUrl as string | undefined;
      if (!nextTransparentUrl) throw new Error("Background removal failed");

      setTransparentUrls((prev) => ({ ...prev, [imageId]: nextTransparentUrl }));
      setUseTransparentMap((prev) => ({ ...prev, [imageId]: true }));
      try {
        const raw = window.localStorage.getItem(LAST_DESIGN_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SavedDesign;
          if (parsed?.imageUrl === imageUrl) {
            parsed.hasBackgroundRemoved = true;
            window.localStorage.setItem(LAST_DESIGN_STORAGE_KEY, JSON.stringify(parsed));
          }
        }
      } catch {
        // ignore storage errors
      }
      trackEvent("remove_background", {
        source: "preview",
        user_credits_before_action: creditsQuery.data ?? null,
        required_credits: 1,
        ...funnelContext,
      });
    } catch (err) {
      console.error("[COUPLES_REMOVE_BACKGROUND_UI]", err);
      alert("Background removal failed. Please try again.");
    } finally {
      setRemovingBackgroundMap((prev) => ({ ...prev, [imageId]: false }));
    }
  };

  const openPopup = (imageUrl: string) => setPopupImage(imageUrl);
  const closePopup = () => setPopupImage(null);

  return (
    <>
      <SeoHead
        title="Free Couple Name Generator & Stylish Couple Name Maker"
        description="Free couple name generator and stylish couple name maker. Enter two names, pick a romantic style, and create beautiful couple name designs for gifts."
        path="/couples-name-art-generator"
        noindex
        jsonLd={[
          buildWebApplicationSchema({
            name: "Couple Name Generator",
            description:
              "Free couple name generator and stylish couple name maker. Combine two names into a single design for anniversaries, weddings, and gifts.",
            path: "/couples-name-art-generator",
          }),
          buildFAQSchema(couplesGeneratorFaqs),
        ]}
      />
      <main className="container m-auto mb-24 flex flex-col px-4 py-6 sm:px-8 sm:py-8 max-w-screen-md">
        <h1 className="text-3xl font-bold sm:text-4xl">Free Couple Name Generator</h1>
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
          Stylish Couple Name Maker for Anniversaries, Weddings, and Gifts
        </h2>
        <p className="mt-4 text-base text-gray-700 dark:text-gray-300 sm:text-lg">
          Create a beautiful couple name design in seconds. Our free couple name
          generator combines both names into a single stylish artwork — perfect
          for anniversaries, weddings, DPs, and thoughtful gifts. Pick from
          romantic, modern, or calligraphy styles, then download your design or
          turn it into a mug, print, or shirt.
        </p>
        <GeneratorNudge generatorType="couples" />
        
        <form className="flex flex-col gap-3 mt-6" onSubmit={handleFormSubmit}>
          {/* --- STRATEGIC CHANGE: Two input fields for names --- */}
          <h2 className="text-xl">1. Enter Your Names</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <FormGroup>
                <label htmlFor="name1">First Name</label>
                <Input required id="name1" value={form.name1} onChange={(e) => setForm((prev) => ({ ...prev, name1: e.target.value }))} placeholder="e.g., Sarah"/>
            </FormGroup>
            <FormGroup>
                <label htmlFor="name2">Second Name</label>
                <Input required id="name2" value={form.name2} onChange={(e) => setForm((prev) => ({ ...prev, name2: e.target.value }))} placeholder="e.g., Michael"/>
            </FormGroup>
          </div>
          {/* --- End of change --- */}

          <h2 className="text-xl">2. Choose Your Romantic Style</h2>
          <div className="mb-12">
            <div className="relative border-b mb-0 mt-4 flex items-center dark:border-gray-700">
                {/* ... Category Scroller JSX (no changes) ... */}
                <div ref={categoryScrollRef} onScroll={handleCategoryScroll} className="flex overflow-x-auto whitespace-nowrap no-scrollbar flex-1">
                    {Object.keys(coupleStylesData ?? {}).map((catKey) => (
                        <button key={catKey} type="button" onClick={() => setActiveTab(catKey)} className={`px-4 py-2 ${activeTab === catKey ? "font-semibold border-b-2 border-brand-500 text-brand-600" : "font-semibold text-gray-500 hover:text-gray-900"}`}>{catKey}</button>
                    ))}
                </div>
            </div>
            <div className="relative border-b mb-4 mt-4 flex items-center dark:border-gray-700">
                {/* ... Subcategory Scroller JSX (no changes) ... */}
                <div ref={subcategoryScrollRef} onScroll={handleSubCategoryScroll} className="flex overflow-x-auto whitespace-nowrap no-scrollbar flex-1">
                    {Object.keys(coupleStylesData[activeTab] ?? {}).map((sub) => (
                        <button key={sub} type="button" onClick={() => setActiveSubTab(sub)} className={`px-4 py-2 ${activeSubTab === sub ? "text-sm border-b-2 border-brand-500 text-brand-600" : "text-sm text-gray-500 hover:text-gray-900"}`}>{sub}</button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(coupleStylesData[activeTab]?.[activeSubTab] ?? []).map((item, idx) => {
                const allowColors = item.allowCustomColors !== false;
                const styleImagePath = item.src.replace(/\.webp$/, "e.webp");
                return (
                  <div key={idx} className={`relative rounded shadow-md hover:shadow-lg transition cursor-pointer ${selectedImage === item.src ? "ring-4 ring-brand-500" : ""}`} onClick={() => handleImageSelect(item.basePrompt, item.src, item.altText, activeSubTab || activeTab, allowColors)}>
                    <img
                      src={styleImagePath}
                      alt={item.altText}
                      className="rounded w-full h-auto object-cover mx-auto"
                    />
                    <button type="button" onClick={(ev) => { ev.stopPropagation(); openPopup(styleImagePath); }} className="absolute top-0 right-0 bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none p-1 text-xs" title="View Fullscreen">🔍</button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Select AI Model */}
                    <h2 className="text-xl">3. Select AI Model</h2>
                    <FormGroup className="mb-12">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                        {MODEL_OPTIONS.map((model) => {
                          const modelLocked = isModelCreditLocked(model.cost);
                          const modelImage =
                            selectedStyleImage && selectedStyleImage.includes(".")
                              ? model.value === "flux-dev"
                                ? selectedStyleImage.replace(/(\.[^.]+)$/, "e$1")
                                : selectedStyleImage
                              : "/images/placeholder.png";

                          return (
                            <button
                              key={model.value}
                              type="button"
                              onClick={() => {
                                if (modelLocked) return;
                                setSelectedModel(model.value);
                              }}
                              disabled={modelLocked}
                              className={`relative flex flex-col items-center justify-center border rounded-lg p-4 transition ${
                                modelLocked
                                  ? "cursor-not-allowed border-amber-200 bg-amber-50/60 opacity-75"
                                  : selectedModel === model.value
                                    ? "border-brand-500 ring-2 ring-brand-500"
                                    : "border-cream-200 hover:border-brand-300"
                              }`}
                            >
                              <div className="relative w-22 h-22 mb-2 overflow-hidden rounded">
                                <img
                                  src={modelImage}
                                  alt={model.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-sm font-semibold">{model.name}</span>
                              <span className="text-sm text-gray-500">Cost: {model.cost} credits</span>
                              {modelLocked && (
                                <span className="mt-2 rounded bg-white/80 px-2 py-1 text-center text-xs font-medium text-amber-800">
                                  Need {getModelCreditShortfall(model.cost)} more credit{getModelCreditShortfall(model.cost) === 1 ? "" : "s"}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {hasKnownCreditBalance &&
                        MODEL_OPTIONS.some((model) => isModelCreditLocked(model.cost)) && (
                          <p className="mt-3 text-xs text-amber-800">
                            Advanced models require more credits.{" "}
                            <Link href="/buy-credits" className="font-semibold underline">
                              Get credits
                            </Link>
                          </p>
                        )}
                    </FormGroup>
          {/* 4. Aspect Ratio */}
                    <h2 className="text-xl">4. Select Image Size</h2>
                    <FormGroup className="mb-12">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {aspectRatios.map((ratio) => {
                          const aspectClass = aspectVisualMap[ratio.value];
                          return (
                            <button
                              key={ratio.value}
                              type="button"
                              onClick={() => setSelectedAspectRatio(ratio.value)}
                              className={`relative flex items-center justify-center border rounded-lg p-4 transition ${
                                selectedAspectRatio === ratio.value
                                  ? "border-brand-500 ring-2 ring-brand-500"
                                  : "border-cream-200 hover:border-brand-300"
                              }`}
                            >
                              <div
                                className={`w-full h-21 rounded-lg ${aspectClass} overflow-hidden flex items-center justify-center`}
                                style={{ backgroundColor: "#ddd" }}
                              >
                                <div className="text-center">
                                  <div className="font-semibold">{ratio.label}</div>
                                  <div className="mt-1 text-xs text-gray-500">{ratio.description}</div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </FormGroup>

          {/* 5. Number of images */}
                    <h2 className="text-xl">5. How Many Designs You Want</h2>
                    <FormGroup className="mb-12">
                      <label htmlFor="numberofImages">Number of images</label>
                      <Input
                        required
                        id="numberofImages"
                        type="number"
                        min={1}
                        max={selectedModel === "ideogram-ai/ideogram-v2-turbo" ? 1 : 10}
                        value={form.numberofImages}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, numberofImages: e.target.value }))
                        }
                        disabled={selectedModel === "ideogram-ai/ideogram-v2-turbo"}
                        placeholder={
                          selectedModel === "ideogram-ai/ideogram-v2-turbo"
                            ? "1 (Fixed)"
                            : "1-10"
                        }
                      />
                    </FormGroup>

          {error && (<div className="bg-red-500 text-white rounded p-4 text-xl">{error}{" "}{error.includes("credits") && (<Link href="/buy-credits" className="underline font-bold ml-2">Buy Credits</Link>)}</div>)}

          {isCreditLocked && (
            <div className="rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              <div className="font-semibold">Your design is saved and ready.</div>
              <div className="mt-1">
                You can still download, share, and preview it now. Add credits to create
                more versions or remove the background for a cleaner result.
              </div>
              <Link href="/buy-credits" className="mt-3 inline-flex font-semibold underline">
                Get more credits
              </Link>
            </div>
          )}
          <Button
            type={isLoggedIn ? "submit" : "button"}
            onClick={!isLoggedIn ? startGeneratorSignIn : undefined}
            isLoading={generateIcon.isLoading}
            disabled={generateIcon.isLoading || isSubmittingGeneration || isCreditLocked}
          >
            {isLoggedIn ? "Generate Couples Art" : "Sign in to Generate"}
          </Button>
          <GeneratorNudge generatorType="couples" section="trust" />
        </form>

        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-xl mt-8 mb-2">Your Beautiful Couples Art Is Ready!</h2>
            <section className={generatedImagesGridClass}>
              {imagesUrl.map(({ imageUrl }, index) => {
                const imageId = extractImageId(imageUrl);
                const isRemoving = imageId ? removingBackgroundMap[imageId] : false;
                const isTransparent = imageId ? useTransparentMap[imageId] : false;
                const displayUrl = getDisplayImageUrl(imageUrl) ?? imageUrl;

                return (
                  <div key={index} className="flex flex-col">
                    <div className="relative rounded border border-gray-200 bg-white shadow-md transition hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
                      <div className="absolute right-1 top-1 flex items-center gap-1.5 rounded-full bg-black/45 px-1.5 py-1 backdrop-blur-sm sm:gap-0.5 sm:px-0.5 sm:py-0.5 md:gap-0.5 md:px-0.5 md:py-0.5">
                        <button
                          type="button"
                          onClick={() => openPopup(displayUrl)}
                          className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-white/90 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60 sm:h-6 sm:w-6 md:h-5 md:w-5"
                          title="View Fullscreen"
                          aria-label="View Fullscreen"
                        >
                          <AiOutlineEye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDownload(displayUrl)}
                          className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-white/90 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60 sm:h-6 sm:w-6 md:h-5 md:w-5"
                          title="Download"
                          aria-label="Download"
                        >
                          <AiOutlineDownload className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openShareModal(displayUrl)}
                          className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-white/90 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60 sm:h-6 sm:w-6 md:h-5 md:w-5"
                          title="Share"
                          aria-label="Share"
                        >
                          <AiOutlineShareAlt className="h-4 w-4" />
                        </button>
                      </div>
                      <Image
                        src={displayUrl}
                        alt={
                          form.basePrompt
                            ? buildPromptImageAlt(form.basePrompt, {
                                kind: "couple",
                                title: activeSubTab || activeTab,
                              })
                            : "Generated couples art"
                        }
                        width={512}
                        height={512}
                        className="w-full rounded"
                        unoptimized={true}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 rounded bg-gray-900/80 px-2 py-1.5 text-xs text-white dark:bg-gray-800/90">
                      <span className="opacity-80">Costs 1 credit</span>
                      <button
                        type="button"
                        onClick={() => void handleToggleBackground(imageUrl)}
                        disabled={!!isRemoving}
                        className="rounded bg-white/10 px-2 py-1 font-semibold hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Remove background"
                        aria-label="Remove background"
                      >
                        {isRemoving ? "Removing..." : isTransparent ? "Background removed" : "Remove background"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>

            <section ref={productsSectionRef} className="mt-10 scroll-mt-20">
              {/* Nudge banner */}
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-amber-50 px-4 py-4">
                <span className="text-3xl">☕</span>
                <div className="flex-1">
                  <p className="font-semibold text-brand-900">Your art is ready to print!</p>
                  <p className="text-sm text-brand-700">Preview it on a real mug below — free, no commitment.</p>
                </div>
              </div>

              {/* Primary: Mug */}
              <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
                <div className="flex flex-col sm:flex-row">
                  <div className="aspect-square w-full sm:w-1/2">
                    <img src="/images/products/mug.webp" alt="Custom Mug" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center gap-4 p-6 sm:w-1/2">
                    <div>
                      <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">
                        Most Popular Gift
                      </span>
                      <h4 className="mt-2 text-2xl font-bold text-slate-900">Custom Couple Mug</h4>
                      <p className="mt-1 text-sm text-gray-500">Your couple name art printed on a premium ceramic mug — perfect gift.</p>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {["High-quality glossy ceramic", "Dishwasher & microwave safe", "Premium print quality", "Shipping to selected countries"].map((pt) => (
                        <li key={pt} className="flex items-start gap-2">
                          <span className="text-brand-600">✔</span>{pt}
                        </li>
                      ))}
                    </ul>
                    {previewCooldown !== null && (
                      <div className="rounded-lg bg-yellow-100 px-4 py-3 text-sm text-yellow-900">
                        ⏳ Preview paused. Try again in <strong>{previewCooldown}s</strong>.
                      </div>
                    )}
                    <button
                      className="w-full rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                      disabled={previewCooldown !== null}
                      onClick={() => {
                        if (selectedAspectRatio === "16:9") {
                          alert("This image size is not supported for mugs.");
                          return;
                        }
                        setPreviewProduct("mug");
                        setPreviewImage(getDisplayImageUrl(imagesUrl[0]?.imageUrl ?? null));
                      }}
                    >
                      {previewCooldown !== null ? `Wait ${previewCooldown}s…` : "Preview on Mug — Free"}
                    </button>
                  </div>
                </div>
              </div>

              {/* More products */}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900">More Products</h4>
                  <Link href="/couples-art/products" className="text-sm font-medium text-brand-700 hover:underline">View all couple name products →</Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {GENERATOR_PRODUCT_THUMBNAILS.couples.filter((p) => p.key !== "mug").map((p) => (
                    <Link
                      key={p.key}
                      href="/couples-art/products"
                      className="group overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm transition hover:border-brand-300 hover:shadow-md"
                    >
                      <div className="aspect-video overflow-hidden">
                        <img src={p.image} alt={p.label} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      </div>
                      <div className="px-3 py-2">
                        <div className="font-semibold text-slate-800">{p.label}</div>
                        <div className="text-xs text-gray-500">{p.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-6">
            {couplesGeneratorFaqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                <p className="mt-2 text-gray-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {popupImage && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center" onClick={closePopup}>
                <div className="relative"><button type="button" onClick={closePopup} className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-200" title="Close">✖️</button><img src={popupImage} alt="Fullscreen view" className="max-w-full max-h-screen rounded" /></div>
            </div>
        )}
        <ShareModal isOpen={shareModalData.isOpen} onClose={closeShareModal} imageUrl={shareModalData.imageUrl} />
        <CreditUpgradeModal
          isOpen={creditUpgradeOpen}
          requiredCredits={creditUpgradeRequired}
          currentCredits={creditsQuery.data ?? 0}
          context={creditUpgradeContext}
          sourcePage={SOURCE_PAGE}
          onClose={() => setCreditUpgradeOpen(false)}
          onSuccess={() => {
            setCreditUpgradeOpen(false);
            trackEvent("generation_resumed_after_upgrade", {
              context: creditUpgradeContext,
              user_credits_before_action: creditsQuery.data ?? null,
              required_credits: creditUpgradeRequired,
              ...funnelContext,
            });
            const action = pendingCreditActionRef.current;
            pendingCreditActionRef.current = null;
            action?.();
          }}
        />
        <ProductPreviewModal
          isOpen={!!previewProduct}
          onClose={() => setPreviewProduct(null)}
          productKey={previewProduct}
          imageUrl={previewImage}
          aspect={generatedAspect ?? "1:1"}
          onCooldownStart={setPreviewCooldown}
        />
      </main>
    </>
  );
};

export default CouplesNameArtGeneratorPage;

