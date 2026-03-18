/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/pages/ar/arabic-name-art-generator.tsx

import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "~/component/Input";
import { arabicStylesData } from "../../data/arabicStylesData"; 
import { useSession, signIn } from "next-auth/react";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { useRouter } from "next/router";
import { ShareModal } from '~/component/ShareModal';
import Link from "next/link";
import { FiGlobe } from "react-icons/fi";
import { GENERATOR_PRODUCT_THUMBNAILS } from "~/config/generatorProductThumbnails";
import { buildPromptImageAlt } from "~/lib/styleImageAlt";

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

interface TypedArabicStylesData {
  [key: string]: SubCategory;
}

// Cast the imported data to the interface so TypeScript allows string indexing
const typedArabicStylesData: TypedArabicStylesData = arabicStylesData as TypedArabicStylesData;

type AIModel = "google/nano-banana-pro";
type AspectRatio = "1:1" | "4:5" | "3:2" | "16:9";
type SavedDesign = {
  imageUrl: string;
  prompt: string;
  model: AIModel;
  createdAt: string;
};

const LAST_DESIGN_STORAGE_KEY = "arabic-name-art:last-design:v1";

const ArabicNameArtGeneratorPageAr: NextPage = () => {
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
          setLeft(Math.abs(scrollLeft) > 10);
          setRight(Math.abs(scrollLeft) < scrollWidth - clientWidth - 10);
      }
  };

  useLayoutEffect(() => {
    handleScroll(categoryScrollRef, setShowLeftCategoryArrow, setShowRightCategoryArrow);
    handleScroll(subcategoryScrollRef, setShowLeftSubCategoryArrow, setShowRightSubCategoryArrow);
  }, [activeTab, activeSubTab]);

  const scrollCategories = (direction: 'left' | 'right') => {
      const scrollAmount = direction === 'left' ? 200 : -200;
      categoryScrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth"});
  };
  const scrollSubCategories = (direction: 'left' | 'right') => {
      const scrollAmount = direction === 'left' ? 200 : -200;
      subcategoryScrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth"});
  };

  const generateIcon = api.generate.generateIcon.useMutation({
    onSuccess: (data) => {
      setImagesUrl(data);
      const firstImageUrl = data?.[0]?.imageUrl;
      if (firstImageUrl) {
        const saved: SavedDesign = {
          imageUrl: firstImageUrl,
          prompt: form.basePrompt.replace(/'Text'/gi, form.name),
          model: selectedModel,
          createdAt: new Date().toISOString(),
        };
        try {
          window.localStorage.setItem(LAST_DESIGN_STORAGE_KEY, JSON.stringify(saved));
        } catch {
          // ignore storage errors
        }
      }
    },
    onError: (error) => setError(error.message),
  });

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn) { void signIn(); return; }
    if (!form.name || !form.basePrompt) {
      setError("الرجاء اختيار نمط وإدخال الاسم."); return;
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
    { label: "1:1", value: "1:1", visual: "aspect-square" },
    { label: "4:5", value: "4:5", visual: "aspect-45" },
    { label: "3:2", value: "3:2", visual: "aspect-32" },
    { label: "16:9", value: "16:9", visual: "aspect-video" },
  ];

  return (
    <>
      <Head>
        <title>مولد الخط العربي | زخرفة الأسماء</title>
        <meta name="description" content="صمم اسمك بالخط العربي وتصاميم إسلامية مذهلة باستخدام الذكاء الاصطناعي." />
      </Head>
      <main className="container m-auto mb-24 flex flex-col px-8 py-8 max-w-screen-md" dir="rtl">
        
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
            <Link href="/arabic-name-art-generator">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 border border-gray-300 rounded-full shadow-sm hover:border-blue-700 hover:text-white transition-all" dir="ltr">
                    <FiGlobe className="text-lg" /> 
                    <span className="font-medium">English</span>
                </button>
            </Link>
        </div>

        <h1 className="text-4xl font-bold text-center">مولد الخط العربي</h1>
        <p className="text-lg mt-4 text-center text-gray-600">حول اسمك إلى لوحة فنية بالخط العربي في ثوانٍ.</p>
        
        <form className="flex flex-col gap-6 mt-8" onSubmit={handleFormSubmit}>
          
          {/* 1. Enter Name */}
          <FormGroup>
            <label className="text-xl font-semibold mb-2 block">1. أدخل الاسم</label>
            <Input 
                required 
                value={form.name} 
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} 
                placeholder="أدخل الاسم هنا (مثال: محمد أو Muhammad)" 
                className="text-right" 
            />
          </FormGroup>

          {/* 2. Choose Style */}
          <div>
            <h2 className="text-xl font-semibold mb-4">2. اختر نمط الخط</h2>
            <div className="relative border-b dark:border-gray-700">
              {showLeftCategoryArrow && <button type="button" onClick={() => scrollCategories('right')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineLeft className="h-5 w-5"/></button>}
              <div ref={categoryScrollRef} onScroll={() => handleScroll(categoryScrollRef, setShowLeftCategoryArrow, setShowRightCategoryArrow)} className="flex overflow-x-auto no-scrollbar flex-row-reverse">
                {Object.keys(typedArabicStylesData).map((catKey) => (
                  <button key={catKey} type="button" onClick={() => { setActiveTab(catKey); setActiveSubTab(Object.keys(typedArabicStylesData[catKey]!)[0]!); }} className={`px-4 py-2 whitespace-nowrap font-semibold ml-2 ${activeTab === catKey ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}`}>
                    {catKey}
                  </button>
                ))}
              </div>
              {showRightCategoryArrow && <button type="button" onClick={() => scrollCategories('left')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineRight className="h-5 w-5"/></button>}
            </div>

            <div className="relative mt-4">
              {showLeftSubCategoryArrow && <button type="button" onClick={() => scrollSubCategories('right')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineLeft className="h-5 w-5"/></button>}
              <div ref={subcategoryScrollRef} onScroll={() => handleScroll(subcategoryScrollRef, setShowLeftSubCategoryArrow, setShowRightSubCategoryArrow)} className="flex overflow-x-auto no-scrollbar flex-row-reverse">
                {Object.keys(typedArabicStylesData[activeTab] ?? {}).map((sub) => (
                  <button key={sub} type="button" id={sub} onClick={() => setActiveSubTab(sub)} className={`px-3 py-1.5 whitespace-nowrap text-sm rounded-full ml-2 ${activeSubTab === sub ? 'bg-blue-500 text-white font-semibold' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                    {sub}
                  </button>
                ))}
              </div>
              {showRightSubCategoryArrow && <button type="button" onClick={() => scrollSubCategories('left')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineRight className="h-5 w-5"/></button>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4" dir="rtl">
              {(typedArabicStylesData[activeTab]?.[activeSubTab] ?? []).map((item, idx) => (
                  <div key={idx} className={`relative group cursor-pointer overflow-hidden rounded-lg shadow-md transition-all duration-200 hover:shadow-xl ${selectedImage === item.src ? "ring-4 ring-offset-2 ring-blue-500" : ""}`} onClick={() => handleImageSelect(item.basePrompt, item.src)}>
                    <Image
                      src={item.src}
                      alt={item.altText}
                      width={200}
                      height={200}
                      className="w-full h-auto aspect-square object-cover"
                    />
                    <button type="button" onClick={(e) => { e.stopPropagation(); openPopup(item.src); }} className="absolute top-1 left-1 bg-black bg-opacity-40 text-white rounded-full p-1 text-xs hover:bg-opacity-60">🔍</button>
                    <div className="p-2 text-center text-xs font-medium truncate">{item.name}</div>
                  </div>
              ))}
            </div>
          </div>

          {/* 3. Select Image Size */}
          <h2 className="text-xl mt-6 mb-2">3. اختر حجم الصورة</h2>
          <FormGroup className="mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {aspectRatios.map((ratio) => {
                const aspectClass =
                  ratio.visual === "aspect-square" ? "aspect-[1/1]" : 
                  ratio.visual === "aspect-45" ? "aspect-[4/5]" : 
                  ratio.visual === "aspect-32" ? "aspect-[3/2]" : 
                  ratio.visual === "aspect-video" ? "aspect-[16/9]" : 
                  "aspect-[1/1]";
                return (
                  <button
                    key={ratio.value}
                    type="button"
                    onClick={() => setSelectedAspectRatio(ratio.value)}
                    className={`relative flex items-center justify-center border rounded-lg p-4 transition ${selectedAspectRatio === ratio.value ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-300 hover:border-gray-500"}`}
                  >
                    <div className={`w-full h-21 rounded-lg ${aspectClass} overflow-hidden flex items-center justify-center`} style={{ backgroundColor: "#ddd" }}>
                      <span className="text-gray-600 font-medium">{ratio.label.split(' ')[0]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </FormGroup>

          {error && (
            <div className="bg-red-500 text-white rounded p-4 text-xl mb-6">
              {error} {error.includes("credits") && <Link href="/buy-credits" className="underline font-bold ml-2">شراء رصيد</Link>}
            </div>
          )}
          
          <Button isLoading={generateIcon.isLoading} disabled={generateIcon.isLoading}>
            {isLoggedIn ? "توليد (4 نقاط)" : "سجل الدخول للتوليد"}
          </Button>
        </form>
        
        {/* Results */}
        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-2xl mt-12 mb-4 text-center">تصاميمك الفنية</h2>
            <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
              {imagesUrl.map(({ imageUrl }, index) => (
                <div key={index} className="relative rounded-lg shadow-lg overflow-hidden group">
                  <div className="absolute top-0 right-0 z-10 flex bg-black/50 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => openPopup(imageUrl)} className="p-2 text-white hover:text-blue-300" title="عرض">🔍</button>
                    <button type="button" onClick={() => void handleDownload(imageUrl)} className="p-2 text-white hover:text-green-300" title="تحميل">⬇️</button>
                    <button type="button" onClick={() => openShareModal(imageUrl)} className="p-2 text-white hover:text-pink-300" title="مشاركة">📤</button>
                  </div>
                  <Image
                    src={imageUrl}
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
                    className="w-full h-auto"
                  />
                </div>
              ))}
            </section>
            <section className="mt-10">
              <h3 className="text-2xl font-semibold mb-6 text-center">
                Turn your design into a real product
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {GENERATOR_PRODUCT_THUMBNAILS.arabic.map((p) => (
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {p.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* POPUP */}
        {popupImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4" onClick={closePopup}>
            <div className="relative max-w-4xl w-full">
                <button onClick={closePopup} className="absolute -top-10 left-0 text-white text-3xl">&times;</button>
                <img src={popupImage} alt="Fullscreen" className="w-full h-auto rounded-lg" />
            </div>
          </div>
        )}
        <ShareModal isOpen={shareModalData.isOpen} onClose={closeShareModal} imageUrl={shareModalData.imageUrl} />
      </main>
    </>
  );
};
export default ArabicNameArtGeneratorPageAr;
