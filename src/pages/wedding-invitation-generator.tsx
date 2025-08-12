/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// pages/wedding-invitation-generator.tsx
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import React, { useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "~/component/Input";
import { AiStyle, weddingStylesData, type WeddingStyle } from "~/data/weddingStylesData"; 
import { useSession, signIn } from "next-auth/react";
import { ShareModal } from '~/component/ShareModal';
import { FiUploadCloud, FiChevronLeft, FiChevronRight } from "react-icons/fi";

type HostingOption = 'couple' | 'coupleAndParents' | 'parents';
type ReceptionOption = 'none' | 'differentLocation' | 'sameLocation';
const initialFormData = { brideName: "", groomName: "", weddingDate: "", weddingTime: "", venueName: "", venueAddress: "", hostingOption: 'couple' as HostingOption, brideParents: "", groomParents: "", receptionOption: 'none' as ReceptionOption, receptionVenue: "", };

const WeddingInvitationGeneratorPage: NextPage = () => {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  const aiStyleScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<WeddingStyle | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState<string>("");
  const detailsFormRef = useRef<HTMLFormElement>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [stage1ImageUrl, setStage1ImageUrl] = useState<string | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [popupImage, setPopupImage] = useState<string | null>(null);
  const [shareModalData, setShareModalData] = useState<{ isOpen: boolean; imageUrl: string | null }>({ isOpen: false, imageUrl: null });
  const [selectedAiStyle, setSelectedAiStyle] = useState<AiStyle | null>(null);

  const createPresignedUrl = api.s3.createPresignedUrl.useMutation();
  
const handleAiScroll = () => {
    if (aiStyleScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = aiStyleScrollRef.current;
      setShowLeftArrow(scrollLeft > 10); // Show if scrolled more than 10px
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10); // Hide if at the end
    }
  };

  const scrollLeft = () => {
    aiStyleScrollRef.current?.scrollBy({ left: -150, behavior: 'smooth' });
  };

  const scrollRight = () => {
    aiStyleScrollRef.current?.scrollBy({ left: 150, behavior: 'smooth' });
  };

  // Check scroll position on mount and when styles change
  useLayoutEffect(() => {
    handleAiScroll();
  }, [selectedStyle]);

  const generateStage1 = api.wedding.generateInvitation.useMutation({
    onSuccess: (data) => { setStage1ImageUrl(data[0]?.imageUrl ?? null); setFinalImageUrl(null); setError(""); },
    onError: (error) => setError(error.message),
    onSettled: () => setIsGenerating(false),
  });

  const generateStage2 = api.enhancement.enhanceImage.useMutation({
    onSuccess: (data) => { setFinalImageUrl(data[0]?.imageUrl ?? null); setError(""); },
    onError: () => setError("Sorry, the AI enhancement failed. Please try again."),
    onSettled: () => setIsGenerating(false),
  });

  const handleStyleSelect = (style: WeddingStyle) => {
    setSelectedStyle(style);
    setStage1ImageUrl(null); setFinalImageUrl(null); setUploadedPhoto(null); setPhotoPreview("");
    setSelectedAiStyle(style.aiStyles?.[0] ?? null);
    detailsFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setUploadedPhoto(file); setPhotoPreview(URL.createObjectURL(file)); setError(""); }
  };

  

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // This function is NOT async. It just kicks off the async process.
    // It is safe to use in onSubmit.
    void performGeneration(); 
  };

  const performGeneration = async () => {
    // --- THIS IS THE CRITICAL FIX ---
    // Check for login status as the VERY FIRST step.
    if (!isLoggedIn) {
      void signIn(); // Redirect to sign-in page
      return;       // Stop the function here
    }
    // --- END OF CRITICAL FIX ---

    if (!selectedStyle) { setError("Please select a style."); return; }
    if (selectedStyle.templateType === 'photo' && !uploadedPhoto) {
      setError("This style requires you to upload a photo."); return;
    }
    
    setIsGenerating(true);
    setError("");

    let finalUserImageUrl = "";
    if (selectedStyle.templateType === 'photo' && uploadedPhoto) {
      try {
        const presignedData = await createPresignedUrl.mutateAsync({ filename: uploadedPhoto.name, filetype: uploadedPhoto.type });
        const formDataToUpload = new FormData();
        Object.entries(presignedData.fields).forEach(([key, value]) => {
          formDataToUpload.append(key, value);
        });
        formDataToUpload.append("file", uploadedPhoto);
        const uploadResponse = await fetch(presignedData.url, { method: "POST", body: formDataToUpload });
        if (!uploadResponse.ok) throw new Error("Upload to S3 failed.");
        finalUserImageUrl = presignedData.publicUrl;
      } catch (uploadError) {
        console.error("Upload Error:", uploadError);
        setError("Failed to upload your photo. Please try again.");
        setIsGenerating(false); return;
      }
    }
    
    generateStage1.mutate({
      isHybridGeneration: true,
      prompt: `Wedding invitation preview for ${formData.brideName}`,
      model: "flux-kontext-pro",
      referenceImageUrl: selectedStyle.backgroundSrc,
      userImageUrl: finalUserImageUrl,
      styleRules: selectedStyle.styleRules,
      brideName: formData.brideName, groomName: formData.groomName, weddingDate: formData.weddingDate,
      weddingTime: formData.weddingTime, venueName: formData.venueName, venueAddress: formData.venueAddress,
      receptionOption: formData.receptionOption,
      receptionVenue: formData.receptionVenue,
    });
  };

  const handleEnhanceWithAI = () => {
    if (!stage1ImageUrl || !selectedAiStyle) return;
    setIsGenerating(true);
    // This now calls the dedicated enhancement procedure with a simple payload
    generateStage2.mutate({
        prompt: selectedAiStyle.prompt,
        model: selectedAiStyle.model,
        referenceImageUrl: stage1ImageUrl,
    });
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      // Fetch the image data from the S3 URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Get the image data as a Blob
      const blob = await response.blob();
      
      // Create a temporary URL for the blob data
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      
      // --- THE CRITICAL CHANGE ---
      link.download = "wedding-invitation.png"; // Set the correct filename and extension
      
      // Append, click, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Release the temporary URL
      
    } catch (error) {
      console.error("Error downloading the image:", error);
      setError("Sorry, the download failed. Please try again.");
    }
  };
  const openPopup = (imageUrl: string | null) => imageUrl && setPopupImage(imageUrl);
  const closePopup = () => setPopupImage(null);
  const openShareModal = (imageUrl: string | null) => imageUrl && setShareModalData({ isOpen: true, imageUrl });
  const closeShareModal = () => setShareModalData({ isOpen: false, imageUrl: null });
  
  const currentImage = finalImageUrl ?? stage1ImageUrl;

  return (
    <>
      <Head>
        <title>AI Wedding Invitation Generator | Name Design AI</title>
      </Head>
      <main className="container m-auto mb-24 flex flex-col px-8 py-8 max-w-screen-lg">
        <h1 className="text-4xl font-bold">Wedding Invitation Generator</h1>
        <p className="text-lg mt-4 text-gray-600 dark:text-gray-400">Create a stunning, personalized wedding invitation in minutes. Start by choosing your favorite style below.</p>
        
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-6">1. Choose Your Invitation Style</h2>
          <div className="flex flex-col gap-8">
            {Object.entries(weddingStylesData).map(([category, subcategories]) => (
                <div key={category}><h3 className="text-xl font-semibold mb-4 border-b pb-2">{category}</h3>
                    {Object.entries(subcategories).map(([subcategory, styles]) => (
                        <div key={subcategory}><h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">{subcategory}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {styles.map((style) => (
                                    <div 
                                      key={style.id} 
                                      onClick={() => handleStyleSelect(style)} 
                                      className={`group relative cursor-pointer overflow-hidden rounded-lg shadow-md transition-all duration-200 hover:shadow-xl ${selectedStyle?.id === style.id ? "ring-4 ring-offset-2 ring-blue-500" : ""}`}
                                    >
                                      <Image 
                                        src={style.src} 
                                        alt={style.title}
                                        width={1024}
                                        height={1434}
                                        className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105" 
                                        unoptimized={true}
                                      />
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-white">
                                          {/* <p className="font-semibold text-sm">{style.title}</p> */}
                                      </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ))}
          </div>
        </section>

        <form ref={detailsFormRef} className={`flex flex-col gap-6 mt-16 ${!selectedStyle ? 'hidden' : 'animate-fade-in'}`} onSubmit={handleFormSubmit}>
          <h2 className="text-2xl font-semibold mb-4">2. Fill in Your Wedding Details</h2>
            
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-6 rounded-lg">
              <legend className="px-2 font-semibold">The Couple</legend>
              <FormGroup><label>Bride&apos;s Name *</label><Input required name="brideName" value={formData.brideName} onChange={handleInputChange} /></FormGroup>
              <FormGroup><label>Groom&apos;s Name *</label><Input required name="groomName" value={formData.groomName} onChange={handleInputChange} /></FormGroup>
            </fieldset>

            {/*
            <fieldset className="border p-6 rounded-lg">
              <legend className="px-2 font-semibold">The Hosts</legend>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center gap-2"><input type="radio" name="hostingOption" value="couple" checked={formData.hostingOption === 'couple'} onChange={handleInputChange} /> We are hosting</label>
                <label className="flex items-center gap-2"><input type="radio" name="hostingOption" value="coupleAndParents" checked={formData.hostingOption === 'coupleAndParents'} onChange={handleInputChange} /> Together with our parents</label>
                <label className="flex items-center gap-2"><input type="radio" name="hostingOption" value="parents" checked={formData.hostingOption === 'parents'} onChange={handleInputChange} /> Our parents are hosting</label>
              </div>
              {(formData.hostingOption === 'parents' || formData.hostingOption === 'coupleAndParents') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-fade-in">
                  <FormGroup><label>Bride’s Parents (e.g., Mr. and Mrs. Johnson)</label><Input name="brideParents" value={formData.brideParents} onChange={handleInputChange} /></FormGroup>
                  <FormGroup><label>Groom’s Parents (e.g., Mr. and Mrs. Davis)</label><Input name="groomParents" value={formData.groomParents} onChange={handleInputChange} /></FormGroup>
                </div>
              )}
            </fieldset>
            */}

            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-6 rounded-lg">
                <legend className="px-2 font-semibold">The Event</legend>
                <FormGroup><label>Date *</label><Input required type="date" name="weddingDate" value={formData.weddingDate} onChange={handleInputChange} /></FormGroup>
                <FormGroup><label>Time *</label><Input required type="time" name="weddingTime" value={formData.weddingTime} onChange={handleInputChange} /></FormGroup>
                <FormGroup><label>Venue Name *</label><Input required name="venueName" value={formData.venueName} onChange={handleInputChange} /></FormGroup>
                <FormGroup><label>Venue Address *</label><Input required name="venueAddress" value={formData.venueAddress} onChange={handleInputChange} /></FormGroup>
            </fieldset>

            <fieldset className="border p-6 rounded-lg">
              <legend className="px-2 font-semibold">The Reception</legend>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center gap-2"><input type="radio" name="receptionOption" value="none" checked={formData.receptionOption === 'none'} onChange={handleInputChange} /> No reception details</label>
                <label className="flex items-center gap-2"><input type="radio" name="receptionOption" value="sameLocation" checked={formData.receptionOption === 'sameLocation'} onChange={handleInputChange} /> Reception to follow</label>
                <label className="flex items-center gap-2"><input type="radio" name="receptionOption" value="differentLocation" checked={formData.receptionOption === 'differentLocation'} onChange={handleInputChange} /> Reception at a different venue</label>
              </div>
              {formData.receptionOption === 'differentLocation' && (
                <div className="mt-4 animate-fade-in">
                  <FormGroup><label>Reception Venue & Address</label><Input name="receptionVenue" value={formData.receptionVenue} onChange={handleInputChange} placeholder="e.g., The Grand Ballroom, 123 Main St" /></FormGroup>
                </div>
              )}
            </fieldset>

            {selectedStyle && selectedStyle.templateType === 'photo' && (
              <fieldset className="border p-6 rounded-lg animate-fade-in">
                <legend className="px-2 font-semibold">Your Photo *</legend>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <label htmlFor="photoUpload" className="cursor-pointer border-2 border-dashed rounded-lg p-8 text-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 w-full md:w-auto">
                      <FiUploadCloud className="text-4xl mb-2 mx-auto" />
                      <span className="font-semibold">{uploadedPhoto ? "Change Photo" : "Upload Your Photo"}</span>
                      <span className="text-sm block">(JPG or PNG)</span>
                      <input id="photoUpload" type="file" className="hidden" accept="image/jpeg, image/png" onChange={handlePhotoChange} />
                  </label>
                  {photoPreview && <Image src={photoPreview} alt="Couple photo preview" width={150} height={210} className="rounded-lg shadow-md aspect-[9/16] object-cover" unoptimized={true}/>}
                </div>
              </fieldset>
            )}

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
            
            <div className="mt-10">
                <Button isLoading={isGenerating} disabled={isGenerating || !selectedStyle} className="w-full py-4 text-lg">
                    {isGenerating ? 'Working...' : `Generate Invitation (${selectedStyle?.creditCost ?? 0} Credits)`}
                </Button>
            </div>
        </form>
        
        {stage1ImageUrl && (
          <section className="mt-16 pt-12 border-t">
            <h2 className="text-3xl font-bold mb-6 text-center">Your Invitation Preview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-semibold mb-4">Your Design:</h3>
                <div className="relative group rounded-lg shadow-xl max-w-md">
                   <Image src={currentImage!} alt="Generated wedding invitation" width={512} height={716} className="w-full rounded-lg" unoptimized={true}/>
                   <div className="absolute top-2 right-2 flex gap-1 bg-black bg-opacity-30 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => openPopup(stage1ImageUrl)} className="text-white p-2 hover:bg-white/20 rounded-full" title="View Fullscreen">🔍</button>
                    <button type="button" onClick={() => handleDownload(stage1ImageUrl)} className="text-white p-2 hover:bg-white/20 rounded-full" title="Download">⬇️</button>
                    <button type="button" onClick={() => openShareModal(stage1ImageUrl)} className="text-white p-2 hover:bg-white/20 rounded-full" title="Share">📤</button>
                  </div>
                </div>
              </div>
              {selectedStyle?.aiStyles && selectedStyle.aiStyles.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow-inner">
                  <h3 className="text-xl font-semibold mb-2">✨ Enhance with AI</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Love the layout? Now, apply a unique artistic style to your photo.</p>
                  <div className="relative flex items-center">
                    {showLeftArrow && (
                        <button onClick={scrollLeft} className="absolute -left-4 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600">
                            <FiChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    )}
                    <div ref={aiStyleScrollRef} onScroll={handleAiScroll} className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {selectedStyle.aiStyles.map(aiStyle => (
                            <div 
                                key={aiStyle.id} 
                                onClick={() => setSelectedAiStyle(aiStyle)} 
                                className={`flex flex-col items-center flex-shrink-0 w-24 cursor-pointer text-center p-2 rounded-lg border-2 transition-colors ${selectedAiStyle?.id === aiStyle.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                <Image src={aiStyle.previewImage} alt={aiStyle.name} width={80} height={80} className="rounded-md shadow-sm" unoptimized={true} />
                                <p className="text-sm font-medium mt-2 w-full">{aiStyle.name}</p>
                            </div>
                        ))}
                    </div>
                    {showRightArrow && (
                        <button onClick={scrollRight} className="absolute -right-4 z-10 bg-white dark:bg-gray-700 shadow-md rounded-full p-1 border border-gray-200 dark:border-gray-600">
                            <FiChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    )}
                  </div>
                  <Button isLoading={generateStage2.isLoading} disabled={isGenerating || !selectedAiStyle} className="w-full py-3 text-lg mt-6" onClick={handleEnhanceWithAI}>
                      {generateStage2.isLoading ? 'Applying Style...' : `Apply ${selectedAiStyle?.name ?? ''} Style (${selectedAiStyle?.creditCost ?? 0} Credits)`}
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}
        {popupImage && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-black bg-opacity-50 absolute inset-0" onClick={closePopup} />
            <div className="bg-white rounded-lg overflow-hidden shadow-lg z-10">
              <Image src={popupImage} alt="Popup Image" width={800} height={600} unoptimized={true}/>
              <button className="absolute top-2 right-2 text-white" onClick={closePopup}>✖️</button>
            </div>
          </div>
        )}
        <ShareModal isOpen={shareModalData.isOpen} onClose={closeShareModal} imageUrl={shareModalData.imageUrl} />
      </main>
    </>
  );
};
export default WeddingInvitationGeneratorPage;