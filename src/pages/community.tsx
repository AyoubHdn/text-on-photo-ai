/* eslint-disable @typescript-eslint/restrict-template-expressions */
// pages/community.tsx
import { type NextPage } from "next";
import Image from "next/image";
import { api } from "~/utils/api";
import { useState } from "react";
import { SeoHead } from "~/component/SeoHead";
import { env } from "~/env.mjs";
import { getCommunityImagePresentation } from "~/lib/styleImageAlt";

const CommunityPage: NextPage = () => {
    const { data: icons, isLoading } = api.icons.getCommunityIcons.useQuery();
    const [popupImage, setPopupImage] = useState<{
        src: string;
        alt: string;
    } | null>(null);

    const openPopup = (imageUrl: string, imageAlt: string) =>
        setPopupImage({ src: imageUrl, alt: imageAlt });
    const closePopup = () => setPopupImage(null);

    return (
    <>
    <SeoHead
        title="Community Gallery | User-Generated Designs on Name Design AI"
        description="Browse user-created designs from the Name Design AI community for inspiration across personalized name art, Arabic calligraphy, and couple artwork."
        path="/community"
    />
    <main className="flex min-h-screen mt-24 flex-col container mx-auto gap-8 px-8 mb-24">
        <div className="text-center">
            <h1 className="text-4xl font-bold">Community Gallery</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Get inspired by personalized name art, Arabic calligraphy, and couple designs created by the community.</p>
        </div>

        {isLoading && <p className="text-center">Loading designs...</p>}
        {!isLoading && icons?.length === 0 && <p className="text-center">The gallery is empty right now. Be the first to create something amazing!</p>}

        {/* --- START: THE FINAL, CORRECTED GALLERY GRID --- */}
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {icons?.map((icon) => {
                const imageUrl = `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${icon.id}`;
                const imagePresentation = getCommunityImagePresentation({
                    metadata: icon.metadata,
                    prompt: icon.prompt,
                });

                return (
                    <li 
                        key={icon.id} 
                        className="group relative cursor-pointer overflow-hidden rounded-lg shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
                        onClick={() => openPopup(imageUrl, imagePresentation.alt)}
                    >
                        {/* This wrapper div enforces a square aspect ratio for a uniform grid */}
                        <div className="aspect-square w-full bg-gray-200 dark:bg-gray-800">
                            <Image 
                                src={imageUrl}
                                alt={imagePresentation.alt}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="px-3 text-center text-xs leading-snug text-white">
                                {imagePresentation.alt}
                            </p>
                        </div>
                    </li>
                );
            })}
        </ul>
        {/* --- END: THE FINAL, CORRECTED GALLERY GRID --- */}

        {/* Popup Modal for viewing images */}
        {popupImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4" onClick={closePopup}>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={closePopup}
                className="absolute -top-4 -right-4 bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-200 focus:outline-none"
                title="Close"
              >
                ✖️
              </button>
              {/* Using a standard img tag here for simplicity in a modal */}
              <img
                src={popupImage.src}
                alt={popupImage.alt}
                className="max-w-screen-lg max-h-[90vh] rounded-lg object-contain"
              />
            </div>
          </div>
        )}
    </main>
    </>
  );
};

export default CommunityPage;
