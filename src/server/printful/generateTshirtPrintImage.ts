// src/server/printful/generateTshirtPrintImage.ts
import sharp from "sharp";
import { AspectRatio } from "./aspects";

export async function generateTshirtPrintImage({
  inputBuffer,
  printWidth,
  printHeight,
  aspect,
}: {
  inputBuffer: Buffer;
  printWidth: number;
  printHeight: number;
  aspect: AspectRatio;
}) {
  const meta = await sharp(inputBuffer).metadata();

  if (!meta.width || !meta.height) {
    throw new Error("Invalid image metadata");
  }

  // DTG safe zone (85% width)
  const maxWidth = printWidth;

  const scale = Math.min(
    maxWidth / meta.width,
    printHeight / meta.height
  );

  const width = Math.round(meta.width * scale);
  const height = Math.round(meta.height * scale);

  const left = Math.round((printWidth - width) / 2);

  // Vertical positioning logic
  let top: number;

  if (aspect === "16:9" || aspect === "3:2") {
    top = Math.round(printHeight * 0.12); // chest placement
  } else {
    top = Math.round((printHeight - height) / 2);
  }

  return sharp({
    create: {
      width: printWidth,
      height: printHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(inputBuffer)
          .resize(width, height)
          .toBuffer(),
        left,
        top,
      },
    ])
    .png({ quality: 100 })
    .withMetadata({ density: 300 })
    .toBuffer();
}
