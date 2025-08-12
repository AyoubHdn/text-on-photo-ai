// pages/community.tsx
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { api } from "~/utils/api";
import { useState } from "react"; // <-- Import useState

const CommunityPage: NextPage = () => {
    const { data: icons, isLoading } = api.icons.getCommunityIcons.useQuery();
    const [popupImage, setPopupImage] = useState<string | null>(null);

    const openPopup = (imageUrl: string) => setPopupImage(imageUrl);
    const closePopup = () => setPopupImage(null);

    return (
    <>
    <Head>
        <title>Community Gallery | User-Generated Designs on Name Design AI</title>
        <meta name="description" content="Browse beautiful designs created by the Name Design AI community. Get inspiration for your own name art, logos, and wedding invitations." />
        <link rel="icon" href="/favicon.ico" />
    </Head>
    <main className="flex min-h-screen mt-24 flex-col container mx-auto gap-8 px-8 mb-24">
        <div className="text-center">
            <h1 className="text-4xl font-bold">Community Gallery</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Get inspired by the amazing designs our community has created.</p>
        </div>

        {isLoading && <p className="text-center">Loading designs...</p>}
        {!isLoading && icons?.length === 0 && <p className="text-center">The gallery is empty right now. Be the first to create something amazing!</p>}

        {/* --- START: THE FINAL, CORRECTED GALLERY GRID --- */}
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {icons?.map((icon) => (
                <li 
                    key={icon.id} 
                    className="group relative cursor-pointer overflow-hidden rounded-lg shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
                    onClick={() => openPopup(`https://name-design-ai.s3.us-east-1.amazonaws.com/${icon.id}`)}
                >
                    {/* This wrapper div enforces a square aspect ratio for a uniform grid */}
                    <div className="aspect-square w-full bg-gray-200 dark:bg-gray-800">
                        <Image 
                            src={`https://name-design-ai.s3.us-east-1.amazonaws.com/${icon.id}`}
                            alt={icon.prompt ?? "A community-generated design"}
                            fill // The 'fill' prop is essential
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    {/* Optional: Add an overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-xs text-center p-2 truncate">{icon.prompt}</p>
                    </div>
                </li>
            ))}
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
                src={popupImage}
                alt="Fullscreen view of a community design"
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