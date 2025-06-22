import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "~/component/Input";
// --- STRATEGIC CHANGE: Import the curated gift styles ---
import { giftStylesData } from "~/data/giftStylesData"; 
import { useSession, signIn } from "next-auth/react";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import Link from "next/link";
import { ShareModal } from '~/component/ShareModal';

type AIModel = "flux-schnell" | "flux-dev" | "ideogram-ai/ideogram-v2-turbo";
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3";

const PersonalizedGiftsGeneratorPage: NextPage = () => {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  const [form, setForm] = useState({
    name: "",
    basePrompt: "",
    numberofImages: "1",
  });
  const [error, setError] = useState<string>("");
  const [imagesUrl, setImagesUrl] = useState<{ imageUrl: string }[]>([]);
  const [allowCustomColors, setAllowCustomColors] = useState<boolean>(true); // Kept for consistency, though most gift styles won't use it
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

  const [shareModalData, setShareModalData] = useState<{ isOpen: boolean; imageUrl: string | null }>({
    isOpen: false,
    imageUrl: null,
  });

  const aspectRatios: { label: string; value: AspectRatio; visual: string }[] = [
    { label: "1:1", value: "1:1", visual: "aspect-square" },
    { label: "16:9", value: "16:9", visual: "aspect-video" },
    { label: "9:16", value: "9:16", visual: "aspect-portrait" },
    { label: "4:3", value: "4:3", visual: "aspect-classic" },
  ];

  useEffect(() => {
    // --- STRATEGIC CHANGE: Use giftStylesData ---
    const categoryKeys = Object.keys(giftStylesData);
    if (categoryKeys.length > 0) {
      setActiveTab(categoryKeys[0] ?? "");
    }
  }, []);

  useEffect(() => {
    if (!activeTab) return;
    // --- STRATEGIC CHANGE: Use giftStylesData ---
    const subKeys = Object.keys(giftStylesData[activeTab] ?? {});
    if (subKeys.length > 0) {
      setActiveSubTab(subKeys[0] ?? "");
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    handleCategoryScroll();
    handleSubCategoryScroll();
  }, [activeTab]);

  const openShareModal = (imageUrl: string) => {
    setShareModalData({ isOpen: true, imageUrl });
  };

  const closeShareModal = () => {
    setShareModalData({ isOpen: false, imageUrl: null });
  };

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
    onSuccess(data) {
      setImagesUrl(data);
    },
    onError(error) {
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
    if (!form.name || !form.basePrompt) {
      setError("Please select a style and enter a name or date.");
      return;
    }

    (window.dataLayer = window.dataLayer || []).push({
      event: "form_submission",
      designType: "PersonalizedGift", // Changed for tracking
      category: activeTab,
      subcategory: activeSubTab,
      styleImage: selectedImage || "none",
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
      numberOfVariants: parseInt(form.numberofImages, 10),
    });

    let finalPrompt = form.basePrompt.replace(/\[NAME\]/gi, form.name);
    finalPrompt += ", beautiful gift art, high resolution";

    generateIcon.mutate({
      prompt: finalPrompt,
      numberOfImages: parseInt(form.numberofImages, 10),
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
    });
  };

  const handleImageSelect = (basePrompt: string, src: string, allowColors = true) => {
    setSelectedImage(src);
    setForm((prev) => ({ ...prev, basePrompt }));
    setSelectedStyleImage(src);
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
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "personalized-gift-design.png";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error downloading the image:", error);
    }
  };

  const openPopup = (imageUrl: string) => {
    setPopupImage(imageUrl);
  };
  const closePopup = () => {
    setPopupImage(null);
  };

  return (
    <>
      <Head>
        {/* --- STRATEGIC CHANGE: Update page SEO --- */}
        <title>Personalized Gift Generator | Name Design AI</title>
        <meta
          name="description"
          content="Create a beautiful, personalized gift in seconds. Enter a name or date, choose from our curated gift styles, and generate unique art for any occasion."
        />
      </Head>
      <main className="container m-auto mb-24 flex flex-col px-8 py-8 max-w-screen-md">
        {/* --- STRATEGIC CHANGE: Update page copy --- */}
        <h1 className="text-4xl font-bold">Personalized Gift Generator</h1>
        <p className="text-1xl mt-4">
          Create a gift they&apos;ll truly cherish. Enter a special name, date, or word, then choose from our collection of beautiful, heartfelt styles to design the perfect one-of-a-kind present.
        </p>
        
        <form className="flex flex-col gap-3 mt-6" onSubmit={handleFormSubmit}>
          <h2 className="text-xl">1. Enter a Name, Date, or Special Word</h2>
          <FormGroup className="mb-12">
            <Input
              required
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., 'The Millers', 'Est. 2015', 'Sarah'"
            />
          </FormGroup>

          <h2 className="text-xl">2. Choose Your Favorite Gift Style</h2>
          <div className="mb-12">
            <div className="relative border-b mb-0 mt-4 flex items-center">
              {showLeftCategoryArrow && ( <button type="button" onClick={scrollCategoriesLeft} className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2 w-5 h-10 rounded-md bg-gray-700 text-white hover:bg-gray-200 border border-gray-300 shadow z-10 flex items-center justify-center" title="Scroll Left"><AiOutlineLeft className="text-xl" /></button>)}
              <div ref={categoryScrollRef} onScroll={handleCategoryScroll} className="flex overflow-x-auto whitespace-nowrap no-scrollbar flex-1">
                {Object.keys(giftStylesData ?? {}).map((catKey) => (
                  <button key={catKey} type="button" onClick={() => setActiveTab(catKey)} className={`px-4 py-2 ${activeTab === catKey ? "font-semibold border-b-2 border-blue-500 text-blue-500" : "font-semibold text-gray-500"}`}>
                    {catKey}
                  </button>
                ))}
              </div>
              {showRightCategoryArrow && ( <button type="button" onClick={scrollCategoriesRight} className="absolute right-[-1.5rem] top-1/2 -translate-y-1/2 w-5 h-10 rounded-md bg-gray-700 text-white hover:bg-gray-200 border border-gray-300 shadow z-10 flex items-center justify-center" title="Scroll Right"><AiOutlineRight className="text-xl" /></button>)}
            </div>

            <div className="relative border-b mb-4 mt-4 flex items-center">
              {showLeftSubCategoryArrow && ( <button type="button" onClick={scrollSubCategoriesLeft} className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2 w-5 h-10 rounded-md bg-gray-700 text-white hover:bg-gray-200 border border-gray-300 shadow z-10 flex items-center justify-center" title="Scroll Left"><AiOutlineLeft className="text-xl" /></button>)}
              <div ref={subcategoryScrollRef} onScroll={handleSubCategoryScroll} className="flex overflow-x-auto whitespace-nowrap no-scrollbar flex-1">
                {Object.keys(giftStylesData[activeTab] ?? {}).map((sub) => (
                  <button key={sub} type="button" onClick={() => setActiveSubTab(sub)} className={`px-4 py-2 ${activeSubTab === sub ? "text-sm border-b-2 border-blue-500 text-blue-500" : "text-sm text-gray-500"}`}>
                    {sub}
                  </button>
                ))}
              </div>
              {showRightSubCategoryArrow && ( <button type="button" onClick={scrollSubCategoriesRight} className="absolute right-[-1.5rem] top-1/2 -translate-y-1/2 w-5 h-10 rounded-md bg-gray-700 text-white hover:bg-gray-200 border border-gray-300 shadow z-10 flex items-center justify-center" title="Scroll Right"><AiOutlineRight className="text-xl" /></button>)}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(giftStylesData[activeTab]?.[activeSubTab] ?? []).map((item, idx) => {
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

          <h2 className="text-xl">3. Select AI Model</h2>
          <FormGroup className="mb-12">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
              {[
                { name: "Standard", value: "flux-schnell" as AIModel, cost: 1, image: selectedStyleImage && selectedStyleImage.includes(".") ? selectedStyleImage : "/images/placeholder.png", recommended: false },
                { name: "Optimized", value: "flux-dev" as AIModel, cost: 4, image: selectedStyleImage && selectedStyleImage.includes(".") ? selectedStyleImage.replace(/(\.[^.]+)$/, "e$1") : "/images/placeholder.png", recommended: true },
              ].map((model) => (
                <button key={model.value} type="button" onClick={() => setSelectedModel(model.value)} className={`relative flex flex-col items-center justify-center border rounded-lg p-4 transition ${selectedModel === model.value ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-300 hover:border-gray-500"}`}>
                  <div className="relative w-22 h-22 mb-2 overflow-hidden rounded"><img src={model.image} alt={model.name} className="w-full h-full object-cover" />{model.recommended && (<span className="absolute top-1 right-1 bg-yellow-400 text-black px-2 text-xs rounded">Recommended</span>)}</div>
                  <span className="text-sm font-semibold">{model.name}</span>
                  <span className="text-sm text-gray-500">Cost: {model.cost} credits</span>
                </button>
              ))}
            </div>
          </FormGroup>

          <h2 className="text-xl">4. Select Image Size</h2>
          <FormGroup className="mb-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {aspectRatios.map((ratio) => (
                <button key={ratio.value} type="button" onClick={() => setSelectedAspectRatio(ratio.value)} className={`relative flex items-center justify-center border rounded-lg p-4 transition ${selectedAspectRatio === ratio.value ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-300 hover:border-gray-500"}`}>
                  <div className={`w-full h-21 rounded-lg ${ratio.visual === "aspect-square" ? "aspect-[1/1]" : ratio.visual === "aspect-video" ? "aspect-[16/9]" : ratio.visual === "aspect-portrait" ? "aspect-[9/16]" : "aspect-[4/3]"} overflow-hidden flex items-center justify-center`} style={{ backgroundColor: "#ddd" }}>
                    <span className="text-gray-600 font-medium">{ratio.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </FormGroup>

          <h2 className="text-xl">5. How Many Designs You Want</h2>
          <FormGroup className="mb-12">
            <label htmlFor="numberofImages">Number of images</label>
            <Input required id="numberofImages" type="number" min={1} max={selectedModel === "ideogram-ai/ideogram-v2-turbo" ? 1 : 10} value={form.numberofImages} onChange={(e) => setForm((prev) => ({ ...prev, numberofImages: e.target.value }))} disabled={selectedModel === "ideogram-ai/ideogram-v2-turbo"} placeholder={selectedModel === "ideogram-ai/ideogram-v2-turbo" ? "1 (Fixed)" : "1-10"} />
          </FormGroup>

          {error && (
            <div className="bg-red-500 text-white rounded p-4 text-xl">
              {error}{" "}{error === "You do not have enough credits" && (<Link id="not-enough-credits-alert-btn" href="/buy-credits" className="underline font-bold ml-2">Buy Credits</Link>)}
            </div>
          )}

          <Button isLoading={generateIcon.isLoading} disabled={generateIcon.isLoading}>
            {isLoggedIn ? "Generate My Gift" : "Sign in to Generate"}
          </Button>
        </form>

        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-xl mt-8 mb-2">Your Beautiful Gift Is Ready!</h2>
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
              {imagesUrl.map(({ imageUrl }, index) => (
                <div key={index} className="relative rounded shadow-md hover:shadow-lg transition">
                  <div className="absolute top-0 right-0 flex gap-0 bg-black bg-opacity-30 rounded-bl-lg rounded-tr-md">
                    <button type="button" onClick={() => openPopup(imageUrl)} className="text-white hover:text-blue-300 p-2 focus:outline-none" title="View Fullscreen">🔍</button>
                    <button type="button" onClick={() => void handleDownload(imageUrl)} className="text-white hover:text-blue-300 p-2 focus:outline-none" title="Download">⬇️</button>
                    <button type="button" onClick={() => openShareModal(imageUrl)} className="text-white hover:text-blue-300 p-2 focus:outline-none" title="Share">📤</button>
                  </div>
                  <Image src={imageUrl} alt="Generated gift art" width={512} height={512} className="w-full rounded" />
                </div>
              ))}
            </section>
          </>
        )}

        {popupImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center" onClick={closePopup}>
            <div className="relative">
              <button type="button" onClick={closePopup} className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-200" title="Close">✖️</button>
              <img src={popupImage} alt="Fullscreen view" className="max-w-full max-h-screen rounded" />
            </div>
          </div>
        )}
        <ShareModal isOpen={shareModalData.isOpen} onClose={closeShareModal} imageUrl={shareModalData.imageUrl} />
      </main>
    </>
  );
};

export default PersonalizedGiftsGeneratorPage;