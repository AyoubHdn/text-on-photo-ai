/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/pages/arabic-name-art-generator.tsx

import { type NextPage } from "next";
import Head from "next/head";
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
import { FiGlobe } from "react-icons/fi";
import { ProductPreviewModal } from "~/component/printful/ProductPreviewModal";
import { trackEvent } from "~/lib/ga";
import { GeneratorNudge } from "~/component/Nudge/GeneratorNudge";
import { CreditUpgradeModal } from "~/component/Credits/CreditUpgradeModal";

// --- TYPESCRIPT FIX START ---
interface StyleItem {
  src: string;
  name: string;
  basePrompt: string;
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

type AIModel = "google/nano-banana-pro";
type AspectRatio = "1:1" | "4:5" | "3:2" | "16:9";

const MODEL_CREDITS: Record<AIModel, number> = {
  "google/nano-banana-pro": 4,
};

type SavedDesign = {
  imageUrl: string;
  prompt: string;
  model: AIModel;
  createdAt: string;
  hasBackgroundRemoved: boolean;
};

const LAST_DESIGN_STORAGE_KEY = "arabic-name-art:last-design:v1";

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
  
  const [selectedModel] = useState<AIModel>("google/nano-banana-pro"); 
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>("1:1");
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
  const creditsQuery = api.user.getCredits.useQuery(undefined, { enabled: isLoggedIn });
  const hasBackgroundCredits = (creditsQuery.data ?? 0) >= 1;
  const generatedImagesGridClass =
    imagesUrl.length === 1
      ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12"
      : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12";
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

  useEffect(() => {
    if (hasTrackedViewRef.current) return;
    trackEvent("view_arabic_generator");
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
    if (imagesUrl.length > 0) return;
    try {
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
    const { name } = router.query;
    if (typeof name === 'string' && name) {
      setForm(prev => ({ ...prev, name }));
    }
    const firstCategory = Object.keys(typedArabicStylesData)[0];
    if (firstCategory) {
      setActiveTab(firstCategory);
      const firstSubCategory = Object.keys(typedArabicStylesData[firstCategory]!)?.[0];
      if (firstSubCategory) setActiveSubTab(firstSubCategory);
    }
  }, [router.isReady, router.query]);

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
        source_page: SOURCE_PAGE,
        user_credits_before_action: creditsQuery.data ?? null,
        required_credits: MODEL_CREDITS[selectedModel],
        country: null,
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
    onError: (error) => {
      if (error.message.toLowerCase().includes("enough credits")) {
        setError("");
        openCreditUpgrade("generate", MODEL_CREDITS[selectedModel], () => {
          let finalPrompt = form.basePrompt.replace(/'Text'/gi, `'${form.name}'`);
          if (!finalPrompt.toLowerCase().includes("arabic")) {
            finalPrompt += ", arabic calligraphy masterpiece, 8k resolution";
          }
          generateIcon.mutate({
            prompt: finalPrompt,
            numberOfImages: 1,
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
      setError(error.message);
    },
  });

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn) { void signIn(); return; }
    if (!form.name || !form.basePrompt) {
      setError("Please select a style and enter a name."); return;
    }
    
    let finalPrompt = form.basePrompt.replace(/'Text'/gi, `'${form.name}'`);
    if(!finalPrompt.toLowerCase().includes("arabic")) {
        finalPrompt += ", arabic calligraphy masterpiece, 8k resolution";
    }

    generateIcon.mutate({
      prompt: finalPrompt,
      numberOfImages: 1,
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
      metadata: {
        category: activeTab || undefined,
        subcategory: activeSubTab || undefined,
      },
    });
  };

  const handleImageSelect = (basePrompt: string, src: string) => {
    setSelectedImage(src);
    setForm((prev) => ({ ...prev, basePrompt }));
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
        source_page: SOURCE_PAGE,
        user_credits_before_action: creditsQuery.data ?? null,
        required_credits: 1,
        country: null,
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
      <Head>
        <title>Arabic Name Art Generator | AI Calligraphy</title>
        <meta name="description" content="Generate stunning Arabic calligraphy and Islamic name art using AI." />
      </Head>
      <main className="container m-auto mb-24 flex flex-col px-4 py-6 sm:px-8 sm:py-8 max-w-screen-md">
        
        {/* Language Switcher - Made more visible */}
        <div className="flex justify-end mb-4">
            <Link href="/ar/arabic-name-art-generator">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 border border-gray-300 rounded-full shadow-sm hover:border-blue-700 hover:text-white transition-all">
                    <FiGlobe className="text-lg" /> 
                    <span className="font-medium">العربية</span>
                </button>
            </Link>
        </div>

        <h1 className="text-3xl font-bold text-center sm:text-4xl">Arabic Name Art Generator</h1>
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
                  <button key={catKey} type="button" onClick={() => { setActiveTab(catKey); setActiveSubTab(Object.keys(typedArabicStylesData[catKey]!)[0]!); }} className={`px-4 py-2 whitespace-nowrap font-semibold ${activeTab === catKey ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}`}>
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
                  <button key={sub} type="button" id={sub} onClick={() => setActiveSubTab(sub)} className={`px-3 py-1.5 whitespace-nowrap text-sm rounded-full ${activeSubTab === sub ? 'bg-blue-500 text-white font-semibold' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                    {sub}
                  </button>
                ))}
              </div>
              {showRightSubCategoryArrow && <button type="button" onClick={() => scrollSubCategories('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineRight className="h-5 w-5"/></button>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
              {(typedArabicStylesData[activeTab]?.[activeSubTab] ?? []).map((item, idx) => (
                  <div key={idx} className={`relative group cursor-pointer overflow-hidden rounded-lg shadow-md transition-all duration-200 hover:shadow-xl ${selectedImage === item.src ? "ring-4 ring-offset-2 ring-blue-500" : ""}`} onClick={() => handleImageSelect(item.basePrompt, item.src)}>
                    <Image src={item.src} alt={item.basePrompt} width={200} height={200} className="w-full h-auto aspect-square object-cover"/>
                    <button type="button" onClick={(e) => { e.stopPropagation(); openPopup(item.src); }} className="absolute top-1 right-1 bg-black bg-opacity-40 text-white rounded-full p-1 text-xs hover:bg-opacity-60">🔍</button>
                    <div className="p-2 text-center text-xs font-medium truncate">{item.name}</div>
                  </div>
              ))}
            </div>
          </div>

          {/* 3. Select Image Size (New Visual Style) */}
          <h2 className="text-xl mt-6 mb-2">3. Select Image Size</h2>
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
                      selectedAspectRatio === ratio.value ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-300 hover:border-gray-500"
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
          
          <Button isLoading={generateIcon.isLoading} disabled={generateIcon.isLoading}>
            {isLoggedIn ? "Generate My Design (4 Credits)" : "Sign in to Generate"}
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
                      <Image src={displayUrl} alt="Arabic Art" width={512} height={512} className="w-full rounded" />
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

            <section className="mt-10">
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                ✨ Your design is ready! Imagine this on your favorite mug, shirt, or framed on your wall.
              </div>
              <h3 className="text-2xl font-semibold mb-6 text-center">
                Turn your design into a real product
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  {
                    key: "poster",
                    label: "Poster",
                    description: "Perfect for walls, frames, and gifts",
                    image: "/images/products/poster.jpg",
                  },
                  {
                    key: "tshirt",
                    label: "T-Shirt",
                    description: "Wear your name art every day",
                    image: "/images/products/tshirt.jpg",
                  },
                  {
                    key: "mug",
                    label: "Mug",
                    description: "A daily reminder with your design",
                    image: "/images/products/mug.jpg",
                  },
                ].map((p) => (
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
                        disabled={previewCooldown !== null}
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
export default ArabicNameArtGeneratorPage;

