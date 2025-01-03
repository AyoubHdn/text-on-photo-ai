import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { api } from "~/utils/api";

const CollectionPage: NextPage = () => {
  const icons = api.icons.getIcons.useQuery();
  const [popupImage, setPopupImage] = useState<string | null>(null);

  const openPopup = (imageUrl: string) => {
    setPopupImage(imageUrl);
  };

  const closePopup = () => {
    setPopupImage(null);
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
        link.download = "design-name-ai.png"; // Customize filename
        link.click();

        window.URL.revokeObjectURL(blobUrl);
      } else {
        console.error("Failed to create PNG blob.");
      }
    } catch (error) {
      console.error("Error downloading the image:", error);
    }
  };

  return (
    <>
      <Head>
        <title>Your images</title>
        <meta name="description" content="your images" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen mt-24 flex-col container mx-auto gap-4 px-8">
        <h1 className="text-4xl">Your images</h1>

        <ul className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {icons.data?.map((icon) => (
            <li key={icon.id} className="relative">
              <Image
                className="w-full rounded"
                width="512"
                height="512"
                alt={icon.prompt ?? "an image of an icon"}
                src={`https://name-design-ai.s3.us-east-1.amazonaws.com/${icon.id}`}
              />
              {/* Button Container */}
              <div className="absolute top-0 right-0 flex gap-0">
                {/* View Button */}
                <button
                  onClick={() => openPopup(`https://name-design-ai.s3.us-east-1.amazonaws.com/${icon.id}`)}
                  className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none p-2"
                  title="View Fullscreen"
                >
                  🔍
                </button>
                {/* Download Button */}
                <button
                  onClick={() => {
                    void handleDownload(`https://name-design-ai.s3.us-east-1.amazonaws.com/${icon.id}`);
                  }}
                  className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none p-2"
                  title="Download"
                >
                  ⬇️
                </button>
              </div>
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
      </main>
    </>
  );
};

export default CollectionPage;
