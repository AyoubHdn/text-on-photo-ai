// pages/name-art-generator.tsx
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "~/component/Input";
import { stylesData } from "~/data/stylesData";
import { useSession, signIn } from "next-auth/react";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { useRouter } from "next/router";
import { ShareModal } from '~/component/ShareModal';
import Link from "next/link";

type AIModel = "flux-schnell" | "flux-dev" | "ideogram-ai/ideogram-v2-turbo";
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3";

const NameArtGeneratorPage: NextPage = () => {
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
  const [shareModalData, setShareModalData] = useState<{ isOpen: boolean; imageUrl: string | null }>({ isOpen: false, imageUrl: null });

  // --- START: THE FINAL, DEFINITIVE INITIALIZATION LOGIC ---
  useEffect(() => {
    if (!router.isReady) return; // Wait until the router is fully initialized

    const { name } = router.query;
    const hash = window.location.hash.substring(1); // e.g., "Vintage"

    // 1. Pre-fill the name field if it exists in the URL
    if (typeof name === 'string' && name) {
      setForm(prev => ({ ...prev, name }));
    }

    let hashFoundAndSet = false;

    // 2. Handle the jump link if a hash exists
    if (hash) {
      // Loop through each main category (e.g., "Themes", "Artistic")
      for (const mainCategory in stylesData) {
        const subcategories = stylesData[mainCategory];
        if (subcategories && Object.keys(subcategories).includes(hash)) {
          console.log(`[DEBUG] Jump link found! Setting tabs to: ${mainCategory} -> ${hash}`);
          setActiveTab(mainCategory);
          setActiveSubTab(hash);
          hashFoundAndSet = true;
          
          setTimeout(() => {
            const element = document.getElementById(hash);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          }, 150);

          break; // Exit the loop once we've found the match
        }
      }
    }

    // 3. If no hash was found or provided, set the default state
    if (!hashFoundAndSet) {
      const firstCategory = Object.keys(stylesData)[0];
      if (firstCategory) {
        setActiveTab(firstCategory);
        const firstSubCategory = Object.keys(stylesData[firstCategory]!)?.[0];
        if (firstSubCategory) {
          setActiveSubTab(firstSubCategory);
        }
      }
    }
  }, [router.isReady, router.query]);
  // --- END: THE FINAL, DEFINITIVE INITIALIZATION LOGIC ---

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

  const generateIcon = api.generate.generateIcon.useMutation({
    onSuccess: (data) => setImagesUrl(data),
    onError: (error) => setError(error.message),
  });

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn) { void signIn(); return; }
    if (!form.name || !form.basePrompt) {
      setError("Please select a style and enter a name."); return;
    }
    
    let finalPrompt = form.basePrompt.replace(/'Text'/gi, form.name);
    finalPrompt += " designed to cover the entire screen, high resolution";

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
  
  const aspectRatios: { label: string; value: AspectRatio; visual: string }[] = [
    { label: "1:1", value: "1:1", visual: "aspect-square" },
    { label: "16:9", value: "16:9", visual: "aspect-video" },
    { label: "9:16", value: "9:16", visual: "aspect-portrait" },
    { label: "4:3", value: "4:3", visual: "aspect-classic" },
  ];

  return (
    <>
      <Head>
        <title>Name Art Generator | Name Design AI</title>
      </Head>
      <main className="container m-auto mb-24 flex flex-col px-8 py-8 max-w-screen-md">
        <h1 className="text-4xl font-bold">Name Art Generator: Create Personalized Designs</h1>
        <p className="text-lg mt-4">Unleash your creativity with our Name Art Generator! ...</p>
        
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
                  <button key={catKey} type="button" onClick={() => { setActiveTab(catKey); setActiveSubTab(Object.keys(stylesData[catKey]!)[0]!); }} className={`px-4 py-2 whitespace-nowrap font-semibold ${activeTab === catKey ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}`}>
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
                  <button key={sub} type="button" id={sub} onClick={() => setActiveSubTab(sub)} className={`px-3 py-1.5 whitespace-nowrap text-sm rounded-full ${activeSubTab === sub ? 'bg-blue-500 text-white font-semibold' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                    {sub}
                  </button>
                ))}
              </div>
              {showRightSubCategoryArrow && <button type="button" onClick={() => scrollSubCategories('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineRight className="h-5 w-5"/></button>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
              {(stylesData[activeTab]?.[activeSubTab] ?? []).map((item, idx) => (
                  <div key={idx} className={`relative group cursor-pointer overflow-hidden rounded-lg shadow-md transition-all duration-200 hover:shadow-xl ${selectedImage === item.src ? "ring-4 ring-offset-2 ring-blue-500" : ""}`} onClick={() => handleImageSelect(item.basePrompt, item.src, item.allowCustomColors)}>
                    <Image src={item.src.replace(/\.webp$/, "e.webp")} alt={item.basePrompt} width={200} height={200} className="w-full h-auto aspect-square object-cover"/>
                    <button type="button" onClick={(e) => { e.stopPropagation(); openPopup(item.src.replace(/\.webp$/, "e.webp")); }} className="absolute top-1 right-1 bg-black bg-opacity-40 text-white rounded-full p-1 text-xs hover:bg-opacity-60" aria-label="View Fullscreen">🔍</button>
                  </div>
              ))}
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
                  cost: 4,
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
                const aspectClass =
                  ratio.visual === "aspect-square"
                    ? "aspect-[1/1]"
                    : ratio.visual === "aspect-video"
                    ? "aspect-[16/9]"
                    : ratio.visual === "aspect-portrait"
                    ? "aspect-[9/16]"
                    : ratio.visual === "aspect-classic"
                    ? "aspect-[4/3]"
                    : "";
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
                      <span className="text-gray-600 font-medium">{ratio.label}</span>
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

          {error && (
            <div className="bg-red-500 text-white rounded p-4 text-xl">
              {error}{" "}
              {error === "You do not have enough credits" && (
                <Link
                  id="not-enough-credits-alert-btn"
                  href="/buy-credits"
                  className="underline font-bold ml-2"
                >
                  Buy Credits
                </Link>
              )}
            </div>
          )}
          
          <Button isLoading={generateIcon.isLoading} disabled={generateIcon.isLoading}>
            {isLoggedIn ? "Generate" : "Sign in to Generate"}
          </Button>
        </form>
        
        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-xl mt-8 mb-2">Your Custom Name Art</h2>
            <section className="grid grid-cols-4 gap-4 mb-12">
              {imagesUrl.map(({ imageUrl }, index) => (
                <div
                  key={index}
                  className="relative rounded shadow-md hover:shadow-lg transition"
                >
                  <div className="absolute top-0 right-0 flex gap-0">
                    <button
                      type="button"
                      onClick={() => openPopup(imageUrl)}
                      className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none"
                      title="View Fullscreen"
                      aria-label="View Fullscreen"
                    >
                      🔍
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDownload(imageUrl)}
                      className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none"
                      title="Download"
                      aria-label="Download"
                    >
                      ⬇️
                    </button>
                    <button
                      type="button"
                      onClick={() => openShareModal(imageUrl)} // This now opens the modal
                      className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none p-2"
                      title="Share"
                      aria-label="Share"
                    >
                      📤
                    </button>
                  </div>
                  <Image
                    src={imageUrl}
                    alt="Generated output"
                    width={512}
                    height={512}
                    className="w-full rounded"
                  />
                </div>
              ))}
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
      </main>
    </>
  );
};
export default NameArtGeneratorPage;