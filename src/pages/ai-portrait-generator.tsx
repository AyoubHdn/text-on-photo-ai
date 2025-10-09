// src/pages/ai-photo-gifts/portrait-generator.tsx

import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import React, { useState, useEffect, useRef, useCallback, ChangeEvent, useLayoutEffect } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { FiImage } from "react-icons/fi";
import { menPhotoStylesData } from "~/data/menPhotoStylesData";
import { womenPhotoStylesData } from "~/data/womenPhotoStylesData";
import { useSession, signIn } from "next-auth/react";
import { AiOutlineCloudUpload, AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import Link from "next/link";
import clsx from "clsx";
import imageCompression from 'browser-image-compression';
import { env } from "~/env.mjs";
import { Input } from "~/component/Input";

// Type definitions
interface PhotoStyleItem { src: string; basePrompt: string; name: string; textPromptEnhancer?: string;}
interface PhotoStyleSubCategory { [subcategoryName: string]: PhotoStyleItem[]; }
interface PhotoStyleCategory { [categoryName: string]: PhotoStyleSubCategory; }
type PhotoAIModel = "flux-kontext-pro" | "flux-kontext-max";
type AspectRatio = 'match_input_image' | '1:1' | '16:9' | '9:16';

const AIPortraitGeneratorPage: NextPage = () => {
    const { data: session } = useSession();
    const isLoggedIn = !!session;

    // State
    const [activeGender, setActiveGender] = useState<'men' | 'women'>('men');
    const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
    const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
    const [activeStyleTab, setActiveStyleTab] = useState<string>("");
    const [activeStyleSubTab, setActiveStyleSubTab] = useState<string>("");
    const [selectedStyleBasePrompt, setSelectedStyleBasePrompt] = useState<string>("");
    const [selectedStyleImagePreview, setSelectedStyleImagePreview] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<PhotoAIModel>("flux-kontext-pro");
    const [error, setError] = useState<string>("");
    const [imagesUrl, setImagesUrl] = useState<{ imageUrl: string }[]>([]);
    const [popupImage, setPopupImage] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [generationStatus, setGenerationStatus] = useState<"idle" | "uploading" | "generating" | "done">("idle");
    const isProcessing = generationStatus === "uploading" || generationStatus === "generating";
    const [optionalText, setOptionalText] = useState<string>("");
    const [selectedStyleTextEnhancer, setSelectedStyleTextEnhancer] = useState<string | undefined>();
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('match_input_image');
    
    // Refs for scrollable tabs
    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const subcategoryScrollRef = useRef<HTMLDivElement>(null);
    const [showLeftCategoryArrow, setShowLeftCategoryArrow] = useState<boolean>(false);
    const [showRightCategoryArrow, setShowRightCategoryArrow] = useState<boolean>(false);
    const [showLeftSubCategoryArrow, setShowLeftSubCategoryArrow] = useState<boolean>(false);
    const [showRightSubCategoryArrow, setShowRightSubCategoryArrow] = useState<boolean>(false);

    // Data handling
    const activeStylesData = activeGender === 'men' ? menPhotoStylesData : womenPhotoStylesData;
    const typedActiveStylesData: PhotoStyleCategory = activeStylesData as PhotoStyleCategory;

    // Handlers
    const handleScroll = (ref: React.RefObject<HTMLDivElement>, setLeft: (val: boolean) => void, setRight: (val: boolean) => void) => {
        if(ref.current) {
            const { scrollLeft, scrollWidth, clientWidth } = ref.current;
            setLeft(scrollLeft > 10);
            setRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };
    const scrollCategories = (direction: 'left' | 'right') => categoryScrollRef.current?.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: "smooth"});
    const scrollSubCategories = (direction: 'left' | 'right') => subcategoryScrollRef.current?.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: "smooth"});
    
    // Effects
    useLayoutEffect(() => {
        handleScroll(categoryScrollRef, setShowLeftCategoryArrow, setShowRightCategoryArrow);
        handleScroll(subcategoryScrollRef, setShowLeftSubCategoryArrow, setShowRightSubCategoryArrow);
    }, [activeStyleTab, activeStyleSubTab]);

    useEffect(() => {
        const firstCategory = Object.keys(typedActiveStylesData)[0];
        if (firstCategory) {
            setActiveStyleTab(firstCategory);
            const firstSubCategory = Object.keys(typedActiveStylesData[firstCategory]!)?.[0];
            if (firstSubCategory) setActiveStyleSubTab(firstSubCategory);
        }
    }, [activeGender, typedActiveStylesData]);
    
    const handleStyleSelect = useCallback((item: PhotoStyleItem) => {
        setSelectedStyleBasePrompt(item.basePrompt);
        setSelectedStyleImagePreview(item.src);
        setSelectedStyleTextEnhancer(item.textPromptEnhancer);
    }, []);

    useEffect(() => {
    if (activeStyleTab && activeStyleSubTab) {
            const styles = typedActiveStylesData[activeStyleTab]?.[activeStyleSubTab];
            if (styles?.[0]) {
                handleStyleSelect(styles[0]); // Pass the whole item object
            }
        }
    }, [activeStyleTab, activeStyleSubTab, handleStyleSelect, typedActiveStylesData]);
    
    // tRPC Mutations
    const { mutateAsync: createPresignedUrl } = api.s3.createPresignedUrl.useMutation();
    const { mutate: triggerGeneratePhotoGift } = api.photoGift.generatePhotoGift.useMutation({
        onSuccess(data) { setImagesUrl([data]); setError(""); setGenerationStatus("done"); document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" }); },
        onError(error) { setError(error.message.includes("credits") ? "INSUFFICIENT_CREDITS" : error.message); setGenerationStatus("idle"); },
    });

    // Form and Action Handlers
    const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const compressedFile = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 1024, useWebWorker: true });
                setUploadedImageFile(compressedFile); setUploadedImagePreview(URL.createObjectURL(compressedFile)); setError("");
            } catch (e) { setError("Could not process image."); }
        }
    };

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setImagesUrl([]);

        if (!isLoggedIn) { void signIn("google"); return; }
        if (!uploadedImageFile) { setError("Please upload a photo."); return; }
        if (!selectedStyleBasePrompt) { setError("Please select an artistic style."); return; }

        try {
            setGenerationStatus("uploading");
            const { url, fields, publicUrl } = await createPresignedUrl({
                filetype: uploadedImageFile.type,
                filename: ""
            });

            const formData = new FormData();
            Object.entries({ ...fields, file: uploadedImageFile }).forEach(([key, value]) => {
                formData.append(key, value as string | Blob);
            });
            await fetch(url, { method: "POST", body: formData });

            setGenerationStatus("generating");
            
            // This is the base prompt from the selected style
            let finalPrompt = selectedStyleBasePrompt;

            // Append the AI text instruction if text is provided
            const userText = optionalText.trim();
            if (userText) {
                // This is the new, intelligent prompt building logic
                const textInstruction = selectedStyleTextEnhancer
                    ? `Add overlay text that reads '${userText}' ${selectedStyleTextEnhancer}` // Use the specific enhancer
                    : `Add elegant overlay text that reads '${userText}' in a clean, modern sans-serif font, positioned subtly at the bottom of the image.`; // Fallback to the generic one

                finalPrompt += `. ${textInstruction}`;
            }

            if (selectedModel === "flux-kontext-max") {
                finalPrompt += `, ultra detailed face, cinematic lighting, masterpiece`;
            }

            // Pass the optionalText to the mutation for database/logging purposes if needed,
            // but the key change is constructing the finalPrompt here.
            triggerGeneratePhotoGift({
                prompt: finalPrompt, // We send the fully constructed prompt
                inputImageS3Url: publicUrl,
                model: selectedModel,
                optionalText: userText,
                aspectRatio: selectedAspectRatio,
            });
        } catch (err) {
            console.error("Error during upload/generation process:", err);
            setError("An error occurred. Please try again.");
            setGenerationStatus("idle");
        }
    };

    const aspectRatioOptions: { label: string; value: AspectRatio; visualClass?: string; icon?: React.ReactNode }[] = [
        { label: "Match Input", value: "match_input_image", icon: <FiImage className="h-8 w-8 text-slate-500" /> },
        { label: "Square (1:1)", value: "1:1", visualClass: "aspect-square" },
        { label: "Portrait (9:16)", value: "9:16", visualClass: "aspect-[9/16]" },
        { label: "Landscape (16:9)", value: "16:9", visualClass: "aspect-video" },
    ];
    
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
    const getButtonText = () => {
        const COST_PER_GENERATION = 10;
        if (!isLoggedIn) return "Sign In to Create";
        if (generationStatus === 'uploading') return 'Uploading Photo...';
        if (generationStatus === 'generating') return 'Creating Your Art...';
        
        return `Generate (${COST_PER_GENERATION} Credits)`;
    };
    
    const modelOptions: { name: string; value: PhotoAIModel; cost: number; desc: string; recommended?: boolean }[] = [ /* ... model options ... */ ];

    return (
        <>
            <Head>
                <title>AI Portrait Generator | Custom Photo Gifts</title>
                <meta name="description" content="Turn any photo into a stunning, AI-generated portrait. Create the perfect personalized gift for anyone with unique artistic styles for men and women." />
            </Head>
            <main className="container m-auto mb-24 flex flex-col px-4 sm:px-8 py-8 max-w-screen-lg">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold">AI Portrait Generator</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300 mt-4">Create a one-of-a-kind gift. Upload a photo, pick a style, and let our AI turn it into a masterpiece.</p>
                </header>

                <form className="flex flex-col gap-10" onSubmit={(e) => { void handleFormSubmit(e); }}>
                    {/* STEP 1: GENDER SELECTION */}
                    <FormGroup>
                        <h2 className="text-xl font-semibold mb-4">1. Choose a Subject</h2>
                        {/* 
                        NEW: A centered container with a maximum width. 
                        This is the key to making the selection smaller.
                        */}
                        <div className="max-w-md mx-auto">
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                {/* Men Button */}
                                <div 
                                    onClick={() => setActiveGender('men')} 
                                    className={clsx(
                                        // KEPT: aspect-square as you requested.
                                        // KEPT: flexbox to place text at the bottom.
                                        'relative flex items-end p-3 sm:p-4 rounded-xl transition-all duration-300 cursor-pointer group overflow-hidden aspect-square', 
                                        activeGender === 'men' ? 'ring-4 ring-offset-2 ring-blue-500' : 'hover:opacity-90'
                                    )}
                                >
                                    <Image 
                                        src="/images/photo-styles/men-category.webp" 
                                        alt="Man portrait example" 
                                        layout="fill" 
                                        objectFit="cover" 
                                        className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-110" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                    <h3 
                                        // TWEAKED: Slightly adjusted text size for the smaller scale.
                                        className="relative z-20 text-xl sm:text-2xl font-bold text-white text-shadow-md"
                                    >
                                        For Men
                                    </h3>
                                </div>
                                {/* Women Button */}
                                <div 
                                    onClick={() => setActiveGender('women')} 
                                    className={clsx(
                                        'relative flex items-end p-3 sm:p-4 rounded-xl transition-all duration-300 cursor-pointer group overflow-hidden aspect-square', 
                                        activeGender === 'women' ? 'ring-4 ring-offset-2 ring-blue-500' : 'hover:opacity-90'
                                    )}
                                >
                                    <Image 
                                        src="/images/photo-styles/women-category.webp" 
                                        alt="Woman portrait example" 
                                        layout="fill" 
                                        objectFit="cover" 
                                        className="absolute inset-0 z-0 transition-transform duration-500 group-hover:scale-110" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                    <h3 
                                        className="relative z-20 text-xl sm:text-2xl font-bold text-white text-shadow-md"
                                    >
                                        For Women
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </FormGroup>
                    
                    {/* STEP 2: UPLOAD PHOTO */}
                    <FormGroup>
                        <h2 className="text-xl font-semibold mb-4">2. Upload a Photo</h2>
                        <label htmlFor="face-image-upload" className={clsx("mt-1 flex justify-center items-center w-full h-52 sm:h-64 px-6 pt-5 pb-6 border-2 rounded-xl cursor-pointer transition-colors", "border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100")}>
                            <div className="space-y-1 text-center">
                                {uploadedImagePreview ? (<Image src={uploadedImagePreview} alt="Uploaded photo preview" width={128} height={128} className="mx-auto h-32 w-32 sm:h-40 sm:w-40 rounded-lg object-cover shadow-md" />) : (<AiOutlineCloudUpload className="mx-auto h-12 w-12 text-slate-400" />)}
                                <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                                    <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-700">
                                        <span>{uploadedImageFile ? "Change photo" : "Upload a file"}</span>
                                        <input id="face-image-upload" type="file" className="sr-only" onChange={(e) => { void handleImageUpload(e); }} accept="image/png, image/jpeg, image/webp" />
                                    </span>
                                </div><p className="text-xs text-slate-500">Clear, well-lit photos work best.</p>
                            </div>
                        </label>
                    </FormGroup>

                    {/* STEP 3: ADD OPTIONAL TEXT (NEW) */}
                    <FormGroup>
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            3. Add Text (Optional)
                            <span className="text-sm font-normal text-slate-500 ml-2">(keep it blank for no text)</span>
                        </h2>
                        <Input
                            value={optionalText}
                            onChange={(e) => setOptionalText(e.target.value)}
                            placeholder="World's Best Dad, Sophia 2024, etc."
                        />
                    </FormGroup>

                    {/* STEP 4: CHOOSE STYLE */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">3. Pick an Art Style</h2>
                        <div className="relative border-b dark:border-gray-700">
                            {showLeftCategoryArrow && <button type="button" onClick={() => scrollCategories('left')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineLeft className="h-5 w-5"/></button>}
                            <div ref={categoryScrollRef} onScroll={() => handleScroll(categoryScrollRef, setShowLeftCategoryArrow, setShowRightCategoryArrow)} className="flex overflow-x-auto no-scrollbar">
                                {Object.keys(typedActiveStylesData).map((catKey) => (
                                <button key={catKey} type="button" onClick={() => { setActiveStyleTab(catKey); setActiveStyleSubTab(Object.keys(typedActiveStylesData[catKey]!)[0]!); }} className={`px-4 py-2 whitespace-nowrap font-semibold ${activeStyleTab === catKey ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}`}>
                                    {catKey}
                                </button>
                                ))}
                            </div>
                            {showRightCategoryArrow && <button type="button" onClick={() => scrollCategories('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineRight className="h-5 w-5"/></button>}
                        </div>

                        <div className="relative mt-4">
                            {showLeftSubCategoryArrow && <button type="button" onClick={() => scrollSubCategories('left')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineLeft className="h-5 w-5"/></button>}
                            <div ref={subcategoryScrollRef} onScroll={() => handleScroll(subcategoryScrollRef, setShowLeftSubCategoryArrow, setShowRightSubCategoryArrow)} className="flex overflow-x-auto no-scrollbar space-x-2">
                                {(Object.keys(typedActiveStylesData[activeStyleTab] ?? {})).map((sub) => (
                                <button key={sub} type="button" onClick={() => setActiveStyleSubTab(sub)} className={`px-3 py-1.5 whitespace-nowrap text-sm rounded-full ${activeStyleSubTab === sub ? 'bg-blue-500 text-white font-semibold' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                                    {sub}
                                </button>
                                ))}
                            </div>
                            {showRightSubCategoryArrow && <button type="button" onClick={() => scrollSubCategories('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineRight className="h-5 w-5"/></button>}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                            {(typedActiveStylesData[activeStyleTab]?.[activeStyleSubTab] ?? []).map((item, idx) => (
                                <div key={idx} className={clsx(`relative group cursor-pointer overflow-hidden rounded-lg shadow-md transition-all duration-200 hover:shadow-xl`, selectedStyleImagePreview === item.src ? "ring-4 ring-offset-2 ring-blue-500" : "")} onClick={() => handleStyleSelect(item)}>
                                    <Image src={item.src} alt={item.name} width={200} height={200} className="w-full h-auto aspect-square object-cover"/>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* STEP 5: Choose Image Size */}
                    <FormGroup>
                        <h2 className="text-xl font-semibold mb-4">5. Choose Image Size</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {aspectRatioOptions.map((ratio) => {
                                // NEW: Check if this is the "Match Input" button and if a preview exists
                                const isMatchInputButton = ratio.value === 'match_input_image';
                                const showUploadedPreview = isMatchInputButton && uploadedImagePreview;

                                return (
                                    <button
                                        key={ratio.value}
                                        type="button"
                                        onClick={() => setSelectedAspectRatio(ratio.value)}
                                        className={clsx(
                                            'flex flex-col items-center justify-start border-2 rounded-lg p-3 sm:p-4 transition-all duration-200 text-center bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg',
                                            selectedAspectRatio === ratio.value
                                                ? "border-blue-500 ring-2 ring-blue-500"
                                                : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                                        )}
                                    >
                                        <div className="w-full h-20 mb-2 flex items-center justify-center">
                                            <div
                                                className={clsx(
                                                    "h-full rounded-md flex items-center justify-center bg-slate-100 dark:bg-slate-700",
                                                    // Apply aspect ratio class only if it's NOT the match button with a preview
                                                    !showUploadedPreview && ratio.visualClass,
                                                    // If it IS the match button with a preview, make it cover the area
                                                    showUploadedPreview && "w-full bg-cover bg-center"
                                                )}
                                                // NEW: Dynamically set a background image if a preview is available
                                                style={showUploadedPreview ? { backgroundImage: `url(${uploadedImagePreview})` } : {}}
                                            >
                                                {/* 
                                                Only show an icon or text if we are NOT showing the user's photo preview.
                                                */}
                                                {!showUploadedPreview && (
                                                    ratio.icon ? ratio.icon : (
                                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{ratio.label.match(/\((.*)\)/)?.[1]}</span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                        {/* NEW: Updated the label for clarity */}
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            {isMatchInputButton ? "Match Photo Size" : ratio.label.split(' ')[0]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </FormGroup>

                    {/* The rest of the page remains the same */}
                    <Button type="submit" isLoading={isProcessing} disabled={isProcessing || !uploadedImageFile} className="w-full text-lg font-semibold py-4">{getButtonText()}</Button>
                </form>

                {/* RESULTS */}
                {imagesUrl.length > 0 && (
                    <section id="results-section" className="mt-12">
                        <h2 className="text-3xl font-semibold mb-6 text-center">Your Masterpiece is Ready!</h2>
                        <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
                            {imagesUrl.map(({ imageUrl }, index) => (
                            <div key={imageUrl} className="relative group rounded-xl shadow-lg hover:shadow-2xl transition-all aspect-square overflow-hidden border-2 hover:border-blue-500">
                                <Image src={imageUrl} alt={`Generated portrait ${index + 1}`} fill style={{ objectFit: "cover" }} />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button type="button" onClick={() => openPopup(imageUrl)} className="py-2 px-4 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md font-semibold">View</button>
                                    <button type="button" onClick={() => { void handleDownload(imageUrl); }} disabled={!!isDownloading} className="py-2 px-4 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md font-semibold">Download</button>
                                </div>
                            </div>))}
                        </div>
                    </section>
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
        
            </main>
        </>
    );
};

export default AIPortraitGeneratorPage;