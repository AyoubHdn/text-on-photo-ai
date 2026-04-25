// src/data/styleContent.ts
// Populated content for all 24 active sub-styles.
// Generated for NameDesignAI.com pSEO style pages.
//
// Each entry includes:
//  - introHeading + introBody (150-200 word intro for the style page)
//  - primaryKeyword + secondaryKeywords + longTailKeywords (for keyword tracking)
//  - faqs (5-7 questions per style, each answer ~60-100 words)
//  - ctaPrimary + ctaSecondary (keyworded CTAs)
//  - productBridgeHeading + productBridgeBody (mug/shirt/wall art bridge)
//  - relatedStyles (3-4 internal-link slugs)
//
// Slug keys MUST match styleTaxonomy slugs.
// If a slug doesn't match, that style page falls back to defaults (no content rendered).

export type StyleContent = {
  introHeading?: string;
  introBody?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  longTailKeywords?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  ctaPrimary?: string;
  ctaSecondary?: string;
  productBridgeHeading?: string;
  productBridgeBody?: string;
  relatedStyles?: string[];
};

export const STYLE_CONTENT: Record<string, StyleContent> = {
  // ============ THEMES ============

  cute: {
    introHeading: "Cute name art for playful, soft personalization",
    introBody:
      "Cute name art turns any name into a soft, playful, kawaii-inspired design. Think pastel colors, rounded letterforms, tiny illustrations, and warm whimsy. It's the style most people pick for baby names, nursery decor, girly gifts, and anything that needs to feel sweet rather than serious. Our cute name designs work especially well as personalized mugs for friends, soft wall art for a child's room, or thoughtful gifts that feel handmade. Type any name, choose your favorite cute direction — kawaii, pastel florals, candy-colored letters, or soft watercolor — and the AI generates a finished design in seconds. No design skills required, no design fees, just your name in a style that feels personal and gentle.",
    primaryKeyword: "cute name art",
    secondaryKeywords: ["cute name design", "kawaii name art", "cute name lettering"],
    longTailKeywords: [
      "cute pastel name art",
      "cute baby name art",
      "kawaii style name design",
      "cute pink name lettering",
      "cute name art ideas",
    ],
    faqs: [
      {
        question: "What makes a name design 'cute'?",
        answer:
          "Cute name designs use soft colors (pastel pinks, lavenders, mints, creams), rounded or bubbly letterforms, and small decorative elements like hearts, stars, flowers, or tiny characters. The mood is playful and gentle — never edgy or serious. Cute styles work especially well for younger audiences, baby names, friend gifts, and anything meant to feel warm and approachable.",
      },
      {
        question: "Is cute name art good for baby gifts?",
        answer:
          "Yes — cute name art is one of the most popular choices for baby shower gifts, nursery decor, and birth announcement keepsakes. Pastel kawaii designs printed on framed wall art or a soft children's t-shirt make a personal, lasting gift. Many parents create cute name art for each child to display in their room.",
      },
      {
        question: "Can I make cute name art for an adult?",
        answer:
          "Absolutely. Cute styles aren't just for children — they suit anyone who likes soft, friendly, playful aesthetics. Friends, partners, and family members often appreciate cute name designs for mugs, phone wallpapers, or social media graphics. The kawaii movement has a huge adult audience.",
      },
      {
        question: "What colors work best in cute name art?",
        answer:
          "Pastels dominate cute design — soft pinks, mint greens, baby blues, lavenders, peaches, and creams. Some cute styles add gold or rose-gold accents for a touch of elegance. Bright neon and dark colors are usually avoided, since they break the gentle mood.",
      },
      {
        question: "Can I print my cute name design on a mug or shirt?",
        answer:
          "Yes. Every cute name design you generate can be ordered on a mug, soft cotton t-shirt, or framed wall art print. Cute mugs make especially popular friend gifts, and cute name shirts are a hit for kids' birthdays and baby announcement photos.",
      },
      {
        question: "Is cute name art free to create?",
        answer:
          "You can browse styles and preview cute name designs free. Generating a high-resolution, downloadable, watermark-free design uses credits from our pricing plans, starting at $1.99. You can also unlock free credits through promotions.",
      },
    ],
    ctaPrimary: "Create your cute name art",
    ctaSecondary: "Browse all cute name examples",
    productBridgeHeading: "Cute name art on real products",
    productBridgeBody:
      "Turn your cute name design into a soft pastel mug, a kawaii-style t-shirt, or framed nursery wall art. Each product is print-on-demand, so your specific name design is what ships — not a generic template.",
    relatedStyles: ["floral", "fantasy", "typography", "illustration"],
  },

  fantasy: {
    introHeading: "Fantasy name art with magic, dragons, and mythic detail",
    introBody:
      "Fantasy name art turns your name into something that feels pulled from a storybook — flame-edged letterforms, dragon scales, enchanted forests, glowing runes, mystical landscapes. It's the style for anyone who loves the magical, the otherworldly, or the dramatic. Whether you want your name to read like the title of an epic novel, feel mystical for a tabletop RPG character, or just have a more imaginative personalized design than anything generic, fantasy delivers. Type any name, pick a fantasy direction — dark fantasy, magical light, dragon-fire, ethereal forest, mystic runes — and the AI builds a finished design in seconds. Use it for wallpapers, profile images, gift mugs for fantasy fans, or framed wall art that turns any room into a place of imagination.",
    primaryKeyword: "fantasy name art",
    secondaryKeywords: ["fantasy name design", "magical name art", "fantasy name lettering"],
    longTailKeywords: [
      "dragon fantasy name art",
      "magical fantasy name design",
      "dark fantasy name art",
      "fantasy name art ideas",
      "enchanted name lettering",
    ],
    faqs: [
      {
        question: "What is fantasy name art?",
        answer:
          "Fantasy name art is a style of personalized design that combines a name with magical, mythical, or otherworldly imagery — dragons, flames, glowing runes, enchanted forests, or epic landscapes. Inspired by fantasy novels, films, and games, it makes a name feel like the title of an adventure rather than just plain text.",
      },
      {
        question: "Is fantasy name art good for gamers and RPG fans?",
        answer:
          "Yes. Fantasy name art is hugely popular among Dungeons & Dragons players, fantasy MMO gamers, fantasy book lovers, and anyone with a tabletop character. Use it for character cards, server avatars, Discord profiles, or as wall art celebrating a favorite hero name.",
      },
      {
        question: "What styles fall under fantasy name art?",
        answer:
          "Fantasy splits into several directions: dark fantasy (gothic, shadow, blood-red), light fantasy (ethereal, glowing, bright), elemental (fire, ice, water, earth), creature-based (dragons, wolves, phoenixes), and ancient/mythic (runic, hieroglyphic, medieval scrollwork). Pick the mood that matches your story.",
      },
      {
        question: "Can I create fantasy name art for a fictional character?",
        answer:
          "Definitely. Many users create designs for D&D characters, fanfiction protagonists, novel characters they're writing, or RP usernames. Type the character name, pick a fantasy direction that matches the character's vibe, and use the design for a character sheet, book cover concept, or framed art.",
      },
      {
        question: "Can fantasy name art be printed on a mug or shirt?",
        answer:
          "Yes. Fantasy name designs work especially well on dark mugs, fitted t-shirts, and large framed prints. Many fantasy fans collect printed name designs for their game room, library, or as gifts for fellow fantasy enthusiasts.",
      },
      {
        question: "Is the fantasy style free to use?",
        answer:
          "Previewing styles is free. Generating high-resolution, watermark-free fantasy name art uses credits from our pricing plans, starting at $1.99. You'll have plenty of room to experiment with different fantasy directions.",
      },
    ],
    ctaPrimary: "Create your fantasy name art",
    ctaSecondary: "Browse all fantasy name examples",
    productBridgeHeading: "Fantasy name art on real products",
    productBridgeBody:
      "Turn your fantasy name design into a dramatic dark mug, a fantasy-themed t-shirt, or a framed wall art print that anchors a game room or fantasy reading nook.",
    relatedStyles: ["gaming", "anime", "vintage", "abstract"],
  },

  floral: {
    introHeading: "Floral name art with botanical detail and natural color",
    introBody:
      "Floral name art weaves your name through flowers, leaves, vines, and natural botanical elements. It ranges from delicate watercolor florals to bold romantic roses, soft wildflower garlands to graphic botanical illustrations. It's one of the most-loved styles for gift-giving — anniversaries, weddings, mother's day, baby girl nurseries, and feminine personalization in general. Floral designs feel timeless and emotional in a way few other styles can match. Type any name, pick a floral direction — watercolor wildflowers, rose romantic, eucalyptus minimal, vintage botanical — and the AI generates a finished design ready for download or product printing. Whether you're gifting it, framing it, or printing it on a mug, floral name art carries a quiet elegance that works in almost any setting.",
    primaryKeyword: "floral name art",
    secondaryKeywords: ["flower name design", "floral name lettering", "watercolor name art"],
    longTailKeywords: [
      "floral name art ideas",
      "rose floral name design",
      "watercolor flower name art",
      "pretty floral name lettering",
      "garden inspired name art",
    ],
    faqs: [
      {
        question: "What is floral name art?",
        answer:
          "Floral name art is a personalized design that wraps, surrounds, or fills a name with flowers, leaves, and botanical elements. Designs range from delicate watercolor wildflowers to bold romantic roses to clean modern eucalyptus. Floral is one of the most popular styles for gift-giving because it feels personal, elegant, and emotionally warm.",
      },
      {
        question: "Is floral name art good for wedding or anniversary gifts?",
        answer:
          "Yes — floral name art is one of the top gift choices for weddings, anniversaries, bridal showers, and engagements. A framed couples' floral name print is a meaningful keepsake. Mother's Day, baby showers, and bridesmaid gifts also work beautifully with floral designs.",
      },
      {
        question: "What flower types work best for personalized name art?",
        answer:
          "Roses (romantic), peonies (lush, feminine), eucalyptus (modern, minimal), wildflowers (boho, casual), cherry blossoms (delicate, Asian-inspired), and sunflowers (bright, joyful) are the most-requested. Each carries a different mood, so pick based on the recipient's style — or the occasion.",
      },
      {
        question: "Can I make floral name art for a man?",
        answer:
          "Floral can absolutely work for men, especially in darker, moodier directions — moody black-background florals, herbal botanical illustrations, or rugged pressed-flower aesthetics. Floral isn't inherently feminine; it's about how the design is composed. Pick darker, structured floral styles for a more masculine feel.",
      },
      {
        question: "Can I print my floral name design on a mug or wall art?",
        answer:
          "Yes. Floral name art prints exceptionally well on framed wall art, ceramic mugs, soft cotton tote bags, and pillowcases. Floral mugs and framed prints are some of the highest-converting gift items on our site for anniversaries and Mother's Day.",
      },
      {
        question: "Is floral name art free?",
        answer:
          "Previews are free. Generating a high-resolution, watermark-free floral design uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your floral name art",
    ctaSecondary: "Browse all floral name examples",
    productBridgeHeading: "Floral name art on real products",
    productBridgeBody:
      "Turn your floral name design into a beautiful framed print, a soft botanical mug, or a t-shirt that captures the warmth of nature. Floral name gifts are especially loved for weddings, anniversaries, and Mother's Day.",
    relatedStyles: ["cute", "vintage", "classic", "illustration"],
  },

  classic: {
    introHeading: "Classic name art with timeless typography and elegance",
    introBody:
      "Classic name art is the style for someone who wants their name to feel timeless, refined, and unmistakably elegant. Think serif typography, ornate flourishes, marble textures, gold foil details, and the kind of restrained beauty you'd see on a luxury wedding invitation or a hardcover book title. Classic doesn't chase trends — it leans on the design principles that have worked for centuries. Type any name, pick a classic direction — calligraphy script, gold serif, marble luxury, monogram emblem — and the AI delivers a finished design suitable for the most formal gift or the most refined wall art. It's the style for weddings, milestone anniversaries, executive gifts, and anyone who simply prefers traditional elegance over modern playfulness.",
    primaryKeyword: "classic name art",
    secondaryKeywords: [
      "elegant name design",
      "timeless name art",
      "sophisticated name lettering",
    ],
    longTailKeywords: [
      "classic name art ideas",
      "elegant name design for wedding",
      "sophisticated name calligraphy",
      "timeless name lettering",
      "luxury classic name design",
    ],
    faqs: [
      {
        question: "What makes a name design 'classic'?",
        answer:
          "Classic name designs use traditional typography choices (elegant serifs, copperplate calligraphy, formal scripts) and timeless decorative elements (gold foil accents, marble textures, ornate flourishes, restrained color palettes). The goal is timelessness — designs that wouldn't look out of place in 1900 or 2050.",
      },
      {
        question: "Is classic name art good for weddings?",
        answer:
          "Yes — classic style is the most-requested for wedding-related personalization. Wedding signage, save-the-dates, framed couple monograms, and anniversary keepsakes all benefit from the classic style's restraint and elegance. Many couples want their wedding gifts to feel timeless, not trendy.",
      },
      {
        question: "What's the difference between classic and vintage name art?",
        answer:
          "Classic emphasizes timeless elegance — refined, restrained, often with gold or marble accents. Vintage leans into a specific era's aesthetic, like Victorian, Art Deco, mid-century, or 1970s. Classic could fit any decade; vintage references a particular one. Both can feel elegant, but vintage carries more nostalgia.",
      },
      {
        question: "Is classic style suitable for executive or formal gifts?",
        answer:
          "Yes. Classic name art is the right choice for retirement gifts, executive thank-yous, formal milestone celebrations, and any context where the recipient appreciates traditional elegance over playful or trendy aesthetics.",
      },
      {
        question: "Can I print classic name art on products?",
        answer:
          "Definitely. Classic designs print especially well as framed wall art (the elegance scales beautifully) and as premium ceramic mugs. Classic name designs on linen-finish prints make especially memorable wedding and anniversary gifts.",
      },
      {
        question: "Is classic name art free to create?",
        answer:
          "You can preview classic styles for free. Generating a high-resolution, downloadable design uses credits from our pricing plans, starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your classic name art",
    ctaSecondary: "Browse all classic name examples",
    productBridgeHeading: "Classic name art on premium products",
    productBridgeBody:
      "Turn your classic name design into a premium framed print, an elegant ceramic mug, or refined wall art that anchors a formal space.",
    relatedStyles: ["vintage", "typography", "floral", "abstract"],
  },

  birthday: {
    introHeading: "Birthday name art for personalized celebration gifts",
    introBody:
      "Birthday name art turns any name into a celebration-ready design — confetti bursts, balloon clusters, sparkle gold, glitter modern, party banners, milestone numbers. It's the most-gifted style category we offer because birthdays are universal and personalization makes any birthday gift feel intentional. Type the birthday person's name, pick a direction — kids' party bright, milestone gold, modern minimal celebration, vintage birthday — and the AI generates a finished design ready for printed cards, framed gifts, or birthday social posts. Birthday name art works for every age: first birthday keepsakes, kids' party decor, sweet sixteens, milestone 30/40/50/60/70/80 prints, and even retirement-adjacent celebrations.",
    primaryKeyword: "birthday name art",
    secondaryKeywords: [
      "birthday name design",
      "personalized birthday name",
      "birthday name gift",
    ],
    longTailKeywords: [
      "milestone birthday name art",
      "first birthday name design",
      "kids birthday name art",
      "personalized birthday gift name",
      "birthday name lettering",
    ],
    faqs: [
      {
        question: "What is birthday name art?",
        answer:
          "Birthday name art combines a name with celebration-themed design — confetti, balloons, sparkles, party decorations, milestone numbers. It's used for personalized birthday gifts, framed birthday keepsakes, party decorations, and birthday social media posts.",
      },
      {
        question: "Is birthday name art good for milestone birthdays?",
        answer:
          "Yes — milestone birthdays (30, 40, 50, 60, 70, 80) are some of the most gifted occasions for personalized name art. A framed milestone print combining the recipient's name with their milestone number makes a meaningful keepsake.",
      },
      {
        question: "What styles work for kids vs adult birthdays?",
        answer:
          "Kids birthdays favor bright party styles — balloons, cartoon, candy colors, kawaii. Adult birthdays favor refined directions — gold sparkle, modern minimal, vintage celebration, marble luxury. Pick based on the recipient's age and aesthetic.",
      },
      {
        question: "Can birthday name art be printed on party decorations?",
        answer:
          "Yes — birthday designs print especially well on framed posters (party centerpieces), on mugs (party favor), on canvas (lasting birthday keepsake), and on t-shirts (group birthday celebration shirts).",
      },
      {
        question: "Is birthday name art a good last-minute gift?",
        answer:
          "Yes. Generate a design in seconds, download immediately for digital cards or social posts, or order a printed product (mugs typically ship within 3-5 days). Personalized gifts feel thoughtful even when planned quickly.",
      },
      {
        question: "Is birthday name art free?",
        answer:
          "Previews are free. Generating high-resolution birthday designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your birthday name art",
    ctaSecondary: "Browse all birthday name examples",
    productBridgeHeading: "Birthday name art on real products",
    productBridgeBody:
      "Turn your birthday name design into a personalized birthday mug, a milestone framed print, or a celebration t-shirt. Especially popular for milestone birthdays and kids' birthday gifts.",
    relatedStyles: ["celebrations", "festive", "3d", "floral"],
  },

  vintage: {
    introHeading: "Vintage name art with retro era nostalgia and texture",
    introBody:
      "Vintage name art borrows from past eras — the bold geometry of Art Deco, the warm palette of mid-century modern, the bohemian feel of the 1970s, the dramatic typography of Victorian posters. It's the style for anyone who loves nostalgia, antique aesthetics, or design that feels like a vintage book cover or aged signage. Vintage works beautifully for personalization that should feel storied, lived-in, and timeless. Type any name, pick a vintage era — Art Deco, retro 70s, Victorian, classic Americana, mid-century — and the AI builds a finished design with the textures and palette that match. It's especially popular for wedding gifts where couples want a non-modern aesthetic, for restaurant or business owners who love retro signage, and for anyone gifting something that feels heirloom rather than trendy.",
    primaryKeyword: "vintage name art",
    secondaryKeywords: [
      "retro name design",
      "vintage style name art",
      "antique name lettering",
    ],
    longTailKeywords: [
      "vintage name art ideas",
      "retro poster name design",
      "distressed vintage name art",
      "antique label name design",
      "old fashioned name lettering",
    ],
    faqs: [
      {
        question: "What is vintage name art?",
        answer:
          "Vintage name art is a personalized design that draws from a specific past era — like Art Deco, mid-century modern, Victorian, 1970s bohemian, or vintage Americana. Each era has signature typography, colors, and decorative elements. Vintage designs feel storied and nostalgic, the opposite of modern and trendy.",
      },
      {
        question: "Which vintage eras work best for name art?",
        answer:
          "Art Deco (geometric, gold, dramatic) is great for elegant gifts. Mid-century modern (warm tones, clean lines) works for everyday personalization. Victorian (ornate, scrollwork) suits formal occasions. The 1970s (boho, earth tones) works for casual, warm-feeling designs. Pick based on the recipient's aesthetic taste.",
      },
      {
        question: "Is vintage name art good for wedding or anniversary gifts?",
        answer:
          "Yes — vintage is one of the most-loved aesthetics for couples wanting a non-modern wedding feel. Vintage couple name art makes especially memorable framed prints, photo mat decorations, and anniversary mugs. The aesthetic fits beautifully in older homes and antique-loving households.",
      },
      {
        question: "What's the difference between vintage and classic name art?",
        answer:
          "Vintage references a specific era's look — you can usually identify which decade inspired it. Classic is era-neutral and emphasizes timelessness — gold foil, refined serifs, marble textures, designs that could fit any decade. Vintage carries more personality and nostalgia; classic feels more formal.",
      },
      {
        question: "Can vintage name designs be printed on products?",
        answer:
          "Yes — vintage designs print especially well on ceramic mugs (the texture and palette feel hand-aged), on canvas wall art (gives the look of an antique poster), and on tote bags. Many users collect vintage designs for retro home offices and craft rooms.",
      },
      {
        question: "Is vintage name art free?",
        answer:
          "Previews are free. Generating a high-resolution, downloadable vintage design uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your vintage name art",
    ctaSecondary: "Browse all vintage name examples",
    productBridgeHeading: "Vintage name art on real products",
    productBridgeBody:
      "Turn your vintage name design into a retro-look mug, an aged-paper canvas print, or a t-shirt that channels the era you love. Vintage works especially well for wedding gifts and anniversary keepsakes.",
    relatedStyles: ["classic", "floral", "typography", "illustration"],
  },

  abstract: {
    introHeading: "Abstract name art with modern shapes and bold composition",
    introBody:
      "Abstract name art moves past traditional letterforms and decorative elements into pure visual composition — geometric shapes, color blocks, fluid lines, modern art movements like Bauhaus, Memphis, or contemporary minimalism. It's the style for someone who wants their name to feel like a piece of modern art rather than a personalized text design. Abstract works beautifully when the goal is to anchor a modern interior, gift something a designer or art-lover would appreciate, or just have something that looks like nothing else. Type any name, pick an abstract direction — Bauhaus geometric, Memphis playful, contemporary minimal, fluid color — and the AI generates a design that lives somewhere between gallery art and personalization. It's the most adventurous style choice we offer.",
    primaryKeyword: "abstract name art",
    secondaryKeywords: [
      "abstract name design",
      "modern abstract name",
      "geometric name art",
    ],
    longTailKeywords: [
      "abstract name art ideas",
      "Bauhaus name design",
      "Memphis style name art",
      "minimalist abstract name design",
      "contemporary abstract name lettering",
    ],
    faqs: [
      {
        question: "What is abstract name art?",
        answer:
          "Abstract name art is a personalized design that uses modern art principles — geometric shapes, color blocks, fluid lines, asymmetric composition — rather than traditional decorative typography. Often inspired by movements like Bauhaus, Memphis, or contemporary minimalism, abstract designs feel like gallery art with personalization built in.",
      },
      {
        question: "Who buys abstract name art?",
        answer:
          "Designers, architects, modern art lovers, people decorating contemporary homes, and anyone gifting something that should feel design-forward rather than traditional. Abstract is also a popular choice for studios, creative agencies, and gifting fellow creatives.",
      },
      {
        question: "What abstract styles are available?",
        answer:
          "Bauhaus geometric (primary colors, hard edges, modernist composition), Memphis (playful, clashing patterns, 80s revival), contemporary minimal (neutral palette, simple shapes, lots of negative space), fluid color (painted blends, gradient blocks), and architectural (line-based, blueprint-feeling). Each gives a different mood.",
      },
      {
        question: "Does abstract name art work as a gift?",
        answer:
          "Yes — abstract makes especially memorable gifts for friends with modern taste, for people moving into new design-forward apartments, or as housewarming gifts. Framed abstract name prints look stunning on accent walls and in modern offices.",
      },
      {
        question: "Can abstract name art print on products?",
        answer:
          "Definitely. Abstract designs translate beautifully to canvas wall art (the colors and shapes hold up at large scale), to ceramic mugs (modern color blocks look striking), and to tote bags. The minimalist directions also work well as phone wallpapers and laptop stickers.",
      },
      {
        question: "Is abstract name art free?",
        answer:
          "Previews are free. Generating high-resolution abstract designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your abstract name art",
    ctaSecondary: "Browse all abstract name examples",
    productBridgeHeading: "Abstract name art on real products",
    productBridgeBody:
      "Turn your abstract name design into striking wall art, a modern ceramic mug, or a designer-style tote. Abstract pieces work especially well as housewarming or studio-warming gifts.",
    relatedStyles: ["typography", "fantasy", "vintage", "3d"],
  },

  // ============ ARTISTIC ============

  typography: {
    introHeading: "Typography name art focused on letterform and lettering craft",
    introBody:
      "Typography name art is built around the letters themselves — bold display fonts, hand-lettered scripts, custom calligraphy, layered typographic compositions, 3D extruded text, dropped shadows, gradient fills. It's the style for anyone who loves type as design, where the name is the visual rather than just labeled by it. Typography works for almost any context — gift posters, t-shirt prints, home decor, wedding signage, executive gifts, branded keepsakes — because well-designed typography is timeless. Type any name, pick a typographic direction — bold sans, hand-lettered script, 3D extruded, layered serif, custom calligraphy — and the AI builds a finished design where the name itself is the hero element.",
    primaryKeyword: "typography name art",
    secondaryKeywords: [
      "name typography",
      "typography name design",
      "lettering name design",
    ],
    longTailKeywords: [
      "bold typography name art",
      "3d typography name art",
      "custom typography name design",
      "modern name typography ideas",
      "luxury typography name art",
    ],
    faqs: [
      {
        question: "What is typography name art?",
        answer:
          "Typography name art is a personalized design where the lettering itself IS the design — through bold display typefaces, hand-lettered scripts, custom calligraphy, or layered typographic compositions. Decoration is minimal; the letters carry the visual weight. It's the most timeless style category.",
      },
      {
        question: "What are the best typography styles for name designs?",
        answer:
          "Bold sans-serifs (modern, confident), hand-lettered scripts (warm, personal), classic calligraphy (elegant, traditional), 3D extruded (impactful, sculptural), and layered serif (editorial, magazine-quality). Each gives a different mood while keeping the lettering itself as the focal point.",
      },
      {
        question: "Is typography name art a good gift choice?",
        answer:
          "Excellent for gift contexts — it works for almost everyone because it doesn't lock into a niche aesthetic. Typography name art makes great gifts for executives, friends with minimalist taste, design lovers, and anyone where you want the gift to feel intentional but not overly themed.",
      },
      {
        question: "Can typography name designs be printed on products?",
        answer:
          "Yes — typography is one of the most product-friendly styles. Bold typography prints sharply on mugs, t-shirts, and posters. Hand-lettered scripts work beautifully on framed wall art. The high contrast in most typographic designs makes them durable across product types.",
      },
      {
        question: "What's the difference between typography and classic name art?",
        answer:
          "Classic uses traditional typography (formal serifs, copperplate calligraphy) WITH classic decorative elements (gold foil, marble, ornate flourishes). Typography focuses purely on the letters, often with modern typefaces and minimal decoration. Both prioritize letterforms; classic adds ornamentation, typography keeps it stripped down.",
      },
      {
        question: "Is typography name art free to create?",
        answer:
          "Previews are free. Generating high-resolution typography designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your typography name art",
    ctaSecondary: "Browse all typography name examples",
    productBridgeHeading: "Typography name art on real products",
    productBridgeBody:
      "Turn your typography name design into a bold mug, a sharp printed t-shirt, or a clean framed wall art piece. Typography prints exceptionally well across product types.",
    relatedStyles: ["classic", "vintage", "abstract", "graffiti"],
  },

  illustration: {
    introHeading: "Illustrated name art with hand-drawn character and detail",
    introBody:
      "Illustrated name art surrounds your name with hand-drawn imagery — characters, scenes, tiny narrative elements, decorative details that turn the name into a small story. Unlike typography (which focuses on the letters) or floral (which focuses on plants), illustration leans into character and storytelling. It's especially popular for kids, creative gifts, and personalization with a strong narrative feel. Type any name, pick an illustration direction — hand-drawn doodle, watercolor scene, character illustration, line-art portrait, storybook scene — and the AI generates a design that feels personal, warm, and crafted. It's one of the most distinctive styles we offer because each piece feels genuinely one-of-a-kind.",
    primaryKeyword: "illustrated name art",
    secondaryKeywords: [
      "name illustration",
      "illustrated name design",
      "hand-drawn name art",
    ],
    longTailKeywords: [
      "illustrated name art for kids",
      "watercolor illustrated name design",
      "character name illustration",
      "storybook name art",
      "line drawing name design",
    ],
    faqs: [
      {
        question: "What is illustrated name art?",
        answer:
          "Illustrated name art combines a name with hand-drawn imagery — characters, scenes, decorative details, doodled elements, watercolor washes, or storybook-style illustrations. Unlike pure typography, the surrounding artwork carries equal weight with the lettering, creating a personalized visual story.",
      },
      {
        question: "Is illustrated name art good for kids?",
        answer:
          "Yes — illustrated styles are some of the most popular choices for children's bedrooms, baby announcements, and kids' birthday gifts. Cute characters and storybook scenes work especially well for younger ages, while more detailed illustration suits older kids and teens.",
      },
      {
        question: "What illustration styles work best for name art?",
        answer:
          "Watercolor (soft, dreamy), line art (clean, modern), character illustration (playful, warm), storybook (detailed, narrative), and minimalist doodle (simple, charming). Each direction gives a different mood, so pick based on the recipient's aesthetic.",
      },
      {
        question: "Can I create illustrated name art for adults?",
        answer:
          "Definitely. Illustrated name art works for adults with creative tastes — line-art portraits, watercolor scenes, or detailed storybook illustrations all suit adult gift contexts. Many illustrated name designs make memorable gifts for artists, writers, and creative friends.",
      },
      {
        question: "Can illustrated name art print on products?",
        answer:
          "Yes — illustrated designs print beautifully on framed wall art (the detail comes through), on mugs (watercolor styles especially), and on canvas. Children's illustrated name prints are popular nursery decor and birthday gifts.",
      },
      {
        question: "Is illustrated name art free?",
        answer:
          "Previews are free. Generating high-resolution illustrated designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your illustrated name art",
    ctaSecondary: "Browse all illustrated name examples",
    productBridgeHeading: "Illustrated name art on real products",
    productBridgeBody:
      "Turn your illustrated name design into framed nursery wall art, a soft watercolor mug, or a charming children's t-shirt. Illustrated designs make especially memorable kids' birthday and baby shower gifts.",
    relatedStyles: ["cute", "floral", "fantasy", "vintage"],
  },

  graffiti: {
    introHeading: "Graffiti name art with street energy and bold lettering",
    introBody:
      "Graffiti name art turns your name into the kind of bold street-style design you'd see on a city wall — drippy spray paint, sharp tag lettering, neon outlines, urban backgrounds, hip-hop typography. It's the style for anyone who loves street art, hip-hop culture, or just wants their name to feel rebellious and high-energy. Graffiti name art is especially popular for teen rooms, gamer setups, urban-themed gifts, and personalization with attitude. Type any name, pick a graffiti direction — classic spray tag, neon glow, drippy paint, geometric urban, hip-hop poster — and the AI builds a finished design with the energy of street art. It's one of the most distinctive personalization styles, the opposite of soft and elegant.",
    primaryKeyword: "graffiti name art",
    secondaryKeywords: [
      "graffiti name design",
      "street art name",
      "graffiti style name",
    ],
    longTailKeywords: [
      "graffiti name art ideas",
      "custom graffiti name art",
      "bold graffiti name design",
      "neon graffiti name art",
      "urban graffiti name lettering",
    ],
    faqs: [
      {
        question: "What is graffiti name art?",
        answer:
          "Graffiti name art is a personalized design that uses street art lettering — spray paint effects, sharp tag styling, drippy paint, neon outlines, urban backdrops. Inspired by hip-hop culture and city wall art, it's bold, energetic, and the opposite of elegant or refined.",
      },
      {
        question: "Is graffiti name art good for teen rooms?",
        answer:
          "Yes — graffiti is one of the most-requested styles for teen bedroom decor and gamer setups. A bold graffiti name print on canvas or framed wall art adds personality and street energy that other styles can't match.",
      },
      {
        question: "What graffiti substyles are available?",
        answer:
          "Classic spray-paint tag (the most traditional graffiti look), neon glow (bright street colors), drippy paint (urban texture, raw feel), geometric urban (cleaner, modern street style), and hip-hop poster (concert-poster aesthetic). Each gives a different street vibe.",
      },
      {
        question: "Can graffiti name art work as an adult gift?",
        answer:
          "Definitely — graffiti designs make great gifts for hip-hop fans, urban culture enthusiasts, friends with bold taste, and anyone with a city-loft aesthetic. Framed graffiti name prints anchor industrial-style apartments beautifully.",
      },
      {
        question: "Can I print graffiti name designs on products?",
        answer:
          "Yes — graffiti designs print especially well on dark mugs, fitted streetwear t-shirts, large canvas prints, and tote bags. The bold contrast holds up across product types.",
      },
      {
        question: "Is graffiti name art free?",
        answer:
          "Previews are free. Generating high-resolution graffiti designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your graffiti name art",
    ctaSecondary: "Browse all graffiti name examples",
    productBridgeHeading: "Graffiti name art on real products",
    productBridgeBody:
      "Turn your graffiti name design into a bold streetwear t-shirt, an urban-style mug, or large canvas wall art that brings street energy to any room.",
    relatedStyles: ["typography", "gaming", "abstract", "anime"],
  },

  // ============ DESIGN ============

  "3d": {
    introHeading: "3D name art with depth, dimension, and rendered realism",
    introBody:
      "3D name art renders your name with depth — extruded letters, sculpted typography, metallic finishes, glass effects, balloon-style inflated forms, stone-carved looks. It's the style for anyone who wants their name to feel substantial, dramatic, and visually impactful. 3D works exceptionally well for gift posters, social media graphics, gaming setups, and any context where flat lettering wouldn't quite land. Type any name, pick a 3D direction — chrome metal, glass crystal, balloon party, stone carved, gold sculpted, neon tube — and the AI builds a finished design with realistic depth and lighting. It's one of the most-requested styles for birthdays and milestone celebrations because nothing else feels quite as special.",
    primaryKeyword: "3D name art",
    secondaryKeywords: ["3d name design", "3d text name art", "3d rendered name"],
    longTailKeywords: [
      "3d balloon name art",
      "chrome 3d name design",
      "glass 3d name art",
      "stone carved name design",
      "3d metallic name lettering",
    ],
    faqs: [
      {
        question: "What is 3D name art?",
        answer:
          "3D name art is a personalized design where the name has depth, dimension, and rendered surface qualities — extruded letters, metallic finishes, glass effects, balloon-style inflated forms, or stone-carved looks. Unlike flat typography, 3D designs simulate real materials with realistic lighting.",
      },
      {
        question: "Is 3D name art good for birthdays?",
        answer:
          "Yes — 3D balloon-style and party-themed designs are some of the most popular choices for birthday personalization. The dimensional, celebratory feel translates perfectly to printed posters, framed gifts, and birthday social media graphics.",
      },
      {
        question: "What 3D styles are available?",
        answer:
          "Chrome metal (sharp, reflective, modern), glass crystal (luminous, transparent), balloon party (inflated, colorful, festive), stone carved (heavy, classic, monument-feel), gold sculpted (luxurious, formal), and neon tube (glowing, retro). Each suits different occasions.",
      },
      {
        question: "Can 3D name art print on products?",
        answer:
          "Yes — 3D designs print especially dramatically on mugs (the depth catches light beautifully), on canvas wall art (large-scale 3D feels sculptural), and on premium framed prints. The visual impact is greatest on larger products.",
      },
      {
        question: "Does 3D name art work for adult gifts?",
        answer:
          "Definitely. Chrome, glass, and stone-carved 3D styles work for milestone birthdays, retirement gifts, executive gifts, and anniversaries. The metallic and glass directions especially feel premium and sophisticated.",
      },
      {
        question: "Is 3D name art free?",
        answer:
          "Previews are free. Generating high-resolution 3D designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your 3D name art",
    ctaSecondary: "Browse all 3D name examples",
    productBridgeHeading: "3D name art on real products",
    productBridgeBody:
      "Turn your 3D name design into a dimensional mug, a dramatic framed print, or large canvas wall art. 3D designs are especially impactful at larger sizes.",
    relatedStyles: ["typography", "abstract", "fantasy", "graffiti"],
  },

  // ============ OCCASIONS ============

  celebrations: {
    introHeading: "Celebration name art for birthdays, parties, and milestones",
    introBody:
      "Celebration name art combines a name with festive elements — confetti, balloons, sparkles, party decorations, vibrant colors, joyful typography. It's the style for any moment that deserves to feel special: birthdays, graduations, baby showers, retirement parties, achievement celebrations. Type any name, pick a celebration direction — confetti burst, balloon party, sparkle gold, glitter modern, party banner — and the AI generates a finished design ready for printing on cards, posters, mugs, or social posts. Celebration designs are some of our highest-converting styles for personalized birthday gifts and party-themed keepsakes.",
    primaryKeyword: "celebration name art",
    secondaryKeywords: [
      "birthday name art",
      "party name design",
      "celebration name lettering",
    ],
    longTailKeywords: [
      "birthday name art ideas",
      "party name design",
      "celebration name lettering",
      "milestone celebration name art",
      "achievement name design",
    ],
    faqs: [
      {
        question: "What is celebration name art?",
        answer:
          "Celebration name art combines a name with festive design elements — confetti, balloons, sparkles, party decorations, vibrant celebratory colors. It's used for birthdays, graduations, anniversaries, baby showers, retirement parties, and any moment worth marking.",
      },
      {
        question: "Is celebration name art good for birthdays?",
        answer:
          "Yes — birthday personalization is the most common use case for this style. Celebration name designs work beautifully as printed birthday cards, framed birthday gifts, milestone birthday posters, and personalized party decorations.",
      },
      {
        question: "What occasions work best with celebration designs?",
        answer:
          "Birthdays (all ages, but especially milestone ones), graduations, baby showers, gender reveals, retirement parties, achievement celebrations, anniversary parties, and engagement parties. Anytime there's a reason to gather and celebrate.",
      },
      {
        question: "Can celebration name art be printed on party items?",
        answer:
          "Yes — celebration designs print especially well on mugs (perfect party favor), framed posters (party centerpiece), canvas prints, and t-shirts (group celebration shirts for milestone events).",
      },
      {
        question: "What's the difference between celebration and festive name art?",
        answer:
          "Celebration is for personal milestone moments — birthdays, graduations, achievements. Festive is for cultural and seasonal holidays — Christmas, Eid, Diwali, Hanukkah, Easter. Both feel joyful but in different contexts.",
      },
      {
        question: "Is celebration name art free?",
        answer:
          "Previews are free. Generating high-resolution celebration designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your celebration name art",
    ctaSecondary: "Browse all celebration name examples",
    productBridgeHeading: "Celebration name art on real products",
    productBridgeBody:
      "Turn your celebration design into a personalized birthday mug, a milestone framed print, or a celebration t-shirt. Especially popular for milestone birthdays and graduation gifts.",
    relatedStyles: ["festive", "seasonal", "3d", "floral"],
  },

  seasonal: {
    introHeading: "Seasonal name art for spring, summer, fall, and winter moods",
    introBody:
      "Seasonal name art aligns your name with the colors, motifs, and feel of a specific season — cherry blossoms and pastels for spring, ocean and sunshine for summer, warm leaves and harvest tones for fall, snowflakes and pine for winter. It's the style for anyone wanting personalization that matches the mood of the moment, or building a collection of seasonal gifts and decor that rotate through the year. Type any name, pick a season — spring botanical, summer beach, autumn harvest, winter snowflake — and the AI builds a finished design with the palette and details that match. It's especially loved for seasonal home decor, holiday-adjacent gifts, and personalization that feels timely.",
    primaryKeyword: "seasonal name art",
    secondaryKeywords: [
      "seasonal name design",
      "spring name art",
      "summer name lettering",
    ],
    longTailKeywords: [
      "fall name art ideas",
      "winter name design",
      "spring name lettering",
      "summer beach name art",
      "autumn harvest name design",
    ],
    faqs: [
      {
        question: "What is seasonal name art?",
        answer:
          "Seasonal name art aligns a personalized design with a specific season's colors and motifs — cherry blossoms for spring, beach and sun for summer, warm leaves for fall, snowflakes and pine for winter. It's used for seasonal home decor and timely gift-giving throughout the year.",
      },
      {
        question: "Which seasons are most popular for name art?",
        answer:
          "Fall and winter dominate seasonal name art purchases — fall for cozy autumn home decor and Thanksgiving-adjacent gifts; winter for holiday-leading-up keepsakes. Spring is popular for nursery and Easter contexts; summer is the lightest for personalization.",
      },
      {
        question: "Can I rotate seasonal name designs through the year?",
        answer:
          "Yes — many users buy framed seasonal name art for a focal wall and rotate through prints as seasons change. Different framed versions for spring, summer, fall, and winter create a personalization-driven approach to seasonal home decor.",
      },
      {
        question: "What's the difference between seasonal and festive name art?",
        answer:
          "Seasonal aligns with a season's mood (spring, summer, fall, winter) — atmospheric and timely. Festive aligns with specific cultural or religious holidays (Christmas, Eid, Diwali, Easter) — celebratory and culturally specific. Both feel timely but in different ways.",
      },
      {
        question: "Can seasonal name art print on products?",
        answer:
          "Yes — seasonal designs print especially well on framed wall art (rotates with seasons), on ceramic mugs (warm fall mugs and cool winter mugs are popular), and on canvas prints. Tea towels and seasonal home items also work well.",
      },
      {
        question: "Is seasonal name art free?",
        answer:
          "Previews are free. Generating high-resolution seasonal designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your seasonal name art",
    ctaSecondary: "Browse all seasonal name examples",
    productBridgeHeading: "Seasonal name art on real products",
    productBridgeBody:
      "Turn your seasonal name design into a fall mug, a winter framed print, or a spring canvas. Seasonal designs work beautifully for rotating home decor.",
    relatedStyles: ["festive", "celebrations", "floral", "vintage"],
  },

  festive: {
    introHeading: "Festive name art for Christmas, holidays, and cultural celebrations",
    introBody:
      "Festive name art combines your name with imagery and palette from major holidays and cultural celebrations — Christmas trees and snowflakes, Hanukkah candles, Eid lanterns, Diwali lights, Easter florals, Lunar New Year red and gold. It's the style for holiday gifts, seasonal cards, and personalization that aligns with cultural or religious moments. Type any name, pick a festive direction — Christmas classic, Eid lantern, Diwali bright, Hanukkah blue and gold, Easter pastel — and the AI builds a finished design ready for cards, gifts, or printed keepsakes. Festive name art is one of the highest-traffic style categories around major holidays each year.",
    primaryKeyword: "festive name art",
    secondaryKeywords: [
      "holiday name design",
      "festive name lettering",
      "christmas name art",
    ],
    longTailKeywords: [
      "christmas name art",
      "eid name design",
      "diwali name lettering",
      "hanukkah name art",
      "easter name design",
    ],
    faqs: [
      {
        question: "What is festive name art?",
        answer:
          "Festive name art combines a name with imagery from major cultural and religious holidays — Christmas trees, Hanukkah candles, Eid lanterns, Diwali lights, Easter florals. It's used for holiday gift-giving, personalized cards, and seasonal celebration decor.",
      },
      {
        question: "Which holidays are most popular for festive name art?",
        answer:
          "Christmas dominates by volume — countries with strong Christmas culture drive enormous personalized gifting. Eid (al-Fitr and al-Adha) is huge in Muslim regions. Hanukkah, Diwali, Easter, Lunar New Year, and Thanksgiving also see strong festive name art demand.",
      },
      {
        question: "Can I create festive name art for non-religious holidays?",
        answer:
          "Yes — festive styling also works for Valentine's Day, Mother's Day, Father's Day, Halloween, and other major secular celebrations. The 'festive' descriptor refers to the celebratory mood, not just religious observance.",
      },
      {
        question: "Is festive name art good for holiday gifts?",
        answer:
          "Yes — festive designs are some of the most-gifted styles around major holidays. Personalized Christmas mugs, Eid framed prints, Hanukkah cards, and Diwali wall art are all popular gift uses.",
      },
      {
        question: "What's the difference between festive and seasonal name art?",
        answer:
          "Festive aligns with specific cultural or religious holidays (Christmas, Eid, Diwali, Easter) — celebratory and culturally specific. Seasonal aligns with the broader mood of a season (spring, summer, fall, winter) — atmospheric without being holiday-specific.",
      },
      {
        question: "Is festive name art free?",
        answer:
          "Previews are free. Generating high-resolution festive designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your festive name art",
    ctaSecondary: "Browse all festive name examples",
    productBridgeHeading: "Festive name art on real products",
    productBridgeBody:
      "Turn your festive name design into a Christmas mug, an Eid framed print, or a holiday t-shirt. Festive name gifts are especially popular leading up to major holidays.",
    relatedStyles: ["seasonal", "celebrations", "islamic", "christian"],
  },

  // ============ LIFESTYLE ============

  food: {
    introHeading: "Food-themed name art for foodies, chefs, and culinary lovers",
    introBody:
      "Food-themed name art combines your name with culinary imagery — coffee beans and steam, pizza slices, sushi platters, baked goods, ice cream cones, hot peppers, wine glasses, fresh herbs. It's the style for food lovers, home chefs, restaurant owners, and anyone gifting personalization to a culinary friend or family member. Type any name, pick a food direction — coffee artisan, baked sweet, hot pepper bold, wine elegant, sushi modern — and the AI generates a finished design that captures both the name and the food culture. It's especially fun for kitchen decor, cafe owner gifts, and personalized aprons or coffee mugs.",
    primaryKeyword: "food name art",
    secondaryKeywords: ["foodie name design", "culinary name art", "coffee name art"],
    longTailKeywords: [
      "coffee themed name art",
      "pizza name design",
      "wine name lettering",
      "baking themed name art",
      "foodie kitchen name design",
    ],
    faqs: [
      {
        question: "What is food-themed name art?",
        answer:
          "Food-themed name art combines a name with culinary imagery — coffee, baked goods, wine, sushi, hot peppers, fresh herbs. It's used for kitchen decor, gifts for food lovers, restaurant owners, and personalized aprons or coffee mugs.",
      },
      {
        question: "Who buys food-themed name art?",
        answer:
          "Home chefs, food bloggers, restaurant owners, cafe employees, food enthusiasts, and anyone gifting to a culinary friend or family member. Coffee-themed name art is especially popular for daily-use mugs.",
      },
      {
        question: "What food themes work best for name art?",
        answer:
          "Coffee (universal, daily-use friendly), baked goods (warm, kitchen-decor friendly), wine (elegant, gift-worthy), pizza (casual, fun), sushi (modern, sophisticated), and hot peppers (bold, spicy personality). Each suits different gift contexts.",
      },
      {
        question: "Is food name art good for kitchen decor?",
        answer:
          "Yes — kitchen wall art with personalized food-themed name designs is a popular use case. Framed coffee or baking-themed prints work especially well above coffee bars or in kitchen breakfast nooks.",
      },
      {
        question: "Can food name art print on aprons or mugs?",
        answer:
          "Coffee-themed designs print especially well on mugs (the daily-use connection is natural). Baked-good designs work for aprons, tea towels, and kitchen-related products. Wine designs make great gifts for wine enthusiasts.",
      },
      {
        question: "Is food name art free?",
        answer:
          "Previews are free. Generating high-resolution food designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your food-themed name art",
    ctaSecondary: "Browse all food name examples",
    productBridgeHeading: "Food name art on real products",
    productBridgeBody:
      "Turn your food-themed name design into a coffee bar mug, a kitchen framed print, or an apron. Food name designs are especially popular for kitchen-loving friends.",
    relatedStyles: ["hobbies", "vintage", "illustration", "typography"],
  },

  hobbies: {
    introHeading: "Hobby-themed name art for sports, crafts, and personal interests",
    introBody:
      "Hobby-themed name art combines your name with imagery from a specific interest or pastime — sports equipment, fishing lures, knitting needles, paint brushes, musical instruments, fitness gear, gardening tools. It's the style for someone whose hobby is core to their identity, or for gifting to a friend or family member who lives for a specific pursuit. Type any name, pick a hobby direction — fitness bold, fishing rustic, music artistic, knitting cozy, gardening floral — and the AI builds a finished design that celebrates both the name and the passion. Hobby designs are especially loved for retirement gifts, hobby-room decor, and birthday gifts where the recipient's interest is well-known.",
    primaryKeyword: "hobby name art",
    secondaryKeywords: [
      "hobby name design",
      "sports name art",
      "hobby themed name design",
    ],
    longTailKeywords: [
      "fitness name art",
      "fishing name design",
      "music name lettering",
      "gardening name art",
      "knitting name design",
    ],
    faqs: [
      {
        question: "What is hobby-themed name art?",
        answer:
          "Hobby-themed name art combines a name with imagery from a specific personal interest — sports gear, fishing lures, knitting needles, paint brushes, musical instruments, fitness equipment, gardening tools. It's used for personalized hobby-room decor and gifts celebrating someone's passion.",
      },
      {
        question: "Who is hobby name art for?",
        answer:
          "Anyone whose hobby is core to their identity. Especially popular for retirement gifts (when hobbies become primary), birthday gifts where the recipient's interest is well-known, and hobby-room or home-office decor.",
      },
      {
        question: "What hobbies work best for name art?",
        answer:
          "Fitness (gym culture is huge for personalization), fishing (popular for dad/grandpa gifts), music (works for both casual and serious musicians), knitting/crafting (cozy aesthetic), gardening (botanical-friendly), and golf (gift-worthy for enthusiasts). Each has clear visual conventions.",
      },
      {
        question: "Can hobby name art be printed on products?",
        answer:
          "Yes — hobby designs work especially well on mugs (daily-use connection to a passion), framed prints (hobby-room wall decor), and t-shirts (hobby-club shirts for groups). Custom shirts for fishing trips and golf outings are popular use cases.",
      },
      {
        question: "Is hobby name art good for retirement gifts?",
        answer:
          "Excellent — retirement is when hobbies often become primary, and personalized hobby-themed name art makes especially memorable retirement gifts. The combination of someone's name with their lifelong passion is uniquely meaningful.",
      },
      {
        question: "Is hobby name art free?",
        answer:
          "Previews are free. Generating high-resolution hobby designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your hobby name art",
    ctaSecondary: "Browse all hobby name examples",
    productBridgeHeading: "Hobby name art on real products",
    productBridgeBody:
      "Turn your hobby-themed name design into a hobby-room framed print, a daily-use mug, or a club t-shirt. Hobby designs make especially memorable retirement and milestone gifts.",
    relatedStyles: ["food", "vintage", "illustration", "gaming"],
  },

  // ============ ENTERTAINMENT ============

  christian: {
    introHeading: "Christian name art with cross, scripture, and faith motifs",
    introBody:
      "Christian name art combines your name with Christian imagery — crosses, scripture verses, dove and olive branch, light streams, stained-glass color, ornate church-inspired typography. It's the style for faith-based personalization: baptism gifts, confirmation keepsakes, nursery decor for Christian families, gifts for clergy or ministry leaders, and anyone wanting their personalized design to express faith. Type any name, pick a Christian direction — cross emblem, scripture frame, stained glass, dove and light, ornate Gothic — and the AI builds a finished design appropriate for spiritual gift-giving. Christian name art is one of the most-gifted styles for major faith milestones throughout the year.",
    primaryKeyword: "christian name art",
    secondaryKeywords: [
      "christian name design",
      "bible verse name art",
      "christian name lettering",
    ],
    longTailKeywords: [
      "baptism name art",
      "scripture name design",
      "cross name art",
      "christian gift name design",
      "faith name lettering",
    ],
    faqs: [
      {
        question: "What is Christian name art?",
        answer:
          "Christian name art combines a personalized name with faith-based imagery — crosses, scripture verses, dove and olive branch, light streams, stained-glass color, church-inspired typography. It's used for baptism gifts, confirmation keepsakes, Christian home decor, and faith-celebrating personalization.",
      },
      {
        question: "Is Christian name art good for baptism gifts?",
        answer:
          "Yes — baptism and confirmation are the most common occasions for Christian name art gifting. A framed Christian name print combining the recipient's name with a meaningful scripture verse makes a lasting keepsake.",
      },
      {
        question: "What Christian directions work best for name art?",
        answer:
          "Cross emblem (clean, central, gift-friendly), scripture verse frame (combines name with chosen verse), stained-glass color (vibrant, traditional church-inspired), dove and light (peaceful, baptism-appropriate), and Gothic ornate (formal, traditional). Pick based on the recipient's tradition and aesthetic.",
      },
      {
        question: "Can Christian name art include scripture verses?",
        answer:
          "Yes — scripture-verse-frame designs combine the name with chosen Bible verses. Popular pairings include the recipient's life verse, baptism scripture, or family blessing passages.",
      },
      {
        question: "Can Christian name art be printed on products?",
        answer:
          "Yes — Christian name designs work especially well on framed wall art (anchoring nursery or family-room decor), on ceramic mugs (daily-use faith reminder), and on canvas prints (large-scale faith-decor pieces).",
      },
      {
        question: "Is Christian name art free?",
        answer:
          "Previews are free. Generating high-resolution Christian designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your Christian name art",
    ctaSecondary: "Browse all Christian name examples",
    productBridgeHeading: "Christian name art on real products",
    productBridgeBody:
      "Turn your Christian name design into a baptism keepsake mug, a framed scripture print, or canvas wall art. Especially popular for baptism, confirmation, and family-faith gifts.",
    relatedStyles: ["islamic", "buddhist", "classic", "birthday"],
  },

  islamic: {
    introHeading: "Islamic name art with calligraphy roots, geometric patterns, and respectful aesthetics",
    introBody:
      "Islamic name art combines your name with Islamic visual traditions — Arabic calligraphy influences, geometric patterns, crescent moons, mosque architecture, gold filigree on cream backgrounds, deep blues and golds. It's the style for faith-based personalization in Islamic contexts: weddings, Eid gifts, Ramadan keepsakes, baby name decor, gifts for Islamic family members. Type any name, pick an Islamic direction — geometric pattern, crescent and stars, mosque silhouette, ornamental gold, calligraphy-inspired — and the AI builds a finished design appropriate for Islamic gift contexts. The style respects traditional Islamic aesthetic principles while feeling modern and personal.",
    primaryKeyword: "islamic name art",
    secondaryKeywords: [
      "islamic name design",
      "islamic name lettering",
      "islamic aesthetic name",
    ],
    longTailKeywords: [
      "islamic name art ideas",
      "islamic geometric name design",
      "crescent moon islamic name art",
      "mosque inspired name art",
      "personalized islamic name design",
    ],
    faqs: [
      {
        question: "What is Islamic name art?",
        answer:
          "Islamic name art combines a personalized name with Islamic visual traditions — Arabic calligraphy influences, geometric patterns, crescent moons, mosque architecture, gold filigree, deep blues and warm golds. It's used for Islamic gift contexts: weddings, Eid, Ramadan, baby names, and family-faith decor.",
      },
      {
        question: "What's the difference between Islamic name art and Arabic calligraphy?",
        answer:
          "Islamic name art is design with Islamic visual themes — geometric patterns, crescents, mosque silhouettes — and can render names in either English or Arabic. Arabic calligraphy specifically renders names in Arabic script following calligraphy traditions (thuluth, diwani, kufic). Use our dedicated Arabic calligraphy generator for the latter.",
      },
      {
        question: "Is Islamic name art appropriate for Eid gifts?",
        answer:
          "Yes — Eid al-Fitr and Eid al-Adha are two of the most popular gift occasions for Islamic name art. Framed Islamic name prints make beautiful gifts, and personalized Islamic mugs are especially popular for family Eid celebrations.",
      },
      {
        question: "What Islamic directions are available?",
        answer:
          "Geometric pattern (traditional Islamic geometry, deeply rooted), crescent moon (familiar Islamic symbol, gift-friendly), mosque silhouette (architectural, formal), ornamental gold (luxurious, wedding-appropriate), and calligraphy-inspired (English letters with calligraphy aesthetic). Each suits different occasions.",
      },
      {
        question: "Can Islamic name art print on products?",
        answer:
          "Yes — Islamic designs work especially well on framed wall art (anchoring family-room or Islamic-decor spaces), on ceramic mugs (daily-use), and on canvas prints. Many Muslim families use Islamic name art as nursery decor for newborns.",
      },
      {
        question: "Is Islamic name art free?",
        answer:
          "Previews are free. Generating high-resolution Islamic designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your Islamic name art",
    ctaSecondary: "Browse all Islamic name examples",
    productBridgeHeading: "Islamic name art on real products",
    productBridgeBody:
      "Turn your Islamic name design into an Eid gift mug, a framed family-faith print, or canvas wall art. Especially loved for weddings, Eid, Ramadan, and family-Islamic decor.",
    relatedStyles: ["christian", "buddhist", "classic", "abstract"],
  },

  buddhist: {
    introHeading: "Buddhist name art with zen, lotus, and meditation aesthetics",
    introBody:
      "Buddhist name art combines your name with Buddhist visual traditions — lotus flowers, Buddha silhouettes, zen circles (enso), mandala patterns, soft watercolor washes, peaceful palettes of cream and gold or earth tones. It's the style for meditation-room decor, Buddhist family gifts, and personalization that channels stillness and intention. Type any name, pick a Buddhist direction — lotus bloom, zen enso, mandala pattern, Buddha silhouette, watercolor peaceful — and the AI builds a finished design that respects Buddhist aesthetic traditions while feeling personal. It's a quiet, meditative style — the opposite of bold or loud.",
    primaryKeyword: "buddhist name art",
    secondaryKeywords: [
      "buddhist name design",
      "zen name art",
      "meditation name lettering",
    ],
    longTailKeywords: [
      "lotus name art",
      "zen name design",
      "mandala name art",
      "buddha inspired name design",
      "meditation room name art",
    ],
    faqs: [
      {
        question: "What is Buddhist name art?",
        answer:
          "Buddhist name art combines a personalized name with Buddhist visual traditions — lotus flowers, Buddha silhouettes, zen circles, mandala patterns, peaceful palettes. It's used for meditation rooms, Buddhist family decor, and personalization that channels stillness.",
      },
      {
        question: "Who buys Buddhist name art?",
        answer:
          "Practicing Buddhists, meditation enthusiasts, yoga teachers and students, anyone with a meditation or zen-style room, and gift-givers for Buddhist family members. The peaceful aesthetic also appeals to non-Buddhists who simply love quiet, meditative design.",
      },
      {
        question: "What Buddhist directions are available?",
        answer:
          "Lotus bloom (the most universal Buddhist symbol, gift-friendly), zen enso (single brushstroke circle, meditative), mandala pattern (intricate, sacred geometry), Buddha silhouette (peaceful, formal), and watercolor peaceful (soft washes in earth tones). Each carries a different meditative quality.",
      },
      {
        question: "Is Buddhist name art appropriate for non-Buddhists?",
        answer:
          "The aesthetic is appreciated widely — many non-Buddhists love the peaceful, meditative style. Use respectfully, with the understanding that lotus, mandala, and Buddha imagery carry spiritual meaning in their tradition. For meditation-themed personalization without religious specifics, the zen and watercolor directions work for anyone.",
      },
      {
        question: "Can Buddhist name art print on products?",
        answer:
          "Yes — Buddhist designs work beautifully on framed wall art (especially for meditation rooms), on ceramic mugs (daily-use stillness reminder), and on canvas prints. Soft palette designs print especially well on linen-finish canvas.",
      },
      {
        question: "Is Buddhist name art free?",
        answer:
          "Previews are free. Generating high-resolution Buddhist designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your Buddhist name art",
    ctaSecondary: "Browse all Buddhist name examples",
    productBridgeHeading: "Buddhist name art on real products",
    productBridgeBody:
      "Turn your Buddhist name design into a meditation-room framed print, a daily-use mug, or canvas wall art. Especially loved for meditation rooms, yoga studios, and Buddhist family gifts.",
    relatedStyles: ["islamic", "christian", "abstract", "floral"],
  },

  anime: {
    introHeading: "Anime name art with manga style, vibrant colors, and character flair",
    introBody:
      "Anime name art turns your name into a design with manga-inspired aesthetics — vibrant colors, dynamic typography, character-driven elements, action-line backgrounds, kawaii detailing, shonen energy. It's the style for anime fans, manga readers, cosplay enthusiasts, and gamers who love Japanese pop-culture aesthetics. Type any name, pick an anime direction — shonen action, kawaii cute, magical girl pastel, dark anime, retro manga — and the AI builds a finished design that captures both the name and the anime energy. It's especially popular for gamer setups, anime club shirts, and personalized gifts among anime-loving friend groups.",
    primaryKeyword: "anime name art",
    secondaryKeywords: ["anime name design", "anime style name", "manga name art"],
    longTailKeywords: [
      "anime name art ideas",
      "custom anime name art",
      "shonen anime name design",
      "kawaii anime name lettering",
      "fantasy anime name art",
    ],
    faqs: [
      {
        question: "What is anime name art?",
        answer:
          "Anime name art combines a personalized name with manga-inspired aesthetics — vibrant colors, dynamic typography, character-driven elements, action-line backgrounds. It's used for anime fans, gamer setups, cosplay personalization, and gifts among anime-loving friends.",
      },
      {
        question: "Who buys anime name art?",
        answer:
          "Anime fans, manga readers, cosplay enthusiasts, gamers (especially JRPG and Japanese game players), and gift-givers for anime-loving friends and family members. Anime conventions and anime club gifts are popular contexts.",
      },
      {
        question: "What anime substyles are available?",
        answer:
          "Shonen action (bold, dynamic, hero-energy like Naruto/Dragon Ball), kawaii cute (pastel, soft, magical-girl friendly), magical girl pastel (sparkles, pink, dreamy), dark anime (gothic, intense), and retro manga (90s aesthetic, halftones). Each captures a different anime aesthetic.",
      },
      {
        question: "Can anime name art work for non-anime fans?",
        answer:
          "The aesthetic is genre-specific — anime name art is best given to people who actually enjoy anime/manga. For non-anime fans, consider illustrated, fantasy, or graffiti styles instead.",
      },
      {
        question: "Can anime name art print on products?",
        answer:
          "Yes — anime designs work especially well on fitted t-shirts (anime-fan favorite), large canvas prints (gamer-room decor), and mugs. Anime club shirts featuring member names in anime style are popular custom orders.",
      },
      {
        question: "Is anime name art free?",
        answer:
          "Previews are free. Generating high-resolution anime designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your anime name art",
    ctaSecondary: "Browse all anime name examples",
    productBridgeHeading: "Anime name art on real products",
    productBridgeBody:
      "Turn your anime name design into a fan-style t-shirt, a gamer-room canvas, or an anime club mug. Especially popular for anime fans and conventions.",
    relatedStyles: ["gaming", "graffiti", "fantasy", "cute"],
  },

  gaming: {
    introHeading: "Gaming name art with gamer tags, esports flair, and digital aesthetics",
    introBody:
      "Gaming name art turns your name into the kind of bold, energetic design you'd see on an esports jersey, a Twitch overlay, a Discord server, or a gamer's bedroom wall. Think neon-cyber color palettes, pixel-art effects, sharp digital typography, action-line motion, console-iconic styling. It's the style for gamers, streamers, esports fans, and anyone whose gamer tag is core to their identity. Type any name (or gamer tag) and pick a gaming direction — neon cyber, pixel retro, esports bold, action streamer, console iconic — and the AI builds a finished design fit for stream graphics, gaming-room decor, or jersey personalization.",
    primaryKeyword: "gaming name art",
    secondaryKeywords: [
      "gamer name art",
      "gaming name design",
      "gaming logo name",
    ],
    longTailKeywords: [
      "cyberpunk gaming name art",
      "fantasy gaming name design",
      "custom gamer name art",
      "neon gaming name lettering",
      "gaming logo style name art",
    ],
    faqs: [
      {
        question: "What is gaming name art?",
        answer:
          "Gaming name art combines a name or gamer tag with gaming visual culture — neon-cyber palettes, pixel-art effects, sharp digital typography, action-line motion, console-iconic styling. It's used for stream graphics, gaming-room decor, esports jerseys, and Discord-server branding.",
      },
      {
        question: "Is gaming name art good for streamers?",
        answer:
          "Yes — streamers use gaming name art for Twitch overlays, YouTube banners, channel logos, and stream graphics. Personalized gamer-tag designs help streamers establish a visual brand quickly.",
      },
      {
        question: "What gaming substyles are available?",
        answer:
          "Neon cyber (bright, cyberpunk-inspired), pixel retro (8-bit, 16-bit nostalgia), esports bold (jersey-quality, sharp, energetic), action streamer (motion lines, dynamic), and console iconic (console-specific aesthetics like PlayStation/Nintendo/Xbox). Each suits different gaming contexts.",
      },
      {
        question: "Can gaming name art use my gamer tag instead of my real name?",
        answer:
          "Yes — many users enter their gamer tag rather than their real name. The tool handles short tags, long tags, tags with numbers, and special characters (within style limits).",
      },
      {
        question: "Can gaming name art print on products?",
        answer:
          "Yes — gaming designs print especially well on fitted t-shirts (esports-jersey friendly), on large canvas prints (gaming-room decor), and on mugs (stream-desk daily-use). Custom shirts for gaming groups and Discord-server members are popular.",
      },
      {
        question: "Is gaming name art free?",
        answer:
          "Previews are free. Generating high-resolution gaming designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your gaming name art",
    ctaSecondary: "Browse all gaming name examples",
    productBridgeHeading: "Gaming name art on real products",
    productBridgeBody:
      "Turn your gaming name design into a streamer-style t-shirt, a gaming-room canvas, or a stream-desk mug. Especially popular for streamers, gamers, and Discord-server custom merch.",
    relatedStyles: ["anime", "graffiti", "abstract", "fantasy"],
  },

  "movies-and-tv-shows": {
    introHeading: "Movie & TV-themed name art for film fans and pop-culture lovers",
    introBody:
      "Movie & TV-themed name art combines your name with film and television visual influences — cinema-poster typography, vintage TV color palettes, classic Hollywood gold, sci-fi futurism, horror moodiness, romantic comedy bright. It's the style for film buffs, TV fans, and anyone wanting personalization that nods to their favorite genre or era. Type any name, pick a direction — vintage Hollywood, sci-fi futurism, horror noir, sitcom retro, romantic cinema — and the AI builds a design with the energy of a movie poster or TV opening title. (Note: We can't include trademarked characters or logos. The style references genres and eras, not specific properties.)",
    primaryKeyword: "movie name art",
    secondaryKeywords: [
      "tv show name art",
      "movie themed name design",
      "cinematic name art",
    ],
    longTailKeywords: [
      "movie poster name art",
      "vintage hollywood name design",
      "sci-fi name art",
      "horror name lettering",
      "cinematic name typography",
    ],
    faqs: [
      {
        question: "What is movie & TV name art?",
        answer:
          "Movie & TV name art combines a name with film and television visual influences — cinema-poster typography, vintage TV palettes, classic Hollywood gold, sci-fi futurism, horror moodiness. It references genres and eras, not specific characters or trademarked properties.",
      },
      {
        question: "Can I include a specific movie or TV show character?",
        answer:
          "No — we can't include trademarked characters, logos, or copyrighted properties. The style references genres (sci-fi, horror, romance, vintage Hollywood) and eras (1950s cinema, 80s sitcom, 90s TV) rather than specific intellectual property.",
      },
      {
        question: "Who buys movie & TV name art?",
        answer:
          "Film buffs, TV enthusiasts, fans of a particular genre or era, and gift-givers for movie-loving friends and family members. Home-theater and entertainment-room decor are common use cases.",
      },
      {
        question: "What movie/TV substyles are available?",
        answer:
          "Vintage Hollywood (classic gold, dramatic typography), sci-fi futurism (chrome, neon, geometric), horror noir (dark, moody, atmospheric), sitcom retro (warm, nostalgic, 70s/80s), and romantic cinema (soft, warm, dreamy). Each captures a genre's mood without specific IP.",
      },
      {
        question: "Can movie name art print on products?",
        answer:
          "Yes — designs work especially well on framed wall art (home-theater decor), on canvas prints (entertainment-room centerpiece), and on t-shirts (genre-fan apparel).",
      },
      {
        question: "Is movie name art free?",
        answer:
          "Previews are free. Generating high-resolution movie/TV designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your movie name art",
    ctaSecondary: "Browse all movie & TV name examples",
    productBridgeHeading: "Movie & TV name art on real products",
    productBridgeBody:
      "Turn your movie-themed name design into a home-theater framed print, a genre-fan t-shirt, or an entertainment-room canvas.",
    relatedStyles: ["birthday", "fantasy", "gaming", "typography"],
  },

  logos: {
    introHeading: "Logo-style name art — your name designed as a personal emblem",
    introBody:
      "Logo-style name art treats your name like a personal logo — clean, distinctive, emblematic. Not a brand logo for a business; a refined personal identifier you can use as a watermark, social media graphic, framed decor, or symbolic gift. Inspired by monogram design, modern logo conventions, and minimalist mark-making, it's the style for someone who wants their name to feel iconic rather than decorated. Type any name (or initials), pick a direction — monogram emblem, minimalist mark, ornate crest, signature script, geometric badge — and the AI generates a clean, distinctive design that works at any size. (Note: This is for personal name design, not commercial brand logos. For business branding, use a dedicated logo service.)",
    primaryKeyword: "logo name art",
    secondaryKeywords: [
      "name logo design",
      "monogram name art",
      "name as logo",
    ],
    longTailKeywords: [
      "personal name logo design",
      "monogram name art for names",
      "minimalist logo name art",
      "personalized logo name design",
      "name as personal emblem",
    ],
    faqs: [
      {
        question: "Is this for personal or business logos?",
        answer:
          "Personal — these are designs that turn your name (or initials) into a personal emblem or monogram-style mark. They're for personal use: signatures, watermarks, social media branding, framed personal decor, or symbolic gifts. For commercial business logos, use a dedicated brand-logo service like Looka or Hatchful.",
      },
      {
        question: "What's the difference between this and a regular name design?",
        answer:
          "Logo-style name art is restrained, emblematic, and designed to work at any size — like a personal mark you'd put on signature blocks or watermarks. Regular name designs are more decorative, with backgrounds, textures, and visual flourishes. Logos focus on the mark itself.",
      },
      {
        question: "What logo directions are available?",
        answer:
          "Monogram emblem (initials interwoven, traditional), minimalist mark (single-line, modern), ornate crest (heraldic, formal), signature script (handwritten-feel, personal), and geometric badge (modernist, sharp). Each gives a different emblem feel.",
      },
      {
        question: "Can I use logo-style name art commercially?",
        answer:
          "For personal use (signatures, watermarks, social bios, framed decor) yes. For commercial business branding (a logo for your company), we recommend a dedicated brand-logo service that handles trademark searches and brand-system design.",
      },
      {
        question: "Can logo name art print on products?",
        answer:
          "Yes — emblem-style designs print exceptionally well on signet-style framed prints, on minimalist mugs, and on monogrammed tote bags. The clean, restrained aesthetic translates beautifully to premium products.",
      },
      {
        question: "Is logo name art free?",
        answer:
          "Previews are free. Generating high-resolution logo-style designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your name logo art",
    ctaSecondary: "Browse all logo name examples",
    productBridgeHeading: "Logo name art on real products",
    productBridgeBody:
      "Turn your name-logo design into a monogrammed mug, an emblem framed print, or a signet-style tote bag. Logo-style works especially well as personal-decor or signature-style gifts.",
    relatedStyles: ["typography", "classic", "abstract", "birthday"],
  },

  // ============ OTHER ============

  landscapes: {
    introHeading: "Landscape-themed name art with mountains, oceans, and natural scenes",
    introBody:
      "Landscape-themed name art weaves your name into natural scenery — mountain ranges, ocean horizons, desert sunsets, forest canopies, river valleys, starry skies. It's the style for nature lovers, hikers, travelers, and anyone wanting personalization that reflects a connection to the outdoors. Type any name, pick a landscape direction — mountain peak, ocean wave, desert sunset, forest canopy, starry sky — and the AI builds a design where the name feels woven into the scenery. Landscape designs work especially well as large framed prints anchoring a living room or home office, and as gifts for outdoor-loving friends and family.",
    primaryKeyword: "landscape name art",
    secondaryKeywords: [
      "nature name art",
      "scenic name design",
      "landscape name lettering",
    ],
    longTailKeywords: [
      "mountain name art",
      "ocean name design",
      "forest name art",
      "desert sunset name design",
      "starry sky name lettering",
    ],
    faqs: [
      {
        question: "What is landscape name art?",
        answer:
          "Landscape name art combines a name with natural scenery — mountains, oceans, deserts, forests, rivers, starry skies. The name feels woven into the landscape rather than placed on top of a flat background. It's used for nature-loving personalization and outdoor-themed home decor.",
      },
      {
        question: "Who buys landscape name art?",
        answer:
          "Nature lovers, hikers, climbers, travelers, beach-house owners, mountain-cabin decorators, and gift-givers for outdoor-loving friends. Anyone whose connection to a specific natural place or landscape type is meaningful to them.",
      },
      {
        question: "What landscape directions are available?",
        answer:
          "Mountain peak (climbing, hiking, dramatic), ocean wave (beach, surfing, peaceful), desert sunset (warm, southwestern, dramatic), forest canopy (woodland, cozy, cabin-feel), and starry sky (cosmic, astronomy-loving, dreamy). Each captures a different connection to nature.",
      },
      {
        question: "Can landscape name art commemorate a specific trip or place?",
        answer:
          "Yes — many users create landscape designs commemorating specific trips, hometowns, or meaningful natural places. Combine the name with the landscape that matters most for a personalized travel-memory keepsake.",
      },
      {
        question: "Can landscape name art print on products?",
        answer:
          "Yes — landscape designs print especially dramatically on large framed prints (the scenery scales beautifully), on canvas (gives the look of natural-scene photography), and on tote bags. Smaller mugs work too but the landscape detail comes through best at larger sizes.",
      },
      {
        question: "Is landscape name art free?",
        answer:
          "Previews are free. Generating high-resolution landscape designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your landscape name art",
    ctaSecondary: "Browse all landscape name examples",
    productBridgeHeading: "Landscape name art on real products",
    productBridgeBody:
      "Turn your landscape-themed name design into a large framed print, a canvas wall art piece, or a daily-use mug. Especially loved for travel-memory gifts and nature-lover decor.",
    relatedStyles: ["floral", "vintage", "illustration", "abstract"],
  },

  animals: {
    introHeading: "Animal-themed name art with pets, wildlife, and creature illustration",
    introBody:
      "Animal-themed name art combines your name with creature imagery — pet portraits, wildlife illustrations, bird silhouettes, sea life, exotic animals. It's the style for animal lovers, pet owners, wildlife enthusiasts, and anyone gifting personalization that celebrates a love of creatures. Type any name (yours, your pet's, your child's), pick an animal direction — domestic pet (cats, dogs), wildlife (deer, eagles, bears), sea life (whales, dolphins), birds, exotic — and the AI builds a finished design celebrating both the name and the animal connection. It's especially loved for pet-memorial keepsakes, kids' rooms with favorite-animal themes, and wildlife-loving outdoor enthusiasts.",
    primaryKeyword: "animal name art",
    secondaryKeywords: [
      "animal themed name art",
      "pet name design",
      "wildlife name lettering",
    ],
    longTailKeywords: [
      "pet name art",
      "wildlife name design",
      "bird name art",
      "sea animal name lettering",
      "exotic animal name design",
    ],
    faqs: [
      {
        question: "What is animal name art?",
        answer:
          "Animal name art combines a name with creature imagery — pet portraits, wildlife illustrations, bird silhouettes, sea animals, exotic creatures. It's used for pet-memorial keepsakes, kids' rooms with animal themes, wildlife-loving home decor, and gifts for animal enthusiasts.",
      },
      {
        question: "Can I create animal name art for my pet?",
        answer:
          "Yes — many users create personalized name art featuring their pet's name with the appropriate animal imagery. Pet-memorial keepsakes (especially for dogs and cats) are a meaningful and popular use case.",
      },
      {
        question: "What animal directions are available?",
        answer:
          "Domestic pets (cats, dogs, rabbits, smaller animals — gift-friendly), wildlife (deer, eagles, bears, wolves — outdoor/cabin aesthetic), sea life (whales, dolphins, fish — coastal-feel), birds (specific species or generic — varied moods), and exotic (lions, elephants, giraffes — bold/safari aesthetic). Each suits different gift contexts.",
      },
      {
        question: "Is animal name art good for kids' rooms?",
        answer:
          "Yes — animal-themed children's rooms are extremely common, and personalized animal name art makes beautiful nursery and kid-room decor. Pick the child's favorite animal and combine with their name for a custom focal piece.",
      },
      {
        question: "Can animal name art print on products?",
        answer:
          "Yes — animal designs work especially well on framed prints (kid-room or pet-memorial wall art), on mugs (daily pet-loving reminder), and on tote bags. Pet-portrait-style designs also print beautifully on canvas at larger sizes.",
      },
      {
        question: "Is animal name art free?",
        answer:
          "Previews are free. Generating high-resolution animal designs uses credits from our pricing plans starting at $1.99.",
      },
    ],
    ctaPrimary: "Create your animal-themed name art",
    ctaSecondary: "Browse all animal name examples",
    productBridgeHeading: "Animal name art on real products",
    productBridgeBody:
      "Turn your animal-themed name design into a pet-memorial framed print, a kid-room canvas, or a daily-use mug. Especially loved for pet keepsakes and animal-themed nurseries.",
    relatedStyles: ["illustration", "cute", "landscapes", "fantasy"],
  },
};

export function getStyleContent(slug: string): StyleContent {
  return STYLE_CONTENT[slug] ?? {};
}
