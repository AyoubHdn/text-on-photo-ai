// src/data/weddingStylesData.ts

// A curated list of visual styles for the Wedding Invitation generator.
// These are the templates the user will choose from.

export const weddingStylesData = {
  "Classic & Romantic": {
    "Timeless Elegance": [
      { 
        id: "classic-floral-01",
        src: "/styles/wedding/w001.webp", // TODO: Create and add this image
        title: "Soft Floral Border",
        description: "Elegant script with a delicate watercolor floral frame."
      },
      { 
        id: "classic-goldfoil-02",
        src: "/styles/wedding/w002.webp",
        title: "Gold Foil Accent",
        description: "A luxurious design with classic serif fonts and gold foil details."
      },
    ]
  },
  "Modern & Minimalist": {
    "Chic & Simple": [
      { 
        id: "modern-minimal-01",
        src: "/styles/wedding/w003.webp",
        title: "Clean Typography",
        description: "A focus on beautiful, modern fonts and generous white space."
      },
      { 
        id: "modern-geometric-02",
        src: "/styles/wedding/w004.webp",
        title: "Geometric Frame",
        description: "Stylish and contemporary with clean lines and a geometric border."
      },
    ]
  },
  "Rustic & Bohemian": {
    "Earthy & Natural": [
       { 
        id: "rustic-pampas-01",
        src: "/styles/wedding/w005.webp",
        title: "Pampas Grass & Earth Tones",
        description: "A warm, bohemian design with dried grass motifs and natural textures."
      },
       { 
        id: "rustic-greenery-02",
        src: "/styles/wedding/w006.webp",
        title: "Eucalyptus Greenery",
        description: "A fresh, natural design featuring elegant watercolor eucalyptus leaves."
      },
    ]
  }
};