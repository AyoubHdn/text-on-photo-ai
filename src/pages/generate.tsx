import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "../component/Input";
import { stylesData } from "../data/stylesData"; // For Name Art
import { gamerStylesData } from "../data/gamerStylesData"; // For Game Logo
import { useSession, signIn } from "next-auth/react";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { colorFamilies } from "../data/colors";
import Link from "next/link";

/**
 * We define our 4 possible design types:
 * 'NameArt' => use stylesData
 * 'GameLogo' => use gamerStylesData
 * 'Wallpaper' => (placeholder)
 * 'ProLogo' => (placeholder)
 */
type DesignType = "NameArt" | "GameLogo" | "Wallpaper" | "ProLogo" | null;

type AIModel = "flux-schnell" | "flux-dev" | "ideogram-ai/ideogram-v2-turbo";
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3";
type ColorMode = "bg" | "text";

const GeneratePage: NextPage = () => {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  // ===========================================================
  // 1) State to pick "NameArt" vs "GameLogo" vs "Wallpaper" vs "ProLogo"
  // ===========================================================
  const [designType, setDesignType] = useState<DesignType>(null);

  // We'll set this once the user picks a designType
  // 'activeData' can be either 'stylesData' or 'gamerStylesData'
  // or null if user hasn't chosen yet
  const [activeData, setActiveData] = useState<
    typeof stylesData | typeof gamerStylesData | null
  >(null);

  // We'll also keep track of the "active category" and "active subcategory"
  // for whichever data object is loaded
  const [activeTab, setActiveTab] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<string>("");

  // Once user picks a design type, we set activeData accordingly
  useEffect(() => {
    if (designType === "NameArt") {
      setActiveData(stylesData);
    } else if (designType === "GameLogo") {
      setActiveData(gamerStylesData);
    } else {
      // Wallpaper or ProLogo => no data for now
      setActiveData(null);
    }

    // Reset tabs
    setActiveTab("");
    setActiveSubTab("");
  }, [designType]);

  // Whenever activeData changes, set the initial activeTab and activeSubTab
  useEffect(() => {
    if (!activeData) return;

    const categoryKeys = Object.keys(activeData);
    if (categoryKeys.length > 0) {
      setActiveTab(categoryKeys[0] ?? "");
    }
  }, [activeData]);

  // Whenever activeTab changes, set the initial activeSubTab
  useEffect(() => {
    if (!activeData) return;
    if (!activeTab) return;

    const subKeys = Object.keys(activeData[activeTab] || {});
    if (subKeys.length > 0) {
      setActiveSubTab(subKeys[0] ?? "");
    }
  }, [activeTab, activeData]);

  // ===========================================================
  // 2) Additional states & logic
  // ===========================================================
  const [form, setForm] = useState({
    name: "",
    basePrompt: "",
    numberofImages: "1",
  });
  const [error, setError] = useState<string>("");
  const [imagesUrl, setImagesUrl] = useState<{ imageUrl: string }[]>([]);
  const [allowCustomColors, setAllowCustomColors] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [popupImage, setPopupImage] = useState<string | null>(null);

  // Scroll references
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const subcategoryScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftCategoryArrow, setShowLeftCategoryArrow] = useState<boolean>(false);
  const [showRightCategoryArrow, setShowRightCategoryArrow] = useState<boolean>(false);
  const [showLeftSubCategoryArrow, setShowLeftSubCategoryArrow] = useState<boolean>(false);
  const [showRightSubCategoryArrow, setShowRightSubCategoryArrow] = useState<boolean>(false);

  // AI Model
  const [selectedModel, setSelectedModel] = useState<AIModel>("flux-schnell");

  // Aspect Ratios
  const aspectRatios: { label: string; value: AspectRatio; visual: string }[] = [
    { label: "1:1", value: "1:1", visual: "aspect-square" },
    { label: "16:9", value: "16:9", visual: "aspect-video" },
    { label: "9:16", value: "9:16", visual: "aspect-portrait" },
    { label: "4:3", value: "4:3", visual: "aspect-classic" },
  ];
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>("1:1");
  const [selectedStyleImage, setSelectedStyleImage] = useState<string | null>(null);

  // Colors
  const [colorMode, setColorMode] = useState<ColorMode>("bg");
  const [selectedBgColor, setSelectedBgColor] = useState<string>("#FFFFFF");
  const [selectedTextColor, setSelectedTextColor] = useState<string>("#000000");
  const colorFamilyNames: string[] = Object.keys(colorFamilies);
  const [showLeftColorFamArrow, setShowLeftColorFamArrow] = useState<boolean>(false);
  const [showRightColorFamArrow, setShowRightColorFamArrow] = useState<boolean>(false);
  const colorFamilyScrollRef = useRef<HTMLDivElement>(null);
  const [activeColorFamily, setActiveColorFamily] = useState<string>(
    colorFamilyNames[0] ?? "Reds"
  );

  // ===========================================================
  // 3) Scroll Handling with useLayoutEffect
  // ===========================================================
  // Scroll handling for Categories & Subcategories
  useLayoutEffect(() => {
    handleCategoryScroll();
    handleSubCategoryScroll();
  }, [activeData, activeTab]);

  const handleCategoryScroll = () => {
    if (!categoryScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
    // Buffer for floating point inaccuracies
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

  // Scroll handling for Color Families
  useLayoutEffect(() => {
    handleColorFamilyScroll();
  }, [activeColorFamily]);

  const handleColorFamilyScroll = () => {
    if (!colorFamilyScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = colorFamilyScrollRef.current;
    setShowLeftColorFamArrow(scrollLeft > 0);
    setShowRightColorFamArrow(scrollLeft + clientWidth < scrollWidth - 1);
  };
  const scrollColorFamilyLeft = () => {
    colorFamilyScrollRef.current?.scrollBy({ left: -150, behavior: "smooth" });
  };
  const scrollColorFamilyRight = () => {
    colorFamilyScrollRef.current?.scrollBy({ left: 150, behavior: "smooth" });
  };

  // ===========================================================
  // 4) TRPC generate
  // ===========================================================
  const generateIcon = api.generate.generateIcon.useMutation({
    onSuccess(data) {
      setImagesUrl(data);
    },
    onError(error) {
      console.error(error);
      setError(error.message);
    },
  });

  // ===========================================================
  // 5) Form submission logic
  // ===========================================================
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isLoggedIn) {
      signIn().catch(console.error);
      return;
    }
    if (!form.name || !form.basePrompt) {
      setError("Please select a style.");
      return;
    }

    // Analytics tracking
    (window.dataLayer = window.dataLayer || []).push({
      event: "form_submission",
      designType,
      category: activeTab,
      subcategory: activeSubTab,
      styleImage: selectedImage || "none",
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
      numberOfVariants: parseInt(form.numberofImages, 10),
      selectedBgColor,
      selectedTextColor,
      allowCustomColors,
    });

    let finalPrompt = form.basePrompt;
    // If custom colors are allowed, replace placeholders
    if (allowCustomColors) {
      finalPrompt = finalPrompt
        .replace(/'background color'/gi, `${selectedBgColor} (${findColorName(selectedBgColor)})`)
        .replace(/'Text color'/gi, `${selectedTextColor} (${findColorName(selectedTextColor)})`);
    }
    // Replace 'Text' placeholders with the actual form name
    finalPrompt = finalPrompt.replace(/'Text'/gi, form.name);
    // Add any extra instructions for coverage & resolution
    finalPrompt += " designed to cover the entire screen, high resolution";

    generateIcon.mutate({
      prompt: finalPrompt,
      numberOfImages: parseInt(form.numberofImages, 10),
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
    });
  };

  // Helper function to find color name
  function findColorName(hex: string): string {
    for (const famArr of Object.values(colorFamilies)) {
      const found = famArr.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
      if (found) return found.name;
    }
    return "Unknown Color";
  }

  // Handle style selection
  const handleImageSelect = (basePrompt: string, src: string, allowColors = true) => {
    setSelectedImage(src);
    setForm((prev) => ({ ...prev, basePrompt }));
    setSelectedStyleImage(src);
    setError("");
    setAllowCustomColors(allowColors);
  };

  // Handle image download
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

  // Handle popup
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
        {/* Main heading */}
        <h1 className="text-4xl font-bold">Let’s Generate a Unique Design</h1>

        {/* Restored Guideline / Instructions */}
        <p className="text-1xl mt-4">
          Create stunning name designs for social media, your brand, business logos, or
          thoughtful gifts. Follow the steps below and bring your ideas to life!
        </p>
        <div className="mt-4 mb-8 p-4 border border-gray-300 rounded-md dark:bg-gray-700 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold mb-2">Here’s how it works:</h2>
          <ol className="list-decimal list-inside">
            <li>Enter a Name to Get Started.</li>
            <li>Choose Your Favorite Style.</li>
            <li>Select AI Model:
              <ul className="list-disc ml-5">
                <li><strong>Standard:</strong> Quick and cost-effective designs.</li>
                <li><strong>Optimized:</strong> Enhanced quality for a professional finish.</li>
              </ul>
            </li>
            <li>Select Image Size:
              <ul className="list-disc ml-5">
                <li><strong>1:1</strong>: Square (ideal for profile pictures).</li>
                <li><strong>16:9</strong>: Landscape (great for desktops and presentations).</li>
                <li><strong>9:16</strong>: Portrait (perfect for mobile screens).</li>
                <li><strong>4:3</strong>: Classic (suitable for versatile use).</li>
              </ul>
            </li>
            <li>Choose How Many Designs You Want.</li>
          </ol>

          <h3 className="text-md font-semibold mt-3">For the best results, keep these tips in mind:</h3>
          <ul className="list-disc list-inside">
            <li>Use clear and simple names or phrases for better precision.</li>
            <li>Experiment with styles to find your perfect match.</li>
            <li>Align the style with your target audience if it’s for a business.</li>
            <li>For gifts, pick playful or personalized designs for a thoughtful touch.</li>
          </ul>
        </div>

        {/* ------------------------------------ */}
        {/* SECTION 1: PICK DESIGN PURPOSE */}
        {/* ------------------------------------ */}
        <div className="mt-6 mb-4">
          <h2 className="text-xl font-semibold">Section 1: What Do You Want to Create?</h2>
          <div className="flex gap-4 mt-2">
            {/* Name Art */}
            <button
              id="Section-one-name-art"
              type="button"
              onClick={() => setDesignType("NameArt")}
              className={`px-6 py-3 border-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                designType === "NameArt"
                  ? "bg-blue-900 text-white border-blue-900"
                  : "bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200 hover:border-blue-400"
              }`}
            >
              Name Art
            </button>

            {/* Game Logo */}
            <button
              id="Section-one-game-logo"
              type="button"
              onClick={() => setDesignType("GameLogo")}
              className={`px-6 py-3 border-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                designType === "GameLogo"
                  ? "bg-blue-900 text-white border-blue-900"
                  : "bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200 hover:border-blue-400"
              }`}
            >
              Game Logo
            </button>

            {/* Wallpaper (hidden/placeholder) */}
            <button
              type="button"
              className="hidden px-6 py-3 border-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed"
              disabled
            >
              Wallpaper (Coming Soon)
            </button>

            {/* Professional Logo (hidden/placeholder) */}
            <button
              type="button"
              className="hidden px-6 py-3 border-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed"
              disabled
            >
              Professional Logo (Coming Soon)
            </button>
          </div>
        </div>

        {/* If the user hasn't picked anything yet */}
        {designType === null && (
          <p className="text-gray-500">
            Please select <strong>Name Art</strong> or <strong>Game Logo</strong> above.
          </p>
        )}

        {/* If designType is NameArt or GameLogo, show the rest of the form */}
        {(designType === "NameArt" || designType === "GameLogo") && (
          <>
            <form className="flex flex-col gap-3 mt-6" onSubmit={handleFormSubmit}>
              {/* Step 1: Name */}
              <h2 className="text-xl">1. Enter a Name/Text to Get Started</h2>
              <FormGroup className="mb-12">
                <Input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Type your name here"
                />
              </FormGroup>

              {/* Step 2: Category/Subcategory */}
              <h2 className="text-xl">2. Choose Your Favorite Style</h2>
              {!activeData ? (
                <p className="text-gray-400 italic">
                  (No data loaded for this design type yet)
                </p>
              ) : (
                <div className="mb-12">
                  {/* Category Scroller */}
                  <div className="relative border-b mb-0 mt-4 flex items-center">
                    {/* Left Scroll Button */}
                    {showLeftCategoryArrow && (
                      <button
                        type="button"
                        onClick={scrollCategoriesLeft}
                        className="
                          absolute
                          left-[-1.5rem]
                          top-1/2
                          -translate-y-1/2
                          w-5
                          h-10
                          rounded-md
                          bg-gray-700
                          text-white
                          hover:bg-gray-200
                          border
                          border-gray-300
                          shadow
                          z-10
                          flex
                          items-center
                          justify-center
                        "
                        title="Scroll Categories Left"
                        aria-label="Scroll Categories Left"
                      >
                        <AiOutlineLeft className="text-xl" />
                      </button>
                    )}

                    {/* Categories */}
                    <div
                      ref={categoryScrollRef}
                      onScroll={handleCategoryScroll}
                      className="flex overflow-x-auto whitespace-nowrap no-scrollbar flex-1"
                    >
                      {Object.keys(activeData).map((catKey) => (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => setActiveTab(catKey)}
                          className={`px-4 py-2 ${
                            activeTab === catKey
                              ? "font-semibold border-b-2 border-blue-500 text-blue-500"
                              : "font-semibold text-gray-500"
                          }`}
                        >
                          {catKey}
                        </button>
                      ))}
                    </div>

                    {/* Right Scroll Button */}
                    {showRightCategoryArrow && (
                      <button
                        type="button"
                        onClick={scrollCategoriesRight}
                        className="
                          absolute
                          right-[-1.5rem]
                          top-1/2
                          -translate-y-1/2
                          w-5
                          h-10
                          rounded-md
                          bg-gray-700
                          text-white
                          hover:bg-gray-200
                          border
                          border-gray-300
                          shadow
                          z-10
                          flex
                          items-center
                          justify-center
                        "
                        title="Scroll Categories Right"
                        aria-label="Scroll Categories Right"
                      >
                        <AiOutlineRight className="text-xl" />
                      </button>
                    )}
                  </div>

                  {/* Subcategory Scroller */}
                  <div className="relative border-b mb-4 mt-4 flex items-center">
                    {/* Left Scroll Button */}
                    {showLeftSubCategoryArrow && (
                      <button
                        type="button"
                        onClick={scrollSubCategoriesLeft}
                        className="
                          absolute
                          left-[-1.5rem]
                          top-1/2
                          -translate-y-1/2
                          w-5
                          h-10
                          rounded-md
                          bg-gray-700
                          text-white
                          hover:bg-gray-200
                          border
                          border-gray-300
                          shadow
                          z-10
                          flex
                          items-center
                          justify-center
                        "
                        title="Scroll Subcategories Left"
                        aria-label="Scroll Subcategories Left"
                      >
                        <AiOutlineLeft className="text-xl" />
                      </button>
                    )}

                    {/* Subcategories */}
                    <div
                      ref={subcategoryScrollRef}
                      onScroll={handleSubCategoryScroll}
                      className="flex overflow-x-auto whitespace-nowrap no-scrollbar flex-1"
                    >
                      {activeData[activeTab] &&
                        Object.keys(activeData[activeTab] || {}).map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => setActiveSubTab(sub)}
                            className={`px-4 py-2 ${
                              activeSubTab === sub
                                ? "text-sm border-b-2 border-blue-500 text-blue-500"
                                : "text-sm text-gray-500"
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                    </div>

                    {/* Right Scroll Button */}
                    {showRightSubCategoryArrow && (
                      <button
                        type="button"
                        onClick={scrollSubCategoriesRight}
                        className="
                          absolute
                          right-[-1.5rem]
                          top-1/2
                          -translate-y-1/2
                          w-5
                          h-10
                          rounded-md
                          bg-gray-700
                          text-white
                          hover:bg-gray-200
                          border
                          border-gray-300
                          shadow
                          z-10
                          flex
                          items-center
                          justify-center
                        "
                        title="Scroll Subcategories Right"
                        aria-label="Scroll Subcategories Right"
                      >
                        <AiOutlineRight className="text-xl" />
                      </button>
                    )}
                  </div>

                  {/* Thumbnails (with src+e.webp) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {activeData[activeTab]?.[activeSubTab]?.map((item, idx) => {
                      const allowColors =
                        item.allowCustomColors === false ? false : true;
                      // IMPORTANT: convert the original .webp to e.webp
                      const styleImagePath = item.src.replace(/\.webp$/, "e.webp");

                      return (
                        <div
                          key={idx}
                          className={`relative rounded shadow-md hover:shadow-lg transition cursor-pointer ${
                            selectedImage === item.src
                              ? "ring-4 ring-blue-500"
                              : ""
                          }`}
                        >
                          <img
                            src={styleImagePath}
                            alt={item.basePrompt}
                            className="rounded w-full h-auto object-cover mx-auto"
                            onClick={() =>
                              handleImageSelect(item.basePrompt, item.src, allowColors)
                            }
                          />
                          <button
                            type="button"
                            onClick={() => openPopup(styleImagePath)}
                            className="absolute top-0 right-0 bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none"
                            title="View Fullscreen"
                            aria-label="View Fullscreen"
                          >
                            🔍
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: AI Model */}
              <h2 className="text-xl">3. Select AI Model</h2>
              <FormGroup className="mb-12">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      name: "Standard",
                      value: "flux-schnell" as AIModel,
                      cost: 1,
                      image: selectedStyleImage || "/images/placeholder.png",
                    },
                    {
                      name: "Optimized",
                      value: "flux-dev" as AIModel,
                      cost: 2,
                      image:
                        selectedStyleImage && selectedStyleImage.includes(".")
                          ? selectedStyleImage.replace(/(\.[^.]+)$/, "e$1")
                          : "/images/placeholder.png",
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
                      <img
                        src={model.image}
                        alt={model.name}
                        className="w-22 h-22 mb-2 rounded"
                      />
                      <span className="text-sm font-semibold">{model.name}</span>
                      <span className="text-sm text-gray-500">
                        Cost: {model.cost} credits
                      </span>
                    </button>
                  ))}
                </div>
              </FormGroup>

              {/* Step 4: Aspect Ratio */}
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
                          <span className="text-gray-600 font-medium">
                            {ratio.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FormGroup>

              {/* Step 5: Number of Images */}
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

              {/* (Optional) Step 6: Colors… if allowCustomColors is true */}
              {/* 
                Insert your color selection UI here if needed
                ...
              */}

              {/* Show error if any */}
              {error && (
                <div className="bg-red-500 text-white rounded p-4 text-xl">
                  {error}{" "}
                  {error === "You do not have enough credits" && (
                    <Link id="not-enough-credits-alert-btn" href="/buy-credits" className="underline font-bold ml-2">
                      Buy Credits
                    </Link>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                isLoading={generateIcon.isLoading}
                disabled={generateIcon.isLoading}
              >
                {isLoggedIn ? "Generate" : "Sign in to Generate"}
              </Button>
            </form>
          </>
        )}

        {/* Render images if any */}
        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-xl mt-8 mb-2">Your Custom Designs</h2>
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

        {/* Fullscreen Popup */}
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
      </main>
    </>
  );
};

export default GeneratePage;
