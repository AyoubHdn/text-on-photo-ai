/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import React, { useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";

// TRPC (Assuming this is set up in your project)
import { api } from "~/utils/api";

// Example UI components (Replace with your actual components)
import { Button } from "~/component/Button";
import { FormGroup } from "~/component/FormGroup";
import { Input } from "~/component/Input";

// **Types**
type IndustryKey = "technology" | "food" | "finance";
type StyleID = "abstract" | "brandmark" | "wordmark" | "lettermark" | "combination" | "emblem";
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3";
type AIModel = "flux-schnell" | "flux-dev";

type ColorPalette = {
  label: string;
  colors: [string, string, string];
};

// **Synonyms by Industry and Style**
const synonymsByIndustryAndStyle: Record<
  IndustryKey,
  Record<
    StyleID,
    {
      focusSynonyms: string[];
      conveySynonyms: string[];
      incorporateSynonyms: string[];
    }
  >
> = {
  technology: {
    abstract: {
      focusSynonyms: ["futuristic abstraction", "digital minimalism", "geometric innovation", "tech-forward design", "sleek modernism"],
      conveySynonyms: ["innovative spirit", "tech sophistication", "precision", "modern energy", "high-tech reliability"],
      incorporateSynonyms: ["geometric circuits", "abstract data flows", "tech patterns", "connected geometry", "microchip motifs"],
    },
    brandmark: {
      focusSynonyms: ["iconic symbols", "memorable marks", "cutting-edge icons", "digital glyphs", "tech-inspired emblems"],
      conveySynonyms: ["tech leadership", "bold innovation", "trustworthiness", "modern energy", "precision"],
      incorporateSynonyms: ["circuit motifs", "data-inspired icons", "tech glyphs", "connected nodes", "digital shapes"],
    },
    wordmark: {
      focusSynonyms: ["modern typography", "sleek letterforms", "tech-inspired fonts", "digital type design", "futuristic scripts"],
      conveySynonyms: ["brand clarity", "modernity", "reliability", "innovative spirit", "tech sophistication"],
      incorporateSynonyms: ["digital letter modifications", "circuit-inspired flourishes", "subtle tech motifs", "data-inspired accents", "geometric type elements"],
    },
    lettermark: {
      focusSynonyms: ["bold initials", "tech-inspired monograms", "digital letterforms", "geometric initials", "modern acronyms"],
      conveySynonyms: ["brand identity", "tech-forward thinking", "precision", "modern energy", "innovative spirit"],
      incorporateSynonyms: ["circuit-like connections", "data node-inspired letters", "tech pattern overlays", "digital flourishes", "geometric enhancements"],
    },
    combination: {
      focusSynonyms: ["harmonious icon-text pairing", "tech-inspired symbols with modern type", "digital emblems with sleek typography", "geometric icons with futuristic fonts", "connected visual elements"],
      conveySynonyms: ["brand coherence", "tech sophistication", "trustworthiness", "modern energy", "innovative spirit"],
      incorporateSynonyms: ["circuit-inspired icons with digital type", "data node motifs with sleek fonts", "tech pattern backgrounds with modern text", "geometric shapes with futuristic typography", "connected visual metaphors"],
    },
    emblem: {
      focusSynonyms: ["enclosed tech symbols", "digital badges", "geometric tech crests", "modern tech seals", "futuristic insignias"],
      conveySynonyms: ["brand authority", "tech leadership", "trustworthiness", "modern energy", "precision"],
      incorporateSynonyms: ["circuit patterns within borders", "data-inspired icons enclosed", "tech motifs in badge form", "geometric tech elements in crest style", "digital symbols in seal format"],
    },
  },
  food: {
    abstract: {
      focusSynonyms: ["organic shapes", "natural forms", "vibrant abstractions", "appetizing designs", "fresh aesthetics"],
      conveySynonyms: ["freshness", "wholesomeness", "appetizing appeal", "natural energy", "culinary creativity"],
      incorporateSynonyms: ["abstract leaves", "fruit-inspired geometry", "culinary curves", "farm-to-table motifs", "natural patterns"],
    },
    brandmark: {
      focusSynonyms: ["iconic food symbols", "memorable culinary marks", "appetizing icons", "natural glyphs", "fresh emblems"],
      conveySynonyms: ["culinary expertise", "wholesomeness", "delicious appeal", "natural energy", "friendly warmth"],
      incorporateSynonyms: ["leaf motifs", "produce-inspired icons", "utensil glyphs", "farm icons", "culinary symbols"],
    },
    wordmark: {
      focusSynonyms: ["playful typography", "appetizing letterforms", "natural scripts", "vibrant type design", "fresh fonts"],
      conveySynonyms: ["warmth", "deliciousness", "friendliness", "natural energy", "culinary creativity"],
      incorporateSynonyms: ["food-inspired flourishes", "organic letter accents", "utensil motifs in type", "produce-inspired modifications", "natural pattern overlays"],
    },
    lettermark: {
      focusSynonyms: ["bold culinary initials", "natural monograms", "appetizing letterforms", "organic initials", "fresh acronyms"],
      conveySynonyms: ["brand identity", "culinary creativity", "wholesomeness", "natural energy", "friendly warmth"],
      incorporateSynonyms: ["leaf-like connections", "produce-inspired letters", "utensil pattern overlays", "natural flourishes", "organic enhancements"],
    },
    combination: {
      focusSynonyms: ["harmonious food icon-text pairing", "natural symbols with playful type", "appetizing emblems with vibrant typography", "organic icons with fresh fonts", "connected culinary elements"],
      conveySynonyms: ["brand coherence", "culinary creativity", "wholesomeness", "natural energy", "friendly warmth"],
      incorporateSynonyms: ["leaf-inspired icons with natural type", "produce motifs with playful fonts", "utensil patterns with vibrant text", "organic shapes with fresh typography", "connected food metaphors"],
    },
    emblem: {
      focusSynonyms: ["enclosed food symbols", "culinary badges", "organic crests", "natural seals", "appetizing insignias"],
      conveySynonyms: ["brand authority", "culinary expertise", "wholesomeness", "natural energy", "friendly warmth"],
      incorporateSynonyms: ["leaf patterns within borders", "produce-inspired icons enclosed", "utensil motifs in badge form", "organic elements in crest style", "natural symbols in seal format"],
    },
  },
  finance: {
    abstract: {
      focusSynonyms: ["stable forms", "geometric elegance", "structured abstraction", "professional designs", "reliable aesthetics"],
      conveySynonyms: ["trustworthiness", "credibility", "professionalism", "financial stability", "high-end vibe"],
      incorporateSynonyms: ["abstract currency shapes", "growth patterns", "secure geometry", "financial motifs", "structured patterns"],
    },
    brandmark: {
      focusSynonyms: ["iconic financial symbols", "memorable marks", "professional icons", "reliable glyphs", "stable emblems"],
      conveySynonyms: ["financial leadership", "trustworthiness", "credibility", "professionalism", "high-end vibe"],
      incorporateSynonyms: ["currency motifs", "growth-inspired icons", "shield glyphs", "financial symbols", "structured icons"],
    },
    wordmark: {
      focusSynonyms: ["elegant typography", "professional letterforms", "classic fonts", "stable type design", "reliable scripts"],
      conveySynonyms: ["authority", "credibility", "professionalism", "financial stability", "high-end vibe"],
      incorporateSynonyms: ["subtle financial motifs", "growth-inspired accents", "shield-like flourishes", "currency-inspired modifications", "structured pattern overlays"],
    },
    lettermark: {
      focusSynonyms: ["bold financial initials", "professional monograms", "stable letterforms", "geometric initials", "reliable acronyms"],
      conveySynonyms: ["brand identity", "financial stability", "credibility", "professionalism", "authority"],
      incorporateSynonyms: ["currency-like connections", "growth-inspired letters", "shield pattern overlays", "financial flourishes", "structured enhancements"],
    },
    combination: {
      focusSynonyms: ["harmonious financial icon-text pairing", "professional symbols with elegant type", "stable emblems with classic typography", "geometric icons with reliable fonts", "connected financial elements"],
      conveySynonyms: ["brand coherence", "financial stability", "credibility", "professionalism", "authority"],
      incorporateSynonyms: ["currency-inspired icons with professional type", "growth motifs with elegant fonts", "shield patterns with classic text", "structured shapes with reliable typography", "connected financial metaphors"],
    },
    emblem: {
      focusSynonyms: ["enclosed financial symbols", "professional badges", "geometric financial crests", "stable seals", "reliable insignias"],
      conveySynonyms: ["brand authority", "financial leadership", "credibility", "professionalism", "trustworthiness"],
      incorporateSynonyms: ["currency patterns within borders", "growth-inspired icons enclosed", "shield motifs in badge form", "structured elements in crest style", "financial symbols in seal format"],
    },
  },
};

// **Industries**
const industries: Record<IndustryKey, { label: string; snippet: string }> = {
  technology: { label: "Technology", snippet: "Focus on futuristic, digital, and cutting-edge designs for tech brands." },
  food: { label: "Food", snippet: "Emphasize fresh, natural, and appetizing visuals for culinary brands." },
  finance: { label: "Finance", snippet: "Project trustworthiness, stability, and professionalism for financial brands." },
};

// **Style Templates**
const styleTemplates: Record<StyleID, string> = {
  abstract: `
"Design an Abstract logo for [BRAND_NAME], [BRAND_SHORT_DESCRIPTION].
Focus on [FOCUS_SYNONYM] design elements to convey [CONVEY_SYNONYM], 
using [COLOR_SCHEME] as the primary palette. 
Incorporate [INCORPORATE_SYNONYM] that reflects the essence of [INDUSTRY]. 
Avoid overly literal icons, favoring abstract or geometric forms."
`,
  brandmark: `
"Create a Brand Mark logo for [BRAND_NAME], [BRAND_SHORT_DESCRIPTION].
Focus on [FOCUS_SYNONYM] design elements to convey [CONVEY_SYNONYM], 
using [COLOR_SCHEME]. 
Pair a distinctive icon (relevant to [INDUSTRY]) with modern typography, 
ensuring both are cohesive and memorable."
`,
  wordmark: `
"Design a Word Mark logo for [BRAND_NAME], [BRAND_SHORT_DESCRIPTION].
Focus on [FOCUS_SYNONYM] typography to convey [CONVEY_SYNONYM]. 
Use [COLOR_SCHEME] as the main palette, integrating subtle design flourishes 
or letter modifications that reflect [INDUSTRY]."
`,
  lettermark: `
"Develop a Lettermark logo for [BRAND_NAME], [BRAND_SHORT_DESCRIPTION].
Focus on [FOCUS_SYNONYM] letterform design to convey [CONVEY_SYNONYM], 
using [COLOR_SCHEME].
Ensure the lettermark reflects the essence of [INDUSTRY]."
`,
  combination: `
"Craft a Combination Mark logo for [BRAND_NAME], [BRAND_SHORT_DESCRIPTION].
Focus on [FOCUS_SYNONYM] visual elements to convey [CONVEY_SYNONYM]. 
Use [COLOR_SCHEME], pairing a symbolic icon with complementary text. 
Both elements should work together but also stand alone effectively, 
reflecting [INDUSTRY]."
`,
  emblem: `
"Design an Emblem logo for [BRAND_NAME], [BRAND_SHORT_DESCRIPTION].
Focus on [FOCUS_SYNONYM] compositional elements to convey [CONVEY_SYNONYM]. 
Use [COLOR_SCHEME], enclosing the brand name and a symbolic element within a cohesive badge. 
Ensure it captures the essence of [INDUSTRY]."
`,
};

// **Style Data**
const styleData: Record<
  StyleID,
  { label: string; previewImage: string; standardImage: string; optimizedImage: string }
> = {
  abstract: {
    label: "Abstract",
    previewImage: "/styles/abstract-opt.webp",
    standardImage: "/styles/abstract-std.webp",
    optimizedImage: "/styles/abstract-opt.webp",
  },
  brandmark: {
    label: "Brand Mark",
    previewImage: "/styles/brandmark-opt.webp",
    standardImage: "/styles/brandmark-std.webp",
    optimizedImage: "/styles/brandmark-opt.webp",
  },
  wordmark: {
    label: "Word Mark",
    previewImage: "/styles/wordmark-opt.webp",
    standardImage: "/styles/wordmark-std.webp",
    optimizedImage: "/styles/wordmark-opt.webp",
  },
  lettermark: {
    label: "Lettermark",
    previewImage: "/styles/lettermark-opt.webp",
    standardImage: "/styles/lettermark-std.webp",
    optimizedImage: "/styles/lettermark-opt.webp",
  },
  combination: {
    label: "Combination Mark",
    previewImage: "/styles/combination-opt.webp",
    standardImage: "/styles/combination-std.webp",
    optimizedImage: "/styles/combination-opt.webp",
  },
  emblem: {
    label: "Emblem",
    previewImage: "/styles/emblem-opt.webp",
    standardImage: "/styles/emblem-std.webp",
    optimizedImage: "/styles/emblem-opt.webp",
  },
};

// **Color Palettes**
const colorPalettes: ColorPalette[] = [
  { label: "blue (#007BFF), neon aqua (#00D1FF) and accent gray (#333333)", colors: ["#007BFF", "#00D1FF", "#333333"] },
  { label: "Platinum (#007BFF), Floral white (#007BFF) and Almond (#EAD7C3)", colors: ["#DCE0D9", "#FBF6EF", "#EAD7C3"] },
  { label: "Yale Blue (#0D3B66), Lemon chiffon (#FAF0CA) and Naples yellow (#F4D35E)", colors: ["#0D3B66", "#FAF0CA", "#F4D35E"] },
  { label: "Ivory (#F6F7EB), Cinnabar (#E94F37) and Onyx (#393E41)", colors: ["#F6F7EB", "#E94F37", "#393E41"] },
  { label: "Caribbean Current (#006D77), Tiffany Blue (#83C5BE) and Alice Blue (#EDF6F9)", colors: ["#006D77", "#83C5BE", "#EDF6F9"] },
  { label: "Bittersweet (#ED6A5A), Lemon chiffon (#F4F1BB) and Ash gray (#9BC1BC)", colors: ["#ED6A5A", "#F4F1BB", "#9BC1BC"] },
  { label: "Space cadet (#2B2D42), Cool gray (#8D99AE) and Anti-flash white (#EDF2F4)", colors: ["#2B2D42", "#8D99AE", "#EDF2F4"] },
  { label: "Magenta (#FE218B), School bus yellow (#FED700) and Picton Blue (#21B0FE)", colors: ["#FE218B", "#FED700", "#21B0FE"] },
  { label: "Eggshell (#F4F1DE), Burnt sienna (#E07A5F) and Delft Blue (#3D405B)", colors: ["#F4F1DE", "#E07A5F", "#3D405B"] },
  { label: "YInMn Blue (#26547C), Bright pink (Crayola) (#EF476F) and Sunglow (#FFD166)", colors: ["#26547C", "#EF476F", "#FFD166"] },
  { label: "Polynesian blue (#064789), UCLA Blue (#427AA1) and Alice Blue (#EBF2FA)", colors: ["#064789", "#427AA1", "#EBF2FA"] },
  { label: "Mint green (#DDFFF7), Tiffany Blue (#93E1D8) and Melon (#FFA69E)", colors: ["#DDFFF7", "#93E1D8", "#FFA69E"] },
  { label: "Dark moss green (#606C38), Pakistan green (#283618) and Cornsilk (#FEFAE0)", colors: ["#606C38", "#283618", "#FEFAE0"] },
  { label: "Raisin black (#1E1E24), Penn red (#92140C) and Floral white (#FFF8F0)", colors: ["#1E1E24", "#92140C", "#FFF8F0"] },
  { label: "Tropical indigo (#9381FF), Periwinkle (#B8B8FF) and Ghost white (#F8F7FF)", colors: ["#9381FF", "#B8B8FF", "#F8F7FF"] },
  { label: "Rich black (#0C1618), Brunswick green (#004643) and Cornsilk (#FAF4D3)", colors: ["#0C1618", "#004643", "#FAF4D3"] },
  { label: "Buff (#CB997E), Desert sand (#DDBEA9) and Champagne pink (#FFE8D6)", colors: ["#CB997E", "#DDBEA9", "#FFE8D6"] },
  { label: "Black (#000000), Red (#FF0000) and School bus yellow (#FFE100)", colors: ["#000000", "#FF0000", "#FFE100"] },
  { label: "Hunyadi yellow (#EDAE49), Amaranth (#D1495B) and Caribbean Current (#00798C)", colors: ["#EDAE49", "#D1495B", "#00798C"] },
  { label: "Aquamarine (#84FFC9), Powder blue (#AAB2FF) and Mauve (#ECA0FF)", colors: ["#84FFC9", "#AAB2FF", "#ECA0FF"] },
  { label: "Charcoal (#233D4D), Pumpkin (#FE7F2D) and Sunglow (#FCCA46)", colors: ["#233D4D", "#FE7F2D", "#FCCA46"] },
  { label: "Indigo (#540D6E), Red (Crayola) (#EE4266) and Sunglow (#FFD23F)", colors: ["#540D6E", "#EE4266", "#FFD23F"] },
  { label: "Snow (#FBF5F3), Fulvous (#E28413) and Oxford Blue (#000022)", colors: ["#FBF5F3", "#E28413", "#000022"] },
  { label: "Tangelo (#F6511D), Selective yellow (#FFB400) and Picton Blue (#00A6ED)", colors: ["#F6511D", "#FFB400", "#00A6ED"] },
];

// **Aspect Ratios**
const aspectOptions: { label: string; value: AspectRatio; visual: string  }[] = [
  { label: "1:1", value: "1:1", visual: "aspect-square" },
  { label: "16:9", value: "16:9", visual: "aspect-video" },
  { label: "9:16", value: "9:16", visual: "aspect-portrait" },
  { label: "4:3", value: "4:3", visual: "aspect-classic" },
];

// **Main Component**
const ProLogoPage: NextPage = () => {
  const { data: session } = useSession();
  const isLoggedIn = !!session;

  // **Form States**
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryKey | "">("");
  const [selectedStyle, setSelectedStyle] = useState<StyleID | null>(null);
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(0);
  const [selectedAspect, setSelectedAspect] = useState<AspectRatio>("1:1");
  const [selectedModel, setSelectedModel] = useState<AIModel>("flux-schnell");
  const [numberOfImages, setNumberOfImages] = useState("1");

  // **UI States**
  const [error, setError] = useState("");
  const [imagesUrl, setImagesUrl] = useState<{ imageUrl: string }[]>([]);
  const [popupImage, setPopupImage] = useState<string | null>(null);

  // **TRPC Mutation**
  const generateIcon = api.generate.generateIcon.useMutation({
    onSuccess(data) {
      setImagesUrl(data);
    },
    onError(err) {
      console.error(err);
      setError(err.message || "Something went wrong");
    },
  });

  // **Horizontal Scroll Ref for Color Palettes**
  const colorScrollRef = useRef<HTMLDivElement>(null);
  const scrollLeft = () => colorScrollRef.current?.scrollBy({ left: -150, behavior: "smooth" });
  const scrollRight = () => colorScrollRef.current?.scrollBy({ left: 150, behavior: "smooth" });

  // **Helper: Pick Random Item**
  function pickRandom<T>(arr: T[]): T {
    if (!arr.length) throw new Error("Cannot pickRandom from an empty array.");
    const idx = Math.floor(Math.random() * arr.length);
    return arr[idx]!; // Non-null because arr.length > 0
  }

  // **Build Prompt Function**
  function buildPrompt(): string {
    if (!selectedStyle || !selectedIndustry) return "";

    const industryStyleSyns = synonymsByIndustryAndStyle[selectedIndustry]?.[selectedStyle];
    if (!industryStyleSyns) {
      throw new Error("Synonyms not found for this industry and style combination.");
    }

    const focusWord = pickRandom(industryStyleSyns.focusSynonyms);
    const conveyWord = pickRandom(industryStyleSyns.conveySynonyms);
    const incWord = pickRandom(industryStyleSyns.incorporateSynonyms);

    let template = styleTemplates[selectedStyle];
    const paletteObj = colorPalettes[selectedPaletteIndex] ?? colorPalettes[0]!;
    const colorScheme = paletteObj.label;

    template = template
      .replace("[BRAND_NAME]", brandName)
      .replace("[BRAND_SHORT_DESCRIPTION]", brandDescription)
      .replace("[FOCUS_SYNONYM]", focusWord)
      .replace("[CONVEY_SYNONYM]", conveyWord)
      .replace("[INCORPORATE_SYNONYM]", incWord)
      .replace("[COLOR_SCHEME]", colorScheme)
      .replace("[INDUSTRY]", selectedIndustry);

    return template.trim();
  }

  // **Submit Handler with Analytics**
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      void signIn();
      return;
    }
    if (!brandName || !brandDescription || !selectedIndustry || !selectedStyle) {
      setError("Please fill out brand name, short description, industry, and style.");
      return;
    }
    setError("");

    const finalPrompt = buildPrompt();
    if (!finalPrompt) {
      setError("Something is missing, please check your selections.");
      return;
    }

    // Add Analytics Tracking
    (window.dataLayer = window.dataLayer || []).push({
      event: "form_submission",
      designType: "ProLogo",
      industry: selectedIndustry,
      style: selectedStyle,
      styleImage: selectedStyle ? styleData[selectedStyle].previewImage : "none",
      aspectRatio: selectedAspect,
      model: selectedModel,
      numberOfVariants: parseInt(numberOfImages, 10),
      selectedPalette: colorPalettes[selectedPaletteIndex]?.label || "unknown",
    });

    generateIcon.mutate({
      prompt: finalPrompt,
      numberOfImages: parseInt(numberOfImages, 10),
      aspectRatio: selectedAspect,
      model: selectedModel,
    });
  }

  // **Download Handler**
  async function handleDownload(imageUrl: string) {
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const blob = await res.blob();
      const imgBitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = imgBitmap.width;
      canvas.height = imgBitmap.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(imgBitmap, 0, 0);
        const pngBlob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png")
        );
        if (pngBlob) {
          const blobUrl = URL.createObjectURL(pngBlob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = "pro-logo.png";
          link.click();
          URL.revokeObjectURL(blobUrl);
        }
      }
    } catch (error) {
      console.error("Error downloading the image:", error);
    }
  }

  // **Popup Handlers**
  const openPopup = (url: string) => setPopupImage(url);
  const closePopup = () => setPopupImage(null);

  // **Standard/Optimized Images**
  const stdImg = selectedStyle ? styleData[selectedStyle].standardImage : "";
  const optImg = selectedStyle ? styleData[selectedStyle].optimizedImage : "";

  // **JSX**
  return (
    <>
      <Head>
        <title>Professional Logo Generator | Name Design AI</title>
        <meta
          name="description"
          content="Create professional logos for your business with our Logo Generator. Add your brand name, choose a style, and customize in minutes!"
        />
      </Head>
      <main className="container m-auto mb-24 flex flex-col px-8 py-8 max-w-screen-md">
        <h1 className="text-3xl font-bold mb-6">
          Professional Logo Generator: Custom Business Logos Made Easy
        </h1>
        {/* Restored Guideline / Instructions */}
        <p className="text-1xl mt-4">
          Build a standout brand with our Professional Logo Generator! Perfect for businesses, startups, or freelancers, this tool lets you design custom logos tailored to your industry and style. Follow the steps below to get started. 
        </p>
        <div className="mt-4 mb-8 p-4 border border-gray-300 rounded-md dark:bg-gray-700 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold mb-2">Here’s how it works:</h2>
          <ol className="list-decimal list-inside">
            <li><b>Brand Name</b><br/>Enter your company or brand name (e.g., “GreenFlow”). Keep it clear and memorable.  </li>
            <li><b>Short Description</b><br/>Add a tagline or brief description (e.g., “Sustainable home products”). This helps tailor the design.</li>
            <li><b>Choose Industry</b><br/>Select your field from options like: Technology, Food, Finance, Healthcare, Retail and more</li>
            <li><b>Select a Style</b>:<br/>Pick a professional design style:
              <ul className="list-disc ml-5">
                <li><b>Abstract</b>: Unique, non-literal shapes.</li>
                <li><b>Brand Mark</b>: A simple symbol (e.g., Nike’s swoosh).</li>
                <li><b>Word Mark</b>: Stylized text of your brand name.</li>
                <li><b>Lettermark</b>: Initials-based (e.g., IBM).</li>
                <li><b>Combination Mark</b>: Text + symbol combo.</li>
                <li><b>Emblem</b>: Detailed, often circular designs (e.g., badges).</li>
              </ul>
            </li>
            <li><b>Choose AI Model</b>
            <ul className="list-disc ml-5">
                <li><b>Standard</b>: budget-friendly designs.</li>
                <li><b>Optimized (Recommended)</b>: Superior quality for professional results.</li>
              </ul>
            </li>
            <li><b>Choose Color Palette</b></li>
            <li>Aspect Ratio (Image Size):
              <ul className="list-disc ml-5">
                <li><b>1:1 (Square)</b>: Great for business cards or social profiles.</li>
                <li><b>16:9 (Landscape)</b>: Ideal for websites or email signatures.</li>
                <li><b>9:16 (Portrait)</b>: Perfect for vertical signage or mobile.  </li>
                <li><b>4:3 (Classic)</b>: Versatile for print or digital use.</li>
              </ul>
            </li>
            <li><b>Choose Color Palette</b><br/>Choose how many logo variations you want (e.g., 3–5) to explore your options.</li>
            <li><b>Generate Your Logo</b><br/>Hit the “Generate” button to see your custom designs!</li>
          </ol>

          <h3 className="text-md font-semibold mt-3">Tips for Success:</h3>
          <ul className="list-disc list-inside">
            <li>Use a concise description, pick an industry-relevant style (e.g., Word Mark for tech firms), and choose colors that reflect your brand identity.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-6">
          {/* Brand Name */}
          <FormGroup>
            <label className="font-semibold">Brand Name</label>
            <Input
              required
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. EcoFlow"
            />
          </FormGroup>

          {/* Short Description */}
          <FormGroup>
            <label className="font-semibold">Short Description</label>
            <textarea
              required
              className="border rounded p-2 w-full h-20 text-gray-800"
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              placeholder="Describe your brand or product..."
            />
          </FormGroup>

          {/* Industry */}
          <div>
            <label className="block font-semibold mb-2">Industry</label>
            <select
              required
              className="border rounded p-2 w-full dark:bg-gray-700"
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value as IndustryKey)}
            >
              <option value="">-- Select an Industry --</option>
              {(Object.entries(industries) as [IndustryKey, { label: string; snippet: string }][]).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          {/* Style Grid */}
          <div>
            <label className="block font-semibold mb-2">Select a Style</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {(Object.entries(styleData) as [StyleID, {
                label: string;
                previewImage: string;
                standardImage: string;
                optimizedImage: string;
              }][]).map(([key, val]) => (
                <div
                  key={key}
                  onClick={() => setSelectedStyle(key)}
                  className={`cursor-pointer border rounded p-2 flex flex-col items-center
                    hover:shadow-lg transition ${
                      selectedStyle === key ? "ring-2 ring-blue-500" : ""
                    }`}
                >
                  <img
                    src={val.previewImage}
                    alt={val.label}
                    className="w-full h-auto object-cover rounded mb-2"
                  />
                  <span className="text-sm font-medium">{val.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Model Selection */}
          {selectedStyle && (
            <div className="mt-4 border rounded p-4">
              <h3 className="font-semibold mb-2">Choose AI Model</h3>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setSelectedModel("flux-schnell")}
                  className={`relative border rounded p-2 flex flex-col items-center cursor-pointer
                    ${selectedModel === "flux-schnell" ? "ring-2 ring-blue-500" : ""}`}
                >
                  {stdImg ? (
                    <img src={stdImg} alt="Standard Preview" className="w-full h-auto rounded" />
                  ) : (
                    <div className="bg-gray-200 w-full h-32 flex items-center justify-center text-gray-500">
                      No Preview
                    </div>
                  )}
                  <span className="font-medium mt-2">Standard</span>
                  <span className="text-sm text-gray-500">Cost: 1 credit</span>
                </div>
                <div
                  onClick={() => setSelectedModel("flux-dev")}
                  className={`relative border rounded p-2 flex flex-col items-center cursor-pointer
                    ${selectedModel === "flux-dev" ? "ring-2 ring-blue-500" : ""}`}
                >
                  <span className="absolute top-1 right-1 bg-yellow-300 text-black px-2 py-0.5 text-xs rounded">
                    Recommended
                  </span>
                  {optImg ? (
                    <img src={optImg} alt="Optimized Preview" className="w-full h-auto rounded" />
                  ) : (
                    <div className="bg-gray-200 w-full h-32 flex items-center justify-center text-gray-500">
                      No Preview
                    </div>
                  )}
                  <span className="font-medium mt-2">Optimized</span>
                  <span className="text-sm text-gray-500">Cost: 4 credits</span>
                </div>
              </div>
            </div>
          )}

          {/* Color Palette */}
          <div>
            <label className="block font-semibold mb-2">Color Palette</label>
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={scrollLeft}
                className="absolute
                ml-3
                          left-[-1.5rem]
                          top-1/2
                          -translate-y-1/2
                          w-5
                          h-10
                          rounded-md
                          bg-gray-700
                          text-white
                          hover:bg-gray-200
                          border
                          border-gray-300
                          shadow
                          z-10
                          flex
                          items-center
                          justify-center"
              >  <AiOutlineLeft className="text-xl" />
              </button>
              <div ref={colorScrollRef} className="flex gap-4 overflow-x-auto no-scrollbar mr-3 ml-3">
                {colorPalettes.map((palette, idx) => (
                  <div
                    key={palette.label}
                    onClick={() => setSelectedPaletteIndex(idx)}
                    className={`flex flex-col items-center border rounded m-2 p-2 w-20 cursor-pointer transition ${
                      selectedPaletteIndex === idx ? "ring-2 ring-blue-500" : "hover:shadow-lg"
                    }`}
                  >
                    {palette.colors.map((hex) => (
                      <div
                        key={hex}
                        className="w-6 h-6 rounded-full border my-1"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={scrollRight}
                className="absolute
                mr-3
                          right-[-1.5rem]
                          top-1/2
                          -translate-y-1/2
                          w-5
                          h-10
                          rounded-md
                          bg-gray-700
                          text-white
                          hover:bg-gray-200
                          border
                          border-gray-300
                          shadow
                          z-10
                          flex
                          items-center
                          justify-center"
              > <AiOutlineRight className="text-xl" />
              </button>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block font-semibold mb-2">Aspect Ratio (Image Size)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {aspectOptions.map((ratio) => {
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
                        onClick={() => setSelectedAspect(ratio.value)}
                        className={`relative flex items-center justify-center border rounded-lg p-4 transition ${
                          selectedAspect === ratio.value
                            ? "border-blue-500 ring-2 ring-blue-500"
                            : "border-gray-300 hover:border-gray-500"
                        }`}
                      >
                        <div
                          className={`w-full h-21 rounded-lg ${aspectClass} overflow-hidden flex items-center justify-center`}
                          style={{ backgroundColor: "#ddd" }}
                        >
                          <span className="text-gray-600 font-medium">
                            {ratio.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
          </div>

          {/* Number of Images */}
          <div>
            <label className="block font-semibold mb-2">Number of Images</label>
            <FormGroup className="mb-12">
            <Input
              required
              type="number"
              min={1}
              max={10}
              value={numberOfImages}
              onChange={(e) => setNumberOfImages(e.target.value)}
            /></FormGroup>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-600 text-white p-3 rounded">
              {error}
              {error.includes("credits") && (
                <Link href="/buy-credits" className="ml-2 underline font-bold">
                  Buy Credits
                </Link>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button isLoading={generateIcon.isLoading} disabled={generateIcon.isLoading}>
            {isLoggedIn ? "Generate Logo" : "Sign In to Generate"}
          </Button>
        </form>

        {/* Generated Images */}
        {imagesUrl.length > 0 && (
          <>
            <h2 className="text-xl mt-8 mb-2">Your Generated Logos</h2>
            <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-12">
              {imagesUrl.map(({ imageUrl }, index) => (
                <div key={index} className="relative rounded shadow-md hover:shadow-lg transition">
                  <div className="absolute top-0 right-0 flex gap-0">
                    <button
                      type="button"
                      onClick={() => openPopup(imageUrl)}
                      className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none"
                      title="View Fullscreen"
                    >
                      🔍
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDownload(imageUrl)}
                      className="bg-gray-800 bg-opacity-50 text-white hover:bg-opacity-70 focus:outline-none"
                      title="Download"
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

        {/* Fullscreen Popup */}
        {popupImage && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="relative">
              <button
                type="button"
                onClick={closePopup}
                className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-2 hover:bg-gray-700 focus:outline-none"
                title="Close Popup"
              >
                ✕
              </button>
              <img src={popupImage} alt="Fullscreen" className="max-w-full max-h-screen rounded" />
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default ProLogoPage;