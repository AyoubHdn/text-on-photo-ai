// pages/name-art-generator.tsx
import { type NextPage } from "next";
import Image from "next/image";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "~/component/Input";
import { stylesData } from "~/data/stylesData";
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
import { trackGA, trackEvent } from "~/lib/ga";
import { createGenerationRequestId } from "~/lib/generationRequest";
import { buildWebApplicationSchema } from "~/lib/seo";
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

const LAST_DESIGN_STORAGE_KEY = "name-art:last-design:v1";
const GENERATOR_DRAFT_STORAGE_KEY = "name-art:auth-draft:v1";
const DIGITAL_ART_INTENT_STORAGE_KEY = "digital-art-interest:intent";
const GENERATOR_DRAFT_TTL_MS = 1000 * 60 * 60 * 24;
const MAX_GENERATION_IMAGES = 4;
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
const isAIModel = (value: unknown): value is AIModel =>
  typeof value === "string" && value in MODEL_CREDITS;
const isAspectRatio = (value: unknown): value is AspectRatio =>
  value === "1:1" || value === "4:5" || value === "3:2" || value === "16:9";

const NameArtGeneratorPage: NextPage = () => {
  const SOURCE_PAGE = "name-art-generator";
  const hasTrackedViewRef = useRef(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const router = useRouter();

  const [form, setForm] = useState({ name: "", basePrompt: "", numberofImages: "1" });
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
  const productsSectionRef = useRef<HTMLElement>(null);
  const hasScrolledToProducts = useRef(false);
  const hasRestoredDraftRef = useRef(false);
  const restoredAuthDraftRef = useRef(false);
  const [isSubmittingGeneration, setIsSubmittingGeneration] = useState(false);
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
  const isIdeogramModel = selectedModel === "ideogram-ai/ideogram-v2-turbo";
  const generatedImagesGridClass =
    imagesUrl.length === 1
      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12"
      : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12";
  const getRequiredGenerateCredits = () => {
    const rawCount = Number.parseInt(form.numberofImages, 10);
    const numberOfImages = isIdeogramModel
      ? 1
      : Math.min(
          MAX_GENERATION_IMAGES,
          Math.max(1, Number.isFinite(rawCount) ? rawCount : 1),
        );
    const perImage = MODEL_CREDITS[selectedModel] ?? 1;
    return perImage * numberOfImages;
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
    if (typeof window === "undefined") return "/name-art-generator";
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

  // --- START: THE FINAL, DEFINITIVE INITIALIZATION LOGIC ---
  useEffect(() => {
    if (hasTrackedViewRef.current) return;
    trackEvent("view_generator");
    hasTrackedViewRef.current = true;
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("last-generator", "default");
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
    if (!router.isReady) return;

    const name = getStringQueryValue(router.query.name);
    const style = getStringQueryValue(router.query.style);
    const styleImage = getStringQueryValue(router.query.styleImage);
    const legacyHash = window.location.hash.substring(1);

    if (name) {
      setForm((prev) => ({ ...prev, name }));
    }

    const styleSelection = findGeneratorStyleSelection(stylesData, {
      style: style ?? legacyHash,
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
      setAllowCustomColors(item.allowCustomColors);
      setForm((prev) => ({ ...prev, basePrompt: item.basePrompt }));
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

    const firstCategory = Object.keys(stylesData)[0];
    if (firstCategory) {
      setActiveTab(firstCategory);
      const firstSubCategory = Object.keys(stylesData[firstCategory]!)?.[0];
      if (firstSubCategory) {
        setActiveSubTab(firstSubCategory);
      }
    }
  }, [
    router.isReady,
    router.query.name,
    router.query.style,
    router.query.styleImage,
  ]);
  // --- END: THE FINAL, DEFINITIVE INITIALIZATION LOGIC ---

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
    if (isIdeogramModel) {
      if (form.numberofImages !== "1") {
        setForm((prev) => ({ ...prev, numberofImages: "1" }));
      }
      return;
    }

    const parsed = Number.parseInt(form.numberofImages, 10);
    if (Number.isFinite(parsed) && parsed > MAX_GENERATION_IMAGES) {
      setForm((prev) => ({ ...prev, numberofImages: String(MAX_GENERATION_IMAGES) }));
    }
  }, [form.numberofImages, isIdeogramModel]);

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

  const startGeneratorSignIn = () => {
    saveAuthDraft();
    try {
      window.localStorage.setItem(DIGITAL_ART_INTENT_STORAGE_KEY, SOURCE_PAGE);
    } catch {
      // ignore storage errors
    }
    void signIn(undefined, { callbackUrl: getSignInCallbackUrl() });
  };

  const generateIcon = api.generate.generateIcon.useMutation({
    onSuccess: (data) => {
      setImagesUrl(data);
      setGeneratedAspect(selectedAspectRatio);
      setTransparentUrls({});
      setUseTransparentMap({});
      setRemovingBackgroundMap({});
      setRemoveBgCreditAlertMap({});
      const firstImageUrl = data?.[0]?.imageUrl;
      if (firstImageUrl) {
        const saved: SavedDesign = {
          imageUrl: firstImageUrl,
          prompt: form.basePrompt ? form.basePrompt.replace(/'Text'/gi, form.name) : form.name,
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
    const rawCount = Number.parseInt(form.numberofImages, 10);
    const numberOfImages = isIdeogramModel
      ? 1
      : Math.min(
          MAX_GENERATION_IMAGES,
          Math.max(1, Number.isFinite(rawCount) ? rawCount : 1),
        );
    let finalPrompt = form.basePrompt.replace(/'Text'/gi, form.name);
    finalPrompt += " designed to cover the entire screen, high resolution";

    return {
      generationRequestId: createGenerationRequestId(),
      prompt: finalPrompt,
      numberOfImages,
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
      sourcePage: SOURCE_PAGE,
      metadata: {
        category: activeTab || undefined,
        subcategory: activeSubTab || undefined,
        communityAlt: selectedStyleAltText
          ? buildCommunityAltFromStyle({
              kind: "name",
              templateAlt: selectedStyleAltText,
              primaryText: form.name,
              styleLabel: selectedStyleLabel,
            })
          : undefined,
        communityTitle: buildCommunityTitleFromStyle({
          kind: "name",
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

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(imageBitmap, 0, 0);
        const pngBlob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );
        if (pngBlob) {
          const blobUrl = window.URL.createObjectURL(pngBlob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = "name-design-ai.png";
          link.click();
          window.URL.revokeObjectURL(blobUrl);
        }
      }
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
      return transparentUrls[imageId];
    }
    return imageUrl;
  };
  const getTransparentInfo = (imageUrl: string | null) => {
    if (!imageUrl) return { transparentImageUrl: null, useTransparent: false };
    const imageId = extractImageId(imageUrl);
    if (!imageId) return { transparentImageUrl: null, useTransparent: false };
    return {
      transparentImageUrl: transparentUrls[imageId] ?? null,
      useTransparent: Boolean(useTransparentMap[imageId]),
    };
  };
  const handleToggleBackground = async (imageUrl: string) => {
    const imageId = extractImageId(imageUrl);
    if (!imageId) return;

    const isRemoving = removingBackgroundMap[imageId];
    if (isRemoving) return;

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
      if (!nextTransparentUrl) {
        throw new Error("Background removal failed");
      }

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
      console.error("[REMOVE_BACKGROUND_UI]", err);
      alert("Background removal failed. Please try again.");
    } finally {
      setRemovingBackgroundMap((prev) => ({ ...prev, [imageId]: false }));
    }
  };
  const openPopup = (imageUrl: string) => setPopupImage(imageUrl);
  const closePopup = () => setPopupImage(null);
  const openShareModal = (imageUrl: string) => setShareModalData({ isOpen: true, imageUrl });
  const closeShareModal = () => setShareModalData({ isOpen: false, imageUrl: null });

  const scrollCategories = (direction: 'left' | 'right') => {
      categoryScrollRef.current?.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: "smooth"});
  };
  const scrollSubCategories = (direction: 'left' | 'right') => {
      subcategoryScrollRef.current?.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: "smooth"});
  };
  
  const aspectRatios: {
    label: string;
    value: AspectRatio;
    description: string;
  }[] = [
    {
      label: "1:1",
      value: "1:1",
      description: "Best for posters, profile images, and square designs",
    },
    {
      label: "4:5",
      value: "4:5",
      description: "Best choice for posters and wall art",
    },
    {
      label: "3:2",
      value: "3:2",
      description: "Ideal for wide posters and horizontal designs",
    },
    {
      label: "16:9",
      value: "16:9",
      description: "Best for screens, wallpapers, and digital use",
    },
  ];

  const aspectVisualMap: Record<AspectRatio, string> = {
    "1:1": "aspect-[1/1]",
    "4:5": "aspect-[4/5]",
    "3:2": "aspect-[3/2]",
    "16:9": "aspect-[16/9]",
  };

  const previewImageInfo = getTransparentInfo(previewImage);

  return (
    <>
      <SeoHead
        title="Free AI Name Art Generator & Name Design Maker — Create Online"
        description="Free AI name art generator and name design maker. Create custom name designs in seconds — pick a style, generate, then turn it into a mug, poster, or shirt."
        path="/name-art-generator"
        jsonLd={[
          buildWebApplicationSchema({
            name: "Name Art Generator",
            description:
              "Free AI name art generator and name design maker. Create custom name designs in multiple styles for decor, gifts, and downloads.",
            path: "/name-art-generator",
          }),
        ]}
      />
      <main className="container m-auto mb-24 flex flex-col px-8 py-8 max-w-screen-md">
        <h1 className="text-4xl font-bold">Free AI Name Art Generator</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
          Name Art Generator & Name Design Maker — Create Custom Designs Online
        </h2>
        <p className="text-lg mt-4">
          Create custom name art and name designs in seconds. Our free AI name art
          generator doubles as a name design maker — type any name, pick a style,
          and generate personalized artwork for decor, gifts, and downloads. No
          sign-up required to preview, and you can turn any design into a mug,
          poster, or t-shirt.
        </p>
        <GeneratorNudge generatorType="default" />
        
        <form className="flex flex-col gap-3 mt-6" onSubmit={handleFormSubmit}>
          <FormGroup className="mb-12">
            <label className="text-xl font-semibold mb-2">1. Enter a Name/Text</label>
            <Input required value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Type your name here" />
          </FormGroup>

          <div>
            <h2 className="text-xl font-semibold mb-4">2. Choose Your Favorite Style</h2>
            <div className="relative border-b dark:border-gray-700">
              {showLeftCategoryArrow && <button type="button" onClick={() => scrollCategories('left')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineLeft className="h-5 w-5"/></button>}
              <div ref={categoryScrollRef} onScroll={() => handleScroll(categoryScrollRef, setShowLeftCategoryArrow, setShowRightCategoryArrow)} className="flex overflow-x-auto no-scrollbar">
                {Object.keys(stylesData).map((catKey) => (
                  <button key={catKey} type="button" onClick={() => { setActiveTab(catKey); setActiveSubTab(Object.keys(stylesData[catKey]!)[0]!); }} className={`px-4 py-2 whitespace-nowrap font-semibold ${activeTab === catKey ? 'border-b-2 border-brand-500 text-brand-600' : 'text-gray-500 hover:text-gray-900'}`}>
                    {catKey}
                  </button>
                ))}
              </div>
              {showRightCategoryArrow && <button type="button" onClick={() => scrollCategories('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineRight className="h-5 w-5"/></button>}
            </div>

            <div className="relative mt-4">
              {showLeftSubCategoryArrow && <button type="button" onClick={() => scrollSubCategories('left')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineLeft className="h-5 w-5"/></button>}
              <div ref={subcategoryScrollRef} onScroll={() => handleScroll(subcategoryScrollRef, setShowLeftSubCategoryArrow, setShowRightSubCategoryArrow)} className="flex overflow-x-auto no-scrollbar">
                {Object.keys(stylesData[activeTab] ?? {}).map((sub) => (
                  <button key={sub} type="button" id={sub} onClick={() => setActiveSubTab(sub)} className={`px-3 py-1.5 whitespace-nowrap text-sm rounded-full ${activeSubTab === sub ? 'bg-brand-600 text-white font-semibold' : 'bg-cream-100 text-gray-600 hover:bg-cream-200'}`}>
                    {sub}
                  </button>
                ))}
              </div>
              {showRightSubCategoryArrow && <button type="button" onClick={() => scrollSubCategories('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineRight className="h-5 w-5"/></button>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
              {(stylesData[activeTab]?.[activeSubTab] ?? []).map((item, idx) => (
                  <div key={idx} className={`relative group cursor-pointer overflow-hidden rounded-lg shadow-md transition-all duration-200 hover:shadow-xl ${selectedImage === item.src ? "ring-4 ring-offset-2 ring-brand-500" : ""}`} onClick={() => handleImageSelect(item.basePrompt, item.src, item.altText, activeSubTab || activeTab, item.allowCustomColors)}>
                    <Image
                      src={item.src.replace(/\.webp$/, "e.webp")}
                      alt={item.altText}
                      width={200}
                      height={200}
                      className="w-full h-auto aspect-square object-cover"
                    />
                  </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">3. Select AI Model</h2>
                  <div className="grid grid-cols-2 gap-4">
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
                          className={`relative flex flex-col items-center justify-center rounded-lg border p-4 transition ${
                            modelLocked
                              ? "cursor-not-allowed border-amber-200 bg-amber-50/60 opacity-75"
                              : selectedModel === model.value
                                ? "border-brand-500 ring-2 ring-brand-500"
                                : "border-cream-200 hover:border-brand-300"
                          }`}
                        >
                          <div className="relative mb-2 w-full aspect-square overflow-hidden rounded">
                            <img
                              src={modelImage}
                              alt={model.name}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          </div>
                          <span className="text-sm font-semibold">{model.name}</span>
                          <span className="text-xs text-gray-500">Cost: {model.cost} credits</span>
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
                </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">4. Select Image Size</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {aspectRatios.map((ratio) => {
                      const aspectClass = aspectVisualMap[ratio.value];
                      return (
                        <button
                          key={ratio.value}
                          type="button"
                          onClick={() => setSelectedAspectRatio(ratio.value)}
                          className={`relative flex items-center justify-center rounded-lg border p-4 transition ${
                            selectedAspectRatio === ratio.value
                              ? "border-brand-500 ring-2 ring-brand-500"
                              : "border-cream-200 hover:border-brand-300"
                          }`}
                        >
                          <div
                            className={`w-full rounded-lg ${aspectClass} overflow-hidden flex items-center justify-center`}
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
                </div>

          <FormGroup className="mb-12">
            <label htmlFor="numberofImages" className="text-xl font-semibold mb-2">
              5. Number of designs
            </label>
                  <Input
                    id="numberofImages"
                    type="number"
                    min={1}
                    max={isIdeogramModel ? 1 : MAX_GENERATION_IMAGES}
                    value={form.numberofImages}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") { setForm((prev) => ({ ...prev, numberofImages: raw })); return; }
                      const parsed = Number.parseInt(raw, 10);
                      if (!Number.isFinite(parsed)) return;
                      const maxImages = isIdeogramModel ? 1 : MAX_GENERATION_IMAGES;
                      const clamped = Math.min(maxImages, Math.max(1, parsed));
                      setForm((prev) => ({ ...prev, numberofImages: String(clamped) }));
                    }}
                    disabled={isIdeogramModel}
                    placeholder={isIdeogramModel ? "1 (Fixed)" : `1–${MAX_GENERATION_IMAGES}`}
                  />
          </FormGroup>

          {/* Credit balance indicator */}
          {isLoggedIn && creditsQuery.data !== undefined && (
            <div className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm ${
              (creditsQuery.data ?? 0) <= 0
                ? "border border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                : "border border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}>
              <span>
                {(creditsQuery.data ?? 0) <= 0
                  ? "No credits remaining — add credits to generate"
                  : `${creditsQuery.data} credit${creditsQuery.data === 1 ? "" : "s"} remaining · this design costs ${getRequiredGenerateCredits()} credit${getRequiredGenerateCredits() === 1 ? "" : "s"}`}
              </span>
              {(creditsQuery.data ?? 0) <= 2 && (
                <Link href="/buy-credits" className="ml-3 whitespace-nowrap font-semibold text-brand-700 hover:underline">
                  Get credits
                </Link>
              )}
            </div>
          )}

          {error && (
            <div className="rounded bg-red-500 p-4 text-sm text-white">
              {error}{" "}
              {error === "You do not have enough credits" && (
                <Link id="not-enough-credits-alert-btn" href="/buy-credits" className="ml-2 font-bold underline">
                  Buy Credits
                </Link>
              )}
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

          {isSubmittingGeneration && (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-brand-200 bg-brand-50 py-4 text-sm font-medium text-brand-800">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              Generating your design — this takes about 10 seconds…
            </div>
          )}

          <Button
            type={isLoggedIn ? "submit" : "button"}
            onClick={!isLoggedIn ? startGeneratorSignIn : undefined}
            isLoading={generateIcon.isLoading}
            disabled={generateIcon.isLoading || isSubmittingGeneration || isCreditLocked}
          >
            {isLoggedIn ? "Generate Design" : "Sign in to Generate Free"}
          </Button>
          <GeneratorNudge generatorType="default" section="trust" />
        </form>
        
        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-xl mt-8 mb-2">Your Custom Name Art</h2>
            <section className={generatedImagesGridClass}>
              {imagesUrl.map(({ imageUrl }, index) => {
                const imageId = extractImageId(imageUrl);
                const isRemoving = imageId ? removingBackgroundMap[imageId] : false;
                const isTransparent = imageId ? useTransparentMap[imageId] : false;
                const displayUrl: string =
                  imageId && isTransparent && transparentUrls[imageId]
                    ? (transparentUrls[imageId] ?? imageUrl)
                    : imageUrl;
                return (
                <div key={index} className="flex flex-col">
                <div className="relative rounded shadow-md hover:shadow-lg transition">
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
                      onClick={() => openShareModal(displayUrl)} // This now opens the modal
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
                            kind: "name",
                            title: activeSubTab || activeTab,
                          })
                        : "Generated name art"
                    }
                    width={512}
                    height={512}
                    className="w-full rounded"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 rounded bg-gray-900/80 px-2 py-1.5 text-xs text-white">
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
                <img
                  src="/images/products/mug.webp"
                  alt="Custom Mug"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center gap-4 p-6 sm:w-1/2">
                <div>
                  <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">
                    Most Popular Gift
                  </span>
                  <h4 className="mt-2 text-2xl font-bold text-slate-900">Custom Mug</h4>
                  <p className="mt-1 text-sm text-gray-500">Your name art printed on a premium ceramic mug.</p>
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
                    setPreviewImage(imagesUrl[0]?.imageUrl ?? null);
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
              <Link href="/products" className="text-sm font-medium text-brand-700 hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {GENERATOR_PRODUCT_THUMBNAILS.default.filter((p) => p.key !== "mug").map((p) => (
                <Link
                  key={p.key}
                  href="/products"
                  className="group overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm transition hover:border-brand-300 hover:shadow-md"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.label}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
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
              <button 
                type="button"
                onClick={closePopup}
                className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 focus:outline-none"
                title="Close Popup"
                aria-label="Close Popup"
              >
                ✖️
              </button>
              <img
                src={popupImage}
                alt="Fullscreen view"
                className="max-w-full max-h-screen rounded"
              />
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
          aspect={generatedAspect ?? selectedAspectRatio}
          onCooldownStart={setPreviewCooldown}
          transparentImageUrl={previewImageInfo.transparentImageUrl}
          useTransparent={previewImageInfo.useTransparent}
        />

      </main>
    </>
  );
};
export default NameArtGeneratorPage;

