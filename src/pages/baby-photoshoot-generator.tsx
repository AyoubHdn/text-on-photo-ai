// src/pages/ai-photo-gifts/baby-generator.tsx

import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import React, { useState, useEffect, useRef, useCallback, ChangeEvent, useLayoutEffect } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "~/component/Input";
import { babyPhotoStylesData } from "~/data/babyPhotoStylesData"; // IMPORTING BABY DATA
import { useSession, signIn } from "next-auth/react";
import { AiOutlineCloudUpload, AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { FiImage } from "react-icons/fi";
import Link from "next/link";
import clsx from "clsx";
import imageCompression from 'browser-image-compression';
import { env } from "~/env.mjs";
import { FaBabyCarriage, FaBaby } from "react-icons/fa";

// Type definitions remain the same
interface PhotoStyleItem { src: string; basePrompt: string; name: string; textPromptEnhancer?: string; }
interface PhotoStyleSubCategory { [subcategoryName: string]: PhotoStyleItem[]; }
interface PhotoStyleCategory { [categoryName: string]: PhotoStyleSubCategory; }
type PhotoAIModel = "flux-kontext-pro"; // Simplified to one model
type AspectRatio = 'match_input_image' | '1:1' | '16:9' | '9:16';

const AIBabyPhotoshootGeneratorPage: NextPage = () => {
    const { data: session } = useSession();
    const isLoggedIn = !!session;

    const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
    const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
    const [activeStyleTab, setActiveStyleTab] = useState<string>("");
    const [activeStyleSubTab, setActiveStyleSubTab] = useState<string>("");
    const [selectedStyleBasePrompt, setSelectedStyleBasePrompt] = useState<string>("");
    const [selectedStyleImagePreview, setSelectedStyleImagePreview] = useState<string | null>(null);
    const [selectedStyleTextEnhancer, setSelectedStyleTextEnhancer] = useState<string | undefined>();
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('match_input_image');
    const [optionalText, setOptionalText] = useState<string>("");
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [error, setError] = useState<string>("");
    const [imagesUrl, setImagesUrl] = useState<{ imageUrl: string }[]>([]);
    const [popupImage, setPopupImage] = useState<string | null>(null);
    const [generationStatus, setGenerationStatus] = useState<"idle" | "uploading" | "generating" | "done">("idle");
    const isProcessing = generationStatus === "uploading" || generationStatus === "generating";
    const [selectedGender, setSelectedGender] = useState<'boy' | 'girl'>('girl');
    const [babyAge, setBabyAge] = useState<string>("1 Month");
    const ageScrollRef = useRef<HTMLDivElement>(null);
    const [showLeftAgeArrow, setShowLeftAgeArrow] = useState(false);
    const [showRightAgeArrow, setShowRightAgeArrow] = useState(false);
    
    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const subcategoryScrollRef = useRef<HTMLDivElement>(null);
    const [showLeftCategoryArrow, setShowLeftCategoryArrow] = useState<boolean>(false);
    const [showRightCategoryArrow, setShowRightCategoryArrow] = useState<boolean>(false);
    const [showLeftSubCategoryArrow, setShowLeftSubCategoryArrow] = useState<boolean>(false);
    const [showRightSubCategoryArrow, setShowRightSubCategoryArrow] = useState<boolean>(false);

    const typedBabyStylesData: PhotoStyleCategory = babyPhotoStylesData as PhotoStyleCategory;

    const ageOptions = [
        { value: "Newborn", label: "Newborn" },
        { value: "1 Month", label: "1 Month" },
        { value: "2 Months", label: "2 Months" },
        { value: "3 Months", label: "3 Months" },
        { value: "4 Months", label: "4 Months" },
        { value: "5 Months", label: "5 Months" },
        { value: "6 Months", label: "6 Months" },
        { value: "7 Months", label: "7 Months" },
        { value: "8 Months", label: "8 Months" },
        { value: "9 Months", label: "9 Months" },
        { value: "10 Months", label: "10 Months" },
        { value: "11 Months", label: "11 Months" },
        { value: "First Birthday", label: "1st B-Day" },
    ];

    const checkScrollArrows = useCallback(() => {
        if (categoryScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
            setShowLeftCategoryArrow(scrollLeft > 1);
            setShowRightCategoryArrow(scrollLeft + clientWidth < scrollWidth - 1);
        }
        if (subcategoryScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = subcategoryScrollRef.current;
            setShowLeftSubCategoryArrow(scrollLeft > 1);
            setShowRightSubCategoryArrow(scrollLeft + clientWidth < scrollWidth - 1);
        }
        if (ageScrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = ageScrollRef.current;
            setShowLeftAgeArrow(scrollLeft > 1);
            setShowRightAgeArrow(scrollLeft + clientWidth < scrollWidth - 1);
        }
    }, []);

    useEffect(() => {
        // A short timeout is needed to allow the browser to render the new tabs 
        // before we check their scroll width.
        const timer = setTimeout(() => {
            checkScrollArrows();
        }, 100);

        window.addEventListener('resize', checkScrollArrows);

        // Cleanup function to prevent memory leaks
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkScrollArrows);
        };
    }, [activeStyleTab, checkScrollArrows]); 

    // Effects for initializing and updating styles
    useEffect(() => {
        const firstCategory = Object.keys(typedBabyStylesData)[0];
        if (firstCategory) {
            setActiveStyleTab(firstCategory);
            const firstSubCategory = Object.keys(typedBabyStylesData[firstCategory]!)?.[0];
            if (firstSubCategory) setActiveStyleSubTab(firstSubCategory);
        }
    }, []);
    
    const handleStyleSelect = useCallback((item: PhotoStyleItem) => {
        setSelectedStyleBasePrompt(item.basePrompt);
        setSelectedStyleImagePreview(item.src);
        setSelectedStyleTextEnhancer(item.textPromptEnhancer);
    }, []);

    const handleScroll = (ref: React.RefObject<HTMLDivElement>, setLeft: (val: boolean) => void, setRight: (val: boolean) => void) => {
            if(ref.current) {
                const { scrollLeft, scrollWidth, clientWidth } = ref.current;
                setLeft(scrollLeft > 4);
                setRight(scrollLeft < scrollWidth - clientWidth - 4);
            }
        };
    const scrollCategories = (direction: 'left' | 'right') => categoryScrollRef.current?.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: "smooth"});
    const scrollSubCategories = (direction: 'left' | 'right') => subcategoryScrollRef.current?.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: "smooth"});
    const scrollAges = (direction: 'left' | 'right') => ageScrollRef.current?.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: "smooth"});

    useEffect(() => {
        if (activeStyleTab && activeStyleSubTab) {
            const styles = typedBabyStylesData[activeStyleTab]?.[activeStyleSubTab];
            if (styles?.[0]) handleStyleSelect(styles[0]);
        }
    }, [activeStyleTab, activeStyleSubTab, handleStyleSelect, typedBabyStylesData]);
    
    // tRPC Mutations (reused, no changes needed in logic)
    const { mutateAsync: createPresignedUrl } = api.s3.createPresignedUrl.useMutation();
    const { mutate: triggerGeneratePhotoGift } = api.photoGift.generatePhotoGift.useMutation({
        onSuccess(data) { setImagesUrl([data]); setError(""); setGenerationStatus("done"); document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" }); },
        onError(error) { setError(error.message.includes("credits") ? "INSUFFICIENT_CREDITS" : error.message); setGenerationStatus("idle"); },
    });

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
        e.preventDefault(); setError(""); setImagesUrl([]);
        if (!isLoggedIn) { void signIn("google"); return; }
        if (!babyAge.trim()) { setError("Please enter the baby's age."); return; }
        if (!uploadedImageFile) { setError("Please upload a photo of your baby."); return; }
        if (!selectedStyleBasePrompt) { setError("Please select a photoshoot style."); return; }
        try {
            setGenerationStatus("uploading");
            const { url, fields, publicUrl } = await createPresignedUrl({
                filetype: uploadedImageFile.type,
                filename: ""
            });
            const formData = new FormData();
            Object.entries({ ...fields, file: uploadedImageFile }).forEach(([key, value]) => { formData.append(key, value as string | Blob); });
            await fetch(url, { method: "POST", body: formData });
            setGenerationStatus("generating");

            let finalPrompt = selectedStyleBasePrompt.replace(/\[Age\]/gi, babyAge.trim());

            const genderTerm = selectedGender === 'boy' ? 'baby boy' : 'baby girl';
            finalPrompt = finalPrompt.replace(/baby/gi, genderTerm);

            const userText = optionalText.trim();
            if (userText) {
                const textInstruction = selectedStyleTextEnhancer
                    ? `Add overlay text that reads '${userText}' ${selectedStyleTextEnhancer}`
                    : `Add cute overlay text that reads '${userText}' in a friendly, gentle font, positioned beautifully at the bottom.`;
                finalPrompt += `. ${textInstruction}`;
            }

            triggerGeneratePhotoGift({
                prompt: finalPrompt,
                inputImageS3Url: publicUrl,
                model: 'flux-kontext-pro', // Using the single model
                optionalText: userText,
                aspectRatio: selectedAspectRatio,
            });
        } catch (err) { setError("An error occurred. Please try again."); setGenerationStatus("idle"); }
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
    const getButtonText = () => {
        const COST_PER_GENERATION = 4;
        if (!isLoggedIn) return "Sign In to Create";
        if (generationStatus === 'uploading') return 'Uploading Photo...';
        if (generationStatus === 'generating') return 'Creating a Magical Photoshoot...';
        return `Create Photoshoot! (${COST_PER_GENERATION} Credits)`;
    };
    
    const aspectRatioOptions: { label: string; value: AspectRatio; visualClass?: string; icon?: React.ReactNode }[] = [
            { label: "Match Input", value: "match_input_image", icon: <FiImage className="h-8 w-8 text-slate-500" /> },
            { label: "Square (1:1)", value: "1:1", visualClass: "aspect-square" },
            { label: "Portrait (9:16)", value: "9:16", visualClass: "aspect-[9/16]" },
            { label: "Landscape (16:9)", value: "16:9", visualClass: "aspect-video" },
        ];

    return (
        <>
            <Head>
                <title>AI Baby Photoshoot Generator | Create Milestone & Themed Pictures</title>
                <meta name="description" content="Turn any baby photo into a professional-quality photoshoot with our AI generator. Create beautiful milestone, seasonal, and themed pictures in seconds. Perfect for announcements and gifts."/>
                <link rel="canonical" href="https://www.namedesignai.com/baby-photoshoot-generator" />
            </Head>
            <main className="container m-auto mb-24 flex flex-col px-4 sm:px-8 py-8 max-w-screen-lg">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold">AI Baby Photoshoot Generator</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300 mt-4">Create adorable, professional photoshoots for your little one in seconds. Perfect for milestones, announcements, and cherished memories.</p>
                </header>

                <form className="flex flex-col gap-10" onSubmit={(e) => { void handleFormSubmit(e); }}>
                

                    {/* STEP 1: UPLOAD PHOTO */}
                    <FormGroup>
                        <h2 className="text-xl font-semibold mb-4">1. Upload a Photo of Your Baby</h2>
                        <label htmlFor="baby-image-upload" className={clsx("mt-1 flex justify-center items-center w-full h-52 sm:h-64 px-6 pt-5 pb-6 border-2 rounded-xl cursor-pointer transition-colors", "border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100")}>
                            <div className="space-y-1 text-center">
                                {uploadedImagePreview ? (<Image src={uploadedImagePreview} alt="Uploaded baby photo preview" width={128} height={128} className="mx-auto h-32 w-32 sm:h-40 sm:w-40 rounded-full object-cover shadow-md" />) : (<AiOutlineCloudUpload className="mx-auto h-12 w-12 text-slate-400" />)}
                                <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                                    <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-700">
                                        <span>{uploadedImageFile ? "Change photo" : "Upload a file"}</span>
                                        <input id="baby-image-upload" type="file" className="sr-only" onChange={(e) => { void handleImageUpload(e); }} accept="image/png, image/jpeg, image/webp" />
                                    </span>
                                </div><p className="text-xs text-slate-500">Clear photos of your baby&apos;s face work best.</p>
                            </div>
                        </label>
                    </FormGroup>

                    <FormGroup>
                        <h2 className="text-xl font-semibold mb-4">2. Is your baby a boy or a girl?</h2>
                        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                            {/* Boy Button */}
                            <button
                                type="button"
                                onClick={() => setSelectedGender('boy')}
                                className={clsx(
                                    'flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-lg',
                                    selectedGender === 'boy'
                                        ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800'
                                )}
                            >
                                <FaBabyCarriage className="h-8 w-8 text-blue-500" />
                                <span className="font-semibold text-slate-700 dark:text-slate-200">Boy</span>
                            </button>
                            {/* Girl Button */}
                            <button
                                type="button"
                                onClick={() => setSelectedGender('girl')}
                                className={clsx(
                                    'flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-lg',
                                    selectedGender === 'girl'
                                        ? 'border-pink-500 ring-2 ring-pink-500 bg-pink-50 dark:bg-pink-900/30'
                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800'
                                )}
                            >
                                <FaBaby className="h-8 w-8 text-pink-500" />
                                <span className="font-semibold text-slate-700 dark:text-slate-200">Girl</span>
                            </button>
                        </div>
                    </FormGroup>

                    <FormGroup>
                    <h2 className="text-xl font-semibold mb-4">3. Select Baby&apos;s Age</h2>
                    <div className="relative flex items-center">
                        {showLeftAgeArrow && (
                            <button type="button" onClick={() => scrollAges('left')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600">
                                <AiOutlineLeft className="h-5 w-5"/>
                            </button>
                        )}
                        <div ref={ageScrollRef} onScroll={checkScrollArrows} className="flex overflow-x-auto no-scrollbar space-x-2 py-2">
                            {ageOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setBabyAge(option.value)}
                                    className={clsx(
                                        'px-4 py-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 shadow-sm',
                                        babyAge === option.value
                                            ? 'bg-blue-500 text-white scale-105'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        {showRightAgeArrow && (
                            <button type="button" onClick={() => scrollAges('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600">
                                <AiOutlineRight className="h-5 w-5"/>
                            </button>
                        )}
                    </div>
                </FormGroup>
                    
                    {/* STEP 2: OPTIONAL TEXT */}
                    <FormGroup>
                        <h2 className="text-xl font-semibold mb-4">2. Add Optional Text <span className="text-sm font-normal text-slate-500 ml-2">(Name, Age, etc.)</span></h2>
                        <Input value={optionalText} onChange={(e) => setOptionalText(e.target.value)} placeholder="e.g., Emma - 6 Months, Our Little Star" />
                    </FormGroup>

                    {/* STEP 3: PICK A STYLE */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">3. Pick a Photoshoot Style</h2>
                        {/* Tab UI for categories and subcategories... same as portrait generator */}
                        <div className="relative border-b dark:border-gray-700">
                            {showLeftCategoryArrow && <button type="button" onClick={() => scrollCategories('left')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineLeft className="h-5 w-5"/></button>}
                            <div ref={categoryScrollRef} onScroll={() => handleScroll(categoryScrollRef, setShowLeftCategoryArrow, setShowRightCategoryArrow)} className="flex overflow-x-auto no-scrollbar">
                                {Object.keys(typedBabyStylesData).map((catKey) => (
                                <button key={catKey} type="button" onClick={() => { setActiveStyleTab(catKey); setActiveStyleSubTab(Object.keys(typedBabyStylesData[catKey]!)[0]!); }} className={`px-4 py-2 whitespace-nowrap font-semibold ${activeStyleTab === catKey ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}`}>
                                    {catKey}
                                </button>
                                ))}
                            </div>
                            {showRightCategoryArrow && <button type="button" onClick={() => scrollCategories('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineRight className="h-5 w-5"/></button>}
                        </div>

                        <div className="relative mt-4">
                            {showLeftSubCategoryArrow && <button type="button" onClick={() => scrollSubCategories('left')} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineLeft className="h-5 w-5"/></button>}
                            <div ref={subcategoryScrollRef} onScroll={() => handleScroll(subcategoryScrollRef, setShowLeftSubCategoryArrow, setShowRightSubCategoryArrow)} className="flex overflow-x-auto no-scrollbar space-x-2">
                                {(Object.keys(typedBabyStylesData[activeStyleTab] ?? {})).map((sub) => (
                                <button key={sub} type="button" onClick={() => setActiveStyleSubTab(sub)} className={`px-3 py-1.5 whitespace-nowrap text-sm rounded-full ${activeStyleSubTab === sub ? 'bg-blue-500 text-white font-semibold' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                                    {sub}
                                </button>
                                ))}
                            </div>
                            {showRightSubCategoryArrow && <button type="button" onClick={() => scrollSubCategories('right')} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600"><AiOutlineRight className="h-5 w-5"/></button>}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                            {(typedBabyStylesData[activeStyleTab]?.[activeStyleSubTab] ?? []).map((item, idx) => (
                                <div key={idx} className={clsx(`relative group cursor-pointer overflow-hidden rounded-lg shadow-md transition-all duration-200 hover:shadow-xl`, selectedStyleImagePreview === item.src ? "ring-4 ring-offset-2 ring-blue-500" : "")} onClick={() => handleStyleSelect(item)}>
                                    <Image src={item.src} alt={item.name} width={200} height={200} className="w-full h-auto aspect-square object-cover"/>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* STEP 4: CHOOSE IMAGE SIZE */}
                    <FormGroup>
                        <h2 className="text-xl font-semibold mb-4">4. Choose Image Size</h2>
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
                    
                    {/* ... (No quality selection as we're using one model) ... */}
                    
                    {error && (
                        <div 
                            className={clsx(
                                'my-4 p-4 border-l-4 rounded-md',
                                error === "INSUFFICIENT_CREDITS" 
                                    ? "bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-200" 
                                    : "bg-red-50 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-200"
                            )}
                            role="alert"
                        >
                            <h3 className="font-bold">
                                {error === "INSUFFICIENT_CREDITS" ? "Not Enough Credits" : "An Error Occurred"}
                            </h3>
                            <p className="mt-1 text-sm">
                                {error === "INSUFFICİENT_CREDITS"
                                    ? "You don't have enough credits to perform this action."
                                    : error}
                                
                                {error === "INSUFFICIENT_CREDITS" && (
                                    <Link href="/buy-credits" className="font-medium underline ml-1 hover:text-yellow-600 dark:hover:text-yellow-100">
                                        Purchase more credits to continue.
                                    </Link>
                                )}
                            </p>
                        </div>
                    )}
                    
                    <Button type="submit" isLoading={isProcessing} disabled={isProcessing || !uploadedImageFile} className="w-full text-lg font-semibold py-4">{getButtonText()}</Button>
                </form>

                {/* RESULTS */}
                {imagesUrl.length > 0 && (
                    <section id="results-section" className="mt-12">
                        <h2 className="text-3xl font-semibold mb-6 text-center">Your Baby&apos;s Photoshoot is Ready!</h2>
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

export default AIBabyPhotoshootGeneratorPage;