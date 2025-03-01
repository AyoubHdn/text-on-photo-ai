import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "~/component/Input";
import { gamerStylesData } from "~/data/gamerStylesData"; // For Game Logo
import { useSession, signIn } from "next-auth/react";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { colorFamilies } from "~/data/colors";
import Link from "next/link";

/**
 * This page is dedicated to generating Game Logos.
 * It re-uses all the scrolling/tabs logic, but references `gamerStylesData`.
 */

// Type definitions
type AIModel = "flux-schnell" | "flux-dev" | "ideogram-ai/ideogram-v2-turbo";
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3";
type ColorMode = "bg" | "text";

const GameLogoPage: NextPage = () => {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  // Similar states
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

  // Category & subcategory
  const [activeTab, setActiveTab] = useState<string>("");
  const [activeSubTab, setActiveSubTab] = useState<string>("");

  // Scrolling
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const subcategoryScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftCategoryArrow, setShowLeftCategoryArrow] = useState<boolean>(false);
  const [showRightCategoryArrow, setShowRightCategoryArrow] = useState<boolean>(false);
  const [showLeftSubCategoryArrow, setShowLeftSubCategoryArrow] = useState<boolean>(false);
  const [showRightSubCategoryArrow, setShowRightSubCategoryArrow] = useState<boolean>(false);

  // Models
  const [selectedModel, setSelectedModel] = useState<AIModel>("flux-schnell");

  // Aspect ratios
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

  // Initialize category & subcategory
  useEffect(() => {
    const categoryKeys = Object.keys(gamerStylesData);
    if (categoryKeys.length > 0) {
      setActiveTab(categoryKeys[0] ?? "");
    }
  }, []);

  useEffect(() => {
    if (!activeTab) return;
    const subKeys = Object.keys(gamerStylesData[activeTab] ?? {});
    if (subKeys.length > 0) {
      setActiveSubTab(subKeys[0] ?? "");
    }
  }, [activeTab]);

  // Scroll
  useLayoutEffect(() => {
    handleCategoryScroll();
    handleSubCategoryScroll();
  }, [activeTab]);

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

  // Color families
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

  // TRPC
  const generateIcon = api.generate.generateIcon.useMutation({
    onSuccess(data) {
      setImagesUrl(data);
    },
    onError(error) {
      console.error(error);
      setError(error.message);
    },
  });

  // Submit
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn) {
      signIn().catch(console.error);
      return;
    }
    if (!form.name || !form.basePrompt) {
      setError("Please select a style and enter a name/text.");
      return;
    }

    (window.dataLayer = window.dataLayer || []).push({
      event: "form_submission",
      designType: "GameLogo",
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
    if (allowCustomColors) {
      finalPrompt = finalPrompt
        .replace(/'background color'/gi, `${selectedBgColor} (${findColorName(selectedBgColor)})`)
        .replace(/'Text color'/gi, `${selectedTextColor} (${findColorName(selectedTextColor)})`);
    }
    finalPrompt = finalPrompt.replace(/'Text'/gi, form.name);
    finalPrompt += " designed in a gaming style, high resolution";

    generateIcon.mutate({
      prompt: finalPrompt,
      numberOfImages: parseInt(form.numberofImages, 10),
      aspectRatio: selectedAspectRatio,
      model: selectedModel,
    });
  };

  function findColorName(hex: string): string {
    for (const famArr of Object.values(colorFamilies)) {
      const found = famArr.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
      if (found) return found.name;
    }
    return "Unknown Color";
  }

  // Style selection
  const handleImageSelect = (basePrompt: string, src: string, allowColors = true) => {
    setSelectedImage(src);
    setForm((prev) => ({ ...prev, basePrompt }));
    setSelectedStyleImage(src);
    setError("");
    setAllowCustomColors(allowColors);
  };

  // Download
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
          link.download = "game-logo.png";
          link.click();
          window.URL.revokeObjectURL(blobUrl);
        }
      }
    } catch (error) {
      console.error("Error downloading the image:", error);
    }
  };

  // Popup
  const openPopup = (imageUrl: string) => setPopupImage(imageUrl);
  const closePopup = () => setPopupImage(null);

  return (
    <>
      <Head>
        <title>Gaming Logo Generator| Name Design AI</title>
        <meta
          name="description"
          content="Design epic gaming logos for teams, streams, or profiles with our Gaming Logo Generator. Customize styles, sizes, and more in minutes!"
        />
      </Head>
      <main className="container m-auto mb-24 flex flex-col px-8 py-8 max-w-screen-md">
        <h1 className="text-4xl font-bold">Gaming Logo Generator: Create Unique Logos for Games & Esports</h1>
        {/* Restored Guideline / Instructions */}
        <p className="text-1xl mt-4">
        Level up your gaming identity with our Gaming Logo Generator! Create stunning logos for esports teams, streaming channels, or personal profiles. Follow the steps below to craft a design that’s as bold as your gameplay.
        </p>
        <div className="mt-4 mb-8 p-4 border border-gray-300 rounded-md dark:bg-gray-700 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold mb-2">Here’s how it works:</h2>
          <ol className="list-decimal list-inside">
            <li><b>Enter a Name to Get Started.</b><br/>
            Type your gaming team name, username, or game title (e.g., “PhantomSquad” or “PixelKing”).  
            </li>
            <li><b>Choose Your Favorite Style.</b><br/>
            Select a gaming-inspired style:<br/>
            <ul className="list-disc ml-5">
                <li><b>Cartoonish</b>: Fun, colorful designs for casual gamers.</li>
                <li><b>Futuristic</b>: Sleek, sci-fi vibes for high-tech games.</li>
                <li><b>Retro</b>: Pixelated throwbacks for classic gaming fans.</li>
                <li><b>Bold</b>: Vibrant, energetic looks for action-packed titles.</li>
            </ul>
            </li>
            <li>Select AI Model:
              <ul className="list-disc ml-5">
                <li><b>Standard:</b> Fast, affordable logos for quick setups.</li>
                <li><b>Optimized:</b> High-quality designs for pro gamers or streamers.</li>
              </ul>
            </li>
            <li>Select Image Size:
              <ul className="list-disc ml-5">
                <li><b>1:1 (Square)</b>: Perfect for Discord or Twitch profile pics.</li>
                <li><b>16:9 (Landscape)</b>: Ideal for streaming overlays or YouTube banners.</li>
                <li><b>9:16 (Portrait)</b>: Great for mobile gaming or TikTok intros.</li>
                <li><b>4:3 (Classic)</b>: Versatile for general use or prints.</li>
              </ul>
            </li>
            <li><b>Choose How Many Designs You Want.</b><br/>Pick the number of designs to generate—explore multiple options to nail your gaming aesthetic!</li>
          </ol>

          <h3 className="text-md font-semibold mt-3">Tips for Gamers:</h3>
          <ul className="list-disc list-inside">
            <li>Use a short, memorable name, and match the style to your game type (e.g., Retro for pixel games, Futuristic for shooters)</li>
          </ul>
        </div>


        <form className="flex flex-col gap-3 mt-6" onSubmit={handleFormSubmit}>
          {/* 1. Enter name */}
          <h2 className="text-xl">1. Enter Your Game Name/Text</h2>
          <FormGroup className="mb-12">
            <Input
              required
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Type your game name here"
            />
          </FormGroup>

          {/* 2. Choose style */}
          <h2 className="text-xl">2. Pick a Style</h2>
          <div className="mb-12">
            {/* Category scroller */}
            <div className="relative border-b mb-0 mt-4 flex items-center">
              {showLeftCategoryArrow && (
                <button
                  type="button"
                  onClick={scrollCategoriesLeft}
                  className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2 w-5 h-10 rounded-md bg-gray-700 text-white hover:bg-gray-200 border border-gray-300 shadow z-10 flex items-center justify-center"
                  title="Scroll Categories Left"
                  aria-label="Scroll Categories Left"
                >
                  <AiOutlineLeft className="text-xl" />
                </button>
              )}

              <div
                ref={categoryScrollRef}
                onScroll={handleCategoryScroll}
                className="flex overflow-x-auto whitespace-nowrap no-scrollbar flex-1"
              >
                {Object.keys(gamerStylesData ?? {}).map((catKey) => (
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

              {showRightCategoryArrow && (
                <button
                  type="button"
                  onClick={scrollCategoriesRight}
                  className="absolute right-[-1.5rem] top-1/2 -translate-y-1/2 w-5 h-10 rounded-md bg-gray-700 text-white hover:bg-gray-200 border border-gray-300 shadow z-10 flex items-center justify-center"
                  title="Scroll Categories Right"
                  aria-label="Scroll Categories Right"
                >
                  <AiOutlineRight className="text-xl" />
                </button>
              )}
            </div>

            {/* Subcategory scroller */}
            <div className="relative border-b mb-4 mt-4 flex items-center">
              {showLeftSubCategoryArrow && (
                <button
                  type="button"
                  onClick={scrollSubCategoriesLeft}
                  className="absolute left-[-1.5rem] top-1/2 -translate-y-1/2 w-5 h-10 rounded-md bg-gray-700 text-white hover:bg-gray-200 border border-gray-300 shadow z-10 flex items-center justify-center"
                  title="Scroll Subcategories Left"
                  aria-label="Scroll Subcategories Left"
                >
                  <AiOutlineLeft className="text-xl" />
                </button>
              )}

              <div
                ref={subcategoryScrollRef}
                onScroll={handleSubCategoryScroll}
                className="flex overflow-x-auto whitespace-nowrap no-scrollbar flex-1"
              >
                {Object.keys(gamerStylesData[activeTab] ?? {}).map((sub) => (
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

              {showRightSubCategoryArrow && (
                <button
                  type="button"
                  onClick={scrollSubCategoriesRight}
                  className="absolute right-[-1.5rem] top-1/2 -translate-y-1/2 w-5 h-10 rounded-md bg-gray-700 text-white hover:bg-gray-200 border border-gray-300 shadow z-10 flex items-center justify-center"
                  title="Scroll Subcategories Right"
                  aria-label="Scroll Subcategories Right"
                >
                  <AiOutlineRight className="text-xl" />
                </button>
              )}
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {(gamerStylesData[activeTab]?.[activeSubTab] ?? []).map((item, idx) => {
                const allowColors = item.allowCustomColors !== false;
                const styleImagePath = item.src.replace(/\.webp$/, "e.webp");

                return (
                  <div
                    key={idx}
                    className={`relative rounded shadow-md hover:shadow-lg transition cursor-pointer ${
                      selectedImage === item.src ? "ring-4 ring-blue-500" : ""
                    }`}
                    onClick={() =>
                      handleImageSelect(item.basePrompt, item.src, allowColors)
                    }
                  >
                    <img
                      src={styleImagePath}
                      alt={item.basePrompt}
                      className="rounded w-full h-auto object-cover mx-auto"
                    />
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        openPopup(styleImagePath);
                      }}
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

          {/* 3. Select AI Model */}
            <h2 className="text-xl">3. Select AI Model</h2>
            <FormGroup className="mb-12">
            <div className="grid grid-cols-2 gap-4">
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
                },
                {
                    name: "Optimized",
                    value: "flux-dev" as AIModel,
                    cost: 4,
                    image:
                    selectedStyleImage && selectedStyleImage.includes(".")
                        ? selectedStyleImage.replace(/(\.[^.]+)$/, "e$1")
                        : "/images/placeholder.png",
                    recommended: true,
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

        {/* Render images */}
        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-xl mt-8 mb-2">Your Custom Game Logos</h2>
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

        {/* Popup */}
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

export default GameLogoPage;
