import sharp from "sharp";

type MugWrapOptions = {
  inputBuffer: Buffer;
  outputWidth: number;
  outputHeight: number;
  mode: "two-side" | "center" | "full-wrap";
};

export async function generateMugWrapImage({
  inputBuffer,
  outputWidth,
  outputHeight,
  mode,
}: MugWrapOptions) {
  const HANDLE_GAP_RATIO = 0.18;
  const handleGap = outputWidth * HANDLE_GAP_RATIO;

  const resized = await sharp(inputBuffer)
    .resize({
      height: outputHeight,
      fit: "cover",
    })
    .png()
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const designWidth = meta.width ?? outputHeight;

  const canvas = sharp({
    create: {
      width: outputWidth,
      height: outputHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  });

  // ---------- CENTER ----------
  if (mode === "center") {
    return canvas
      .composite([
        {
          input: resized,
          left: Math.round((outputWidth - designWidth) / 2),
          top: 0,
        },
      ])
      .png({ quality: 100 })
      .withMetadata({ density: 300 })
      .toBuffer();
  }

  // ---------- TWO-SIDE ----------
  if (mode === "two-side") {
    const leftX = (outputWidth - handleGap) / 2 - designWidth;
    const rightX = (outputWidth + handleGap) / 2;

    return canvas
      .composite([
        { input: resized, left: Math.round(leftX), top: 0 },
        { input: resized, left: Math.round(rightX), top: 0 },
      ])
      .png({ quality: 100 })
      .withMetadata({ density: 300 })
      .toBuffer();
  }

  // ---------- FULL WRAP ----------
  return sharp(inputBuffer)
    .resize({
      width: outputWidth,
      height: outputHeight,
      fit: "cover",
    })
    .png({ quality: 100 })
    .withMetadata({ density: 300 })
    .toBuffer();
}