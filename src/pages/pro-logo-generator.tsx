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
type IndustryKey = "technology" | "food" | "finance" | "healthcare" | "retail" | "ecommerce" | "fashion" | "entertainment" | "sports" | "education" | "sustainability" | "realestate" | "professionalservices";
type StyleID = "abstract" | "brandmark" | "wordmark" | "lettermark" | "combination" | "emblem";
type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3";
type AIModel = "flux-schnell" | "flux-dev" | "ideogram-ai/ideogram-v2-turbo";

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
  healthcare: {
    abstract: {
      focusSynonyms: ["healing shapes", "fluid forms", "calm abstractions", "wellness designs", "soothing aesthetics"],
      conveySynonyms: ["care", "trust", "health", "compassion", "modern wellness"],
      incorporateSynonyms: ["wave-like patterns", "heart-inspired geometry", "cross motifs", "organic flows", "healing symbols"],
    },
    brandmark: {
      focusSynonyms: ["iconic health symbols", "memorable care marks", "wellness icons", "trustworthy glyphs", "healing emblems"],
      conveySynonyms: ["health leadership", "compassionate care", "reliability", "patient focus", "professionalism"],
      incorporateSynonyms: ["cross motifs", "heart icons", "pulse lines", "care symbols", "medical glyphs"],
    },
    wordmark: {
      focusSynonyms: ["soothing typography", "clear letterforms", "health-inspired fonts", "calm type design", "trustworthy scripts"],
      conveySynonyms: ["clarity", "care", "dependability", "health focus", "professional warmth"],
      incorporateSynonyms: ["pulse-inspired accents", "cross-like flourishes", "heart motifs in type", "organic letter tweaks", "subtle care elements"],
    },
    lettermark: {
      focusSynonyms: ["bold health initials", "care-inspired monograms", "wellness letterforms", "trustworthy initials", "modern acronyms"],
      conveySynonyms: ["brand identity", "healthcare focus", "trust", "compassion", "modern care"],
      incorporateSynonyms: ["cross-like connections", "heart-shaped letters", "pulse overlays", "organic flourishes", "healing enhancements"],
    },
    combination: {
      focusSynonyms: ["harmonious health icon-text pairing", "care symbols with soothing type", "wellness emblems with clear typography", "organic icons with trustworthy fonts", "connected care elements"],
      conveySynonyms: ["brand coherence", "healthcare trust", "compassion", "modern care", "reliability"],
      incorporateSynonyms: ["cross-inspired icons with calm type", "heart motifs with clear fonts", "pulse patterns with soothing text", "organic shapes with trustworthy typography", "connected health metaphors"],
    },
    emblem: {
      focusSynonyms: ["enclosed health symbols", "care badges", "wellness crests", "trustworthy seals", "healing insignias"],
      conveySynonyms: ["health authority", "care leadership", "dependability", "compassion", "professionalism"],
      incorporateSynonyms: ["cross patterns within borders", "heart icons enclosed", "pulse motifs in badge form", "organic elements in crest style", "healing symbols in seal format"],
    },
  },
  retail: {
    abstract: {
      focusSynonyms: ["dynamic shapes", "vibrant forms", "bold abstractions", "shopper-friendly designs", "engaging aesthetics"],
      conveySynonyms: ["energy", "accessibility", "customer focus", "modern appeal", "vibrancy"],
      incorporateSynonyms: ["abstract shopping bags", "geometric storefronts", "flowing product lines", "retail patterns", "engaging motifs"],
    },
    brandmark: {
      focusSynonyms: ["iconic retail symbols", "memorable shop marks", "customer-centric icons", "bold glyphs", "vibrant emblems"],
      conveySynonyms: ["retail excellence", "customer trust", "energy", "modern appeal", "reliability"],
      incorporateSynonyms: ["bag motifs", "cart icons", "storefront glyphs", "product symbols", "retail shapes"],
    },
    wordmark: {
      focusSynonyms: ["playful typography", "engaging letterforms", "retail-inspired fonts", "vibrant type design", "bold scripts"],
      conveySynonyms: ["brand energy", "accessibility", "friendliness", "modern retail", "customer appeal"],
      incorporateSynonyms: ["cart-inspired flourishes", "bag-like accents", "product motifs in type", "retail tweaks", "vibrant overlays"],
    },
    lettermark: {
      focusSynonyms: ["bold retail initials", "shop-inspired monograms", "vibrant letterforms", "customer-friendly initials", "modern acronyms"],
      conveySynonyms: ["brand identity", "retail energy", "trust", "accessibility", "modernity"],
      incorporateSynonyms: ["bag-like connections", "cart-shaped letters", "storefront overlays", "vibrant flourishes", "retail enhancements"],
    },
    combination: {
      focusSynonyms: ["harmonious retail icon-text pairing", "shop symbols with bold type", "vibrant emblems with engaging typography", "dynamic icons with modern fonts", "connected retail elements"],
      conveySynonyms: ["brand coherence", "retail appeal", "customer trust", "energy", "modernity"],
      incorporateSynonyms: ["bag-inspired icons with bold type", "cart motifs with vibrant fonts", "storefront patterns with engaging text", "dynamic shapes with modern typography", "connected retail metaphors"],
    },
    emblem: {
      focusSynonyms: ["enclosed retail symbols", "shop badges", "vibrant crests", "customer-centric seals", "engaging insignias"],
      conveySynonyms: ["retail authority", "shop leadership", "trust", "energy", "accessibility"],
      incorporateSynonyms: ["bag patterns within borders", "cart icons enclosed", "storefront motifs in badge form", "vibrant elements in crest style", "retail symbols in seal format"],
    },
  },
  ecommerce: {
    abstract: {
      focusSynonyms: ["digital shapes", "flowing forms", "online abstractions", "e-commerce designs", "modern aesthetics"],
      conveySynonyms: ["innovation", "accessibility", "digital trust", "online energy", "modern commerce"],
      incorporateSynonyms: ["abstract carts", "digital flow patterns", "click motifs", "online geometry", "e-commerce symbols"],
    },
    brandmark: {
      focusSynonyms: ["iconic e-commerce symbols", "memorable online marks", "digital icons", "trustworthy glyphs", "modern emblems"],
      conveySynonyms: ["e-commerce leadership", "digital reliability", "innovation", "online appeal", "trust"],
      incorporateSynonyms: ["cart motifs", "click icons", "package glyphs", "digital symbols", "online shapes"],
    },
    wordmark: {
      focusSynonyms: ["sleek typography", "digital letterforms", "e-commerce fonts", "modern type design", "trustworthy scripts"],
      conveySynonyms: ["clarity", "innovation", "accessibility", "digital trust", "modern commerce"],
      incorporateSynonyms: ["cart-inspired flourishes", "click accents", "package motifs in type", "digital tweaks", "online overlays"],
    },
    lettermark: {
      focusSynonyms: ["bold e-commerce initials", "digital monograms", "online letterforms", "trustworthy initials", "modern acronyms"],
      conveySynonyms: ["brand identity", "e-commerce focus", "trust", "innovation", "accessibility"],
      incorporateSynonyms: ["cart-like connections", "click-shaped letters", "package overlays", "digital flourishes", "online enhancements"],
    },
    combination: {
      focusSynonyms: ["harmonious e-commerce icon-text pairing", "digital symbols with sleek type", "online emblems with modern typography", "dynamic icons with trustworthy fonts", "connected e-commerce elements"],
      conveySynonyms: ["brand coherence", "e-commerce trust", "innovation", "online appeal", "reliability"],
      incorporateSynonyms: ["cart-inspired icons with sleek type", "click motifs with modern fonts", "package patterns with trustworthy text", "digital shapes with modern typography", "connected e-commerce metaphors"],
    },
    emblem: {
      focusSynonyms: ["enclosed e-commerce symbols", "digital badges", "online crests", "trustworthy seals", "modern insignias"],
      conveySynonyms: ["e-commerce authority", "digital leadership", "trust", "innovation", "accessibility"],
      incorporateSynonyms: ["cart patterns within borders", "click icons enclosed", "package motifs in badge form", "digital elements in crest style", "online symbols in seal format"],
    },
  },
  fashion: {
    abstract: {
      focusSynonyms: ["trendy abstractions", "sleek shapes", "chic forms", "stylish designs", "modern elegance"],
      conveySynonyms: ["fashion-forward", "elegance", "trendiness", "style", "sophistication"],
      incorporateSynonyms: ["flowing fabric patterns", "geometric elegance", "runway-inspired lines", "texture motifs", "fashion accents"],
    },
    brandmark: {
      focusSynonyms: ["iconic style marks", "bold fashion symbols", "sleek icons", "trendy glyphs", "elegant emblems"],
      conveySynonyms: ["fashion authority", "stylish impact", "elegance", "modernity", "trend leadership"],
      incorporateSynonyms: ["fabric silhouettes", "pattern icons", "style glyphs", "minimalist motifs", "fashion symbols"],
    },
    wordmark: {
      focusSynonyms: ["elegant typography", "trendy letterforms", "fashion fonts", "sleek type", "stylish scripts"],
      conveySynonyms: ["brand sophistication", "style clarity", "trendiness", "elegance", "modern flair"],
      incorporateSynonyms: ["fabric flourishes", "patterned accents", "runway-inspired tweaks", "style lines", "texture overlays"],
    },
    lettermark: {
      focusSynonyms: ["bold fashion initials", "chic monograms", "sleek letters", "trendy initials", "elegant acronyms"],
      conveySynonyms: ["fashion identity", "style focus", "elegance", "trendiness", "sophistication"],
      incorporateSynonyms: ["fabric connections", "patterned letters", "style overlays", "sleek flourishes", "fashion enhancements"],
    },
    combination: {
      focusSynonyms: ["stylish icon-text blend", "trendy symbols with sleek type", "chic emblems with elegant fonts", "fashion pairings", "modern style elements"],
      conveySynonyms: ["fashion coherence", "style harmony", "elegance", "trendiness", "sophistication"],
      incorporateSynonyms: ["fabric icons with sleek type", "pattern motifs with trendy fonts", "runway accents with elegant text", "style shapes with modern typography", "fashion connections"],
    },
    emblem: {
      focusSynonyms: ["enclosed fashion badges", "trendy crests", "chic seals", "stylish insignias", "elegant emblems"],
      conveySynonyms: ["fashion prestige", "style authority", "elegance", "trend leadership", "sophistication"],
      incorporateSynonyms: ["fabric patterns in borders", "patterned icons enclosed", "runway motifs in badges", "sleek elements in crests", "fashion seals"],
    },
  },
  entertainment: {
    abstract: {
      focusSynonyms: ["vibrant abstractions", "playful shapes", "dynamic forms", "fun designs", "bold aesthetics"],
      conveySynonyms: ["excitement", "creativity", "fun", "energy", "entertainment vibe"],
      incorporateSynonyms: ["abstract waves", "geometric bursts", "playful patterns", "motion motifs", "vibrant symbols"],
    },
    brandmark: {
      focusSynonyms: ["iconic fun symbols", "bold entertainment marks", "vibrant icons", "dynamic glyphs", "playful emblems"],
      conveySynonyms: ["entertainment energy", "creative spark", "fun", "excitement", "modern appeal"],
      incorporateSynonyms: ["star motifs", "wave icons", "play glyphs", "motion symbols", "entertainment shapes"],
    },
    wordmark: {
      focusSynonyms: ["dynamic typography", "playful letterforms", "vibrant fonts", "fun type", "bold scripts"],
      conveySynonyms: ["brand excitement", "creative flair", "fun", "energy", "entertainment vibe"],
      incorporateSynonyms: ["wave flourishes", "star accents", "playful tweaks", "motion lines", "vibrant overlays"],
    },
    lettermark: {
      focusSynonyms: ["bold entertainment initials", "fun monograms", "vibrant letters", "playful initials", "dynamic acronyms"],
      conveySynonyms: ["entertainment identity", "creative focus", "fun", "excitement", "energy"],
      incorporateSynonyms: ["wave connections", "star-shaped letters", "playful overlays", "dynamic flourishes", "entertainment enhancements"],
    },
    combination: {
      focusSynonyms: ["dynamic icon-text blend", "playful symbols with bold type", "vibrant emblems with fun fonts", "entertainment pairings", "energetic elements"],
      conveySynonyms: ["entertainment harmony", "creative energy", "fun", "excitement", "modern appeal"],
      incorporateSynonyms: ["star icons with bold type", "wave motifs with vibrant fonts", "playful accents with dynamic text", "motion shapes with fun typography", "entertainment connections"],
    },
    emblem: {
      focusSynonyms: ["enclosed entertainment badges", "vibrant crests", "playful seals", "dynamic insignias", "fun emblems"],
      conveySynonyms: ["entertainment authority", "creative prestige", "fun", "energy", "excitement"],
      incorporateSynonyms: ["wave patterns in borders", "star icons enclosed", "playful motifs in badges", "vibrant elements in crests", "entertainment seals"],
    },
  },
  sports: {
    abstract: {
      focusSynonyms: ["energetic abstractions", "bold shapes", "dynamic forms", "athletic designs", "strong aesthetics"],
      conveySynonyms: ["strength", "energy", "dynamism", "athleticism", "sports spirit"],
      incorporateSynonyms: ["abstract motion", "geometric power", "sport lines", "dynamic patterns", "athletic motifs"],
    },
    brandmark: {
      focusSynonyms: ["iconic sports symbols", "bold athletic marks", "strong icons", "dynamic glyphs", "energetic emblems"],
      conveySynonyms: ["sports strength", "athletic energy", "dynamism", "power", "team spirit"],
      incorporateSynonyms: ["ball motifs", "motion icons", "power glyphs", "sport symbols", "athletic shapes"],
    },
    wordmark: {
      focusSynonyms: ["bold typography", "energetic letterforms", "sports fonts", "dynamic type", "strong scripts"],
      conveySynonyms: ["brand power", "athleticism", "energy", "dynamism", "sports spirit"],
      incorporateSynonyms: ["motion flourishes", "power accents", "sport tweaks", "dynamic lines", "athletic overlays"],
    },
    lettermark: {
      focusSynonyms: ["bold sports initials", "athletic monograms", "strong letters", "dynamic initials", "energetic acronyms"],
      conveySynonyms: ["sports identity", "athletic focus", "strength", "energy", "dynamism"],
      incorporateSynonyms: ["motion connections", "power-shaped letters", "sport overlays", "dynamic flourishes", "athletic enhancements"],
    },
    combination: {
      focusSynonyms: ["energetic icon-text blend", "athletic symbols with bold type", "dynamic emblems with strong fonts", "sports pairings", "powerful elements"],
      conveySynonyms: ["sports harmony", "athletic strength", "energy", "dynamism", "team spirit"],
      incorporateSynonyms: ["ball icons with bold type", "motion motifs with strong fonts", "sport accents with dynamic text", "power shapes with athletic typography", "sports connections"],
    },
    emblem: {
      focusSynonyms: ["enclosed sports badges", "strong crests", "dynamic seals", "athletic insignias", "energetic emblems"],
      conveySynonyms: ["sports authority", "athletic prestige", "strength", "energy", "dynamism"],
      incorporateSynonyms: ["motion patterns in borders", "ball icons enclosed", "sport motifs in badges", "dynamic elements in crests", "athletic seals"],
    },
  },
  education: {
    abstract: {
      focusSynonyms: ["inspired abstractions", "calm shapes", "learning forms", "educational designs", "wise aesthetics"],
      conveySynonyms: ["knowledge", "growth", "wisdom", "accessibility", "learning spirit"],
      incorporateSynonyms: ["abstract books", "geometric inspiration", "learning lines", "growth patterns", "knowledge motifs"],
    },
    brandmark: {
      focusSynonyms: ["iconic learning symbols", "wise marks", "calm icons", "accessible glyphs", "inspired emblems"],
      conveySynonyms: ["education wisdom", "knowledge growth", "accessibility", "learning", "trust"],
      incorporateSynonyms: ["book motifs", "growth icons", "wisdom glyphs", "learning symbols", "education shapes"],
    },
    wordmark: {
      focusSynonyms: ["clear typography", "inspired letterforms", "education fonts", "calm type", "wise scripts"],
      conveySynonyms: ["brand knowledge", "growth", "wisdom", "accessibility", "learning spirit"],
      incorporateSynonyms: ["book flourishes", "growth accents", "learning tweaks", "wisdom lines", "inspired overlays"],
    },
    lettermark: {
      focusSynonyms: ["bold education initials", "wise monograms", "calm letters", "accessible initials", "inspired acronyms"],
      conveySynonyms: ["education identity", "learning focus", "knowledge", "growth", "wisdom"],
      incorporateSynonyms: ["book connections", "growth-shaped letters", "learning overlays", "wise flourishes", "education enhancements"],
    },
    combination: {
      focusSynonyms: ["inspired icon-text blend", "learning symbols with clear type", "wise emblems with calm fonts", "education pairings", "growth elements"],
      conveySynonyms: ["education harmony", "knowledge wisdom", "growth", "accessibility", "learning"],
      incorporateSynonyms: ["book icons with clear type", "growth motifs with wise fonts", "learning accents with calm text", "inspired shapes with education typography", "education connections"],
    },
    emblem: {
      focusSynonyms: ["enclosed education badges", "wise crests", "calm seals", "learning insignias", "inspired emblems"],
      conveySynonyms: ["education authority", "knowledge prestige", "wisdom", "growth", "trust"],
      incorporateSynonyms: ["book patterns in borders", "growth icons enclosed", "learning motifs in badges", "wise elements in crests", "education seals"],
    },
  },
  sustainability: {
    abstract: {
      focusSynonyms: ["green abstractions", "natural shapes", "eco forms", "sustainable designs", "earth aesthetics"],
      conveySynonyms: ["sustainability", "nature", "eco-friendliness", "harmony", "green living"],
      incorporateSynonyms: ["abstract leaves", "geometric nature", "eco lines", "green patterns", "sustainable motifs"],
    },
    brandmark: {
      focusSynonyms: ["iconic eco symbols", "green marks", "natural icons", "sustainable glyphs", "earth emblems"],
      conveySynonyms: ["sustainability focus", "eco harmony", "nature", "green trust", "modern eco"],
      incorporateSynonyms: ["leaf motifs", "earth icons", "eco glyphs", "sustainable symbols", "natural shapes"],
    },
    wordmark: {
      focusSynonyms: ["natural typography", "green letterforms", "sustainability fonts", "calm type", "eco scripts"],
      conveySynonyms: ["brand harmony", "sustainability", "nature", "eco-friendliness", "green living"],
      incorporateSynonyms: ["leaf flourishes", "earth accents", "eco tweaks", "green lines", "sustainable overlays"],
    },
    lettermark: {
      focusSynonyms: ["bold eco initials", "natural monograms", "green letters", "sustainable initials", "earth acronyms"],
      conveySynonyms: ["sustainability identity", "eco focus", "nature", "harmony", "green trust"],
      incorporateSynonyms: ["leaf connections", "earth-shaped letters", "eco overlays", "green flourishes", "sustainable enhancements"],
    },
    combination: {
      focusSynonyms: ["eco icon-text blend", "natural symbols with green type", "sustainable emblems with calm fonts", "earth pairings", "green elements"],
      conveySynonyms: ["sustainability harmony", "eco balance", "nature", "green living", "trust"],
      incorporateSynonyms: ["leaf icons with green type", "earth motifs with eco fonts", "sustainable accents with calm text", "natural shapes with green typography", "eco connections"],
    },
    emblem: {
      focusSynonyms: ["enclosed eco badges", "green crests", "natural seals", "sustainable insignias", "earth emblems"],
      conveySynonyms: ["sustainability authority", "eco prestige", "nature", "harmony", "green trust"],
      incorporateSynonyms: ["leaf patterns in borders", "earth icons enclosed", "eco motifs in badges", "green elements in crests", "sustainable seals"],
    },
  },
  realestate: {
    abstract: {
      focusSynonyms: ["stable abstractions", "modern shapes", "property forms", "real estate designs", "solid aesthetics"],
      conveySynonyms: ["trust", "stability", "modernity", "property strength", "reliability"],
      incorporateSynonyms: ["abstract rooftops", "geometric stability", "property lines", "solid patterns", "estate motifs"],
    },
    brandmark: {
      focusSynonyms: ["iconic property symbols", "stable marks", "modern icons", "reliable glyphs", "solid emblems"],
      conveySynonyms: ["real estate trust", "property stability", "modernity", "strength", "reliability"],
      incorporateSynonyms: ["roof motifs", "key icons", "building glyphs", "estate symbols", "property shapes"],
    },
    wordmark: {
      focusSynonyms: ["elegant typography", "stable letterforms", "real estate fonts", "modern type", "reliable scripts"],
      conveySynonyms: ["brand stability", "trust", "modernity", "property strength", "reliability"],
      incorporateSynonyms: ["roof flourishes", "key accents", "building tweaks", "stable lines", "estate overlays"],
    },
    lettermark: {
      focusSynonyms: ["bold property initials", "stable monograms", "modern letters", "reliable initials", "solid acronyms"],
      conveySynonyms: ["real estate identity", "property focus", "trust", "stability", "modernity"],
      incorporateSynonyms: ["roof connections", "building-shaped letters", "estate overlays", "stable flourishes", "property enhancements"],
    },
    combination: {
      focusSynonyms: ["stable icon-text blend", "property symbols with modern type", "reliable emblems with elegant fonts", "estate pairings", "solid elements"],
      conveySynonyms: ["real estate harmony", "property trust", "stability", "modernity", "reliability"],
      incorporateSynonyms: ["roof icons with modern type", "key motifs with elegant fonts", "building accents with reliable text", "stable shapes with estate typography", "property connections"],
    },
    emblem: {
      focusSynonyms: ["enclosed property badges", "stable crests", "modern seals", "reliable insignias", "solid emblems"],
      conveySynonyms: ["real estate authority", "property prestige", "trust", "stability", "reliability"],
      incorporateSynonyms: ["roof patterns in borders", "building icons enclosed", "key motifs in badges", "stable elements in crests", "estate seals"],
    },
  },
  professionalservices: {
    abstract: {
      focusSynonyms: ["clean abstractions", "structured shapes", "professional forms", "service designs", "reliable aesthetics"],
      conveySynonyms: ["expertise", "trust", "professionalism", "reliability", "modern service"],
      incorporateSynonyms: ["abstract lines", "geometric clarity", "service motifs", "precise patterns", "expert accents"],
    },
    brandmark: {
      focusSynonyms: ["iconic service symbols", "clean marks", "professional icons", "reliable glyphs", "expert emblems"],
      conveySynonyms: ["service expertise", "professional trust", "reliability", "modernity", "authority"],
      incorporateSynonyms: ["line motifs", "clarity icons", "service glyphs", "expert symbols", "professional shapes"],
    },
    wordmark: {
      focusSynonyms: ["elegant typography", "clean letterforms", "service fonts", "professional type", "reliable scripts"],
      conveySynonyms: ["brand expertise", "trust", "professionalism", "reliability", "modern service"],
      incorporateSynonyms: ["line flourishes", "clarity accents", "service tweaks", "precise lines", "expert overlays"],
    },
    lettermark: {
      focusSynonyms: ["bold service initials", "clean monograms", "professional letters", "reliable initials", "expert acronyms"],
      conveySynonyms: ["service identity", "expert focus", "trust", "professionalism", "reliability"],
      incorporateSynonyms: ["line connections", "clarity-shaped letters", "service overlays", "precise flourishes", "professional enhancements"],
    },
    combination: {
      focusSynonyms: ["clean icon-text blend", "service symbols with elegant type", "reliable emblems with professional fonts", "expert pairings", "structured elements"],
      conveySynonyms: ["service harmony", "expert trust", "professionalism", "reliability", "modernity"],
      incorporateSynonyms: ["line icons with elegant type", "clarity motifs with professional fonts", "service accents with reliable text", "clean shapes with expert typography", "service connections"],
    },
    emblem: {
      focusSynonyms: ["enclosed service badges", "clean crests", "professional seals", "reliable insignias", "expert emblems"],
      conveySynonyms: ["service authority", "expert prestige", "trust", "professionalism", "reliability"],
      incorporateSynonyms: ["line patterns in borders", "clarity icons enclosed", "service motifs in badges", "clean elements in crests", "professional seals"],
    },
  },
};

// **Industries**
const industries: Record<IndustryKey, { label: string; snippet: string }> = {
  technology: { label: "Technology", snippet: "Focus on futuristic, digital, and cutting-edge designs for tech brands." },
  food: { label: "Food", snippet: "Emphasize fresh, natural, and appetizing visuals for culinary brands." },
  finance: { label: "Finance", snippet: "Project trustworthiness, stability, and professionalism for financial brands." },
  healthcare: { label: "Healthcare", snippet: "Highlight care, trust, and wellness for medical and health brands." },
  retail: { label: "Retail", snippet: "Create vibrant, customer-focused designs for retail businesses." },
  ecommerce: { label: "E-Commerce", snippet: "Design bold, digital-first logos for online stores." },
  fashion: { label: "Fashion & Beauty", snippet: "Craft stylish, trendy visuals for fashion and beauty brands." },
  entertainment: { label: "Entertainment", snippet: "Capture fun, creativity, and excitement for media and entertainment." },
  sports: { label: "Sports & Leisure", snippet: "Focus on energy, strength, and dynamism for sports brands." },
  education: { label: "Education", snippet: "Reflect knowledge, growth, and accessibility for learning brands." },
  sustainability: { label: "Sustainability", snippet: "Emphasize eco-friendly, natural designs for green businesses." },
  realestate: { label: "Real Estate", snippet: "Project stability, trust, and modernity for property brands." },
  professionalservices: { label: "Professional Services", snippet: "Convey expertise, reliability, and professionalism for service providers." },
};

// **Style Templates** (unchanged)
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

// **Style Data** (unchanged)
const styleData: Record<
  StyleID,
  { label: string; previewImage: string; standardImage: string; optimizedImage: string; bestResultImage: string}
> = {
  abstract: {
    label: "Abstract",
    previewImage: "/styles/abstract-opt.webp",
    standardImage: "/styles/abstract-std.webp",
    optimizedImage: "/styles/abstract-opt.webp",
    bestResultImage: "/styles/abstract-best.webp",
  },
  brandmark: {
    label: "Brand Mark",
    previewImage: "/styles/brandmark-opt.webp",
    standardImage: "/styles/brandmark-std.webp",
    optimizedImage: "/styles/brandmark-opt.webp",
    bestResultImage: "/styles/brandmark-best.webp",
  },
  wordmark: {
    label: "Word Mark",
    previewImage: "/styles/wordmark-opt.webp",
    standardImage: "/styles/wordmark-std.webp",
    optimizedImage: "/styles/wordmark-opt.webp",
    bestResultImage: "/styles/wordmark-best.webp",
  },
  lettermark: {
    label: "Lettermark",
    previewImage: "/styles/lettermark-opt.webp",
    standardImage: "/styles/lettermark-std.webp",
    optimizedImage: "/styles/lettermark-opt.webp",
    bestResultImage: "/styles/lettermark-best.webp",
  },
  combination: {
    label: "Combination Mark",
    previewImage: "/styles/combination-opt.webp",
    standardImage: "/styles/combination-std.webp",
    optimizedImage: "/styles/combination-opt.webp",
    bestResultImage: "/styles/combination-best.webp",
  },
  emblem: {
    label: "Emblem",
    previewImage: "/styles/emblem-opt.webp",
    standardImage: "/styles/emblem-std.webp",
    optimizedImage: "/styles/emblem-opt.webp",
    bestResultImage: "/styles/emblem-best.webp",
  },
};

// **Color Palettes** (unchanged)
const colorPalettes: ColorPalette[] = [
  { label: "blue (#007BFF), neon aqua (#00D1FF) and accent gray (#333333)", colors: ["#007BFF", "#00D1FF", "#333333"] },
  { label: "Platinum (#DCE0D9), Floral white (#FBF6EF) and Almond (#EAD7C3)", colors: ["#DCE0D9", "#FBF6EF", "#EAD7C3"] },
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

// **Aspect Ratios** (unchanged)
const aspectOptions: { label: string; value: AspectRatio; visual: string }[] = [
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
  const bestImg = selectedStyle ? styleData[selectedStyle].bestResultImage : "";

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
        <p className="text-1xl mt-4">
          Build a standout brand with our Professional Logo Generator! Perfect for businesses, startups, or freelancers, this tool lets you design custom logos tailored to your industry and style. Follow the steps below to get started.
        </p>
        <div className="mt-4 mb-8 p-4 border border-gray-300 rounded-md dark:bg-gray-700 text-sm leading-relaxed">
          <h2 className="text-lg font-semibold mb-2">Here’s how it works:</h2>
          <ol className="list-decimal list-inside">
            <li><b>Brand Name</b><br/>Enter your company or brand name (e.g., “GreenFlow”). Keep it clear and memorable.</li>
            <li><b>Short Description</b><br/>Add a tagline or brief description (e.g., “Sustainable home products”). This helps tailor the design.</li>
            <li><b>Choose Industry</b><br/>Select your field from options like: Technology, Food, Finance, Healthcare, Retail, and more.</li>
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
                <li><b>Standard</b>: Budget-friendly designs.</li>
                <li><b>Optimized (Recommended)</b>: Superior quality for professional results.</li>
              </ul>
            </li>
            <li><b>Choose Color Palette</b></li>
            <li>Aspect Ratio (Image Size):
              <ul className="list-disc ml-5">
                <li><b>1:1 (Square)</b>: Great for business cards or social profiles.</li>
                <li><b>16:9 (Landscape)</b>: Ideal for websites or email signatures.</li>
                <li><b>9:16 (Portrait)</b>: Perfect for vertical signage or mobile.</li>
                <li><b>4:3 (Classic)</b>: Versatile for print or digital use.</li>
              </ul>
            </li>
            <li><b>Choose Number of Variations</b><br/>Select how many logo variations you want (e.g., 3–5) to explore your options.</li>
            <li><b>Generate Your Logo</b><br/>Hit the “Generate” button to see your custom designs!</li>
          </ol>
          <h3 className="text-md font-semibold mt-3">Tips for Success:</h3>
          <ul className="list-disc list-inside">
            <li>Use a concise description, pick an industry-relevant style (e.g., Word Mark for tech firms), and choose colors that reflect your brand identity.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-6">
          <FormGroup>
            <label className="font-semibold">Brand Name</label>
            <Input
              required
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. EcoFlow"
            />
          </FormGroup>

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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Standard Model */}
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
                {/* Optimized Model */}
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
                {/* --- ADDED: Third Model (Ideogram) --- */}
                <div
                  onClick={() => setSelectedModel("ideogram-ai/ideogram-v2-turbo")}
                  className={`relative border rounded p-2 flex flex-col items-center cursor-pointer
                    ${selectedModel === "ideogram-ai/ideogram-v2-turbo" ? "ring-2 ring-blue-500" : ""}`}
                >
                  {/* You can place a badge if you like, or remove it */}
                  <span className="absolute top-1 right-1 bg-red-300 text-black px-2 py-0.5 text-xs rounded">
                    Top Tier
                  </span>
                  {bestImg ? (
                    <img src={bestImg} alt="Optimized Preview" className="w-full h-auto rounded" />
                  ) : (
                    <div className="bg-gray-200 w-full h-32 flex items-center justify-center text-gray-500">
                      {/* Or you can add a real image if you have it */}
                      Ultimate Preview
                    </div>
                  )}
                  <span className="font-medium mt-2">Ultimate</span>
                  <span className="text-sm text-gray-500">Cost: 8 credits</span>
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
                className="absolute ml-3 left-[-1.5rem] top-1/2 -translate-y-1/2 w-5 h-10 rounded-md bg-gray-700 text-white hover:bg-gray-200 border border-gray-300 shadow z-10 flex items-center justify-center"
              >
                <AiOutlineLeft className="text-xl" />
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
                className="absolute mr-3 right-[-1.5rem] top-1/2 -translate-y-1/2 w-5 h-10 rounded-md bg-gray-700 text-white hover:bg-gray-200 border border-gray-300 shadow z-10 flex items-center justify-center"
              >
                <AiOutlineRight className="text-xl" />
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
                      <span className="text-gray-600 font-medium">{ratio.label}</span>
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
                max={selectedModel === "ideogram-ai/ideogram-v2-turbo" ? 1 : 10}
                value={numberOfImages}
                onChange={(e) => setNumberOfImages(e.target.value)}
                disabled={selectedModel === "ideogram-ai/ideogram-v2-turbo"}
              />
            </FormGroup>
          </div>

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

          <Button isLoading={generateIcon.isLoading} disabled={generateIcon.isLoading}>
            {isLoggedIn ? "Generate Logo" : "Sign In to Generate"}
          </Button>
        </form>

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
                    unoptimized={true}
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