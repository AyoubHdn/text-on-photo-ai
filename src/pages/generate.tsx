import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import React, { useState, useEffect, useRef } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "../component/Input";
import { stylesData } from "../data/stylesData"; // Updated import location
import { useSession, signIn } from "next-auth/react";
// 1) Import the icons you want
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";

const GeneratePage: NextPage = () => {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  const [form, setForm] = useState({
    name: "",
    basePrompt: "",
    numberofImages: "1",
  });

  const [error, setError] = useState("");
  const [imagesUrl, setImagesUrl] = useState<{ imageUrl: string }[]>([]);

  // Default to first available styleData key
  const [activeTab, setActiveTab] = useState<keyof typeof stylesData>(
    Object.keys(stylesData)[0] as keyof typeof stylesData
  );

  // Default subTab is the first subcategory of "Themes"
  const [activeSubTab, setActiveSubTab] = useState<string>(() => {
    const firstTabData = stylesData["Themes"];
    return firstTabData ? Object.keys(firstTabData)[0] || "" : "";
  });

  // Whenever activeTab changes, reset subcategory to that tab’s first item
  useEffect(() => {
    const firstSubTab =
      stylesData && stylesData[activeTab]
        ? Object.keys(stylesData[activeTab] || {})[0] || ""
        : "";
    setActiveSubTab(firstSubTab);
  }, [activeTab]);

  // Track which style image is selected
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Popup image state
  const [popupImage, setPopupImage] = useState<string | null>(null);

  // -- Horizontal scroll references & arrow-visibility states --
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const subcategoryScrollRef = useRef<HTMLDivElement>(null);

  // Show/hide arrow states for categories
  const [showLeftCategoryArrow, setShowLeftCategoryArrow] = useState(false);
  const [showRightCategoryArrow, setShowRightCategoryArrow] = useState(false);

  // Show/hide arrow states for subcategories
  const [showLeftSubCategoryArrow, setShowLeftSubCategoryArrow] = useState(false);
  const [showRightSubCategoryArrow, setShowRightSubCategoryArrow] = useState(false);

  // Check scroll positions immediately on mount
  useEffect(() => {
    handleCategoryScroll();
    handleSubCategoryScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Scroll logic for categories --
  const handleCategoryScroll = () => {
    if (!categoryScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
    setShowLeftCategoryArrow(scrollLeft > 0);
    setShowRightCategoryArrow(scrollLeft < scrollWidth - clientWidth);
  };

  const scrollCategoriesLeft = () => {
    categoryScrollRef.current?.scrollBy({ left: -150, behavior: "smooth" });
  };
  const scrollCategoriesRight = () => {
    categoryScrollRef.current?.scrollBy({ left: 150, behavior: "smooth" });
  };

  // -- Scroll logic for subcategories --
  const handleSubCategoryScroll = () => {
    if (!subcategoryScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = subcategoryScrollRef.current;
    setShowLeftSubCategoryArrow(scrollLeft > 0);
    setShowRightSubCategoryArrow(scrollLeft < scrollWidth - clientWidth);
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

  const aspectRatios = [
    { label: "1:1", value: "1:1", visual: "aspect-square" },
    { label: "16:9", value: "16:9", visual: "aspect-video" },
    { label: "9:16", value: "9:16", visual: "aspect-portrait" },
    { label: "4:3", value: "4:3", visual: "aspect-classic" },
  ];

  const [selectedAspectRatio, setSelectedAspectRatio] = useState("1:1");
  const [selectedModel, setSelectedModel] = useState("flux-schnell"); // Default to "Standard" model

  // To store the selected style image for the preview in model cards
  const [selectedStyleImage, setSelectedStyleImage] = useState<string | null>(null);

  // Form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn) {
      signIn().catch(console.error);
      return;
    }

    if (!form.name || !form.basePrompt) {
      setError("Please type your name and select a style.");
      return;
    }

    // Push data to GTM dataLayer for analytics
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "form_submission",
      category: activeTab,
      subcategory: activeSubTab,
      styleImage: selectedImage || "none",
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
      numberOfVariants: form.numberofImages,
    });

    const finalPrompt = `${form.basePrompt.replace(/Text/g, form.name)}, designed to cover the entire screen, high resolution`;

    generateIcon.mutate({
      prompt: finalPrompt,
      numberOfImages: parseInt(form.numberofImages, 10),
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
    });
  };

  // Update form state
  const updateForm =
    (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [key]: e.target.value,
      }));
    };

  // When user selects a style
  const handleImageSelect = (basePrompt: string, src: string) => {
    setSelectedImage(src); // highlight the chosen thumbnail
    setForm((prev) => ({
      ...prev,
      basePrompt,
    }));
    setSelectedStyleImage(src); // store image for model previews
    setError("");
  };

  // Download logic
  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();

      // Convert to PNG if needed
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

  // Popup open/close
  const openPopup = (imageUrl: string) => {
    setPopupImage(imageUrl);
  };
  const closePopup = () => {
    setPopupImage(null);
  };

  return (
    <>
      <Head>
        <title>Generate Name Designs Online | Name Design AI</title>
        <meta
          name="description"
          content="Generate name designs online with Name Design AI. Easily create personalized, artistic name designs using a variety of styles, fonts, and effects."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container m-auto mb-24 flex flex-col px-8 py-8 max-w-screen-md">
        <h1 className="text-4xl ">
          <strong>Let’s Generate a Unique Name Design</strong>
        </h1>
        <p className="text-1xl mt-4">
          Create stunning name designs for social media, your brand, business
          logos, or thoughtful gifts. Follow the steps below and bring your ideas
          to life!
        </p>
        <p className="text-1xl mt-4">Here’s how it works:</p>
        <ol className="list-decimal ml-6 mt-2 text-1xl">
          <li>Enter a Name to Get Started.</li>
          <li>Choose Your Favorite Style.</li>
          <li>
            Select AI Model:
            <ul className="list-disc ml-6">
              <li>
                <strong>Standard</strong>: Quick and cost-effective designs.
              </li>
              <li>
                <strong>Optimized</strong>: Enhanced quality for a professional
                finish.
              </li>
            </ul>
          </li>
          <li>
            Select Image Size:
            <ul className="list-disc ml-6">
              <li>
                <strong>1:1</strong>: Square (ideal for profile pictures).
              </li>
              <li>
                <strong>16:9</strong>: Landscape (great for desktops and
                presentations).
              </li>
              <li>
                <strong>9:16</strong>: Portrait (perfect for mobile screens).
              </li>
              <li>
                <strong>4:3</strong>: Classic (suitable for versatile use).
              </li>
            </ul>
          </li>
          <li>Choose How Many Designs You Want.</li>
        </ol>
        <p className="text-1xl mt-4">For the best results, keep these tips in mind:</p>
        <ul className="list-disc ml-6 mt-2 text-1xl">
          <li>Use clear and simple names or phrases for better precision.</li>
          <li>Experiment with styles to find your perfect match.</li>
          <li>Align the style with your target audience for businesses.</li>
          <li>For gifts, select playful or personalized designs for a thoughtful touch.</li>
        </ul>

        <form className="flex flex-col gap-3 mt-6" onSubmit={handleFormSubmit}>
          <h2 className="text-xl">1. Enter a Name/Text to Get Started</h2>
          <FormGroup className="mb-12">
            <Input
              required
              value={form.name}
              onChange={updateForm("name")}
              placeholder="Type your name here"
            />
          </FormGroup>

          {/* ---------------- 2. Choose Your Favorite Style ---------------- */}
          <h2 className="text-xl">2. Choose Your Favorite Style</h2>
          <div className="mb-12">
            {/* ====================== CATEGORIES (Horizontal Scroll) ====================== */}
            <div className="relative border-b mb-0">
              {/* Left Arrow for Categories (Using AiOutlineLeft) */}
              {showLeftCategoryArrow && (
                <button
                  type="button"
                  onClick={scrollCategoriesLeft}
                  className="
                    absolute 
                    left-[-1.5rem]
                    top-1/2
                    -translate-y-1/2
                    w-5 h-10
                    rounded-md
                    bg-gray-700
                    text-white
                    hover:bg-gray-200
                    border border-gray-300
                    shadow
                    z-10
                    flex
                    items-center
                    justify-center
                  "
                  title="Scroll Left"
                >
                  <AiOutlineLeft className="text-xl" />
                </button>
              )}

              {/* Scrollable Categories */}
              <div
                ref={categoryScrollRef}
                onScroll={handleCategoryScroll}
                className="flex overflow-x-auto whitespace-nowrap no-scrollbar"
              >
                {Object.keys(stylesData).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveTab(category)}
                    id={category}
                    className={`px-4 py-2 ${
                      activeTab === category
                        ? "font-semibold border-b-2 border-blue-500 text-blue-500"
                        : "font-semibold text-gray-500"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Right Arrow for Categories (Using AiOutlineRight) */}
              {showRightCategoryArrow && (
                <button
                  type="button"
                  onClick={scrollCategoriesRight}
                  className="
                    absolute 
                    right-[-1.5rem]
                    top-1/2
                    -translate-y-1/2
                    w-5 h-10
                    rounded-md
                    bg-gray-700
                    text-white
                    hover:bg-gray-200
                    border border-gray-300
                    shadow
                    z-10
                    flex
                    items-center
                    justify-center
                  "
                  title="Scroll Right"
                >
                  <AiOutlineRight className="text-xl" />
                </button>
              )}
            </div>

            {/* ====================== SUBCATEGORIES (Horizontal Scroll) ====================== */}
            <div className="relative border-b mb-4 mt-0">
              {/* Left Arrow for Subcategories (Using AiOutlineLeft) */}
              {showLeftSubCategoryArrow && (
                <button
                  type="button"
                  onClick={scrollSubCategoriesLeft}
                  className="
                    absolute
                    left-[-1.5rem]
                    top-1/2
                    -translate-y-1/2
                    w-5 h-10
                    rounded-md
                    bg-gray-700
                    text-white
                    hover:bg-gray-200
                    border border-gray-300
                    shadow
                    z-10
                    flex
                    items-center
                    justify-center
                  "
                  title="Scroll Left"
                >
                  <AiOutlineLeft className="text-xl" />
                </button>
              )}

              {/* Scrollable Subcategories */}
              <div
                ref={subcategoryScrollRef}
                onScroll={handleSubCategoryScroll}
                className="flex overflow-x-auto whitespace-nowrap no-scrollbar"
              >
                {stylesData[activeTab] &&
                  Object.keys(stylesData[activeTab] || {}).map((subcategory) => (
                    <button
                      key={subcategory}
                      type="button"
                      onClick={() => setActiveSubTab(subcategory)}
                      id={subcategory}
                      className={`px-4 py-2 ${
                        activeSubTab === subcategory
                          ? "text-sm border-b-2 blue-purple-500 text-blue-500"
                          : "text-sm text-gray-500"
                      }`}
                    >
                      {subcategory}
                    </button>
                  ))}
              </div>

              {/* Right Arrow for Subcategories (Using AiOutlineRight) */}
              {showRightSubCategoryArrow && (
                <button
                  type="button"
                  onClick={scrollSubCategoriesRight}
                  className="
                    absolute
                    right-[-1.5rem]
                    top-1/2
                    -translate-y-1/2
                    w-5 h-10
                    rounded-md
                    bg-gray-700
                    text-white
                    hover:bg-gray-200
                    border border-gray-300
                    shadow
                    z-10
                    flex
                    items-center
                    justify-center
                  "
                  title="Scroll Right"
                >
                  <AiOutlineRight className="text-xl" />
                </button>
              )}
            </div>

            {/* ====================== THUMBNAILS ====================== */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stylesData[activeTab]?.[activeSubTab]?.map(({ src, basePrompt }, index) => (
                <div
                  key={index}
                  className={`relative rounded shadow-md hover:shadow-lg transition cursor-pointer ${
                    selectedImage === src ? "ring-4 ring-blue-500" : ""
                  }`}
                >
                  <img
                    src={src}
                    alt={basePrompt}
                    id={src}
                    className="rounded w-full h-auto object-cover mx-auto"
                    onClick={() => handleImageSelect(basePrompt, src)}
                  />
                  <button
                    onClick={() => openPopup(src)}
                    className="absolute top-0 right-0 bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none"
                    title="View Fullscreen"
                  >
                    🔍
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ---------------- 3. Select AI Model ---------------- */}
          <h2 className="text-xl">3. Select AI Model</h2>
          <FormGroup className="mb-12">
            <label className="block mb-4 text-sm font-medium">AI Model</label>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              {[
                {
                  name: "Standard",
                  value: "flux-schnell",
                  cost: 1,
                  id: "ai-model-standard",
                  image: selectedStyleImage || "/images/placeholder.png",
                },
                {
                  name: "Optimized",
                  value: "flux-dev",
                  cost: 2,
                  id: "ai-model-optimized",
                  image:
                    selectedStyleImage && selectedStyleImage.includes(".")
                      ? selectedStyleImage.replace(/(\.[^.]+)$/, "e$1")
                      : "/images/placeholder.png",
                  badge: "Optimized",
                },
              ].map((model) => (
                <button
                  key={model.value}
                  type="button"
                  data-model={`ai-model-${model.name || "default"}`}
                  onClick={() => setSelectedModel(model.value)}
                  className={`relative flex flex-col items-center justify-center border rounded-lg p-4 transition ${
                    selectedModel === model.value
                      ? "border-blue-500 ring-2 ring-blue-500"
                      : "border-gray-300 hover:border-gray-500"
                  }`}
                >
                  {/* Badge for "Optimized" */}
                  {model.badge && (
                    <span className="absolute top-2 right-2 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-md">
                      {model.badge}
                    </span>
                  )}
                  <img
                    src={model.image}
                    alt={model.name}
                    className="w-22 h-22 mb-2 rounded"
                  />
                  <span className="text-sm text-gray-500 mt-2">
                    Cost: {model.cost} credits
                  </span>
                </button>
              ))}
            </div>
          </FormGroup>

          {/* ---------------- 4. Select Image Size ---------------- */}
          <h2 className="text-xl">4. Select Image Size</h2>
          <FormGroup className="mb-12">
            <label className="block mb-4 text-sm font-medium">Aspect Ratio</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {aspectRatios.map((ratio) => {
                // Precompute the aspect class
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
                    id={`aspect-${ratio.value || "default"}`}
                    onClick={() => setSelectedAspectRatio(ratio.value)}
                    className={`relative flex items-center justify-center border rounded-lg p-4 transition ${
                      selectedAspectRatio === ratio.value
                        ? "border-blue-500 ring-2 ring-blue-500"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {/* Visual Representation */}
                    <div
                      className={`w-full h-21 dark:bg-gray-200 rounded-lg ${aspectClass} overflow-hidden flex items-center justify-center`}
                      style={{ backgroundColor: "#ddd" }}
                    >
                      <span className="text-gray-600 font-medium">
                        {ratio.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </FormGroup>

          {/* ---------------- 5. Number of Designs ---------------- */}
          <h2 className="text-xl">5. How Many Designs You Want</h2>
          <FormGroup className="mb-12">
            <label>Number of images</label>
            <Input
              required
              inputMode="numeric"
              pattern="[1-9]|10"
              value={form.numberofImages}
              onChange={updateForm("numberofImages")}
            />
          </FormGroup>

          {error && (
            <div className="bg-red-500 text-white rounded p-8 text-xl">
              {error}
            </div>
          )}

          <Button isLoading={generateIcon.isLoading} disabled={generateIcon.isLoading}>
            {isLoggedIn ? "Generate" : "Sign in to Generate"}
          </Button>
        </form>

        {/* ---------------- Generated Images Preview ---------------- */}
        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-xl mt-8">Your Custom Name Designs</h2>
            <section className="grid grid-cols-4 gap-4 mb-12">
              {imagesUrl.map(({ imageUrl }, index) => (
                <div
                  key={index}
                  className="relative rounded shadow-md hover:shadow-lg transition"
                >
                  <div className="absolute top-0 right-0 flex gap-0">
                    <button
                      onClick={() => openPopup(imageUrl)}
                      className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none"
                      title="View Fullscreen"
                    >
                      🔍
                    </button>
                    <button
                      onClick={() => {
                        void handleDownload(imageUrl);
                      }}
                      className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none"
                      title="Download Image"
                    >
                      ⬇️
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

        {/* ---------------- Fullscreen Popup ---------------- */}
        {popupImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="relative">
              <button
                onClick={closePopup}
                className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 focus:outline-none"
                title="Close"
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
      </main>
    </>
  );
};

export default GeneratePage;
