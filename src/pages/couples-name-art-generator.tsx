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
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import Link from "next/link";
import { ShareModal } from '~/component/ShareModal';

type AIModel = "flux-schnell" | "flux-dev" | "ideogram-ai/ideogram-v2-turbo";
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3";

const CouplesNameArtGeneratorPage: NextPage = () => {
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
    onSuccess: (data) => setImagesUrl(data),
    onError: (error) => { console.error(error); setError(error.message); },
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

  const openPopup = (imageUrl: string) => setPopupImage(imageUrl);
  const closePopup = () => setPopupImage(null);

  return (
    <>
      <Head>
        <title>Couples Name Art Generator | Name Design AI</title>
        <meta name="description" content="Create beautiful, romantic art with two names. Perfect for anniversaries, weddings, and gifts for your partner. Design your unique couples art in seconds." />
      </Head>
      <main className="container m-auto mb-24 flex flex-col px-8 py-8 max-w-screen-md">
        <h1 className="text-4xl font-bold">Couples Name Art Generator</h1>
        <p className="text-1xl mt-4">
          Celebrate your connection by turning both of your names into a single, beautiful work of art. Perfect for anniversaries, wedding gifts, or a special surprise for your partner.
        </p>
        
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
            <div className="relative border-b mb-0 mt-4 flex items-center">
                {/* ... Category Scroller JSX (no changes) ... */}
                <div ref={categoryScrollRef} onScroll={handleCategoryScroll} className="flex overflow-x-auto whitespace-nowrap no-scrollbar flex-1">
                    {Object.keys(coupleStylesData ?? {}).map((catKey) => (
                        <button key={catKey} type="button" onClick={() => setActiveTab(catKey)} className={`px-4 py-2 ${activeTab === catKey ? "font-semibold border-b-2 border-blue-500 text-blue-500" : "font-semibold text-gray-500"}`}>{catKey}</button>
                    ))}
                </div>
            </div>
            <div className="relative border-b mb-4 mt-4 flex items-center">
                {/* ... Subcategory Scroller JSX (no changes) ... */}
                <div ref={subcategoryScrollRef} onScroll={handleSubCategoryScroll} className="flex overflow-x-auto whitespace-nowrap no-scrollbar flex-1">
                    {Object.keys(coupleStylesData[activeTab] ?? {}).map((sub) => (
                        <button key={sub} type="button" onClick={() => setActiveSubTab(sub)} className={`px-4 py-2 ${activeSubTab === sub ? "text-sm border-b-2 border-blue-500 text-blue-500" : "text-sm text-gray-500"}`}>{sub}</button>
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

          {error && (<div className="bg-red-500 text-white rounded p-4 text-xl">{error}{" "}{error.includes("credits") && (<Link href="/buy-credits" className="underline font-bold ml-2">Buy Credits</Link>)}</div>)}

          <Button  isLoading={generateIcon.isLoading} disabled={generateIcon.isLoading}>{isLoggedIn ? "Generate Couples Art" : "Sign in to Generate"}</Button>
        </form>

        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-xl mt-8 mb-2">Your Beautiful Couples Art Is Ready!</h2>
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
              {imagesUrl.map(({ imageUrl }, index) => (
                <div key={index} className="relative rounded shadow-md hover:shadow-lg transition">
                    <div className="absolute top-0 right-0 flex gap-0 bg-black bg-opacity-30 rounded-bl-lg rounded-tr-md">
                        <button type="button" onClick={() => openPopup(imageUrl)} className="text-white hover:text-blue-300 p-2 focus:outline-none" title="View Fullscreen">🔍</button>
                        <button type="button" onClick={() => void handleDownload(imageUrl)} className="text-white hover:text-blue-300 p-2 focus:outline-none" title="Download">⬇️</button>
                        <button type="button" onClick={() => openShareModal(imageUrl)} className="text-white hover:text-blue-300 p-2 focus:outline-none" title="Share">📤</button>
                    </div>
                    <Image src={imageUrl} alt="Generated couples art" width={512} height={512} className="w-full rounded" unoptimized={true} />
                </div>
              ))}
            </section>
          </>
        )}

        {popupImage && (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center" onClick={closePopup}>
                <div className="relative"><button type="button" onClick={closePopup} className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-200" title="Close">✖️</button><img src={popupImage} alt="Fullscreen view" className="max-w-full max-h-screen rounded" /></div>
            </div>
        )}
        <ShareModal isOpen={shareModalData.isOpen} onClose={closeShareModal} imageUrl={shareModalData.imageUrl} />
      </main>
    </>
  );
};

export default CouplesNameArtGeneratorPage;