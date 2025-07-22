/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/require-await */
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import React, { useState, useRef } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "~/component/Input";
import { weddingStylesData } from "~/data/weddingStylesData"; 
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { ShareModal } from '~/component/ShareModal';
import { FiUploadCloud } from "react-icons/fi";

// --- Type Definitions ---
type HostingOption = 'couple' | 'coupleAndParents' | 'parents' | 'other';
type ReceptionOption = 'sameLocation' | 'differentLocation' | 'none';

// --- Initial Form State ---
const initialFormData = {
  brideName: "",
  groomName: "",
  weddingDate: "",
  weddingTime: "",
  venueName: "",
  venueAddress: "",
  hostingOption: 'couple' as HostingOption,
  brideParents: "",
  groomParents: "",
  receptionOption: 'sameLocation' as ReceptionOption,
  receptionVenue: "",
};

const WeddingInvitationGeneratorPage: NextPage = () => {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  // --- State Management ---
  const [selectedStyle, setSelectedStyle] = useState<{ id: string; src: string; title: string } | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState<string>("");
  const detailsFormRef = useRef<HTMLFormElement>(null);
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [photoForUpsell, setPhotoForUpsell] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [shareModalData, setShareModalData] = useState<{ isOpen: boolean; imageUrl: string | null }>({ isOpen: false, imageUrl: null });
  const [popupImage, setPopupImage] = useState<string | null>(null);

  const generateTextInvite = api.generate.generateIcon.useMutation({
    onSuccess: (data) => {
      setInitialImageUrl(data[0]?.imageUrl ?? null);
      setFinalImageUrl(null);
    },
    onError: (error) => { console.error(error); setError(error.message); },
  });

  const generatePhotoInvite = api.generate.generateIcon.useMutation({
    onSuccess: (data) => {
      setFinalImageUrl(data[0]?.imageUrl ?? null);
    },
    onError: (error) => { console.error(error); setError(error.message); },
  });

  const handleStyleSelect = (style: { id: string; src: string; title: string }) => {
    setSelectedStyle(style);
    detailsFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // --- START: CORRECTED FUNCTION ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // Destructure both name and value from the event target
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  // --- END: CORRECTED FUNCTION ---

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      setPhotoForUpsell(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError("");
    } else {
      setError("Please upload a valid image file (JPG or PNG).");
    }
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoggedIn) { signIn().catch(console.error); return; }
    if (!selectedStyle) { setError("Please select an invitation style first."); return; }

    const textInstructions = `
      Edit this wedding invitation.
      Bride's Name: ${formData.brideName}
      Groom's Name: ${formData.groomName}
      Wedding Date: ${formData.weddingDate}
      Wedding Time: ${formData.weddingTime}
      Venue: ${formData.venueName}, ${formData.venueAddress}
      Hosting Info: Based on option '${formData.hostingOption}' with parents ${formData.brideParents} and ${formData.groomParents}.
      Reception Info: Based on option '${formData.receptionOption}' with details: ${formData.receptionVenue}.
      Keep the original artistic style, fonts, and colors, but replace all placeholder text with this new information.
    `;

    generateTextInvite.mutate({
      prompt: textInstructions,
      model: "flux-kontext-dev",
      referenceImageUrl: selectedStyle.src,
      numberOfImages: 1,
      aspectRatio: '9:16',
    });
  };

  const handlePhotoUpsellSubmit = async () => {
    if (!initialImageUrl) { setError("Please generate the initial invitation first."); return; }
    if (!photoForUpsell) { setError("Please upload a photo to add."); return; }

    // TODO: Your logic to upload `photoForUpsell` to S3 and get a `userPhotoUrl`
    const userPhotoUrl = "https://your-s3-bucket-url/path/to/user/photo.jpg"; // Placeholder
    console.log("Simulating photo upload:", userPhotoUrl);

    const photoInstructions = `
      Take the provided invitation and seamlessly integrate the user's photo into the background.
      The photo should have a soft, dreamy, and slightly transparent quality, blending elegantly with the existing design.
      Do not alter the text or the primary design elements.
    `;

    generatePhotoInvite.mutate({
      prompt: photoInstructions,
      model: "flux-kontext-dev",
      referenceImageUrl: initialImageUrl,
      userImageUrl: userPhotoUrl,
      numberOfImages: 1,
      aspectRatio: '9:16',
    });
  };

  const handleDownload = async (imageUrl: string) => {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "wedding-invitation-design.png"; 
        link.click();
        URL.revokeObjectURL(link.href);
        
      } catch (error) {
        console.error("Error downloading the image:", error);
      }
    };
  const openPopup = (imageUrl: string) => setPopupImage(imageUrl);
  const closePopup = () => setPopupImage(null);
  const openShareModal = (imageUrl: string) => setShareModalData({ isOpen: true, imageUrl });
  const closeShareModal = () => setShareModalData({ isOpen: false, imageUrl: null });
  return (
    <>
      <Head>
        <title>AI Wedding Invitation Generator | Name Design AI</title>
        <meta name="description" content="Design your own beautiful, custom wedding invitations with AI. Choose a style, add your details, and optionally include a photo of the couple." />
      </Head>
      <main className="container m-auto mb-24 flex flex-col px-8 py-8 max-w-screen-lg">
        <h1 className="text-4xl font-bold">Wedding Invitation Generator</h1>
        <p className="text-lg mt-4 text-gray-600 dark:text-gray-400">
          Create a stunning, personalized wedding invitation in minutes. Start by choosing your favorite style below.
        </p>

        {/* --- STEP 1: CHOOSE STYLE --- */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold mb-6">1. Choose Your Invitation Style</h2>
          <div className="flex flex-col gap-8">
            {Object.entries(weddingStylesData).map(([category, subcategories]) => (
                <div key={category}>
                    <h3 className="text-xl font-semibold mb-4 border-b pb-2">{category}</h3>
                    {Object.entries(subcategories).map(([subcategory, styles]) => (
                        <div key={subcategory}>
                            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">{subcategory}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {styles.map((style) => (
                                    <div key={style.id} onClick={() => handleStyleSelect(style)} className={`relative rounded-lg shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden ${selectedStyle?.id === style.id ? "ring-4 ring-blue-500" : ""}`}>
                                        <Image src={style.src} alt={style.title} width={300} height={420} className="w-full h-auto object-cover aspect-[9/16]" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 text-white">
                                            <p className="font-semibold text-sm">{style.title}</p>
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

        {/* --- STEP 2: FORM DETAILS (shows after style is selected) --- */}
        <form ref={detailsFormRef} className={`flex flex-col gap-4 mt-16 ${!selectedStyle ? 'hidden' : 'animate-fade-in'}`} onSubmit={handleFormSubmit}>
          <h2 className="text-2xl font-semibold mb-4">2. Fill in Your Wedding Details</h2>
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6 border p-6 rounded-lg">
              <legend className="px-2 font-semibold">The Couple</legend>
              <FormGroup><label>Bride&apos;s Full Name *</label><Input required name="brideName" value={formData.brideName} onChange={handleInputChange} /></FormGroup>
              <FormGroup><label>Groom&apos;s Full Name *</label><Input required name="groomName" value={formData.groomName} onChange={handleInputChange} /></FormGroup>
            </fieldset>

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
                <label className="flex items-center gap-2"><input type="radio" name="receptionOption" value="sameLocation" checked={formData.receptionOption === 'sameLocation'} onChange={handleInputChange} /> Reception to follow</label>
                <label className="flex items-center gap-2"><input type="radio" name="receptionOption" value="differentLocation" checked={formData.receptionOption === 'differentLocation'} onChange={handleInputChange} /> Reception at a different venue</label>
                <label className="flex items-center gap-2"><input type="radio" name="receptionOption" value="none" checked={formData.receptionOption === 'none'} onChange={handleInputChange} /> No reception details</label>
              </div>
              {formData.receptionOption === 'differentLocation' && (
                <div className="mt-4 animate-fade-in">
                  <FormGroup><label>Reception Venue & Address</label><Input name="receptionVenue" value={formData.receptionVenue} onChange={handleInputChange} placeholder="e.g., The Grand Ballroom, 123 Main St" /></FormGroup>
                </div>
              )}
            </fieldset>

            <h2 className="text-2xl font-semibold mt-8 mb-4">3. Add Your Photo (Optional)</h2>
            <div className="border p-6 rounded-lg flex flex-col md:flex-row items-center gap-6">
                <label htmlFor="photoUpload" className="cursor-pointer border-2 border-dashed rounded-lg p-8 text-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <span className="block">Click to Upload Photo</span>
                    <span className="text-sm">(JPG or PNG)</span>
                    <input id="photoUpload" type="file" className="hidden" accept="image/jpeg, image/png" onChange={handlePhotoChange} />
                </label>
                {photoPreview && <Image src={photoPreview} alt="Couple photo preview" width={150} height={210} className="rounded-lg shadow-md aspect-[9/16] object-cover" />}
            </div>
          
          {error && <div className="bg-red-500 text-white rounded p-4 text-center mt-6">{error}</div>}

          <div className="mt-10">
            <Button isLoading={generateTextInvite.isLoading} disabled={generateTextInvite.isLoading} className="w-full py-4 text-lg">
              Generate My Invitation
            </Button>
          </div>
        </form>
        
        {/* --- STRATEGIC CHANGE: NEW RESULTS & UPSELL SECTION --- */}
        {initialImageUrl && (
          <section className="mt-16 pt-12 border-t">
            <h2 className="text-3xl font-bold mb-6 text-center">Your Beautiful Invitation Is Ready!</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
              
              {/* Column 1: Generated Image */}
              <div className="flex flex-col items-center">
                <h3 className="text-xl font-semibold mb-4">Your Design:</h3>
                <div className="relative group rounded-lg shadow-xl hover:shadow-2xl transition max-w-md">
                   <Image src={finalImageUrl ?? initialImageUrl} alt="Generated wedding invitation" width={512} height={716} className="w-full rounded-lg" />
                   <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button type="button" onClick={() => openPopup(finalImageUrl ?? initialImageUrl)} className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70" title="View Fullscreen">🔍</button>
                    <button type="button" onClick={() => handleDownload(finalImageUrl ?? initialImageUrl)} className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70" title="Download">⬇️</button>
                    <button type="button" onClick={() => openShareModal(finalImageUrl ?? initialImageUrl)} className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70" title="Share">📤</button>
                  </div>
                </div>
              </div>

              {/* Column 2: The Photo Upsell */}
              <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow-inner">
                <h3 className="text-xl font-semibold mb-2">✨ Make it Unforgettable</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Add a personal touch by seamlessly blending a photo of you and your partner into the design.</p>
                
                <label htmlFor="photoUpload" className="cursor-pointer border-2 border-dashed rounded-lg p-6 text-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col items-center justify-center">
                    <FiUploadCloud className="text-4xl mb-2" />
                    <span className="font-semibold">{photoForUpsell ? "Change Photo" : "Upload Your Photo"}</span>
                    <span className="text-sm">(JPG or PNG recommended)</span>
                    <input id="photoUpload" type="file" className="hidden" accept="image/jpeg, image/png" onChange={handlePhotoChange} />
                </label>

                {photoPreview && (
                    <div className="mt-4 text-center">
                        <p className="text-sm font-medium mb-2">Your Photo:</p>
                        <Image src={photoPreview} alt="Couple photo preview" width={100} height={140} className="rounded-md shadow-md aspect-[9/16] object-cover mx-auto" />
                    </div>
                )}

                <div className="mt-6">
                    <Button 
                        isLoading={generatePhotoInvite.isLoading} 
                        disabled={!photoForUpsell || generatePhotoInvite.isLoading} 
                        className="w-full py-3 text-lg"
                        // eslint-disable-next-line @typescript-eslint/no-misused-promises
                        onClick={handlePhotoUpsellSubmit}
                    >
                        Enhance with Photo
                    </Button>
                    <p className="text-xs text-center mt-2 text-gray-500">This is a premium feature.</p>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* --- MODALS (no changes) --- */}
        {popupImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center" onClick={closePopup}>
            <div className="relative">
              <button type="button" onClick={closePopup} className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-200" title="Close">✖️</button>
              <img src={popupImage} alt="Fullscreen view" className="max-w-full max-h-screen rounded" />
            </div>
          </div>
        )}
        <ShareModal isOpen={shareModalData.isOpen} onClose={closeShareModal} imageUrl={shareModalData.imageUrl} />
      </main>
    </>
  );
};

export default WeddingInvitationGeneratorPage;