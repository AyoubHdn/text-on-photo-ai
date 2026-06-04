// src/data/arabicStylesData.ts
// Merged from arabicStylesData(1).ts + missing styles from Wallpapers.json.
// Existing category names are preserved; selected new styles are promoted to subcategories for pSEO pages.

type ArabicStyleEntry = {
  altText: string;
  src: string;
  name: string;
  basePrompt: string;
};

type ArabicStylesData = Record<string, Record<string, ArabicStyleEntry[]>>;

const ARABIC_OUTPUT_REQUIREMENTS =
  "Final output requirements: create one square finished artwork, design-only, edge-to-edge full-bleed composition; keep the Arabic lettering large, centered, crisp, and readable; preserve the exact provided name only; no extra words, no Latin letters, no watermark, no logo, no frame, no border, no mat, no margin, no wall, no paper sheet, no canvas stretcher, no product mockup, no phone screen, no room scene, no hands, no presentation context.";

function enhanceArabicPrompt(basePrompt: string) {
  const normalizedPrompt = basePrompt.trim().replace(/\s+/g, " ");

  if (normalizedPrompt.includes(ARABIC_OUTPUT_REQUIREMENTS)) {
    return normalizedPrompt;
  }

  return `${normalizedPrompt} ${ARABIC_OUTPUT_REQUIREMENTS}`;
}

function withEnhancedArabicPrompts(data: ArabicStylesData): ArabicStylesData {
  return Object.fromEntries(
    Object.entries(data).map(([category, subcategories]) => [
      category,
      Object.fromEntries(
        Object.entries(subcategories).map(([subcategory, styles]) => [
          subcategory,
          styles.map((style) => ({
            ...style,
            basePrompt: enhanceArabicPrompt(style.basePrompt),
          })),
        ]),
      ),
    ]),
  ) as ArabicStylesData;
}

export const arabicStylesData = withEnhancedArabicPrompts({
  "Seasonal & Islamic Themes": {
    "Ramadan Nights": [
      {
        "altText": "Crescent Glow Arabic name art example: Elegant Arabic calligraphy of custom Arabic name integrated subtly within a glowing crescent moon, deep navy sky with.",
        "src": "/styles/arabic/ramadan-crescent.webp",
        "name": "Crescent Glow",
        "basePrompt": "Elegant Arabic calligraphy of 'Text' integrated subtly within a glowing crescent moon, centered night composition, deep navy sky with soft golden light accents, refined Islamic ambiance, high contrast readability, no extra words or symbols, premium Ramadan artwork, no frame, no border, no mat, no mockup, design-only, full-bleed composition."
      },
      {
        "altText": "Lantern Light Arabic name art example: Arabic name custom Arabic name illuminated by traditional Ramadan lantern light, warm golden glow against dark blue.",
        "src": "/styles/arabic/ramadan-lantern.webp",
        "name": "Lantern Light",
        "basePrompt": "Arabic name 'Text' illuminated by traditional Ramadan lantern light, centered composition, warm golden glow against dark blue background, soft ambient shadows, luxurious spiritual atmosphere, crisp readable lettering, no extra text, premium festive print-ready finish."
      },
      {
        "altText": "Sacred Silhouette Arabic name art example: The entire canvas must be filled edge-to-edge with a deep blue Ramadan night sky, Refined Arabic calligraphy of.",
        "src": "/styles/arabic/ramadan-mosque.webp",
        "name": "Sacred Silhouette",
        "basePrompt": "Full-bleed square digital illustration. The entire canvas must be filled edge-to-edge with a deep blue Ramadan night sky. Refined Arabic calligraphy of 'Text' in elegant gold Thuluth style, centered and glowing softly. Behind the text, a subtle mosque silhouette integrated directly into the same background scene under a starry sky and crescent moon. Smooth gradient lighting. Gold and deep blue color palette. Flat 2D digital graphic. No border. No frame. No paper. No wall. No margin. No mockup. No presentation context. No image inside another image."
      },
      {
        "altText": "Golden Geometry Arabic name art example: Arabic calligraphy of custom Arabic name centered within intricate Islamic geometric patterns, embossed gold on deep.",
        "src": "/styles/arabic/ramadan-geometry.webp",
        "name": "Golden Geometry",
        "basePrompt": "Arabic calligraphy of 'Text' centered within intricate Islamic geometric patterns, embossed gold on deep matte black background, symmetrical balanced composition, sharp crisp details, high readability, no extra text elements, luxury Ramadan print-ready design."
      }
    ]
  },
  "Traditional Calligraphy": {
    "Thuluth": [
      {
        "altText": "Golden Royal Arabic name art example: Arabic Thuluth calligraphy of the name custom Arabic name, thick embossed gold ink on vintage textured parchment",
        "src": "/styles/arabic/thuluth-gold.webp",
        "name": "Golden Royal",
        "basePrompt": "Arabic Thuluth calligraphy of the name 'Text', centered single composition, thick embossed gold ink on vintage textured parchment, subtle Islamic geometric illuminated border, clean negative space, crisp edges, high legibility, no extra words or symbols, premium print-ready artwork."
      },
      {
        "altText": "Classic Ink Arabic name art example: Traditional Arabic Thuluth calligraphy of custom Arabic name in sharp black ink on pure white paper, high contrast",
        "src": "/styles/arabic/thuluth-black.webp",
        "name": "Classic Ink",
        "basePrompt": "Traditional Arabic Thuluth calligraphy of 'Text' in sharp black ink on pure white paper, centered and balanced layout, clean strokes, high contrast, minimal background noise, no Latin letters, no extra text, scan-like clarity, print-ready."
      }
    ],
    "Diwani": [
      {
        "altText": "Diwani Flow Arabic name art example: Elegant Diwani Arabic calligraphy of custom Arabic name with flowing interlocking curves and refined flourishes, black.",
        "src": "/styles/arabic/diwani-ink.webp",
        "name": "Diwani Flow",
        "basePrompt": "Elegant Diwani Arabic calligraphy of 'Text' with flowing interlocking curves and refined flourishes, black ink on warm cream paper, centered composition, ornamental yet readable, crisp linework, no extra words, premium printable art."
      },
      {
        "altText": "Diwani Jali Arabic name art example: Diwani Jali Arabic calligraphy of custom Arabic name, dense ornamental structure with decorative dots and marks",
        "src": "/styles/arabic/diwani-jali.webp",
        "name": "Diwani Jali",
        "basePrompt": "Diwani Jali Arabic calligraphy of 'Text', dense ornamental structure with decorative dots and marks, gold and black palette on deep royal blue texture, centered framing, sharp details, high contrast, no extra text, luxury print-ready finish."
      }
    ],
    "Diwani Modern": [
      {
        "altText": "Diwani Modern Arabic name art example: Modern minimalist Arabic Diwani calligraphy of custom Arabic name with a single flowing brush stroke aesthetic.",
        "src": "/styles/arabic/diwani-modern.webp",
        "name": "Diwani Modern",
        "basePrompt": "Modern minimalist Arabic Diwani calligraphy of 'Text', single flowing brush stroke aesthetic, centered balanced composition, warm beige gradient background, rich deep black ink with authentic ink-bleed texture at stroke edges, flowing Diwani curves, generous negative space with subtle paper grain, contemporary premium aesthetic, no extra words, no Latin letters, no additional Arabic text, no frame, no border, no mockup, full-bleed composition."
      }
    ],
    "Ruq'ah Classic": [
      {
        "altText": "Ruq'ah Classic Arabic name art example: Classic Arabic Ruq'ah calligraphy of custom Arabic name with smooth confident strokes on warm cream paper.",
        "src": "/styles/arabic/ruqah-classic.webp",
        "name": "Ruq'ah Classic",
        "basePrompt": "Classic Arabic Ruq'ah calligraphy of 'Text', smooth confident strokes, centered balanced composition, warm cream background with subtle aged paper texture and soft natural vignetting, rich deep black ink with authentic hand-lettered quality, natural breathing room, premium scribe quality, no extra words, no Latin letters, no additional Arabic text, no frame, no border, no mockup, full-bleed composition."
      }
    ],
    "Ruq'ah Bold": [
      {
        "altText": "Ruq'ah Bold Arabic name art example: Bold modern Arabic Ruq'ah calligraphy of custom Arabic name with thick confident brush strokes.",
        "src": "/styles/arabic/ruqah-bold.webp",
        "name": "Ruq'ah Bold",
        "basePrompt": "Bold modern Arabic Ruq'ah calligraphy of 'Text', thick confident brush strokes, centered balanced composition, deep midnight navy gradient background, rich dark ink letterforms with controlled rim lighting, subtle bokeh light particles, contemporary aesthetic with traditional roots, high readability, no extra words, no Latin letters, no additional Arabic text, no frame, no border, no mockup, full-bleed composition."
      }
    ],
    "Classic Nastaliq": [
      {
        "altText": "Classic Nastaliq Arabic name art example: Classical Arabic Nastaliq calligraphy of custom Arabic name with flowing diagonal strokes and Persian elegance.",
        "src": "/styles/arabic/nastaliq-classic.webp",
        "name": "Classic Nastaliq",
        "basePrompt": "Classical Arabic Nastaliq calligraphy of 'Text', flowing diagonal strokes with characteristic Persian elegance, centered balanced composition, warm cream Persian manuscript background with subtle aged paper texture, faint floral illumination patterns in pale gold, organic vine and leaf motifs near the edges, warm amber candlelight glow, professional calligrapher quality, no extra words, no Latin letters, no additional Arabic text, no frame, no border, no mockup, full-bleed composition."
      }
    ],
    "Kufic": [
      {
        "altText": "Square Kufic Arabic name art example: Geometric Square Kufic Arabic calligraphy of custom Arabic name, architectural maze-like structure",
        "src": "/styles/arabic/kufic-geo.webp",
        "name": "Square Kufic",
        "basePrompt": "Geometric Square Kufic Arabic calligraphy of 'Text', architectural maze-like structure, black lines on clean white background, centered balanced grid, precise edges, minimalist Islamic design, no extra symbols or words, print-ready vector-like clarity."
      },
      {
        "altText": "Ancient Stone Arabic name art example: Eastern Kufic calligraphy of custom Arabic name carved into ancient sandstone, frontal composition with controlled side.",
        "src": "/styles/arabic/kufic-ancient.webp",
        "name": "Ancient Stone",
        "basePrompt": "Eastern Kufic calligraphy of 'Text' carved into ancient sandstone, frontal composition with controlled side lighting, detailed stone texture, readable carved strokes, muted earthy tones, no extra inscriptions, premium printable artwork."
      }
    ],
    "Ornate Kufic": [
      {
        "altText": "Ornate Kufic Arabic name art example: Decorated Arabic Kufic calligraphy of custom Arabic name with floriated terminals and gold arabesque details.",
        "src": "/styles/arabic/kufic-ornate.webp",
        "name": "Ornate Kufic",
        "basePrompt": "Ornate decorated Arabic Kufic calligraphy of 'Text' with intricate floriated terminals and decorative flourishes, centered symmetrical composition, deep burgundy background with subtle Islamic arabesque patterns in deep gold, gold leaf primary letterforms with warm controlled glow, balanced ornamental density, museum-quality Islamic manuscript aesthetic, no extra words, no Latin letters, no additional Arabic text, no frame, no border, no mockup, full-bleed composition."
      }
    ]
  },
  "Luxury & 3D Materials": {
    "Precious Metals": [
      {
        "altText": "Moonlight Silver Arabic name art example: 3D Arabic lettering of custom Arabic name in brushed moonlight silver metal, soft halo glow",
        "src": "/styles/arabic/moonlight-silver.webp",
        "name": "Moonlight Silver",
        "basePrompt": "3D Arabic lettering of 'Text' in brushed moonlight silver metal, centered composition on deep indigo Ramadan night background, soft halo glow, clean reflections, clear readable forms, no additional text, premium luxury print-ready aesthetic."
      },
      {
        "altText": "Solid Gold 3D Arabic name art example: 3D Arabic lettering of custom Arabic name in polished solid gold, neutral dark luxury backdrop",
        "src": "/styles/arabic/gold-3d.webp",
        "name": "Solid Gold 3D",
        "basePrompt": "3D Arabic lettering of 'Text' in polished solid gold, centered hero composition, neutral dark luxury backdrop, controlled reflections, clean silhouette, sharp focus, no extra objects or words, high-end product-ready print aesthetic."
      },
      {
        "altText": "Silver Chrome Arabic name art example: Futuristic Arabic typography of custom Arabic name in liquid silver chrome, reflective but readable",
        "src": "/styles/arabic/silver-chrome.webp",
        "name": "Silver Chrome",
        "basePrompt": "Futuristic Arabic typography of 'Text' in liquid silver chrome, centered on clean light studio background, soft grounded shadows, crisp contours, reflective but readable, no additional text, modern premium print-ready look."
      },
      {
        "altText": "Rose Gold Arabic name art example: Elegant Arabic text custom Arabic name in brushed rose gold metal, soft blush-toned background",
        "src": "/styles/arabic/rose-gold.webp",
        "name": "Rose Gold",
        "basePrompt": "Elegant Arabic text 'Text' in brushed rose gold metal, centered composition, soft blush-toned background, subtle luxury lighting, clear readable letterforms, clean edges, no extra words or logos, refined print-safe artwork."
      }
    ],
    "Marble Gold": [
      {
        "altText": "Marble Gold Arabic name art example: Arabic calligraphy of custom Arabic name carved into white Carrara marble with deep gold leaf inlay.",
        "src": "/styles/arabic/marble-gold.webp",
        "name": "Marble Gold",
        "basePrompt": "Arabic calligraphy of 'Text' carved into white Carrara marble with deep gold leaf inlay, centered luxury composition, white and grey Carrara marble surface with dramatic flowing veining, subtle warm gold vein accents echoing the letter material, soft controlled directional light revealing marble depth and texture, crisp engraved letterforms with rich gold fill, premium luxury interior aesthetic, no extra words, no Latin letters, no additional Arabic text, no frame, no border, no mockup, full-bleed composition."
      }
    ],
    "Black Gold Minimal": [
      {
        "altText": "Black Gold Minimal Arabic name art example: Minimalist Arabic calligraphy of custom Arabic name in thin precise gold metallic strokes on deep black.",
        "src": "/styles/arabic/black-gold-minimal.webp",
        "name": "Black Gold Minimal",
        "basePrompt": "Minimalist Arabic calligraphy of 'Text' in thin precise gold metallic strokes, centered premium composition, pure deep matte black background with subtle vignette toward edges, razor-thin gold letterforms with crisp reflective edges catching a single elegant light source, minimal gold particle dust, absolute premium minimalist aesthetic, no extra words, no Latin letters, no additional Arabic text, no frame, no border, no mockup, full-bleed composition."
      }
    ],
    "Gemstones": [
      {
        "altText": "Diamond Arabic name art example: Arabic name custom Arabic name formed from diamonds with platinum settings, dark elegant background",
        "src": "/styles/arabic/diamond.webp",
        "name": "Diamond",
        "basePrompt": "Arabic name 'Text' formed from diamonds with platinum settings, centered macro-luxury composition, controlled sparkle, dark elegant background, strong readability, crisp gemstone edges, no extra text, premium print-ready finish."
      },
      {
        "altText": "Emerald Arabic name art example: Arabic name custom Arabic name carved from luminous emerald gemstone, deep dark backdrop",
        "src": "/styles/arabic/emerald.webp",
        "name": "Emerald",
        "basePrompt": "Arabic name 'Text' carved from luminous emerald gemstone, centered with balanced framing, deep dark backdrop, subtle inner glow, clear letter structure, high detail, no extra symbols or text, print-ready luxury artwork."
      }
    ],
    "Crystal": [
      {
        "altText": "Crystal Arabic name art example: Arabic name custom Arabic name formed from clear faceted crystal with internal rainbow refraction.",
        "src": "/styles/arabic/crystal.webp",
        "name": "Crystal",
        "basePrompt": "Arabic name 'Text' formed from clear faceted crystal with internal rainbow refraction, centered luxury composition, dark grey gradient background, rainbow caustic light projections and color refractions scattered across the background surface, controlled brilliance and sparkle, crisp crystal facet edges, premium luxury product render quality, no extra words, no Latin letters, no additional Arabic text, no frame, no border, no mockup, full-bleed composition."
      }
    ]
  },
  "Modern": {
    "Neon Lights": [
      {
        "altText": "Blue Neon Arabic name art example: Arabic neon sign of custom Arabic name in electric blue, high contrast",
        "src": "/styles/arabic/neon-blue.webp",
        "name": "Blue Neon",
        "basePrompt": "Arabic neon sign of 'Text' in electric blue, centered composition against a clean dark urban wall, controlled glow halo, high contrast, readable Arabic forms, minimal scene clutter, no extra words, cyberpunk print-friendly artwork."
      },
      {
        "altText": "Cyberpunk Pink Arabic name art example: Futuristic Arabic calligraphy custom Arabic name in bright pink neon and magenta light accents, limited bokeh.",
        "src": "/styles/arabic/neon-pink.webp",
        "name": "Cyberpunk Pink",
        "basePrompt": "Futuristic Arabic calligraphy 'Text' in bright pink neon and magenta light accents, centered on dark sci-fi background, crisp stroke definition, limited bokeh distractions, high contrast readability, no extra text, print-ready synthwave style."
      }
    ],
    "Light Painting": [
      {
        "altText": "Light Painting Arabic name art example: Arabic name custom Arabic name written in long-exposure glowing light trails on a deep black background.",
        "src": "/styles/arabic/light-painting.webp",
        "name": "Light Painting",
        "basePrompt": "Arabic name 'Text' written in long-exposure light painting, centered composition on pure deep black photographic background, vibrant glowing light trails in electric blue, yellow and white forming the Arabic letterforms, subtle sparks and light orbs around the letters, slight authentic motion blur in the trails, star-like sparkle points at stroke tips, maximum darkness-to-light contrast, cinematic fine-art photography quality, no extra words, no Latin letters, no additional Arabic text, no frame, no border, no mockup, full-bleed composition."
      }
    ],
    "Glitch & Tech": [
      {
        "altText": "Digital Glitch Arabic name art example: Modern Arabic typography of custom Arabic name with controlled digital glitch effect, high-detail print-safe cyber.",
        "src": "/styles/arabic/glitch.webp",
        "name": "Digital Glitch",
        "basePrompt": "Modern Arabic typography of 'Text' with controlled digital glitch effect, subtle RGB shift and pixel breaks while preserving legibility, centered on dark tech background, clean composition, no extra words, high-detail print-safe cyber aesthetic."
      },
      {
        "altText": "Wireframe Arabic name art example: 3D wireframe Arabic lettering of custom Arabic name with glowing orange lines on deep black background, precise geometry",
        "src": "/styles/arabic/wireframe.webp",
        "name": "Wireframe",
        "basePrompt": "3D wireframe Arabic lettering of 'Text' with glowing orange lines on deep black background, centered blueprint-style composition, precise geometry, clean line clarity, high contrast, no extra text elements, print-ready tech art."
      }
    ]
  },
  "Nature & Elements": {
    "Elemental": [
      {
        "altText": "Color Smoke Arabic name art example: Arabic name custom Arabic name formed from swirling blue and orange smoke, defined silhouette",
        "src": "/styles/arabic/smoke-art.webp",
        "name": "Color Smoke",
        "basePrompt": "Arabic name 'Text' formed from swirling blue and orange smoke, centered dark background composition, defined silhouette, sharp high-speed detail, controlled particle spread, readable letterforms, no extra text, premium printable effect."
      },
      {
        "altText": "Fire Flame Arabic name art example: Arabic name custom Arabic name written in vivid fire and flame, strong orange-yellow contrast",
        "src": "/styles/arabic/fire.webp",
        "name": "Fire Flame",
        "basePrompt": "Arabic name 'Text' written in vivid fire and flame, centered on dark backdrop, controlled sparks, strong orange-yellow contrast, clear readable form despite motion, clean composition, no extra words, print-ready cinematic style."
      },
      {
        "altText": "Water Splash Arabic name art example: Arabic name custom Arabic name formed from clear splashing water, frozen droplets",
        "src": "/styles/arabic/water.webp",
        "name": "Water Splash",
        "basePrompt": "Arabic name 'Text' formed from clear splashing water, centered composition with clean blue gradient background, frozen droplets, crisp edges, high readability, minimal clutter, no extra text, high-detail print-friendly artwork."
      }
    ],
    "Botanical": [
      {
        "altText": "Floral Bloom Arabic name art example: Arabic name custom Arabic name shaped from fresh flowers and green leaves, clear letter readability",
        "src": "/styles/arabic/floral.webp",
        "name": "Floral Bloom",
        "basePrompt": "Arabic name 'Text' shaped from fresh flowers and green leaves, centered top-down composition on clean light background, balanced color palette, crisp botanical detail, clear letter readability, no extra text, premium printable floral art."
      },
      {
        "altText": "Desert Sand Arabic name art example: Arabic name custom Arabic name sculpted in golden desert sand dunes, warm sunset lighting with soft shadows",
        "src": "/styles/arabic/sand-desert.webp",
        "name": "Desert Sand",
        "basePrompt": "Arabic name 'Text' sculpted in golden desert sand dunes, centered aerial-frontal composition, warm sunset lighting with soft shadows, clear engraved letterforms, minimal scene distractions, no extra text, print-ready desert aesthetic."
      }
    ]
  },
  "Artistic & Abstract": {
    "Creative": [
      {
        "altText": "Noor Glow Arabic name art example: Arabic calligraphy of custom Arabic name radiating soft divine light glow, dark gradient background with subtle golden.",
        "src": "/styles/arabic/noor-glow.webp",
        "name": "Noor Glow",
        "basePrompt": "Arabic calligraphy of 'Text' radiating soft divine light glow, centered composition, dark gradient background with subtle golden particles, elegant spiritual ambiance, crisp letter definition, no extra words or symbols, premium Ramadan-themed print-ready artwork."
      },
      {
        "altText": "Street Graffiti Arabic name art example: Arabic graffiti art of custom Arabic name spray-painted on a textured concrete wall, vibrant controlled palette",
        "src": "/styles/arabic/graffiti.webp",
        "name": "Street Graffiti",
        "basePrompt": "Arabic graffiti art of 'Text' spray-painted on a textured concrete wall, centered mural composition, vibrant controlled palette, crisp outlines with tasteful drips, high legibility, no extra tags or words, print-ready urban style."
      },
      {
        "altText": "Watercolor Splash Arabic name art example: Watercolor Arabic lettering of custom Arabic name on textured paper, soft pastel washes with controlled ink splashes",
        "src": "/styles/arabic/watercolor.webp",
        "name": "Watercolor Splash",
        "basePrompt": "Watercolor Arabic lettering of 'Text' on textured paper, centered composition, soft pastel washes with controlled ink splashes, clean readable strokes, balanced negative space, no extra text, premium printable fine-art style."
      },
      {
        "altText": "Paper Cutout Arabic name art example: Layered paper-cut Arabic name art of custom Arabic name, precise cut edges",
        "src": "/styles/arabic/paper-cut.webp",
        "name": "Paper Cutout",
        "basePrompt": "Layered paper-cut Arabic name art of 'Text', centered multi-layer composition, precise cut edges, soft dimensional shadows, harmonious pastel palette, clear letterform readability, no extra words, clean print-ready craft aesthetic."
      },
      {
        "altText": "Cosmic Galaxy Arabic name art example: Arabic name custom Arabic name formed from stars, nebula dust",
        "src": "/styles/arabic/galaxy.webp",
        "name": "Cosmic Galaxy",
        "basePrompt": "Arabic name 'Text' formed from stars, nebula dust, and cosmic light, centered deep-space composition, rich blue-violet tones with controlled glow, clear readable silhouette, minimal visual clutter, no extra text, premium printable cosmic art."
      }
    ],
    "Vintage Poster": [
      {
        "altText": "Vintage Poster Arabic name art example: Arabic name custom Arabic name designed as vintage retro poster typography on aged paper.",
        "src": "/styles/arabic/vintage-poster.webp",
        "name": "Vintage Poster",
        "basePrompt": "Arabic name 'Text' designed as vintage retro poster typography, centered composition, warm cream and aged paper background with distressed paper texture and worn grain, faded Art Deco ornamental accents softly filling the corners, warm ochre and terracotta color accents, subtle foxing and age marks, mid-century design aesthetic, clear readable Arabic letterforms with vintage character, no extra words, no Latin letters, no additional Arabic text, no frame, no border, no mockup, full-bleed composition."
      }
    ],
    "Embroidery": [
      {
        "altText": "Embroidery Arabic name art example: Arabic name custom Arabic name rendered as detailed gold thread embroidery on deep midnight blue velvet fabric.",
        "src": "/styles/arabic/embroidery.webp",
        "name": "Embroidery",
        "basePrompt": "Arabic name 'Text' rendered as detailed gold thread embroidery, centered composition, deep midnight blue velvet fabric background with visible velvet nap and subtle sheen variation, ornamental traditional Middle Eastern embroidery patterns in deep gold thread extending from the letter edges, intricate satin stitch detail, warm intimate lighting, traditional artisan craft quality, no extra words, no Latin letters, no additional Arabic text, no frame, no border, no mockup, full-bleed composition."
      }
    ],
    "Henna": [
      {
        "altText": "Henna Arabic name art example: Arabic name custom Arabic name designed in traditional henna art style with fine paisley and floral motifs.",
        "src": "/styles/arabic/henna.webp",
        "name": "Henna",
        "basePrompt": "Arabic name 'Text' designed in traditional henna art style, centered composition, warm bridal aesthetic background with cream-to-copper gradient, fine ornamental henna paisleys, dots and floral motifs surrounding the letters, rich red-brown henna pigment, cultural wedding ceremony aesthetic, professional henna artist quality, no extra words, no Latin letters, no additional Arabic text, no frame, no border, no mockup, full-bleed composition."
      }
    ]
  }
});
