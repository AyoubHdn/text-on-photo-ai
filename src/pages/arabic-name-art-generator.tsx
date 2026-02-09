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
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { useRouter } from "next/router";
import { ShareModal } from '~/component/ShareModal';
import Link from "next/link";
import { FiGlobe } from "react-icons/fi";

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
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3";

const ArabicNameArtGeneratorPage: NextPage = () => {
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

  const scrollCategories = (direction: 'left' | 'right') => {
      categoryScrollRef.current?.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: "smooth"});
  };
  const scrollSubCategories = (direction: 'left' | 'right') => {
      subcategoryScrollRef.current?.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: "smooth"});
  };

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
  const openPopup = (imageUrl: string) => setPopupImage(imageUrl);
  const closePopup = () => setPopupImage(null);
  const openShareModal = (imageUrl: string) => setShareModalData({ isOpen: true, imageUrl });
  const closeShareModal = () => setShareModalData({ isOpen: false, imageUrl: null });

  const aspectRatios: { label: string; value: AspectRatio; visual: string }[] = [
    { label: "Square (1:1)", value: "1:1", visual: "aspect-square" },
    { label: "Landscape (16:9)", value: "16:9", visual: "aspect-video" },
    { label: "Portrait (9:16)", value: "9:16", visual: "aspect-portrait" },
    { label: "Classic (4:3)", value: "4:3", visual: "aspect-classic" },
  ];

  return (
    <>
      <Head>
        <title>Arabic Name Art Generator | AI Calligraphy</title>
        <meta name="description" content="Generate stunning Arabic calligraphy and Islamic name art using AI." />
      </Head>
      <main className="container m-auto mb-24 flex flex-col px-8 py-8 max-w-screen-md">
        
        {/* Language Switcher - Made more visible */}
        <div className="flex justify-end mb-4">
            <Link href="/ar/arabic-name-art-generator">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 border border-gray-300 rounded-full shadow-sm hover:border-blue-700 hover:text-white transition-all">
                    <FiGlobe className="text-lg" /> 
                    <span className="font-medium">العربية</span>
                </button>
            </Link>
        </div>

        <h1 className="text-4xl font-bold text-center">Arabic Name Art Generator</h1>
        <p className="text-lg mt-4 text-center text-gray-600">Transform your name into an Arabic calligraphy masterpiece.</p>
        
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
                const aspectClass =
                  ratio.visual === "aspect-square" ? "aspect-[1/1]" : 
                  ratio.visual === "aspect-video" ? "aspect-[16/9]" : 
                  ratio.visual === "aspect-portrait" ? "aspect-[9/16]" : 
                  "aspect-[4/3]";
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
                      <span className="text-gray-600 font-medium">{ratio.label}</span>
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
            {isLoggedIn ? "Generate Calligraphy (4 Credits)" : "Sign in to Generate"}
          </Button>
        </form>
        
        {/* Results Section */}
        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-xl mt-8 mb-2 text-center">Your Arabic Masterpieces</h2>
            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
              {imagesUrl.map(({ imageUrl }, index) => (
                <div key={index} className="relative rounded shadow-md hover:shadow-lg transition group">
                  <div className="absolute top-0 right-0 flex gap-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-bl-md">
                    <button type="button" onClick={() => openPopup(imageUrl)} className="p-2 text-white hover:text-blue-300" title="View">🔍</button>
                    <button type="button" onClick={() => void handleDownload(imageUrl)} className="p-2 text-white hover:text-green-300" title="Download">⬇️</button>
                    <button type="button" onClick={() => openShareModal(imageUrl)} className="p-2 text-white hover:text-pink-300" title="Share">📤</button>
                  </div>
                  <Image src={imageUrl} alt="Arabic Art" width={512} height={512} className="w-full rounded" />
                </div>
              ))}
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
      </main>
    </>
  );
};
export default ArabicNameArtGeneratorPage;
