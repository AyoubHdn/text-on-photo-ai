/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { FiGlobe } from "react-icons/fi";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Button } from "~/component/Button";
import { CreditUpgradeModal } from "~/component/Credits/CreditUpgradeModal";
import { FormGroup } from "~/component/FormGroup";
import { Input } from "~/component/Input";
import { ShareModal } from "~/component/ShareModal";
import {
  ARABIC_GENERATOR_SOURCE_PAGE,
  ARABIC_GENERATOR_TIERS,
  type ArabicGeneratorModel,
} from "~/config/arabicGenerator";
import { GENERATOR_PRODUCT_THUMBNAILS } from "~/config/generatorProductThumbnails";
import { arabicStylesData } from "~/data/arabicStylesData";
import { buildPromptImageAlt } from "~/lib/styleImageAlt";
import { api } from "~/utils/api";

interface StyleItem {
  src: string;
  name: string;
  basePrompt: string;
  altText: string;
}

interface SubCategory {
  [key: string]: StyleItem[];
}

type TypedArabicStylesData = Record<string, SubCategory>;
type AspectRatio = "1:1" | "4:5" | "3:2" | "16:9";
type SavedDesign = {
  imageUrl: string;
  prompt: string;
  model: ArabicGeneratorModel;
  createdAt: string;
};

const typedArabicStylesData =
  arabicStylesData as unknown as TypedArabicStylesData;
const LAST_DESIGN_STORAGE_KEY = "arabic-name-art:last-design:v1";
const DIGITAL_ART_INTENT_STORAGE_KEY = "digital-art-interest:intent";
const MODEL_CREDITS: Record<ArabicGeneratorModel, number> = {
  "google/nano-banana-2": 3,
  "google/nano-banana-pro": 6,
};

const ArabicNameArtGeneratorPageAr: NextPage = () => {
  const SOURCE_PAGE = ARABIC_GENERATOR_SOURCE_PAGE;
  const { data: session } = useSession();
  const isLoggedIn = !!session;
  const router = useRouter();

  const [form, setForm] = useState({ name: "", basePrompt: "" });
  const [error, setError] = useState("");
  const [imagesUrl, setImagesUrl] = useState<{ imageUrl: string }[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [popupImage, setPopupImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("");
  const [selectedModel, setSelectedModel] =
    useState<ArabicGeneratorModel>("google/nano-banana-2");
  const [selectedAspectRatio, setSelectedAspectRatio] =
    useState<AspectRatio>("1:1");
  const [creditUpgradeOpen, setCreditUpgradeOpen] = useState(false);
  const [creditUpgradeRequired, setCreditUpgradeRequired] = useState(0);
  const [shareModalData, setShareModalData] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
  }>({ isOpen: false, imageUrl: null });
  const pendingCreditActionRef = useRef<null | (() => void)>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const subcategoryScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftCategoryArrow, setShowLeftCategoryArrow] = useState(false);
  const [showRightCategoryArrow, setShowRightCategoryArrow] = useState(false);
  const [showLeftSubCategoryArrow, setShowLeftSubCategoryArrow] =
    useState(false);
  const [showRightSubCategoryArrow, setShowRightSubCategoryArrow] =
    useState(false);
  const creditsQuery = api.user.getCredits.useQuery(undefined, {
    enabled: isLoggedIn,
  });
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

  const selectedTier =
    ARABIC_GENERATOR_TIERS.find((tier) => tier.model === selectedModel) ??
    ARABIC_GENERATOR_TIERS[0];

  useEffect(() => {
    if (imagesUrl.length > 0) return;
    try {
      const raw = window.localStorage.getItem(LAST_DESIGN_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedDesign;
      if (parsed?.imageUrl) {
        setImagesUrl([{ imageUrl: parsed.imageUrl }]);
        setSelectedModel(parsed.model ?? "google/nano-banana-2");
      }
    } catch {
      // ignore invalid cache
    }
  }, [imagesUrl.length]);

  useEffect(() => {
    if (!router.isReady) return;
    const { name } = router.query;
    if (typeof name === "string" && name) {
      setForm((prev) => ({ ...prev, name }));
    }
    const firstCategory = Object.keys(typedArabicStylesData)[0];
    if (!firstCategory) return;
    setActiveTab(firstCategory);
    const firstSubCategory = Object.keys(typedArabicStylesData[firstCategory]!)[0];
    if (firstSubCategory) setActiveSubTab(firstSubCategory);
  }, [router.isReady, router.query]);

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

  const handleScroll = (
    ref: React.RefObject<HTMLDivElement>,
    setLeft: (value: boolean) => void,
    setRight: (value: boolean) => void,
  ) => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    setLeft(Math.abs(scrollLeft) > 10);
    setRight(Math.abs(scrollLeft) < scrollWidth - clientWidth - 10);
  };

  useLayoutEffect(() => {
    handleScroll(categoryScrollRef, setShowLeftCategoryArrow, setShowRightCategoryArrow);
    handleScroll(
      subcategoryScrollRef,
      setShowLeftSubCategoryArrow,
      setShowRightSubCategoryArrow,
    );
  }, [activeTab, activeSubTab]);

  const scrollCategories = (direction: "left" | "right") => {
    const scrollAmount = direction === "left" ? 200 : -200;
    categoryScrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const scrollSubCategories = (direction: "left" | "right") => {
    const scrollAmount = direction === "left" ? 200 : -200;
    subcategoryScrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const openCreditUpgrade = (requiredCredits: number, retryAction: () => void) => {
    pendingCreditActionRef.current = retryAction;
    setCreditUpgradeRequired(requiredCredits);
    setCreditUpgradeOpen(true);
  };

  const startGeneratorSignIn = () => {
    try {
      window.localStorage.setItem(DIGITAL_ART_INTENT_STORAGE_KEY, SOURCE_PAGE);
    } catch {
      // ignore storage errors
    }
    void signIn(undefined, { callbackUrl: router.asPath });
  };

  const generateIcon = api.generate.generateIcon.useMutation({
    onSuccess: (data) => {
      setImagesUrl(data);
      const firstImageUrl = data?.[0]?.imageUrl;
      if (firstImageUrl) {
        try {
          window.localStorage.setItem(
            LAST_DESIGN_STORAGE_KEY,
            JSON.stringify({
              imageUrl: firstImageUrl,
              prompt: form.basePrompt.replace(/'Text'/gi, form.name),
              model: selectedModel,
              createdAt: new Date().toISOString(),
            } satisfies SavedDesign),
          );
        } catch {
          // ignore storage errors
        }
      }
    },
    onError: (mutationError) => {
      if (mutationError.message.toLowerCase().includes("enough credits")) {
        setError("");
        openCreditUpgrade(MODEL_CREDITS[selectedModel], () => {
          void submitGeneration();
        });
        return;
      }
      setError(mutationError.message);
    },
  });

  const submitGeneration = async () => {
    let finalPrompt = form.basePrompt.replace(/'Text'/gi, `'${form.name}'`);
    if (!finalPrompt.toLowerCase().includes("arabic")) {
      finalPrompt += ", arabic calligraphy masterpiece, 8k resolution";
    }

    generateIcon.mutate({
      prompt: finalPrompt,
      numberOfImages: 1,
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
      sourcePage: SOURCE_PAGE,
      metadata: {
        category: activeTab || undefined,
        subcategory: activeSubTab || undefined,
      },
    });
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn) {
      startGeneratorSignIn();
      return;
    }
    if (!form.name || !form.basePrompt) {
      setError("الرجاء اختيار نمط وإدخال الاسم.");
      return;
    }
    void submitGeneration();
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
      if (!context) return;
      context.drawImage(imageBitmap, 0, 0);
      const pngBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!pngBlob) return;
      const blobUrl = window.URL.createObjectURL(pngBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "arabic-name-art.png";
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      console.error("Error downloading:", downloadError);
    }
  };

  const openPopup = (imageUrl: string) => setPopupImage(imageUrl);
  const closePopup = () => setPopupImage(null);
  const openShareModal = (imageUrl: string) =>
    setShareModalData({ isOpen: true, imageUrl });
  const closeShareModal = () =>
    setShareModalData({ isOpen: false, imageUrl: null });

  const aspectRatios: { label: string; value: AspectRatio; visual: string }[] = [
    { label: "1:1", value: "1:1", visual: "aspect-[1/1]" },
    { label: "4:5", value: "4:5", visual: "aspect-[4/5]" },
    { label: "3:2", value: "3:2", visual: "aspect-[3/2]" },
    { label: "16:9", value: "16:9", visual: "aspect-[16/9]" },
  ];

  return (
    <>
      <Head>
        <title>مولد الخط العربي | زخرفة الأسماء</title>
        <meta
          name="description"
          content="صمم اسمك بالخط العربي بتجربتين: عادية وبريميوم، مع إمكانية الحصول على 3 نقاط مجانية عبر الاستبيان."
        />
      </Head>
      <main className="container m-auto mb-24 flex max-w-screen-md flex-col px-8 py-8" dir="rtl">
        <div className="mb-4 flex justify-end">
          <Link href="/arabic-name-art-generator">
            <button className="flex items-center gap-2 rounded-full border border-gray-300 bg-blue-500 px-4 py-2 shadow-sm transition-all hover:border-blue-700 hover:text-white" dir="ltr">
              <FiGlobe className="text-lg" />
              <span className="font-medium">English</span>
            </button>
          </Link>
        </div>

        <h1 className="text-center text-4xl font-bold">مولد الخط العربي</h1>
        <p className="mt-4 text-center text-lg text-gray-600">
          حوّل اسمك إلى لوحة فنية عربية مع خيار عادي أو بريميوم.
        </p>

        <form className="mt-8 flex flex-col gap-6" onSubmit={handleFormSubmit}>
          <FormGroup>
            <label className="mb-2 block text-xl font-semibold">1. أدخل الاسم</label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="أدخل الاسم هنا"
              className="text-right"
            />
          </FormGroup>

          <div>
            <h2 className="mb-4 text-xl font-semibold">2. اختر النمط</h2>
            <div className="relative border-b dark:border-gray-700">
              {showLeftCategoryArrow && (
                <button type="button" onClick={() => scrollCategories("right")} className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1 shadow-md dark:border-gray-600 dark:bg-gray-700">
                  <AiOutlineLeft className="h-5 w-5" />
                </button>
              )}
              <div ref={categoryScrollRef} onScroll={() => handleScroll(categoryScrollRef, setShowLeftCategoryArrow, setShowRightCategoryArrow)} className="flex flex-row-reverse overflow-x-auto no-scrollbar">
                {Object.keys(typedArabicStylesData).map((catKey) => (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      setActiveTab(catKey);
                      setActiveSubTab(Object.keys(typedArabicStylesData[catKey]!)[0]!);
                    }}
                    className={`ml-2 whitespace-nowrap px-4 py-2 font-semibold ${
                      activeTab === catKey
                        ? "border-b-2 border-blue-500 text-blue-500"
                        : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    {catKey}
                  </button>
                ))}
              </div>
              {showRightCategoryArrow && (
                <button type="button" onClick={() => scrollCategories("left")} className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1 shadow-md dark:border-gray-600 dark:bg-gray-700">
                  <AiOutlineRight className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="relative mt-4">
              {showLeftSubCategoryArrow && (
                <button type="button" onClick={() => scrollSubCategories("right")} className="absolute -left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1 shadow-md dark:border-gray-600 dark:bg-gray-700">
                  <AiOutlineLeft className="h-5 w-5" />
                </button>
              )}
              <div ref={subcategoryScrollRef} onScroll={() => handleScroll(subcategoryScrollRef, setShowLeftSubCategoryArrow, setShowRightSubCategoryArrow)} className="flex flex-row-reverse overflow-x-auto no-scrollbar">
                {Object.keys(typedArabicStylesData[activeTab] ?? {}).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setActiveSubTab(sub)}
                    className={`ml-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
                      activeSubTab === sub
                        ? "bg-blue-500 font-semibold text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
              {showRightSubCategoryArrow && (
                <button type="button" onClick={() => scrollSubCategories("left")} className="absolute -right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1 shadow-md dark:border-gray-600 dark:bg-gray-700">
                  <AiOutlineRight className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" dir="rtl">
              {(typedArabicStylesData[activeTab]?.[activeSubTab] ?? []).map((item, idx) => (
                <div
                  key={idx}
                  className={`cursor-pointer overflow-hidden rounded-lg shadow-md transition-all duration-200 hover:shadow-xl ${
                    selectedImage === item.src ? "ring-4 ring-blue-500 ring-offset-2" : ""
                  }`}
                  onClick={() => handleImageSelect(item.basePrompt, item.src)}
                >
                  <Image src={item.src} alt={item.altText} width={200} height={200} className="aspect-square h-auto w-full object-cover" />
                  <div className="truncate p-2 text-center text-xs font-medium">{item.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">3. اختر الجودة</h2>
            <div className="grid gap-4 sm:grid-cols-2" dir="ltr">
              {ARABIC_GENERATOR_TIERS.map((tier) => (
                <button
                  key={tier.model}
                  type="button"
                  onClick={() => setSelectedModel(tier.model)}
                  className={`rounded-xl border p-4 text-left transition ${
                    selectedModel === tier.model
                      ? "border-blue-500 ring-2 ring-blue-500"
                      : "border-gray-300 hover:border-gray-500"
                  }`}
                >
                  <div className="text-base font-semibold">{tier.label}</div>
                  <div className="mt-1 text-sm text-gray-500">{tier.description}</div>
                  <div className="mt-3 text-sm font-medium text-blue-600">{tier.credits} credits</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-xl">4. اختر حجم الصورة</h2>
            <FormGroup className="mb-8">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {aspectRatios.map((ratio) => (
                  <button
                    key={ratio.value}
                    type="button"
                    onClick={() => setSelectedAspectRatio(ratio.value)}
                    className={`rounded-lg border p-4 transition ${
                      selectedAspectRatio === ratio.value
                        ? "border-blue-500 ring-2 ring-blue-500"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    <div className={`flex h-20 w-full items-center justify-center rounded-lg ${ratio.visual}`} style={{ backgroundColor: "#ddd" }}>
                      <span className="font-medium text-gray-600">{ratio.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </FormGroup>
          </div>

          {error && (
            <div className="mb-6 rounded bg-red-500 p-4 text-xl text-white">
              {error}
            </div>
          )}

          <Button
            type={isLoggedIn ? "submit" : "button"}
            onClick={!isLoggedIn ? startGeneratorSignIn : undefined}
            isLoading={generateIcon.isLoading}
            disabled={generateIcon.isLoading}
          >
            {isLoggedIn
              ? `توليد (${selectedTier.credits} نقاط)`
              : "سجل الدخول للتوليد"}
          </Button>
        </form>

        {imagesUrl.length > 0 && (
          <>
            <h2 className="mb-4 mt-12 text-center text-2xl">تصاميمك الفنية</h2>
            <section className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {imagesUrl.map(({ imageUrl }, index) => (
                <div key={index} className="group relative overflow-hidden rounded-lg shadow-lg">
                  <div className="absolute right-0 top-0 z-10 flex rounded-bl-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={() => openPopup(imageUrl)} className="p-2 text-white hover:text-blue-300" title="عرض">
                      🔍
                    </button>
                    <button type="button" onClick={() => void handleDownload(imageUrl)} className="p-2 text-white hover:text-green-300" title="تحميل">
                      ⬇️
                    </button>
                    <button type="button" onClick={() => openShareModal(imageUrl)} className="p-2 text-white hover:text-pink-300" title="مشاركة">
                      📨
                    </button>
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
                    className="h-auto w-full"
                  />
                </div>
              ))}
            </section>

            {selectedModel === "google/nano-banana-2" && (
              <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                هل تريد نتيجة أغنى بالتفاصيل؟ جرّب <strong>Premium Arabic</strong> بـ 6 نقاط.
              </div>
            )}

            <section className="mt-10">
              <h3 className="mb-6 text-center text-2xl font-semibold">
                Turn your design into a real product
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {GENERATOR_PRODUCT_THUMBNAILS.arabic.map((p) => (
                  <div key={p.key} className="group relative overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-lg dark:bg-gray-900">
                    <div className="relative h-44 bg-gray-100 dark:bg-gray-800">
                      <img src={p.image} alt={p.label} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <div className="p-4 text-center">
                      <h4 className="mb-1 text-lg font-semibold">{p.label}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {popupImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4" onClick={closePopup}>
            <div className="relative w-full max-w-4xl">
              <button onClick={closePopup} className="absolute -top-10 left-0 text-3xl text-white">
                &times;
              </button>
              <img src={popupImage} alt="Fullscreen" className="h-auto w-full rounded-lg" />
            </div>
          </div>
        )}

        <ShareModal
          isOpen={shareModalData.isOpen}
          onClose={closeShareModal}
          imageUrl={shareModalData.imageUrl}
        />
        <CreditUpgradeModal
          isOpen={creditUpgradeOpen}
          requiredCredits={creditUpgradeRequired}
          currentCredits={creditsQuery.data ?? 0}
          context="generate"
          sourcePage={SOURCE_PAGE}
          onClose={() => setCreditUpgradeOpen(false)}
          onSuccess={() => {
            setCreditUpgradeOpen(false);
            const action = pendingCreditActionRef.current;
            pendingCreditActionRef.current = null;
            action?.();
          }}
        />
      </main>
    </>
  );
};

export default ArabicNameArtGeneratorPageAr;
