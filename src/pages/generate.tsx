import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { api } from "~/utils/api";
import { Input } from "../component/Input";
import { stylesData } from "../data/stylesData"; // Updated import location
import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";

const GeneratePage: NextPage = () => {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  const [form, setForm] = useState({
    name: "",
    basePrompt: "",
    numberofImages: "1",
  });

  const [error, setError] = useState("");
  const [imagesUrl, setImagesUrl] = useState<{ imageUrl: string }[]>([]);

  const [activeTab, setActiveTab] = useState<keyof typeof stylesData>(
    Object.keys(stylesData)[0] as keyof typeof stylesData // Default to the first key in `stylesData`
  );
  const [activeSubTab, setActiveSubTab] = useState<string>(() => {
  const firstTabData = stylesData["Themes"];
  return firstTabData ? Object.keys(firstTabData)[0] || "" : "";
  });

  // Update `activeSubTab` whenever `activeTab` changes
  useEffect(() => {
    const firstSubTab =
      stylesData && stylesData[activeTab]
        ? Object.keys(stylesData[activeTab] || {})[0] || ""
        : "";
    setActiveSubTab(firstSubTab);
  }, [activeTab, stylesData]);  
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [popupImage, setPopupImage] = useState<string | null>(null); // State for the popup image

  const generateIcon = api.generate.generateIcon.useMutation({
    onSuccess(data) {
      setImagesUrl(data);
    },
    onError(error) {
      console.error(error);
      setError(error.message);
    },
  });

  const aspectRatios = [
    { label: "1:1", value: "1:1", visual: "aspect-square" },
    { label: "16:9", value: "16:9", visual: "aspect-video" },
    { label: "9:16", value: "9:16", visual: "aspect-portrait" },
    { label: "4:3", value: "4:3", visual: "aspect-classic" },
  ];

  const [selectedAspectRatio, setSelectedAspectRatio] = useState("1:1");
  
  const [selectedModel, setSelectedModel] = useState("flux-schnell"); // Default to flux-schnell

  const [selectedStyleImage, setSelectedStyleImage] = useState<string | null>(null); // To store the selected style image

  // Update the form submit handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    

    if (!isLoggedIn) {
      signIn().catch(console.error); // Redirect to login
      return;
    }

    if (!form.name || !form.basePrompt) {
      setError("Please type your name and select a style.");
      return;
    }

    const finalPrompt = `${form.basePrompt.replace('Text', form.name)} full design`;

    generateIcon.mutate({
      prompt: finalPrompt,
      numberOfImages: parseInt(form.numberofImages),
      aspectRatio: selectedAspectRatio, // Include aspect ratio
      model: selectedModel, // Pass the selected model
    });
  };

  const updateForm = (key: string) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [key]: e.target.value,
      }));
    };
  };

  const handleImageSelect = (basePrompt: string, src: string) => {
    setSelectedImage(src); // Keeps track of the selected image
    setForm((prev) => ({
      ...prev,
      basePrompt,
    }));
    setSelectedStyleImage(src); // Save the selected style image
    setError("");
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
  
      // Convert to PNG if needed
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
  

  const openPopup = (imageUrl: string) => {
    setPopupImage(imageUrl); // Open the popup
  };

  const closePopup = () => {
    setPopupImage(null); // Close the popup
  };

  return (
    <>
      <Head>
      <title>Generate Name Designs Online | Name Design AI</title>
      <meta name="description" content="Generate name designs online with Name Design AI. Easily create personalized, artistic name designs using a variety of styles, fonts, and effects." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container m-auto mb-24 flex flex-col px-8 py-8 max-w-screen-md">
      <h1 className="text-4xl ">
        <strong>Let’s Generate a Unique Name Design</strong>
      </h1>
      <p className="text-1xl mt-4">
        Create stunning name designs for social media, your brand, business logos, or thoughtful gifts. 
        Follow the steps below and bring your ideas to life!
      </p>
      <p className="text-1xl mt-4">Here’s how it works:</p>
      <ol className="list-decimal ml-6 mt-2 text-1xl">
        <li>Enter a Name to Get Started.</li>
        <li>Choose Your Favorite Style.</li>
        <li>
          Select Image Size:
          <ul className="list-disc ml-6">
            <li><strong>1:1</strong>: Square (ideal for profile pictures).</li>
            <li><strong>16:9</strong>: Landscape (great for desktops and presentations).</li>
            <li><strong>9:16</strong>: Portrait (perfect for mobile screens).</li>
            <li><strong>4:3</strong>: Classic (suitable for versatile use).</li>
          </ul>
        </li>
        <li>Select AI Model:
          <ul className="list-disc ml-6">
            <li><strong>Standard</strong>: Quick and cost-effective designs.</li>
            <li><strong>Optimized</strong>: Enhanced quality for a professional finish.</li>
          </ul>
        </li>
        <li>Choose How Many Designs You Want.</li>
      </ol>
      <p className="text-1xl mt-4">
        For the best results, keep these tips in mind:
      </p>
      <ul className="list-disc ml-6 mt-2 text-1xl">
        <li>Use clear and simple names or phrases for better precision.</li>
        <li>Experiment with styles to find your perfect match.</li>
        <li>Align the style with your target audience for businesses.</li>
        <li>For gifts, select playful or personalized designs for a thoughtful touch.</li>
      </ul>

        <form className="flex flex-col gap-3 mt-6" onSubmit={handleFormSubmit}>
          <h2 className="text-xl">1. Enter a Name/Text to Get Started</h2>
          <FormGroup className="mb-12">
            <Input
              required
              value={form.name}
              onChange={updateForm("name")}
              placeholder="Type your name here"
            />
          </FormGroup>

          <h2 className="text-xl">2. Choose Your Favorite Style</h2>
          <div className="mb-12">
            {/* Categories */}
            <div className="flex flex-wrap border-b mb-0">
              {Object.keys(stylesData).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveTab(category)}
                  id={category}
                  className={`px-4 py-2 ${
                    activeTab === category
                      ? "font-semibold border-b-2 border-blue-500 text-blue-500"
                      : "font-semibold text-gray-500"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap border-b mb-4 mt-0">
              {stylesData[activeTab] &&
                Object.keys(stylesData[activeTab] || {}).map((subcategory) => (
                  <button
                    key={subcategory}
                    type="button"
                    onClick={() => setActiveSubTab(subcategory)}
                    id={subcategory}
                    className={`px-4 py-2 ${
                      activeSubTab === subcategory
                        ? "text-sm border-b-2 border-purple-300 text-purple-300"
                        : " text-sm text-gray-500"
                    }`}
                  >
                    {subcategory}
                  </button>
                ))}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {stylesData[activeTab]?.[activeSubTab]?.map(({ src, basePrompt }, index) => (
                <div
                  key={index}
                  className={`relative rounded shadow-md hover:shadow-lg transition cursor-pointer ${
                    selectedImage === src ? "ring-4 ring-blue-500" : ""
                  }`}
                >
                  <img
                    src={src}
                    alt={basePrompt}
                    id={src}
                    className="rounded w-30 h-30 min-w-20 min-h-20 object-cover mx-auto"
                    onClick={() => handleImageSelect(basePrompt, src)}
                  />
                  <button
                    onClick={() => openPopup(src)}
                    className="absolute top-0 right-0 bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none"
                    title="View Fullscreen"
                  >
                    🔍
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add the image size selection in the form */}
          <h2 className="text-xl">3. Select Image Size</h2>
          <FormGroup className="mb-12">
            <label className="block mb-4 text-sm font-medium">Aspect Ratio</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {aspectRatios.map((ratio) => {
                // Precompute the aspect class
                const aspectClass =
                  ratio.visual === "aspect-square"
                    ? "aspect-[1/1]"
                    : ratio.visual === "aspect-video"
                    ? "aspect-[16/9]"
                    : ratio.visual === "aspect-portrait"
                    ? "aspect-[9/16]"
                    : ratio.visual === "aspect-classic"
                    ? "aspect-[4/3]"
                    : "";

                return (
                  <button
                    key={ratio.value}
                    type="button"
                    id={`aspect-${ratio.value || 'default'}`}
                    onClick={() => setSelectedAspectRatio(ratio.value)}
                    className={`relative flex items-center justify-center border rounded-lg p-4 transition ${
                      selectedAspectRatio === ratio.value
                        ? "border-blue-500 ring-2 ring-blue-500"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {/* Visual Representation */}
                    <div
                      className={`w-full h-21 dark:bg-gray-200 rounded-lg ${aspectClass} overflow-hidden flex items-center justify-center`}
                      style={{ backgroundColor: "#ddd" }}
                    >
                      {/* Aspect Ratio Label Inside the Shape */}
                      <span className="text-gray-600 font-medium">{ratio.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </FormGroup>

          <h2 className="text-xl">4. Select AI Model</h2>
          <FormGroup className="mb-12">
            <label className="block mb-4 text-sm font-medium">AI Model</label>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              {[
                {
                  name: "Standard",
                  value: "flux-schnell",
                  cost: 1,
                  id: "ai-model-standard", // Unique ID for Standard model
                  image: selectedStyleImage || "/images/placeholder.png",
                },
                {
                  name: "Optimized",
                  value: "flux-dev",
                  cost: 2,
                  id: "ai-model-optimized", // Unique ID for Optimized model
                  image:
                    selectedStyleImage && selectedStyleImage.includes(".")
                      ? selectedStyleImage.replace(/(\.[^.]+)$/, "e$1")
                      : "/images/placeholder.png",
                  badge: "Optimized",
                },
              ].map((model) => (
                <button
                  key={model.value}
                  type="button"
                  id={model.id || `model-${model.value || 'default'}`}
                  onClick={() => setSelectedModel(model.value)}
                  className={`relative flex flex-col items-center justify-center border rounded-lg p-4 transition ${
                    selectedModel === model.value
                      ? "border-blue-500 ring-2 ring-blue-500"
                      : "border-gray-300 hover:border-gray-500"
                  }`}
                >
                  {/* Badge for Flux Dev */}
                  {model.badge && (
                    <span
                      className="absolute top-2 right-2 bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-md"
                    >
                      {model.badge}
                    </span>
                  )}
                  {/* Style Image */}
                  <img
                    src={model.image}
                    alt={model.name}
                    className="w-22 h-22 mb-2 rounded"
                  />
                  {/* Credit Cost */}
                  <span className="text-sm text-gray-500 mt-2">
                    Cost: {model.cost} credits
                  </span>
                </button>
              ))}
            </div>
          </FormGroup>

          <h2 className="text-xl">5. How Many Designs You Want</h2>
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
            {isLoggedIn ? "Generate" : "Log in to Generate"}
          </Button>
        </form>

        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-xl mt-8">Your Custom Name Designs</h2>
            <section className="grid grid-cols-4 gap-4 mb-12">
              {imagesUrl.map(({ imageUrl }, index) => (
                <div
                  key={index}
                  className="relative rounded shadow-md hover:shadow-lg transition"
                >
                  <div className="absolute top-0 right-0 flex gap-0">
                    <button
                      onClick={() => openPopup(imageUrl)}
                      className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none"
                      title="View Fullscreen"
                    >
                      🔍
                    </button>
                    <button
                      onClick={() => {
                        void handleDownload(imageUrl);
                      }}
                      className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none"
                      title="Download Image"
                    >
                      ⬇️
                    </button>
                  </div>
                  <Image
                    src={imageUrl}
                    alt="Generated output"
                    width={512}
                    height={512}
                    className="w-full rounded"
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

export default GeneratePage;
