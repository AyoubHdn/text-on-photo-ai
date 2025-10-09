import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { api } from "~/utils/api";
import { ShareModal } from '~/component/ShareModal';
import { env } from "~/env.mjs";

  interface VisibilityToggleProps {
    iconId: string;
    initialIsPublic: boolean;
    isSubscriber: boolean;
    onToggle: (iconId: string, newIsPublic: boolean) => void;
    isLoading: boolean;
  }

  const VisibilityToggle: React.FC<VisibilityToggleProps> = ({ iconId, initialIsPublic, isSubscriber, onToggle, isLoading }) => {
  const isEnabled = isSubscriber;
  const toggleId = `toggle-${iconId}`;

  const handleChange = () => {
    if (!isEnabled || isLoading) return;
    onToggle(iconId, !initialIsPublic);
  };
  return (
    <div className="flex flex-col items-center gap-2 mt-2" title={!isEnabled ? "This feature is for subscribers only." : ""}>
      <label htmlFor={toggleId} className={`relative inline-flex items-center cursor-pointer ${!isEnabled ? 'cursor-not-allowed opacity-50' : ''}`}>
        <input
          type="checkbox"
          id={toggleId}
          className="sr-only peer"
          checked={initialIsPublic}
          disabled={!isEnabled || isLoading}
          onChange={handleChange}
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
      </label>
      <span className={`text-xs font-medium ${initialIsPublic ? 'text-gray-900 dark:text-gray-300' : 'text-gray-500'}`}>
        {initialIsPublic ? 'Public' : 'Private'}
      </span>
    </div>
  );
};

const CollectionPage: NextPage = () => {
  const [popupImage, setPopupImage] = useState<string | null>(null);
  const utils = api.useContext();

  const { data, isLoading: isLoadingIcons } = api.icons.getIconsForUser.useQuery();
  const { icons, userPlan, isSubscriber } = data || { icons: [], userPlan: null, isSubscriber: false };

  const updateVisibility = api.icons.updateIconVisibility.useMutation({
    onSuccess: () => {
      // After a successful update, invalidate the query to refetch the fresh data
      void utils.icons.getIconsForUser.invalidate();
    },
    onError: (error) => {
      // Handle potential errors, e.g., show a toast notification
      console.error("Failed to update visibility:", error);
    }
  });

  const openPopup = (imageUrl: string) => {
    setPopupImage(imageUrl);
  };

  const closePopup = () => {
    setPopupImage(null);
  };

  const [shareModalData, setShareModalData] = useState<{ isOpen: boolean; imageUrl: string | null }>({
      isOpen: false,
      imageUrl: null,
    });
  
    const openShareModal = (imageUrl: string) => {
    setShareModalData({ isOpen: true, imageUrl });
  };
  
  const closeShareModal = () => {
    setShareModalData({ isOpen: false, imageUrl: null });
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl, { mode: "cors" });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      // Convert WebP to PNG using canvas
      const imageBitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(imageBitmap, 0, 0);
      }

      const pngBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((blob) => resolve(blob), "image/png")
      );

      if (pngBlob) {
        const blobUrl = window.URL.createObjectURL(pngBlob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = "name-design-ai.png"; // Customize filename
        link.click();

        window.URL.revokeObjectURL(blobUrl);
      } else {
        console.error("Failed to create PNG blob.");
      }
    } catch (error) {
      console.error("Error downloading the image:", error);
    }
  };
  function handleToggle(iconId: string, newIsPublic: boolean): void {
    updateVisibility.mutate({ iconId, isPublic: newIsPublic });
  }

  // Add this function inside your component, alongside handleDownload, etc.

  return (
    <>
      <Head>
        <title>Your Generated Images | Name Design AI</title>
        <meta name="description" content="View, download, and manage your generated images on Name Design AI. Access your personalized designs anytime, anywhere." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen mt-24 flex-col container mx-auto gap-4 px-8">
        <h1 className="text-4xl">Your Generated Images</h1>

        <ul className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {icons.map((icon) => (
            <li key={icon.id} className="relative">
              <Image
                className="w-full rounded"
                width="512"
                height="512"
                alt={icon.prompt ?? "an image of an icon"}
                src={`https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${icon.id}`}
              />
              {/* Button Container */}
              <div className="absolute top-0 right-0 flex gap-0">
                {/* View Button */}
                <button
                  onClick={() => openPopup(`https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${icon.id}`)}
                  className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none p-2"
                  title="View Fullscreen"
                >
                  🔍
                </button>
                {/* Download Button */}
                <button
                  onClick={() => {
                    void handleDownload(`https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${icon.id}`);
                  }}
                  className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none p-2"
                  title="Download"
                >
                  ⬇️
                </button>
                <button
                  onClick={() => {
                    openShareModal(`https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${icon.id}`);
                  }}
                  className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none p-2"
                  title="Share"
                  aria-label="Share"
                >
                  📤
                </button>
              </div>
              <VisibilityToggle
                iconId={icon.id}
                initialIsPublic={icon.isPublic}
                isSubscriber={isSubscriber}
                onToggle={handleToggle}
                isLoading={updateVisibility.isLoading && updateVisibility.variables?.iconId === icon.id}
              />
            </li>
          ))}
        </ul>

        {/* Popup Modal */}
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
        <ShareModal 
          isOpen={shareModalData.isOpen}
          onClose={closeShareModal}
          imageUrl={shareModalData.imageUrl}
        />
      </main>
    </>
  );
};

export default CollectionPage;
