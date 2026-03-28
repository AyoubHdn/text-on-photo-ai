export const FULL_BLEED_ARTWORK_PROMPT_RULES = [
  "Critical composition constraint: the artwork must fill the entire image edge-to-edge, with the background and design extending all the way to the four edges of the canvas.",
  "Critical anti-mockup constraint: never place the artwork inside a centered square, rectangle, poster, paper sheet, card, panel, canvas, framed print, logo badge, or any smaller image area within the image.",
  "Critical anti-margin constraint: no outer white background, off-white studio backdrop, pale textured surface, paper border, visible sheet edges, wall margin, tabletop, surrounding empty space, drop shadow, floating artwork, or presentation shadow.",
  "Critical output framing constraint: generate a single full-bleed artwork file, not an isolated object cutout and not a photographed print.",
] as const;
