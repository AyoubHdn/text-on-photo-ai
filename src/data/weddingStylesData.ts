// src/data/weddingStylesData.ts
import { date } from 'zod';
import { type StyleRules } from '~/data/types/weddingStyles';

export interface AiStyle {
  id: string;
  name: string;
  previewImage: string;
  model: "flux-kontext-pro";
  prompt: string;
  creditCost: number;
}

export interface WeddingStyle {
  id: string; src: string; backgroundSrc: string; title: string;
  templateType: 'text-only' | 'photo';
  styleRules: StyleRules;
  // This is now an array of AI styles for the gallery
  aiStyles?: AiStyle[]; 
  creditCost: number;
}
const photoUpsellStyles: AiStyle[] = [
  {
    id: 'AI-Wedding-Elegance',
    name: 'Wedding Elegance',
    previewImage: '/styles/ai-previews/wedding-elegance.webp', // Create this preview image
    model: 'flux-kontext-pro',
    prompt: 'Transform the couple in the photo, wearing wedding attire, into a beautifully enhanced and refined artistic style that highlights their love and elegance. Match the overall aesthetic of the invitation while keeping all other elements unchanged.',
    creditCost: 5,
  },
  {
    id: 'ai-cartoon',
    name: 'Cartoon',
    previewImage: '/styles/ai-previews/cartoon.webp', // Create this preview image
    model: 'flux-kontext-pro',
    prompt: 'Transform the couple in the photo into a beautiful, elegant cartoon style, matching the aesthetic of the invitation. Keep all other elements unchanged.',
    creditCost: 5,
  },
  {
    id: 'ai-watercolor',
    name: 'Watercolor',
    previewImage: '/styles/ai-previews/watercolor.webp', // Create this preview image
    model: 'flux-kontext-pro',
    prompt: 'Transform the couple in the photo into a beautiful, elegant watercolor painting style, matching the aesthetic of the invitation. Keep all other elements unchanged.',
    creditCost: 5,
  },
  {
    id: 'AI-Oil-Painting',
    name: 'Oil Painting',
    previewImage: '/styles/ai-previews/oil-painting.webp', // Create this preview image
    model: 'flux-kontext-pro',
    prompt: 'Render the couple in the photo in a rich, detailed oil painting style, with smooth brush strokes and classic tones. Match the invitation’s elegance and keep all other elements intact.',
    creditCost: 5,
  },
  {
    id: 'AI-Soft-Focus-Photo',
    name: 'Soft Focus Photo',
    previewImage: '/styles/ai-previews/soft-focus-photo.webp', // Create this preview image
    model: 'flux-kontext-pro',
    prompt: 'Apply a soft, dreamy photo enhancement to the couple in the photo with delicate lighting and smooth background blur. Maintain the original invitation elements.',
    creditCost: 5,
  },
  {
    id: 'AI-Vintage-Illustration',
    name: 'Vintage Illustration',
    previewImage: '/styles/ai-previews/vintage-illustration.webp', // Create this preview image
    model: 'flux-kontext-pro',
    prompt: 'Convert the couple into a romantic vintage-style illustration, with sepia tones, fine ink lines, and a nostalgic touch. Preserve all other parts of the invitation.',
    creditCost: 5,
  },
  {
    id: 'AI-Fairytale/Fantasy',
    name: 'Fairytale/Fantasy',
    previewImage: '/styles/ai-previews/fairytale-fantasy.webp', // Create this preview image
    model: 'flux-kontext-pro',
    prompt: 'Reimagine the couple in a dreamy fairytale art style, with magical lighting, sparkles, and fantasy-like elegance. Keep all invitation design elements untouched.',
    creditCost: 5,
  },
  {
    id: 'AI-Minimalist Flat Art',
    name: 'Minimalist Flat Art',
    previewImage: '/styles/ai-previews/minimalist-flat-art.webp', // Create this preview image
    model: 'flux-kontext-pro',
    prompt: 'Transform the couple into a modern minimalist flat design, using clean lines, soft shadows, and solid colors. Keep the rest of the invitation layout unchanged.',
    creditCost: 5,
  },
  {
    id: 'AI-Classical Renaissance',
    name: 'Classical Renaissance',
    previewImage: '/styles/ai-previews/classical-renaissance.webp', // Create this preview image
    model: 'flux-kontext-pro',
    prompt: 'Turn the couple into a timeless Renaissance-style portrait, with dramatic lighting and classical details. Leave all other invitation elements as they are.',
    creditCost: 5,
  },
  {
    id: 'AI-Cinematic Portrait',
    name: 'Cinematic Portrait',
    previewImage: '/styles/ai-previews/cinematic-portrait.webp', // Create this preview image
    model: 'flux-kontext-pro',
    prompt: 'Stylize the couple with a dramatic, elegant cinematic look, including soft depth of field and film-like tones. Keep all other invitation elements unchanged.',
    creditCost: 5,
  },
  {
    id: 'AI-Glitter & Glam',
    name: 'Glitter & Glam',
    previewImage: '/styles/ai-previews/glitter-glam.webp', // Create this preview image
    model: 'flux-kontext-pro',
    prompt: "Add a glamorous glitter effect to the couple's portrait, with light sparkle overlays and a luxurious glow. Don’t alter the rest of the invitation.",
    creditCost: 5,
  },
];

const bohemianGreenRules: StyleRules = {
  fonts: {
    mainScript: { family: "Armorel Script", file: "Armorel-Script.ttf" },
    nameScript: { family: "Allura", file: "Allura-Regular.ttf" },
    body: { family: "Montserrat", file: "Montserrat-Regular.ttf" },
  },
  formatting: {
    timeFormat: 'ampm', // <-- This template wants the time in AM/PM format
  },
  elements: {
    // Note: The "Save the Date" and "Wedding Celebration" are now part of the background
    // Your code will render the user's specific text over it.
    
    // Names, as perfected by you
    groomName:    { x: 512, y: 730, fontSize: 90, color: "#FFFFFF", fontFamily: "mainScript", fontWeight: "bold", },
    brideName:    { x: 512, y: 880, fontSize: 90, color: "#FFFFFF", fontFamily: "mainScript", fontWeight: "bold", },

    // Date block, as perfected by you
    dayOfWeek:    { x: 350, y: 1195, fontSize: 35, color: "#FFFFFF", letterSpacing: 2, textTransform: "uppercase", fontWeight: "bold", fontFamily: "body" },
    day:          { x: 512, y: 1205, fontSize: 100, color: "#FFFFFF", fontFamily: "body" },
    month:        { x: 512, y: 1090, fontSize: 40, color: "#FFFFFF", letterSpacing: 2, textTransform: "uppercase", fontWeight: "bold", fontFamily: "body" },
    year:         { x: 670, y: 1195, fontSize: 40, color: "#FFFFFF", letterSpacing: 2, fontWeight: "bold", fontFamily: "body" },

    // Venue and Address, as perfected by you
    venue:        { x: 512, y: 1265, fontSize: 35, color: "#FFFFFF", fontWeight: "bold", fontFamily: "body" },
    address:     { x: 512, y: 1320, fontSize: 30, color: "#FFFFFF", fontFamily: "body" },
  },
  // Lines are no longer needed as they are part of the date block design
};
const classicFloralRules: StyleRules = {
  fonts: {
    // We now have three fonts defined
    script: { family: "Great Vibes", file: "GreatVibes-Regular.ttf" },
    serif: { family: "Baskervville", file: "Baskervville.ttf" },
    georgia: { family: "Georgia", file: "georgia.ttf" }, // No file needed for system fonts
  },
  formatting: {
    // This tells the backend how to format the date parts
    dateFormat: {
      weekday: 'short', // "Mon", "Tue", "Sat", etc.
      month: 'short',   // "Jan", "Feb", "May", etc.
      day: 'numeric',
      year: 'numeric',
    },
    // This tells the backend to convert the time to words
    timeFormat: 'words'
  },
  elements: {

    groomName:    { x: 512, y: 490, fontSize: 80, color: "#5B3A29", fontFamily: "script" },
    brideName:    { x: 512, y: 610, fontSize: 80, color: "#5B3A29", fontFamily: "script" },
    
    // --- The 'day' element now uses the Georgia font ---
    dayOfWeek:    { x: 512, y: 768, fontSize: 26, color: "#5B3A29", letterSpacing: 3, textTransform: "uppercase", fontFamily: "serif" },
    day:          { x: 512, y: 820, fontSize: 50, color: "#5B3A29", fontFamily: "georgia" },
    month:        { x: 420, y: 790, fontSize: 19, color: "#8C7D70", letterSpacing: 3, textTransform: "uppercase", fontFamily: "serif", fontWeight: "bold" },
    year:         { x: 600, y: 790, fontSize: 19, color: "#8C7D70", letterSpacing: 3, fontFamily: "serif", fontWeight: "bold" },

    time:         { x: 512, y: 860, fontSize: 22, color: "#8C7D70", letterSpacing: 2, textTransform: "uppercase", fontFamily: "serif" },
    
    venue:        { x: 512, y: 940, fontSize: 31, color: "#5B3A29", letterSpacing: 3, fontWeight: "bold", textTransform: "uppercase", fontFamily: "serif" },
    address:      { x: 512, y: 990, fontSize: 22, color: "#8C7D70", letterSpacing: 1.5, fontFamily: "serif" },
    reception:    { x: 512, y: 1110, fontSize: 32, color: "#8C7D70", fontFamily: "script", content: "reception to follow" },
  },

};

const marbleBlossomRules: StyleRules = {
  fonts: {
    script: { family: "GreatVibes", file: "GreatVibes-Regular.ttf" },
    serif: { family: "AbhayaLibre", file: "AbhayaLibre-Regular.ttf" },
  },
  formatting: {
    timeFormat: 'words', // This template uses time in words
  },
  elements: {

    groomName:    { x: 512, y: 540, fontSize: 110, color: "#B99A66", fontFamily: "script" },
    brideName:    { x: 512, y: 710, fontSize: 110, color: "#B99A66", fontFamily: "script" },
    fullDate:     { x: 512, y: 900, fontSize: 22, color: "#8C7D70", letterSpacing: 2, textTransform: "uppercase", fontFamily: "serif" },
    time:         { x: 512, y: 935, fontSize: 22, color: "#8C7D70", letterSpacing: 2, textTransform: "uppercase", fontFamily: "serif" },
    venue:        { x: 512, y: 1005, fontSize: 24, color: "#8C7D70", letterSpacing: 2.5, textTransform: "uppercase", fontFamily: "serif" },
    address:      { x: 512, y: 1040, fontSize: 24, color: "#8C7D70", letterSpacing: 2.5, textTransform: "uppercase", fontFamily: "serif" },
    reception:    { x: 512, y: 1170, fontSize: 32, color: "#8C7D70", fontFamily: "script", content: "Reception to follow" },
  },
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
    day:          { x: 490, y: 530, fontSize: 180, color: "#696969", fontFamily: "headline" },
    month:        { x: 490, y: 635, fontSize: 50, color: "#8a8a8a", letterSpacing: 4, textTransform: "uppercase", fontFamily: "body" },
    year:         { x: 490, y: 710, fontSize: 40, color: "#8a8a8a", letterSpacing: 4, fontFamily: "body" },
    brideName:    { x: 750, y: 1205, fontSize: 70, color: "#696969", fontFamily: "headline" },
    groomName:    { x: 250, y: 1205, fontSize: 70, color: "#696969", fontFamily: "headline" },
    venue:        { x: 512, y: 1340, fontSize: 30, color: "#6e6e6e", letterSpacing: 2, textTransform: "uppercase", fontFamily: "body" },
    address:       { x: 512, y: 1390, fontSize: 30, color: "#8a8a8a", letterSpacing: 1.5, fontFamily: "body" },
  },
};
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
    groomName:    { x: 768, y: 960, fontSize: 100, color: "#FDB813", fontFamily: "script" },
    brideName:    { x: 256, y: 960, fontSize: 100, color: "#FDB813", fontFamily: "script" },
    navyDate:     { x: 512, y: 1172, fontSize: 50, color: "#FDB813", letterSpacing: 2, textTransform: "lowercase", fontFamily: "serif" },
    time:         { x: 512, y: 1225, fontSize: 30, color: "#FFFFFF", textTransform: "lowercase", fontFamily: "serif" },
    venue:        { x: 512, y: 1280, fontSize: 50, color: "#FFFFFF", letterSpacing: 3, fontWeight: "bold", textTransform: "lowercase", fontFamily: "serif" },
    address:      { x: 512, y: 1330, fontSize: 40, color: "#FFFFFF", textTransform: "lowercase", letterSpacing: 1.5, fontFamily: "serif" },
    reception:    { x: 512, y: 1375, fontSize: 40, color: "#FFFFFF", textTransform: "lowercase", fontFamily: "serif" },
  },
};
const classicRingsPhotoRules: StyleRules = {
  fonts: {
    script: { family: "Parisienne", file: "Parisienne-Regular.ttf" },
    body: { family: "FiraSans SemiBold", file: "FiraSans-SemiBold.ttf" },
    book: { family: "FiraSans Book", file: "FiraSans-Book.otf" },
  },
  photo: {
    width: 2599, // The photo spans the full width of the card
    height: 3629, // The height of the photo area from the top
    x: 0,
    y: 0,
  },
  elements: {
    
    brideName:    { x: 256, y: 920, fontSize: 110, color: "#fbb449", fontFamily: "script" }, // Gold color
    groomName:    { x: 768, y: 920, fontSize: 110, color: "#fbb449", fontFamily: "script" }, // Gold color
    classicDate:  { x: 512, y: 1110, fontSize: 40, color: "#ffaa4c", letterSpacing: 2, fontFamily: "body" },
    time:         { x: 512, y: 1185, fontSize: 60, color: "#a7712b", fontWeight: "bold", fontFamily: "body" },
    venue:        { x: 512, y: 1295, fontSize: 26, color: "#f6a95c", letterSpacing: 1.5, fontFamily: "book" },
    address:      { x: 512, y: 1350, fontSize: 40, color: "#a7712b", fontWeight: "bold", fontFamily: "body" }, // Placeholder for 'Lorem Ipsum Dolor'
  },
};
const pastelBouquetRules: StyleRules = {
  fonts: {
    script: { family: "BLACKJAR", file: "BLACKJAR.ttf" },
    serif: { family: "DubielItalic", file: "DubielItalic.ttf" },
  },
  formatting: {
      timeFormat: 'ampm'
  },
  photo: {
    width: 2548, // The photo spans the full width of the card
    height: 3562, // The height of the photo area from the top
    x: 0,
    y: 0,
  },
  elements: {
    brideName:    { x: 256, y: 900, fontSize: 100, color: "#ca8213", fontFamily: "script" },
    groomName:    { x: 768, y: 900, fontSize: 100, color: "#ca8213", fontFamily: "script" },
    pastelDate:   { x: 512, y: 1115, fontSize: 60, color: "#505153", letterSpacing: 2, fontFamily: "serif" },
    venue:        { x: 512, y: 1240, fontSize: 50, color: "#505153", letterSpacing: 1.5, fontFamily: "serif" },
    time:         { x: 512, y: 1290, fontSize: 40, color: "#505153", fontFamily: "serif" },
  },

};
const classicVeilPhotoRules: StyleRules = {
  fonts: {
    script: { family: "BLACKJAR", file: "BLACKJAR.ttf" },
    body: { family: "Montserrat", file: "Montserrat-Regular.ttf" },
  },
  photo: {
    width: 1230, // The photo spans the full width of the card
    height: 1696, // The height of the photo area from the top
    x: 0,
    y: 0,
  },
  elements: {
    
    brideName:    { x: 256, y: 1000, fontSize: 110, color: "#C18F44", fontFamily: "script" }, // Gold color
    groomName:    { x: 768, y: 1000, fontSize: 110, color: "#C18F44", fontFamily: "script" },
    
    MaxDate:     { x: 512, y: 1230, fontSize: 30, color: "#C18F44", letterSpacing: 2, textTransform: "uppercase", fontWeight: "bold", fontFamily: "body" },
    venue:        { x: 512, y: 1290, fontSize: 28, color: "#505050", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "body" },
    address:      { x: 512, y: 1340, fontSize: 26, color: "#505050", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "body" },

  },
};
export const weddingStylesData: { [category: string]: { [subcategory: string]: WeddingStyle[] } } = {
  "Text-Only Invitations": {
    "Modern & Minimalist": [
      {
        id: "modern-wreath-01",
        src: "/styles/wedding/w001.webp",
        backgroundSrc: "/styles/wedding/w001_background.webp",
        title: "Modern Wreath",
        styleRules: modernWreathRules,
        templateType: 'text-only',
        creditCost: 10,
      },
      {
        id: "boho-green-01",
        src: "/styles/wedding/w-boho-green-01.webp", // The preview image with "Seth & Felicia"
        backgroundSrc: "/styles/wedding/w-boho-green-01_background.webp", // The background WITH "Save the Date"
        title: "Bohemian Green",
        templateType: 'text-only',
        styleRules: bohemianGreenRules,
        creditCost: 10,
      },
      {
        id: "classic-floral-01",
        src: "/styles/wedding/w-classic-floral-01.webp",
        backgroundSrc: "/styles/wedding/w-classic-floral-01_background.webp",
        title: "Classic Floral",
        templateType: 'text-only',
        styleRules: classicFloralRules,
        creditCost: 10,
      },
      {
        id: "marble-blossom-01",
        src: "/styles/wedding/w-marble-blossom-01.webp", // The preview image
        backgroundSrc: "/styles/wedding/w-marble-blossom-01_background.webp", // The clean background
        title: "Marble & Blossom",
        templateType: 'text-only',
        styleRules: marbleBlossomRules,
        creditCost: 10,
      }
    ],
  },
  "Photo Invitations": {
    "Elegant & Personal": [
      {
          id: "classic-photo-01",
          src: "/styles/wedding/w-photo-01.webp",
          backgroundSrc: "/styles/wedding/w-photo-01_background.webp", // Must be a PNG with transparency
          title: "Classic Photo Frame",
          templateType: 'photo', // <-- Specify the type
          styleRules: navyCartoonStyleRules,
          creditCost: 10,
          aiStyles: photoUpsellStyles,
      },
      {
        id: "classic-rings-photo-01",
        src: "/styles/wedding/w-rings-photo-01.webp", // The preview image
        backgroundSrc: "/styles/wedding/w-rings-photo-01_background.webp", // The background with transparent window
        title: "Classic Rings Photo",
        templateType: 'photo',
        styleRules: classicRingsPhotoRules,
        creditCost: 10,
        aiStyles: photoUpsellStyles,
      },
      {
        id: "pastel-bouquet-01",
        src: "/styles/wedding/w-pastel-bouquet-01.webp", // The preview image
        backgroundSrc: "/styles/wedding/w-pastel-bouquet-01_background.webp", // The background with transparent window
        title: "Pastel Bouquet",
        templateType: 'photo',
        styleRules: pastelBouquetRules,
        creditCost: 10,
        aiStyles: photoUpsellStyles,
      },
      {
        id: "classic-veil-photo-01",
        src: "/styles/wedding/w-veil-photo-01.webp", // The preview image
        backgroundSrc: "/styles/wedding/w-veil-photo-01_background.webp", // The background with transparent window
        title: "Classic Veil Photo",
        templateType: 'photo',
        styleRules: classicVeilPhotoRules,
        creditCost: 10,
        aiStyles: photoUpsellStyles,
      }
    ],
  }
};