/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/pages/arabic-name-art-generator.tsx

import { type NextPage } from "next";
import Image from "next/image";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "~/component/Input";
import { arabicStylesData } from "../data/arabicStylesData";
import { useSession, signIn } from "next-auth/react";
import {
  AiOutlineDownload,
  AiOutlineEye,
  AiOutlineLeft,
  AiOutlineRight,
  AiOutlineShareAlt,
} from "react-icons/ai";
import { useRouter } from "next/router";
import { ShareModal } from '~/component/ShareModal';
import Link from "next/link";
import { ProductPreviewModal } from "~/component/printful/ProductPreviewModal";
import { SeoHead } from "~/component/SeoHead";
import { trackEvent } from "~/lib/ga";
import { createGenerationRequestId } from "~/lib/generationRequest";
import { buildCollectionPageSchema } from "~/lib/seo";
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
  ARABIC_GENERATOR_TIERS,
  type ArabicGeneratorModel,
} from "~/config/arabicGenerator";
import {
  findGeneratorStyleSelection,
  getStringQueryValue,
} from "~/lib/generatorStyleSelection";

// --- TYPESCRIPT FIX START ---
interface StyleItem {
  src: string;
  name: string;
  basePrompt: string;
  altText: string;
}

interface SubCategory {
  [key: string]: StyleItem[];
}

interface typedArabicStylesData {
  [key: string]: SubCategory;
}

// Cast the imported data to the interface so TypeScript allows string indexing
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
const typedArabicStylesData: typedArabicStylesData = arabicStylesData as typedArabicStylesData;

type AIModel = ArabicGeneratorModel;
type AspectRatio = "1:1" | "4:5" | "3:2" | "16:9";

const MODEL_CREDITS: Record<AIModel, number> = {
  "google/nano-banana-2": 3,
  "google/nano-banana-pro": 6,
};
const isAIModel = (value: unknown): value is AIModel =>
  typeof value === "string" && value in MODEL_CREDITS;
const isAspectRatio = (value: unknown): value is AspectRatio =>
  value === "1:1" || value === "4:5" || value === "3:2" || value === "16:9";

type SavedDesign = {
  imageUrl: string;
  prompt: string;
  model: AIModel;
  createdAt: string;
  hasBackgroundRemoved: boolean;
};
type GeneratorDraft = {
  form: {
    name: string;
    basePrompt: string;
  };
  selectedImage: string | null;
  selectedModel: AIModel;
  selectedAspectRatio: AspectRatio;
  selectedStyleAltText: string | null;
  selectedStyleLabel: string | null;
  activeTab: string;
  activeSubTab: string;
  createdAt: number;
};

const LAST_DESIGN_STORAGE_KEY = "arabic-name-art:last-design:v1";
const GENERATOR_DRAFT_STORAGE_KEY = "arabic-name-art:auth-draft:v1";
const DIGITAL_ART_INTENT_STORAGE_KEY = "digital-art-interest:intent";
const GENERATOR_DRAFT_TTL_MS = 1000 * 60 * 60 * 24;

const ArabicNameArtGeneratorPage: NextPage = () => {
  const SOURCE_PAGE = "arabic-name-art-generator";
  const hasTrackedViewRef = useRef(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const router = useRouter();

  const [form, setForm] = useState({ name: "", basePrompt: "" });
  const [error, setError] = useState<string>("");
  const [imagesUrl, setImagesUrl] = useState<{ imageUrl: string }[]>([]);
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
  
  const [selectedModel, setSelectedModel] = useState<AIModel>("google/nano-banana-2");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>("1:1");
  const [selectedStyleAltText, setSelectedStyleAltText] = useState<string | null>(null);
  const [selectedStyleLabel, setSelectedStyleLabel] = useState<string | null>(null);
  const [shareModalData, setShareModalData] = useState<{ isOpen: boolean; imageUrl: string | null }>({ isOpen: false, imageUrl: null });
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
  const selectedTier =
    ARABIC_GENERATOR_TIERS.find((tier) => tier.model === selectedModel) ??
    ARABIC_GENERATOR_TIERS[0];
  const getRequiredGenerateCredits = () => MODEL_CREDITS[selectedModel];
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
    if (typeof window === "undefined") return "/arabic-name-art-generator";
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  };
  const saveAuthDraft = () => {
    const draft: GeneratorDraft = {
      form,
      selectedImage,
      selectedModel,
      selectedAspectRatio,
      selectedStyleAltText,
      selectedStyleLabel,
      activeTab,
      activeSubTab,
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

  useEffect(() => {
    if (hasTrackedViewRef.current) return;
    trackEvent("view_arabic_name_art_generator", {
      user_credits: creditsQuery.data ?? null,
      ...funnelContext,
    });
    const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof maybeFbq === "function") {
      maybeFbq("trackCustom", "view_arabic_name_art_generator", {
        user_credits: creditsQuery.data ?? null,
        ...funnelContext,
      });
    }
    hasTrackedViewRef.current = true;
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("last-generator", "arabic");
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
      }
    } catch {
      // ignore invalid cache
    }
  }, [imagesUrl.length]);

  useEffect(() => {
    if (!router.isReady) return;

    const name = getStringQueryValue(router.query.name);
    const style = getStringQueryValue(router.query.style);
    const styleImage = getStringQueryValue(router.query.styleImage);

    if (name) {
      setForm((prev) => ({ ...prev, name }));
    }

    const styleSelection = findGeneratorStyleSelection(typedArabicStylesData, {
      style,
      styleImage,
    });

    if (styleSelection) {
      const { category, subcategory, item } = styleSelection;
      setActiveTab(category);
      setActiveSubTab(subcategory);
      setSelectedImage(item.src);
      setForm((prev) => ({ ...prev, basePrompt: item.basePrompt }));
      setSelectedStyleAltText(item.altText);
      setSelectedStyleLabel(item.name || subcategory || category);
      setError("");

      setTimeout(() => {
        const element = document.getElementById(subcategory);
        element?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }, 150);

      return;
    }

    const firstCategory = Object.keys(typedArabicStylesData)[0];
    if (firstCategory) {
      setActiveTab(firstCategory);
      const firstSubCategory = Object.keys(typedArabicStylesData[firstCategory]!)?.[0];
      if (firstSubCategory) setActiveSubTab(firstSubCategory);
    }
  }, [
    router.isReady,
    router.query.name,
    router.query.style,
    router.query.styleImage,
  ]);

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
        name: typeof draft.form?.name === "string" ? draft.form.name : prev.name,
        basePrompt:
          typeof draft.form?.basePrompt === "string"
            ? draft.form.basePrompt
            : prev.basePrompt,
      }));
      setSelectedImage(
        typeof draft.selectedImage === "string" ? draft.selectedImage : null,
      );
      if (isAIModel(draft.selectedModel)) setSelectedModel(draft.selectedModel);
      if (isAspectRatio(draft.selectedAspectRatio)) {
        setSelectedAspectRatio(draft.selectedAspectRatio);
      }
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
      window.localStorage.removeItem(GENERATOR_DRAFT_STORAGE_KEY);
    } catch {
      try {
        window.localStorage.removeItem(GENERATOR_DRAFT_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    }
  }, [isLoggedIn, router.isReady]);

  const handleScroll = (ref: React.RefObject<HTMLDivElement>, setLeft: (val: boolean) => void, setRight: (val: boolean) => void) => {
      if(ref.current) {
          const { scrollLeft, scrollWidth, clientWidth } = ref.current;
          setLeft(scrollLeft > 10);
          setRight(scrollLeft < scrollWidth - clientWidth - 10);
      }
  };

  useLayoutEffect(() => {
    handleScroll(categoryScrollRef, setShowLeftCategoryArrow, setShowRightCategoryArrow);
    handleScroll(subcategoryScrollRef, setShowLeftSubCategoryArrow, setShowRightSubCategoryArrow);
  }, [activeTab, activeSubTab]);

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

    const fallbackTier =
      ARABIC_GENERATOR_TIERS.find((tier) => currentCredits >= tier.credits) ??
      ARABIC_GENERATOR_TIERS[0];
    if (fallbackTier.model !== selectedModel) {
      setSelectedModel(fallbackTier.model);
    }
  }, [currentCredits, hasKnownCreditBalance, selectedModel]);

  const startGeneratorSignIn = () => {
    saveAuthDraft();
    try {
      window.localStorage.setItem(DIGITAL_ART_INTENT_STORAGE_KEY, SOURCE_PAGE);
    } catch {
      // ignore storage errors
    }
    void signIn(undefined, { callbackUrl: getSignInCallbackUrl() });
  };

  const scrollCategories = (direction: 'left' | 'right') => {
      categoryScrollRef.current?.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: "smooth"});
  };
  const scrollSubCategories = (direction: 'left' | 'right') => {
      subcategoryScrollRef.current?.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: "smooth"});
  };

  const generateIcon = api.generate.generateIcon.useMutation({
    onSuccess: (data) => {
      setImagesUrl(data);
      setGeneratedAspect(selectedAspectRatio);
      setTransparentUrls({});
      setUseTransparentMap({});
      setRemovingBackgroundMap({});
      setRemoveBgCreditAlertMap({});
      trackEvent("generate_design", {
        model: selectedModel,
        credits_used: MODEL_CREDITS[selectedModel],
        user_credits_before_action: creditsQuery.data ?? null,
        required_credits: MODEL_CREDITS[selectedModel],
        ...funnelContext,
      });

      const firstImageUrl = data?.[0]?.imageUrl;
      if (firstImageUrl) {
        const saved: SavedDesign = {
          imageUrl: firstImageUrl,
          prompt: form.basePrompt.replace(/'Text'/gi, form.name),
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
      setError(error.message);
    },
  });

  const buildGenerationInput = () => {
    let finalPrompt = form.basePrompt.replace(/'Text'/gi, `'${form.name}'`);
    if (!finalPrompt.toLowerCase().includes("arabic")) {
      finalPrompt += ", arabic calligraphy masterpiece, 8k resolution";
    }

    return {
      generationRequestId: createGenerationRequestId(),
      prompt: finalPrompt,
      numberOfImages: 1,
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
      sourcePage: SOURCE_PAGE,
      metadata: {
        category: activeTab || undefined,
        subcategory: activeSubTab || undefined,
        communityAlt: selectedStyleAltText
          ? buildCommunityAltFromStyle({
              kind: "arabic",
              templateAlt: selectedStyleAltText,
              primaryText: form.name,
              styleLabel: selectedStyleLabel,
            })
          : undefined,
        communityTitle: buildCommunityTitleFromStyle({
          kind: "arabic",
          primaryText: form.name,
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
    if (!isLoggedIn) { startGeneratorSignIn(); return; }
    if (!form.name || !form.basePrompt) {
      setError("Please select a style and enter a name."); return;
    }

    triggerGeneration();
  };

  const handleImageSelect = (
    basePrompt: string,
    src: string,
    altText: string,
    styleLabel: string,
  ) => {
    setSelectedImage(src);
    setForm((prev) => ({ ...prev, basePrompt }));
    setSelectedStyleAltText(altText);
    setSelectedStyleLabel(styleLabel);
    setError("");
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(imageBitmap, 0, 0);
        const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        if (pngBlob) {
          const blobUrl = window.URL.createObjectURL(pngBlob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = "arabic-name-art.png";
          link.click();
          window.URL.revokeObjectURL(blobUrl);
        }
      }
    } catch (error) { console.error("Error downloading:", error); }
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
      if (!res.ok) throw new Error(data?.error || "Background removal failed");

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
      console.error("[ARABIC_REMOVE_BACKGROUND_UI]", err);
      alert("Background removal failed. Please try again.");
    } finally {
      setRemovingBackgroundMap((prev) => ({ ...prev, [imageId]: false }));
    }
  };

  const openPopup = (imageUrl: string) => setPopupImage(imageUrl);
  const closePopup = () => setPopupImage(null);
  const openShareModal = (imageUrl: string) => setShareModalData({ isOpen: true, imageUrl });
  const closeShareModal = () => setShareModalData({ isOpen: false, imageUrl: null });

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

  return (
    <>
      <SeoHead
        title="Arabic Name Art Generator | AI Calligraphy for Your Name"
        description="Create personalized Arabic name art with our AI calligraphy generator. Choose traditional or modern styles, then turn your design into a gift, mug, or wall art."
        path="/arabic-name-art-generator"
        jsonLd={[
          buildCollectionPageSchema({
            name: "Arabic Name Art Generator",
            description:
              "Create personalized Arabic name art and calligraphy designs online. Multiple styles for gifts, decor, and keepsakes.",
            path: "/arabic-name-art-generator",
          }),
        ]}
      />
      <main className="container m-auto mb-24 flex flex-col px-4 py-6 sm:px-8 sm:py-8 max-w-screen-md">
        
        <h1 className="text-3xl font-bold text-center sm:text-4xl">Arabic Name Art Generator</h1>
        <h2 className="mt-4 text-center text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
          AI Calligraphy for Personalized Gifts and Decor
        </h2>
        <p className="mt-4 text-center text-base text-gray-700 dark:text-gray-300 sm:text-lg">Transform your name into an Arabic calligraphy masterpiece.</p>
        <GeneratorNudge generatorType="arabic" />
        
        <form className="flex flex-col gap-6 mt-8" onSubmit={handleFormSubmit}>
          
          {/* 1. Enter Name - Standard English Labels, RTL Input */}
          <FormGroup>
            <label className="text-xl font-semibold mb-2 block">1. Enter Name (Arabic or English)</label>
            <Input 
                required 
                value={form.name} 
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} 
                placeholder="Enter name here (e.g., محمد or Muhammad)" 
                
            />
          </FormGroup>

          {/* 2. Choose Style */}
          <div>
            <h2 className="text-xl font-semibold mb-4">2. Choose Art Style</h2>
            <div className="relative border-b dark:border-gray-700">
              {showLeftCategoryArrow && <button type="button" onClick={() => scrollCategories('left')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineLeft className="h-5 w-5"/></button>}
              <div ref={categoryScrollRef} onScroll={() => handleScroll(categoryScrollRef, setShowLeftCategoryArrow, setShowRightCategoryArrow)} className="flex overflow-x-auto no-scrollbar">
                {Object.keys(typedArabicStylesData).map((catKey) => (
                  <button key={catKey} type="button" onClick={() => { setActiveTab(catKey); setActiveSubTab(Object.keys(typedArabicStylesData[catKey]!)[0]!); }} className={`px-4 py-2 whitespace-nowrap font-semibold ${activeTab === catKey ? 'border-b-2 border-brand-500 text-brand-600' : 'text-gray-500 hover:text-gray-900'}`}>
                    {catKey}
                  </button>
                ))}
              </div>
              {showRightCategoryArrow && <button type="button" onClick={() => scrollCategories('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineRight className="h-5 w-5"/></button>}
            </div>

            <div className="relative mt-4">
              {showLeftSubCategoryArrow && <button type="button" onClick={() => scrollSubCategories('left')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineLeft className="h-5 w-5"/></button>}
              <div ref={subcategoryScrollRef} onScroll={() => handleScroll(subcategoryScrollRef, setShowLeftSubCategoryArrow, setShowRightSubCategoryArrow)} className="flex overflow-x-auto no-scrollbar">
                {Object.keys(typedArabicStylesData[activeTab] ?? {}).map((sub) => (
                  <button key={sub} type="button" id={sub} onClick={() => setActiveSubTab(sub)} className={`px-3 py-1.5 whitespace-nowrap text-sm rounded-full ${activeSubTab === sub ? 'bg-brand-600 text-white font-semibold' : 'bg-cream-100 text-gray-600 hover:bg-cream-200'}`}>
                    {sub}
                  </button>
                ))}
              </div>
              {showRightSubCategoryArrow && <button type="button" onClick={() => scrollSubCategories('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineRight className="h-5 w-5"/></button>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
              {(typedArabicStylesData[activeTab]?.[activeSubTab] ?? []).map((item, idx) => (
                  <div key={idx} className={`relative group cursor-pointer overflow-hidden rounded-lg shadow-md transition-all duration-200 hover:shadow-xl ${selectedImage === item.src ? "ring-4 ring-offset-2 ring-brand-500" : ""}`} onClick={() => handleImageSelect(item.basePrompt, item.src, item.altText, item.name)}>
                    <Image
                      src={item.src}
                      alt={item.altText}
                      width={200}
                      height={200}
                      className="w-full h-auto aspect-square object-cover"
                    />
                    <button type="button" onClick={(e) => { e.stopPropagation(); openPopup(item.src); }} className="absolute top-1 right-1 bg-black bg-opacity-40 text-white rounded-full p-1 text-xs hover:bg-opacity-60">🔍</button>
                    <div className="p-2 text-center text-xs font-medium truncate">{item.name}</div>
                  </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">3. Choose Arabic Quality</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {ARABIC_GENERATOR_TIERS.map((tier) => {
                const tierLocked = isModelCreditLocked(tier.credits);

                return (
                  <button
                    key={tier.model}
                    type="button"
                    onClick={() => {
                      if (tierLocked) return;
                      setSelectedModel(tier.model);
                    }}
                    disabled={tierLocked}
                    className={`rounded-xl border p-4 text-left transition ${
                      tierLocked
                        ? "cursor-not-allowed border-amber-200 bg-amber-50/60 opacity-75"
                        : selectedModel === tier.model
                          ? "border-brand-500 ring-2 ring-brand-500"
                          : "border-cream-200 hover:border-brand-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold">{tier.label}</div>
                        <div className="mt-1 text-sm text-gray-500">{tier.description}</div>
                      </div>
                      {tier.premium && (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
                          Better quality
                        </span>
                      )}
                    </div>
                    <div className="mt-3 text-sm font-medium text-brand-700">
                      {tier.credits} credits
                    </div>
                    {tierLocked && (
                      <div className="mt-2 rounded bg-white/80 px-2 py-1 text-xs font-medium text-amber-800">
                        Need {getModelCreditShortfall(tier.credits)} more credit{getModelCreditShortfall(tier.credits) === 1 ? "" : "s"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {hasKnownCreditBalance &&
              ARABIC_GENERATOR_TIERS.some((tier) => isModelCreditLocked(tier.credits)) && (
                <p className="mt-3 text-xs text-amber-800">
                  Premium Arabic needs more credits.{" "}
                  <Link href="/buy-credits" className="font-semibold underline">
                    Get credits
                  </Link>
                </p>
              )}
          </div>

          {/* 3. Select Image Size (New Visual Style) */}
          <h2 className="text-xl mt-6 mb-2">4. Select Image Size</h2>
          <FormGroup className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {aspectRatios.map((ratio) => {
                const aspectClass = aspectVisualMap[ratio.value];
                return (
                  <button
                    key={ratio.value}
                    type="button"
                    onClick={() => setSelectedAspectRatio(ratio.value)}
                    className={`relative flex items-center justify-center border rounded-lg p-4 transition ${
                      selectedAspectRatio === ratio.value ? "border-brand-500 ring-2 ring-brand-500" : "border-cream-200 hover:border-brand-300"
                    }`}
                  >
                    <div className={`w-full h-21 rounded-lg ${aspectClass} overflow-hidden flex items-center justify-center`} style={{ backgroundColor: "#ddd" }}>
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

          {error && (
            <div className="bg-red-500 text-white rounded p-4 text-xl mb-6">
              {error} {error.includes("credits") && <Link href="/buy-credits" className="underline font-bold ml-2">Buy Credits</Link>}
            </div>
          )}
          
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
            {isLoggedIn
              ? `Generate My Design (${selectedTier.credits} Credits)`
              : "Sign in to Generate"}
          </Button>
          <GeneratorNudge generatorType="arabic" section="trust" />
        </form>
        
        {/* Results Section */}
        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-xl mt-8 mb-2 text-center">Your Arabic Masterpieces</h2>
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
                                kind: "arabic",
                                title: activeSubTab || activeTab,
                              })
                            : "Generated Arabic art"
                        }
                        width={512}
                        height={512}
                        className="w-full rounded"
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

            {selectedModel === "google/nano-banana-2" && (
              <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Want a more detailed result? Generate a <strong>Premium Arabic</strong> version for 6 credits.
              </div>
            )}

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
                    <img src="/images/products/arabic/mug.webp" alt="Custom Mug" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center gap-4 p-6 sm:w-1/2">
                    <div>
                      <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">
                        Most Popular Gift
                      </span>
                      <h4 className="mt-2 text-2xl font-bold text-slate-900">Custom Mug</h4>
                      <p className="mt-1 text-sm text-gray-500">Your Arabic name art printed on a premium ceramic mug.</p>
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
                  <Link href="/products" className="text-sm font-medium text-brand-700 hover:underline">View all →</Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {GENERATOR_PRODUCT_THUMBNAILS.arabic.filter((p) => p.key !== "mug").map((p) => (
                    <Link
                      key={p.key}
                      href="/products"
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

        {popupImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="relative">
              <button onClick={closePopup} className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700">✖️</button>
              <img src={popupImage} alt="Fullscreen" className="max-w-full max-h-screen rounded" />
            </div>
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
export default ArabicNameArtGeneratorPage;

