/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { type NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AiOutlineDownload, AiOutlineEye, AiOutlineShareAlt } from "react-icons/ai";
import { SeoHead } from "~/component/SeoHead";
import { ShareModal } from "~/component/ShareModal";
import { api } from "~/utils/api";
import { env } from "~/env.mjs";

type VisibilityToggleProps = {
  iconId: string;
  initialIsPublic: boolean;
  isSubscriber: boolean;
  onToggle: (iconId: string, newIsPublic: boolean) => void;
  isLoading: boolean;
};

function VisibilityToggle({
  iconId,
  initialIsPublic,
  isSubscriber,
  onToggle,
  isLoading,
}: VisibilityToggleProps) {
  const isEnabled = isSubscriber;
  const toggleId = `toggle-${iconId}`;

  const handleChange = () => {
    if (!isEnabled || isLoading) return;
    onToggle(iconId, !initialIsPublic);
  };

  return (
    <div className="flex items-center justify-between gap-2" title={!isEnabled ? "This feature is for subscribers only." : ""}>
      <span className={`text-xs font-medium ${initialIsPublic ? "text-gray-900" : "text-gray-500"}`}>
        {initialIsPublic ? "Public" : "Private"}
      </span>
      <label htmlFor={toggleId} className={`relative inline-flex items-center ${!isEnabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
        <input
          type="checkbox"
          id={toggleId}
          className="peer sr-only"
          checked={initialIsPublic}
          disabled={!isEnabled || isLoading}
          onChange={handleChange}
        />
        <div className="h-6 w-11 rounded-full bg-gray-200 transition peer-focus:ring-2 peer-focus:ring-brand-300 peer-checked:bg-brand-600 peer-checked:after:translate-x-full after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-cream-200 after:bg-white after:transition-all" />
      </label>
    </div>
  );
}

const CollectionPage: NextPage = () => {
  const [popupImage, setPopupImage] = useState<string | null>(null);
  const [shareModalData, setShareModalData] = useState<{ isOpen: boolean; imageUrl: string | null }>({
    isOpen: false,
    imageUrl: null,
  });

  const utils = api.useContext();
  const { data, isLoading } = api.icons.getIconsForUser.useQuery();
  const { icons, isSubscriber } = data || { icons: [], isSubscriber: false };

  const updateVisibility = api.icons.updateIconVisibility.useMutation({
    onSuccess: () => {
      void utils.icons.getIconsForUser.invalidate();
    },
    onError: (error) => {
      console.error("Failed to update visibility:", error);
    },
  });

  const openPopup = (imageUrl: string) => setPopupImage(imageUrl);
  const closePopup = () => setPopupImage(null);
  const openShareModal = (imageUrl: string) => setShareModalData({ isOpen: true, imageUrl });
  const closeShareModal = () => setShareModalData({ isOpen: false, imageUrl: null });

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl, { mode: "cors" });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(imageBitmap, 0, 0);

      const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
      if (!pngBlob) {
        console.error("Failed to create PNG blob.");
        return;
      }

      const blobUrl = window.URL.createObjectURL(pngBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "name-design-ai.png";
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading the image:", error);
    }
  };

  const handleToggle = (iconId: string, newIsPublic: boolean) => {
    updateVisibility.mutate({ iconId, isPublic: newIsPublic });
  };

  return (
    <>
      <SeoHead
        title="Your Generated Images | Name Design AI"
        description="View, download, and manage your generated images on Name Design AI. Access your personalized designs anytime, anywhere."
        path="/collection"
        noindex
      />

      <main className="container mx-auto mt-24 flex min-h-screen flex-col gap-4 px-4 md:px-8">
        <h1 className="text-3xl md:text-4xl">Your Generated Images</h1>

        {isLoading && <div className="text-sm text-gray-600">Loading designs...</div>}
        {!isLoading && icons.length === 0 && (
          <div className="rounded-lg border border-cream-200 bg-white p-4 text-sm text-gray-700">
            No designs yet. Generate your first design to see it here.
          </div>
        )}

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {icons.map((icon) => {
            const imageUrl = `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${icon.id}`;
            return (
              <li
                key={icon.id}
                className="overflow-hidden rounded-lg border border-cream-200 bg-white shadow-sm"
              >
                <div className="relative">
                  <Image
                    className="w-full"
                    width={512}
                    height={512}
                    alt={icon.prompt ?? "Generated design"}
                    src={imageUrl}
                  />

                  <div className="absolute right-1 top-1 flex items-center gap-1 rounded-full bg-black/45 px-1 py-1 backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => openPopup(imageUrl)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/90 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
                      title="View Fullscreen"
                      aria-label="View Fullscreen"
                    >
                      <AiOutlineEye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDownload(imageUrl)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/90 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
                      title="Download"
                      aria-label="Download"
                    >
                      <AiOutlineDownload className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openShareModal(imageUrl)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/90 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
                      title="Share"
                      aria-label="Share"
                    >
                      <AiOutlineShareAlt className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-cream-200 p-2">
                  <Link
                    href="/products"
                    className="mb-2 block rounded-md bg-brand-600 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-brand-700"
                  >
                    Print on Products
                  </Link>

                  <VisibilityToggle
                    iconId={icon.id}
                    initialIsPublic={icon.isPublic}
                    isSubscriber={isSubscriber}
                    onToggle={handleToggle}
                    isLoading={updateVisibility.isLoading && updateVisibility.variables?.iconId === icon.id}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        {popupImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <div className="relative">
              <button
                type="button"
                onClick={closePopup}
                className="absolute right-2 top-2 rounded-full bg-gray-800 p-2 text-white hover:bg-gray-700 focus:outline-none"
                title="Close"
                aria-label="Close"
              >
                ×
              </button>
              <img src={popupImage} alt="Fullscreen view" className="max-h-[90vh] max-w-full rounded" />
            </div>
          </div>
        )}

        <ShareModal isOpen={shareModalData.isOpen} onClose={closeShareModal} imageUrl={shareModalData.imageUrl} />
      </main>
    </>
  );
};

export default CollectionPage;
