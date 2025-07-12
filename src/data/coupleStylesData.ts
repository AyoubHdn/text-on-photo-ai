// src/data/coupleStylesData.ts

// A curated list of prompts for the Couples Name Art generator.
// Each prompt MUST include placeholders for two names. We will use [NAME1] and [NAME2].

export const coupleStylesData: Record<
string,
Record<string, { src: string; basePrompt: string ; allowCustomColors: boolean }[]>
> = {
  "Romantic & Classic": {
    "Timeless Love": [
      { 
        src: "/styles/couples/c001.webp", // TODO: Replace with your actual image paths
        basePrompt: "A stunning 3D render of two intertwined gold wedding rings. The name '[NAME1]' is elegantly engraved on one ring, and '[NAME2]' on the other. A single, perfect red rose lies beside them on a soft, white silk background. Photorealistic, romantic, elegant.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c002.webp", 
        basePrompt: "The names '[NAME1]' and '[NAME2]' written in beautiful, flowing calligraphy, forming a single, elegant heart shape. The background is a soft, dreamy watercolor wash of pink and gold. Artistic, romantic, masterpiece.",
        allowCustomColors: false 
      },
      /*{ 
        src: "/styles/couples/c003.webp", 
        basePrompt: "An old, wise tree with two main branches that grow together and intertwine. The name '[NAME1]' is carved into the left branch, and '[NAME2]' into the right. A magical sunset illuminates the serene landscape. Fantasy, detailed, symbolic.",
        allowCustomColors: false 
      },*/
      { 
        src: "/styles/couples/c008.webp", 
        basePrompt: "An elegant calligraphy design on vintage parchment. The name '[NAME1]' is intertwined with '[NAME2]' in graceful gold script, surrounded by soft roses and ivy. Classic, romantic, timeless.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c009.webp", 
        basePrompt: "A hand-painted watercolor of two doves flying over a blooming cherry blossom tree. '[NAME1]' and '[NAME2]' are written in soft cursive beneath the tree, with subtle pink petals falling around them. Peaceful and poetic.",
        allowCustomColors: false 
      },
      /*{ 
        src: "/styles/couples/c010.webp", 
        basePrompt: "A royal-style monogram with initials '[NAME1]' and '[NAME2]' entwined inside a heart-shaped crest. Deep red and gold theme, with delicate ornamentation. Noble, historic, eternal.",
        allowCustomColors: false 
      },*/
      { 
        src: "/styles/couples/c011.webp", 
        basePrompt: "An oil painting of a sunset over the ocean with the names '[NAME1]' and '[NAME2]' drawn into the sand at the shore, waves gently approaching. Romantic, sentimental, classic.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c012.webp", 
        basePrompt: "A vintage love letter concept where '[NAME1]' and '[NAME2]' are written in ink on an old paper scroll, sealed with a wax heart stamp. Soft shadows and candlelight ambiance.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c013.webp", 
        basePrompt: "A timeless black and white sketch of two hands holding. '[NAME1]' and '[NAME2]' are etched beneath in elegant serif font, giving a classic and emotional touch.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c014.webp", 
        basePrompt: "A grand piano with sheet music opened to a love song titled '[NAME1] & [NAME2]'. The notes swirl off the page into glowing hearts. Sophisticated, melodic, romantic.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c015.webp", 
        basePrompt: "An antique photo frame with sepia tones. '[NAME1]' and '[NAME2]' are written in cursive across the frame as if hand-engraved. Emotional, warm, and nostalgic.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c016.webp", 
        basePrompt: "A ballroom scene with a couple dancing in silhouette. '[NAME1]' and '[NAME2]' are written in the stars above them in glowing golden cursive. Magical, old-world charm.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c017.webp", 
        basePrompt: "A dreamy floral arch made of white roses and peonies, framing '[NAME1]' & '[NAME2]' in ornate romantic lettering. Sunlight filters through in soft golden hues.",
        allowCustomColors: false 
      },
    ]
  },
  "Modern & Minimalist": {
    "Chic & Simple": [
      { 
        src: "/styles/couples/c004.webp", 
        basePrompt: "A minimalist, abstract design of two continuous lines that flow and loop together, subtly forming an infinity symbol. The name '[NAME1]' is integrated into the top line, and '[NAME2]' into the bottom line. Clean white background, black ink style, modern, sophisticated.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c005.webp", 
        basePrompt: "The names '[NAME1]' & '[NAME2]' embossed in a simple, elegant sans-serif font on a piece of thick, textured charcoal-colored paper. A single, minimalist heart icon is placed between the names. Studio lighting, high-end, modern luxury.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c018.webp", 
        basePrompt: "Clean white background with modern sans-serif text. '[NAME1]' and '[NAME2]' are aligned in bold black and soft grey, connected by a simple geometric heart icon. Minimalist elegance.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c019.webp", 
        basePrompt: "Monoline art of two faces looking at each other, with '[NAME1]' and '[NAME2]' written beneath in lowercase, modern typography. Thin lines, artistic, simple.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c020.webp", 
        basePrompt: "A flat-lay of two cups of coffee on a marble table. '[NAME1]' and '[NAME2]' are written in a stylish handwritten font, softly blended into the clean background. Chic and cozy.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c021.webp", 
        basePrompt: "A pastel-toned background with '[NAME1]' and '[NAME2]' stacked vertically in a clean, bold font, with a tiny heart in between. Scandinavian style, soft and simple.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c022.webp", 
        basePrompt: "A clean grid-style design with '[NAME1]' on the left and '[NAME2]' on the right, separated by a minimalist diagonal line. Muted color palette, stylish and crisp.",
        allowCustomColors: false 
      },
      /*{ 
        src: "/styles/couples/c023.webp", 
        basePrompt: "A light beige background with a single continuous line forming a heart around '[NAME1]' and '[NAME2]'. Ultra-minimalist, modern romance.",
        allowCustomColors: false 
      },*/
      { 
        src: "/styles/couples/c024.webp", 
        basePrompt: "Abstract watercolor shapes (in muted tones) behind simple serif initials of '[NAME1]' and '[NAME2]'. Balanced, modern, effortlessly romantic.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c025.webp", 
        basePrompt: "A framed poster-style design with '[NAME1]' & '[NAME2]' in uppercase sans-serif font centered on a matte background. Urban, refined, minimalist.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c026.webp", 
        basePrompt: "'[NAME1]' and '[NAME2]' handwritten with a thin digital brush on a clean paper texture background, as if freshly signed. Elegant, modern, intimate.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c027.webp", 
        basePrompt: "A single-line heart shape connecting '[NAME1]' and '[NAME2]' with a soft gradient in the background. Simplistic and artistic with a romantic touch.",
        allowCustomColors: false 
      },
    ]
  },
  "Playful & Fun": {
    "Unique & Cute": [
       { 
        src: "/styles/couples/c006.webp", 
        basePrompt: "Two jigsaw puzzle pieces, one with the name '[NAME1]' and the other with '[NAME2]', fitting together perfectly. The puzzle pieces are made of warm, polished wood on a clean background. 3D render, symbolic, cute, playful.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c007.webp", 
        basePrompt: "A vibrant neon sign against a dark brick wall. The name '[NAME1]' is written in glowing pink neon, and connected by a glowing heart to the name '[NAME2]', written in glowing blue neon. Retro, fun, energetic.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c028.webp", 
        basePrompt: "Cartoon-style art of two adorable boba tea cups with happy faces. '[NAME1]' is on one cup, '[NAME2]' on the other, with a pink heart connecting the straws. Cute and bubbly.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c029.webp", 
        basePrompt: "Bright candyland-themed design with '[NAME1]' and '[NAME2]' written in rainbow-colored bubble letters, surrounded by sweets and floating hearts. Whimsical and joyful.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c030.webp", 
        basePrompt: "Two playful robots holding hands, with '[NAME1]' and '[NAME2]' written in a digital pixel-style font on their screens. Futuristic and quirky.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c031.webp", 
        basePrompt: "A couple of smiling donuts with sprinkles. '[NAME1]' is on the chocolate one, '[NAME2]' on the strawberry one. Cute, colorful, and deliciously fun.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c032.webp", 
        basePrompt: "A comic-style pop art background with '[NAME1]' and '[NAME2]' in bold, fun bubble letters with speech bubbles like 'Wow!' and 'True Love!'. Vibrant, humorous, and energetic.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c033.webp", 
        basePrompt: "A pair of kawaii cats sitting side-by-side with their tails forming a heart. '[NAME1]' and '[NAME2]' are written in cute rounded script below. Sweet and endearing.",
        allowCustomColors: false 
      },
      /*{ 
        src: "/styles/couples/c034.webp", 
        basePrompt: "A chalkboard doodle-style drawing with two cute stick figures labeled '[NAME1]' and '[NAME2]' holding balloons shaped like hearts. The names '[NAME1]' and '[NAME2]' are handwritten in white chalk above their heads in playful, childlike font. Playful, innocent, and handmade-style.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c035.webp", 
        basePrompt: "A playful UFO beaming up '[NAME1]' while '[NAME2]' waves from the moon. Whimsical outer-space love theme with cartoon charm.",
        allowCustomColors: false 
      },*/
      { 
        src: "/styles/couples/c036.webp", 
        basePrompt: "A whimsical cartoon scene: a UFO beaming up a character with the name '[NAME1]' written in glowing letters on the beam, while another character labeled '[NAME2]' waves from the moon, with their name engraved in moon dust. Names '[NAME1]' and '[NAME2]' are clearly visible in a fun, cosmic font. Outer-space love theme with cartoon charm.",
        allowCustomColors: false 
      },
      { 
        src: "/styles/couples/c037.webp", 
        basePrompt: "A colorful illustration of two smiling skateboards, each with one of the names '[NAME1]' and '[NAME2]' painted boldly on the deck in vibrant graffiti-style text. As the skateboards roll, they leave behind trails of heart-shaped sparks. Youthful, free-spirited, and energetic.",
        allowCustomColors: false 
      },
    ]
  }
};