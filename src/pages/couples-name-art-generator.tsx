import { type NextPage } from "next";
import Head from "next/head";
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
import Link from "next/link";
import { ShareModal } from '~/component/ShareModal';
import { ProductPreviewModal } from "~/component/printful/ProductPreviewModal";
import { trackEvent } from "~/lib/ga";
import { GeneratorNudge } from "~/component/Nudge/GeneratorNudge";
import { CreditUpgradeModal } from "~/component/Credits/CreditUpgradeModal";
import { GENERATOR_PRODUCT_THUMBNAILS } from "~/config/generatorProductThumbnails";

type AIModel = "flux-schnell" | "flux-dev" | "ideogram-ai/ideogram-v2-turbo";
type AspectRatio = "1:1" | "4:5" | "3:2" | "16:9";

const MODEL_CREDITS: Record<AIModel, number> = {
  "flux-schnell": 1,
  "flux-dev": 3,
  "ideogram-ai/ideogram-v2-turbo": 5,
};

type SavedDesign = {
  imageUrl: string;
  prompt: string;
  model: AIModel;
  createdAt: string;
  hasBackgroundRemoved: boolean;
};

const LAST_DESIGN_STORAGE_KEY = "couples-name-art:last-design:v1";

const CouplesNameArtGeneratorPage: NextPage = () => {
  const SOURCE_PAGE = "couples-art-generator";
  const hasTrackedViewRef = useRef(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session;

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
  const creditsQuery = api.user.getCredits.useQuery(undefined, { enabled: isLoggedIn });
  const hasBackgroundCredits = (creditsQuery.data ?? 0) >= 1;
  const isCreditLocked = isLoggedIn && (creditsQuery.data ?? 0) <= 0 && imagesUrl.length > 0;
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
      source_page: "couples-name-art-generator",
      user_credits: creditsQuery.data ?? null,
      country: null,
    });
    const maybeFbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof maybeFbq === "function") {
      maybeFbq("trackCustom", "view_couples_name_art_generator", {
        source_page: "couples-name-art-generator",
        user_credits: creditsQuery.data ?? null,
        country: null,
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
    if (imagesUrl.length > 0) return;
    try {
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
    const categoryKeys = Object.keys(coupleStylesData);
    if (categoryKeys.length > 0) setActiveTab(categoryKeys[0] ?? "");
  }, []);

  useEffect(() => {
    if (!activeTab) return;
    const subKeys = Object.keys(coupleStylesData[activeTab] ?? {});
    if (subKeys.length > 0) setActiveSubTab(subKeys[0] ?? "");
  }, [activeTab]);

  useLayoutEffect(() => {
    handleCategoryScroll();
    handleSubCategoryScroll();
  }, [activeTab]);

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
        source_page: SOURCE_PAGE,
        user_credits_before_action: creditsQuery.data ?? null,
        required_credits: creditsUsed,
        country: null,
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
    onError: (error) => {
      if (error.message.toLowerCase().includes("enough credits")) {
        setError("");
        openCreditUpgrade("generate", getRequiredGenerateCredits(), () => {
          let finalPrompt = form.basePrompt
            .replace(/\[NAME1\]/gi, form.name1)
            .replace(/\[NAME2\]/gi, form.name2);
          finalPrompt += ", beautiful romantic art, high resolution";
          generateIcon.mutate({
            prompt: finalPrompt,
            numberOfImages: parseInt(form.numberofImages, 10),
            aspectRatio: selectedAspectRatio,
            model: selectedModel,
            metadata: {
              category: activeTab || undefined,
              subcategory: activeSubTab || undefined,
            },
          });
        });
        return;
      }
      console.error(error);
      setError(error.message);
    },
  });

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn) {
      signIn().catch(console.error);
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

    // --- STRATEGIC CHANGE: Replace both name placeholders ---
    let finalPrompt = form.basePrompt
        .replace(/\[NAME1\]/gi, form.name1)
        .replace(/\[NAME2\]/gi, form.name2);
    finalPrompt += ", beautiful romantic art, high resolution";

    generateIcon.mutate({
      prompt: finalPrompt,
      numberOfImages: parseInt(form.numberofImages, 10),
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
      metadata: {
        category: activeTab || undefined,
        subcategory: activeSubTab || undefined,
      },
    });
  };

  const handleImageSelect = (basePrompt: string, src: string, allowColors = true) => {
    setSelectedImage(src);
    setForm((prev) => ({ ...prev, basePrompt }));
    setSelectedStyleImage(src);
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
        source_page: SOURCE_PAGE,
        user_credits_before_action: creditsQuery.data ?? null,
        required_credits: 1,
        country: null,
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
      <Head>
        <title>Couples Name Art Generator | Name Design AI</title>
        <meta name="description" content="Create beautiful, romantic art with two names. Perfect for anniversaries, weddings, and gifts for your partner. Design your unique couples art in seconds." />
      </Head>
      <main className="container m-auto mb-24 flex flex-col px-4 py-6 sm:px-8 sm:py-8 max-w-screen-md">
        <h1 className="text-3xl font-bold sm:text-4xl">Couples Name Art Generator</h1>
        <p className="mt-4 text-base text-gray-700 dark:text-gray-300 sm:text-lg">
          Celebrate your connection by turning both of your names into a single, beautiful work of art. Perfect for anniversaries, wedding gifts, or a special surprise for your partner.
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
                        <button key={catKey} type="button" onClick={() => setActiveTab(catKey)} className={`px-4 py-2 ${activeTab === catKey ? "font-semibold border-b-2 border-blue-500 text-blue-500" : "font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"}`}>{catKey}</button>
                    ))}
                </div>
            </div>
            <div className="relative border-b mb-4 mt-4 flex items-center dark:border-gray-700">
                {/* ... Subcategory Scroller JSX (no changes) ... */}
                <div ref={subcategoryScrollRef} onScroll={handleSubCategoryScroll} className="flex overflow-x-auto whitespace-nowrap no-scrollbar flex-1">
                    {Object.keys(coupleStylesData[activeTab] ?? {}).map((sub) => (
                        <button key={sub} type="button" onClick={() => setActiveSubTab(sub)} className={`px-4 py-2 ${activeSubTab === sub ? "text-sm border-b-2 border-blue-500 text-blue-500" : "text-sm text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"}`}>{sub}</button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(coupleStylesData[activeTab]?.[activeSubTab] ?? []).map((item, idx) => {
                const allowColors = item.allowCustomColors !== false;
                const styleImagePath = item.src.replace(/\.webp$/, "e.webp");
                return (
                  <div key={idx} className={`relative rounded shadow-md hover:shadow-lg transition cursor-pointer ${selectedImage === item.src ? "ring-4 ring-blue-500" : ""}`} onClick={() => handleImageSelect(item.basePrompt, item.src, allowColors)}>
                    <img src={styleImagePath} alt={item.basePrompt} className="rounded w-full h-auto object-cover mx-auto" />
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
                        {[
                          {
                            name: "Standard",
                            value: "flux-schnell" as AIModel,
                            cost: 1,
                            image:
                              selectedStyleImage && selectedStyleImage.includes(".")
                                ? selectedStyleImage
                                : "/images/placeholder.png",
                            recommended: false,
                            label: undefined, // No extra label
                          },
                          {
                            name: "Optimized",
                            value: "flux-dev" as AIModel,
                            cost: 3,
                            image:
                              selectedStyleImage && selectedStyleImage.includes(".")
                                ? selectedStyleImage.replace(/(\.[^.]+)$/, "e$1")
                                : "/images/placeholder.png",
                            recommended: true,  // Shows the "Recommended" tag
                            label: undefined,
                          },
                          
                        ].map((model) => (
                          <button
                            key={model.value}
                            type="button"
                            onClick={() => setSelectedModel(model.value)}
                            className={`relative flex flex-col items-center justify-center border rounded-lg p-4 transition ${
                              selectedModel === model.value
                                ? "border-blue-500 ring-2 ring-blue-500"
                                : "border-gray-300 hover:border-gray-500"
                            }`}
                          >
                            <div className="relative w-22 h-22 mb-2 overflow-hidden rounded">
                              <img
                                src={model.image}
                                alt={model.name}
                                className="w-full h-full object-cover"
                              />
                              {model.recommended && (
                                <span className="absolute top-1 right-1 bg-yellow-400 text-black px-2 text-xs rounded">
                                  Recommended
                                </span>
                              )}
                              {/* Render label if present (e.g. "Top Tier") */}
                              {model.label && (
                                <span className="absolute top-1 right-1 bg-red-300 text-black px-2 text-xs rounded">
                                  {model.label}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-semibold">{model.name}</span>
                            <span className="text-sm text-gray-500">Cost: {model.cost} credits</span>
                          </button>
                        ))}
                      </div>
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
                                  ? "border-blue-500 ring-2 ring-blue-500"
                                  : "border-gray-300 hover:border-gray-500"
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
            <div className="rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
              This design is saved. Add credits to continue.{" "}
              <Link href="/buy-credits" className="underline font-semibold">
                Buy credits
              </Link>
            </div>
          )}
          <Button isLoading={generateIcon.isLoading} disabled={generateIcon.isLoading || isCreditLocked}>{isLoggedIn ? "Generate Couples Art" : "Sign in to Generate"}</Button>
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
                const showRemoveBgAlert = imageId ? removeBgCreditAlertMap[imageId] : false;
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
                        alt="Generated couples art"
                        width={512}
                        height={512}
                        className={`w-full rounded ${isCreditLocked ? "blur-[2px] opacity-70" : ""}`}
                        unoptimized={true}
                      />
                      {isCreditLocked && (
                        <div className="absolute inset-0 flex items-center justify-center rounded bg-black/30 text-xs font-semibold text-white">
                          Saved design locked
                        </div>
                      )}
                      {showRemoveBgAlert && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                          Removing the background costs 1 credit.
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 rounded bg-gray-900/80 px-2 py-1.5 text-xs text-white dark:bg-gray-800/90">
                      <span className="opacity-80">Costs 1 credit</span>
                      <button
                        type="button"
                        onClick={() => void handleToggleBackground(imageUrl)}
                        disabled={!!isRemoving || isCreditLocked}
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

            <section className="mt-10">
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                ✨ Your design is ready! Imagine this on your favorite mug, shirt, or framed on your wall.
              </div>
              <h3 className="text-2xl font-semibold mb-6 text-center">
                Turn your design into a real product
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {GENERATOR_PRODUCT_THUMBNAILS.couples.map((p) => (
                  <div
                    key={p.key}
                    className="group relative rounded-xl overflow-hidden border bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg transition"
                  >
                    <div className="relative h-44 bg-gray-100 dark:bg-gray-800">
                      <img
                        src={p.image}
                        alt={p.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="p-4 text-center">
                      <h4 className="text-lg font-semibold mb-1">{p.label}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {p.description}
                      </p>

                      {previewCooldown !== null && (
                        <div className="mb-4 rounded-lg bg-yellow-100 text-yellow-900 px-4 py-3 text-sm">
                          Preview temporarily paused due to high demand.
                          <br />
                          You can try again in <strong>{previewCooldown}s</strong>.
                        </div>
                      )}

                      <button
                        className="inline-block px-8 py-4 text-l font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                        disabled={previewCooldown !== null || isCreditLocked}
                        onClick={() => {
                          if (
                            selectedAspectRatio === "16:9" &&
                              (p.key === "poster" || p.key === "mug"))
                          {
                            alert("This image size is not supported for this product.");
                            return;
                          }

                          setPreviewProduct(p.key as "poster" | "tshirt" | "mug");
                          setPreviewImage(getDisplayImageUrl(imagesUrl[0]?.imageUrl ?? null));
                        }}
                      >
                        {previewCooldown !== null ? `Please wait ${previewCooldown}s` : "Preview (0.1 credit)"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

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
              source_page: SOURCE_PAGE,
              user_credits_before_action: creditsQuery.data ?? null,
              required_credits: creditUpgradeRequired,
              country: null,
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

