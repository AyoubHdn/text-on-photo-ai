import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "../component/Input";
import { stylesData } from "../data/stylesData";

// Type definitions and constants
interface ImageData {
  imageUrl: string;
}

const USER_LOGIN = 'AyoubHdn';

const getCurrentDateTime = (): string => {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace('T', '_');
};

const GeneratePage: NextPage = () => {
  const [form, setForm] = useState({
    name: "",
    basePrompt: "",
    numberofImages: "1",
  });

  const [error, setError] = useState<string>("");
  const [imagesUrl, setImagesUrl] = useState<ImageData[]>([]);
  const [activeTab, setActiveTab] = useState<keyof typeof stylesData>("Modern");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [popupImage, setPopupImage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const generateIcon = api.generate.generateIcon.useMutation({
    onSuccess(data) {
      setImagesUrl(data);
    },
    onError(error) {
      console.log(error);
      setError(error.message);
    },
  });

  const handleOpenPopup = (url: string): void => {
    setPopupImage(url);
  };

  const handleClosePopup = (): void => {
    setPopupImage(null);
  };

  const handleFormSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (!form.name || !form.basePrompt) {
      setError("Please type your name and select a style.");
      return;
    }

    const finalPrompt = `${form.basePrompt.replace("Text", form.name)}`;

    generateIcon.mutate({
      prompt: finalPrompt,
      numberOfImages: parseInt(form.numberofImages),
    });
  };

  const updateForm = (key: string) => {
    return (e: React.ChangeEvent<HTMLInputElement>): void => {
      setForm((prev) => ({
        ...prev,
        [key]: e.target.value,
      }));
    };
  };

  const handleImageSelect = (basePrompt: string, src: string): void => {
    setSelectedImage(src);
    setForm((prev) => ({
      ...prev,
      basePrompt,
    }));
    setError("");
  };

  const handleDownload = async (url: string): Promise<void> => {
    setIsDownloading(true);
    try {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.src = url;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image failed to load'));
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not create blob'));
          }
        }, 'image/png');
      });

      const timestamp = getCurrentDateTime();
      const filename = `generated_image_${timestamp}_${USER_LOGIN}.png`;

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      try {
        const timestamp = getCurrentDateTime();
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated_image_${timestamp}_${USER_LOGIN}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (fallbackError) {
        console.error('Fallback download failed:', fallbackError);
        window.open(url, '_blank');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async (url: string): Promise<void> => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this generated image!",
          text: "I created this awesome image using the app.",
          url: url,
        });
        alert("Shared successfully!");
      } catch (error) {
        console.error("Error sharing the image:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert("Image URL copied to clipboard. Share it manually!");
      } catch (error) {
        alert("Unable to copy. Please manually copy and share the URL.");
      }
    }
  };

  return (
    <>
      <Head>
        <title>Name Design AI</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container m-auto mb-24 flex flex-col px-8 py-8 max-w-screen-md">
        <h1 className="text-6xl">Generate your design</h1>
        <p className="text-2xl">Type your name / text</p>
        <form className="flex flex-col gap-3" onSubmit={handleFormSubmit}>
          <h2 className="text-xl">1. Type your name</h2>
          <FormGroup className="mb-12">
            <label>Name</label>
            <Input
              required
              value={form.name}
              onChange={updateForm("name")}
              placeholder="Type your name here"
            />
          </FormGroup>

          <h2 className="text-xl">2. Pick your style</h2>
          <div className="mb-12">
            <div className="flex border-b mb-4">
              {Object.keys(stylesData).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setActiveTab(style as keyof typeof stylesData)}
                  className={`px-4 py-2 ${
                    activeTab === style
                      ? "border-b-2 border-blue-500 text-blue-500"
                      : "text-gray-500"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-4 max-w-30">
              {stylesData[activeTab].map(({ src, basePrompt }, index) => (
                <div
                  key={index}
                  className={`rounded shadow-md hover:shadow-lg transition cursor-pointer ${
                    selectedImage === src ? "ring-4 ring-blue-500" : ""
                  }`}
                  onClick={() => handleImageSelect(basePrompt, src)}
                >
                  <img
                    src={src}
                    alt={basePrompt}
                    className="rounded w-30 h-30 min-w-20 min-h-20 object-cover mx-auto"
                  />
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-xl">3. How many do you want?</h2>
          <FormGroup className="mb-12">
            <label>Number of images</label>
            <Input
              required
              inputMode="numeric"
              pattern="[1-9]|10"
              value={form.numberofImages}
              onChange={updateForm("numberofImages")}
            />
          </FormGroup>

          {error && (
            <div className="bg-red-500 text-white rounded p-8 text-xl">
              {error}
            </div>
          )}

          <Button
            isLoading={generateIcon.isLoading}
            disabled={generateIcon.isLoading}
          >
            Submit
          </Button>
        </form>

        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-xl">Your images</h2>
            <section className="grid grid-cols-4 gap-4 mb-12">
              {imagesUrl.map((image: ImageData, index: number) => (
                <div key={index} className="relative rounded shadow-md hover:shadow-lg transition">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={(): void => handleOpenPopup(image.imageUrl)}
                      className="bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700 focus:outline-none"
                      title="View Fullscreen"
                    >
                      ⬜️
                    </button>

                    <button
                      onClick={(): void => {
                        void handleDownload(image.imageUrl);
                      }}
                      disabled={isDownloading}
                      className="bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700 focus:outline-none disabled:opacity-50"
                      title="Download Image"
                    >
                      {isDownloading ? '⏳' : '⬇️'}
                    </button>

                    <button
                      onClick={(): void => {
                        void handleShare(image.imageUrl);
                      }}
                      className="bg-gray-800 text-white rounded-full p-1 hover:bg-gray-700 focus:outline-none"
                      title="Share Image"
                    >
                      🔗
                    </button>
                  </div>

                  <Image
                    src={image.imageUrl}
                    alt={`Generated output ${index + 1}`}
                    width={512}
                    height={512}
                    className="w-full rounded"
                    unoptimized
                  />
                </div>
              ))}
            </section>
          </>
        )}

        {popupImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="relative">
              <button
                onClick={handleClosePopup}
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

export default GeneratePage;