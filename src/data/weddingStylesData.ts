// src/data/weddingStylesData.ts
import { type StyleRules } from '~/data/types/weddingStyles';

export interface AiStyle {
  id: string;
  name: string;
  previewImage: string;
  model: "flux-kontext-pro";
  prompt: string;
}

export interface WeddingStyle {
  id: string; src: string; backgroundSrc: string; title: string;
  templateType: 'text-only' | 'photo';
  styleRules: StyleRules;
  // This is now an array of AI styles for the gallery
  aiStyles?: AiStyle[]; 
}

const navyCartoonStyleRules: StyleRules = {
  // NEW: This is now just for the OPTIONAL AI upsell
  aiStyle: {
    model: "black-forest-labs/flux-kontext-pro",
    prompt: "Transform the couple in the photo into a beautiful, elegant cartoon style, matching the dark navy and gold aesthetic of the invitation. Keep all other elements of the invitation unchanged."
  },
  photo: { width: 1823, height: 2554, x: 0, y: 0 },
  fonts: {
    script: { family: "BLACKJAR", file: "BLACKJAR.ttf" },
    serif: { family: "Sraction", file: "Sraction-regular.otf" },
    // We can use the same serif font for the ampersand in this design
  },
  formatting: {
    dateFormat: { month: '2-digit', day: '2-digit', year: 'numeric' }, // e.g., "08.07.2025"
    dateSeparator: '.', // Period between parts
    dateCase: 'none',
  },
  elements: {
    brideName:    { x: 260, y: 960, fontSize: 100, color: "#FDB813", fontFamily: "script" },
    groomName:    { x: 704, y: 960, fontSize: 100, color: "#FDB813", fontFamily: "script" },
    date:         { x: 512, y: 1172, fontSize: 50, color: "#FDB813", letterSpacing: 2, textTransform: "lowercase", fontFamily: "serif" },
    time:         { x: 512, y: 1235, fontSize: 24, color: "#FFFFFF", textTransform: "lowercase", fontFamily: "serif" },
    venue:        { x: 512, y: 1282, fontSize: 32, color: "#FFFFFF", letterSpacing: 3, fontWeight: "bold", textTransform: "lowercase", fontFamily: "serif" },
    address:      { x: 512, y: 1310, fontSize: 32, color: "#FFFFFF", textTransform: "lowercase", letterSpacing: 1.5, fontFamily: "serif" },
    reception:    { 
        x: 512, y: 1320,
          fontSize: 24, 
          color: "#FFFFFF", 
          fontFamily: "serif", 
          textTransform: "lowercase",
          content: "reception to follow" // This is the default text used for 'sameLocation'
        },  
  },
  // This design has no code-drawn lines; they are part of the background image
};

// DESIGN BLUEPRINT FOR "Modern Wreath"
const modernWreathRules: StyleRules = {
  fonts: {
    headline: { family: "Playfair Display", file: "PlayfairDisplay-Regular.ttf" },
    body: { family: "Montserrat", file: "Montserrat-Regular.ttf" },
  },
  formatting: {
    dateFormat: { month: 'long', day: 'numeric', year: 'numeric' }, // e.g., "AUGUST 8, 2025"
    dateSeparator: ' ', // Space between parts
    dateCase: 'uppercase', // e.g., AUGUST
  },
  elements: {
    day:          { x: 490, y: 530, fontSize: 180, color: "#363636", fontFamily: "headline" },
    month:        { x: 490, y: 635, fontSize: 50, color: "#8a8a8a", letterSpacing: 4, textTransform: "uppercase", fontFamily: "body" },
    year:         { x: 490, y: 710, fontSize: 40, color: "#8a8a8a", letterSpacing: 4, fontFamily: "body" },
    brideName:    { x: 250, y: 1205, fontSize: 70, color: "#363636", fontFamily: "headline" },
    groomName:    { x: 750, y: 1205, fontSize: 70, color: "#363636", fontFamily: "headline" },
    venue:        { x: 512, y: 1340, fontSize: 30, color: "#6e6e6e", letterSpacing: 2, textTransform: "uppercase", fontFamily: "body" },
    address:      { x: 512, y: 1390, fontSize: 30, color: "#8a8a8a", letterSpacing: 1.5, fontFamily: "body" },
  },
};
export const weddingStylesData: { [category: string]: { [subcategory: string]: WeddingStyle[] } } = {
  "Modern & Minimalist": {
    "Chic & Simple": [
      {
        id: "modern-wreath-01",
        src: "/styles/wedding/w001.webp",
        backgroundSrc: "/styles/wedding/w001_background.jpg",
        title: "Modern Wreath",
        styleRules: modernWreathRules,
        templateType: 'text-only'
      }
    ]
  },
  "Photo Invitations": {
    "Elegant & Personal": [
        {
            id: "classic-photo-01",
            src: "/styles/wedding/w-photo-01.webp",
            backgroundSrc: "/styles/wedding/w-photo-01_background.png", // Must be a PNG with transparency
            title: "Classic Photo Frame",
            templateType: 'photo', // <-- Specify the type
            styleRules: navyCartoonStyleRules,

            aiStyles: [
                  {
                    id: 'ai-cartoon',
                    name: 'Cartoon',
                    previewImage: '/styles/ai-previews/cartoon.webp', // Create this preview image
                    model: 'flux-kontext-pro',
                    prompt: 'Transform the couple in the photo into a beautiful, elegant cartoon style, matching the aesthetic of the invitation. Keep all other elements unchanged.'
                  },
                  {
                    id: 'ai-watercolor',
                    name: 'Watercolor',
                    previewImage: '/styles/ai-previews/watercolor.webp', // Create this preview image
                    model: 'flux-kontext-pro',
                    prompt: 'Transform the couple in the photo into a dreamy, soft-focus watercolor painting, blending seamlessly with the invitation background. Keep all other elements unchanged.'
                  },
          // Add more AI styles here
        ]
      }
    ],
  }
};