export type ArabicNameMugV1Style = {
  id: string;
  name: string;
  src: string;
  basePrompt: string;
  recommended?: boolean;
};

export const ARABIC_NAME_MUG_V1_STYLES: ArabicNameMugV1Style[] = [
  {
    id: "crescent-glow",
    name: "Crescent Glow",
    src: "/styles/arabic/ramadan-crescent.webp",
    basePrompt:
      "Elegant Arabic calligraphy of 'Text' integrated subtly within a glowing crescent shape, centered night composition, deep navy sky with soft golden light accents, refined premium ambiance, high contrast readability, no extra words or symbols, print-ready flat artwork, no frame, no border, no mat, no mockup, design-only, full-bleed composition.",
  },
  {
    id: "lantern-light",
    name: "Lantern Glow",
    src: "/styles/arabic/ramadan-lantern.webp",
    basePrompt:
      "Arabic name 'Text' illuminated by ornate lantern-inspired light, centered composition, warm golden glow against a deep blue background, soft ambient shadows, luxurious gift-ready atmosphere, crisp readable lettering, no extra text, premium print-ready finish, flat artwork only, no mug, no product mockup, no physical lantern scene, no photography.",
  },
  {
    id: "moonlit-silhouette",
    name: "Moonlit Silhouette",
    src: "/styles/arabic/ramadan-mosque.webp",
    basePrompt:
      "Full-bleed square digital illustration. The entire canvas must be filled edge-to-edge with a deep blue night sky. Refined Arabic calligraphy of 'Text' in elegant gold Thuluth style, centered and glowing softly. Behind the text, a subtle heritage silhouette integrated directly into the same background scene under a starry sky and crescent moon. Smooth gradient lighting. Gold and deep blue color palette. Flat 2D digital graphic. No border. No frame. No paper. No wall. No margin. No mockup. No presentation context. No image inside another image.",
  },
  {
    id: "golden-geometry",
    name: "Golden Geometry",
    src: "/styles/arabic/ramadan-geometry.webp",
    basePrompt:
      "Arabic calligraphy of 'Text' centered within intricate geometric patterns, gold ornamental linework on a deep matte black flat background, symmetrical balanced composition, sharp crisp details, high readability, no extra text elements, luxury print-ready design, flat 2D artwork only, no mug, no cup, no product shot, no 3D object render.",
  },
  {
    id: "noor-glow",
    name: "Noor Glow",
    src: "/styles/arabic/noor-glow.webp",
    basePrompt:
      "Arabic calligraphy of 'Text' radiating soft luminous glow, centered composition, dark gradient background with subtle golden particles, elegant premium ambiance, crisp letter definition, no extra words or symbols, high-end print-ready artwork.",
  },
  {
    id: "moonlight-silver",
    name: "Moonlight Silver",
    src: "/styles/arabic/moonlight-silver.webp",
    basePrompt:
      "Arabic lettering of 'Text' in moonlight silver foil style, centered composition on a deep indigo night background, soft halo glow, controlled metallic illustration effect, clear readable forms, no additional text, premium luxury print-ready aesthetic, flat 2D artwork only, not a mug, not a product mockup, not a real object scene.",
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    src: "/styles/arabic/rose-gold.webp",
    basePrompt:
      "Elegant Arabic text 'Text' in a brushed rose gold foil illustration style, centered composition, rich blush-to-burgundy full-bleed background with subtle luxury lighting, clear readable letterforms, clean edges, no extra words or logos, refined print-safe artwork, flat design only, no mug, no product application, no product photography.",
  },
  {
    id: "thuluth-gold",
    name: "Thuluth Gold",
    src: "/styles/arabic/thuluth-gold.webp",
    basePrompt:
      "Arabic Thuluth calligraphy of the name 'Text', centered single composition, thick gold ink illustration on a deep antique gold-and-umber illuminated manuscript background, subtle ornamental border, clean negative space, crisp edges, high legibility, no extra words or symbols, premium print-ready artwork, flat printable art only, no mug, no product mockup, no photographed object.",
    recommended: true,
  },
  {
    id: "diwani-flow",
    name: "Diwani Flow",
    src: "/styles/arabic/diwani-ink.webp",
    basePrompt:
      "Elegant Diwani Arabic calligraphy of 'Text' with flowing interlocking curves and refined flourishes, black ink over a warm amber-to-espresso illuminated background, centered composition, ornamental yet readable, crisp linework, no extra words, premium printable art.",
  },
  {
    id: "square-kufic",
    name: "Square Kufic",
    src: "/styles/arabic/kufic-geo.webp",
    basePrompt:
      "Geometric Square Kufic Arabic calligraphy of 'Text', architectural maze-like structure, black lines with antique gold accents on a deep charcoal full-bleed background, centered balanced grid, precise edges, minimalist heritage design, no extra symbols or words, print-ready vector-like clarity.",
  },
  {
    id: "floral-bloom",
    name: "Floral Bloom",
    src: "/styles/arabic/floral.webp",
    basePrompt:
      "Arabic name 'Text' shaped from fresh flowers and green leaves, centered top-down composition on a rich emerald botanical background, balanced color palette, crisp botanical detail, clear letter readability, no extra text, premium printable floral art.",
  },
  {
    id: "watercolor-splash",
    name: "Watercolor Splash",
    src: "/styles/arabic/watercolor.webp",
    basePrompt:
      "Watercolor Arabic lettering of 'Text' on a textured indigo watercolor background, centered composition, soft pastel washes with controlled ink splashes, clean readable strokes, balanced negative space, no extra text, premium printable fine-art style.",
  },
  {
    id: "cosmic-galaxy",
    name: "Cosmic Galaxy",
    src: "/styles/arabic/galaxy.webp",
    basePrompt:
      "Arabic name 'Text' formed from stars, nebula dust, and cosmic light, centered deep-space composition, rich blue-violet tones with controlled glow, clear readable silhouette, minimal visual clutter, no extra text, premium printable cosmic art.",
  },
  {
    id: "emerald-mosaic",
    name: "Emerald Mosaic",
    src: "/styles/arabic/emerald.webp",
    basePrompt:
      "Arabic calligraphy of 'Text' in a rich emerald and antique gold illuminated manuscript style, centered composition, elegant ornamental accents, crisp readable lettering, premium heritage atmosphere, flat printable artwork only, no extra text, no mug, no cup, no product mockup, no tabletop scene, no photography.",
  },
  {
    id: "diwani-jali",
    name: "Diwani Jali",
    src: "/styles/arabic/diwani-jali.webp",
    basePrompt:
      "Luxurious Diwani Jali Arabic calligraphy of 'Text' with layered ornamental curves and regal flow, centered composition, refined gold and ink contrast, crisp readability, premium printable artwork, flat 2D design only, no extra text, no mug, no product mockup, no photography.",
  },
  {
    id: "diamond-light",
    name: "Diamond Light",
    src: "/styles/arabic/diamond.webp",
    basePrompt:
      "Arabic calligraphy of 'Text' with faceted diamond-like illumination, centered composition, elegant silver and crystal highlights, clean dark background, sharp readable forms, premium printable artwork, flat graphic design only, no mug, no cup, no object scene.",
  },
  {
    id: "fire-script",
    name: "Fire Script",
    src: "/styles/arabic/fire.webp",
    basePrompt:
      "Arabic lettering of 'Text' rendered as controlled luminous fire calligraphy, centered composition, dramatic warm glow, crisp readable silhouette, dark clean background, premium printable artwork, flat 2D illustration only, no product, no mug, no photography.",
  },
  {
    id: "glitch-neon",
    name: "Glitch Neon",
    src: "/styles/arabic/glitch.webp",
    basePrompt:
      "Arabic calligraphy of 'Text' in a futuristic glitch neon style, centered composition, electric cyan and magenta highlights, sharp readable edges, balanced minimal background, premium printable artwork, flat digital design only, no mug, no product mockup, no scene.",
  },
  {
    id: "gold-ornament",
    name: "Gold Ornament",
    src: "/styles/arabic/gold-3d.webp",
    basePrompt:
      "Arabic calligraphy of 'Text' in rich illustrated gold ornament style, centered composition, premium dark background, crisp readable letterforms, elegant luxury mood, flat printable artwork only, not a real object, no mug, no product photography.",
  },
  {
    id: "graffiti-calligraphy",
    name: "Graffiti Calligraphy",
    src: "/styles/arabic/graffiti.webp",
    basePrompt:
      "Arabic name 'Text' in bold contemporary graffiti calligraphy, centered composition, expressive paint energy with clean readability, controlled urban color palette, premium printable artwork, flat design only, no wall photo, no mug, no product scene.",
  },
  {
    id: "kufic-ancient",
    name: "Kufic Ancient",
    src: "/styles/arabic/kufic-ancient.webp",
    basePrompt:
      "Ancient-inspired Kufic Arabic calligraphy of 'Text', centered composition, sandstone and ink palette, manuscript-like atmosphere, precise geometry, clear readable structure, premium printable flat artwork, no mug, no product mockup, no photography.",
  },
  {
    id: "neon-blue",
    name: "Neon Blue",
    src: "/styles/arabic/neon-blue.webp",
    basePrompt:
      "Arabic calligraphy of 'Text' in luminous neon blue light style, centered composition, dark minimal background, crisp glowing edges, high readability, premium printable flat artwork, no extra text, no mug, no product application, no scene photography.",
  },
  {
    id: "neon-pink",
    name: "Neon Pink",
    src: "/styles/arabic/neon-pink.webp",
    basePrompt:
      "Arabic calligraphy of 'Text' in luminous neon pink and violet light style, centered composition, dark minimal background, crisp glowing forms, premium printable flat artwork, no mug, no product mockup, no photography.",
  },
  {
    id: "paper-cut",
    name: "Paper Cut",
    src: "/styles/arabic/paper-cut.webp",
    basePrompt:
      "Arabic calligraphy of 'Text' in layered paper-cut illustration style, centered composition, refined shadows within flat layered artwork, clean readable silhouette, premium printable design, no mug, no physical product scene, no photography.",
  },
  {
    id: "sand-desert",
    name: "Sand Desert",
    src: "/styles/arabic/sand-desert.webp",
    basePrompt:
      "Arabic calligraphy of 'Text' shaped with desert sand and warm dune tones, centered composition, elegant texture, readable forms, minimal background, premium printable flat artwork, no mug, no product mockup, no landscape photo scene.",
  },
  {
    id: "silver-chrome",
    name: "Silver Chrome",
    src: "/styles/arabic/silver-chrome.webp",
    basePrompt:
      "Arabic calligraphy of 'Text' in polished silver chrome illustration style, centered composition, dark clean background, crisp readable forms, premium printable flat design only, not a real object, no mug, no product photography.",
  },
  {
    id: "smoke-art",
    name: "Smoke Art",
    src: "/styles/arabic/smoke-art.webp",
    basePrompt:
      "Arabic name 'Text' formed from elegant flowing smoke trails, centered composition, soft atmospheric contrast, readable silhouette, premium printable flat artwork, no mug, no product scene, no photography.",
  },
  {
    id: "thuluth-black",
    name: "Thuluth Black",
    src: "/styles/arabic/thuluth-black.webp",
    basePrompt:
      "Arabic Thuluth calligraphy of 'Text' in rich black ink on a refined sand-to-umber illuminated background, centered composition, classic manuscript elegance, clean negative space, crisp edges, premium printable artwork, flat design only, no mug, no product mockup.",
  },
  {
    id: "water-flow",
    name: "Water Flow",
    src: "/styles/arabic/water.webp",
    basePrompt:
      "Arabic calligraphy of 'Text' shaped from flowing water and liquid light, centered composition, cool luminous tones, clear readable letterforms, premium printable flat artwork, no mug, no product scene, no photography.",
  },
  {
    id: "wireframe-light",
    name: "Wireframe Light",
    src: "/styles/arabic/wireframe.webp",
    basePrompt:
      "Arabic calligraphy of 'Text' in a refined wireframe digital geometry style, centered composition, futuristic minimal background, crisp readable structure, premium printable flat artwork, no mug, no product application, no photography.",
  },
];
