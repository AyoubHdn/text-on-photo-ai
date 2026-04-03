import sharp from "sharp";

type MugWrapOptions = {
  outputWidth: number;
  outputHeight: number;
  mode: "two-side" | "center" | "full-wrap" | "paired-two-side";
  inputBuffer?: Buffer;
  leftInputBuffer?: Buffer;
  rightInputBuffer?: Buffer;
};

export async function generateMugWrapImage({
  outputWidth,
  outputHeight,
  mode,
  inputBuffer,
  leftInputBuffer,
  rightInputBuffer,
}: MugWrapOptions) {
  const HANDLE_GAP_RATIO = 0.18;
  const handleGap = outputWidth * HANDLE_GAP_RATIO;

  const canvas = sharp({
    create: {
      width: outputWidth,
      height: outputHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  });

  if (mode === "paired-two-side") {
    if (!leftInputBuffer || !rightInputBuffer) {
      throw new Error("Both left and right mug side buffers are required.");
    }

    const leftRegionWidth = Math.round((outputWidth - handleGap) / 2);
    const rightRegionWidth = leftRegionWidth;
    const insetX = Math.round(leftRegionWidth * 0.05);
    const insetY = Math.round(outputHeight * 0.04);
    const sideWidth = leftRegionWidth - insetX * 2;
    const sideHeight = outputHeight - insetY * 2;

    const leftResized = await sharp(leftInputBuffer)
      .resize({
        width: sideWidth,
        height: sideHeight,
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer();

    const rightResized = await sharp(rightInputBuffer)
      .resize({
        width: sideWidth,
        height: sideHeight,
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer();

    const leftMeta = await sharp(leftResized).metadata();
    const rightMeta = await sharp(rightResized).metadata();
    const leftWidth = leftMeta.width ?? sideWidth;
    const leftHeight = leftMeta.height ?? sideHeight;
    const rightWidth = rightMeta.width ?? sideWidth;
    const rightHeight = rightMeta.height ?? sideHeight;

    return canvas
      .composite([
        {
          input: leftResized,
          left: Math.round((leftRegionWidth - leftWidth) / 2),
          top: Math.round((outputHeight - leftHeight) / 2),
        },
        {
          input: rightResized,
          left: Math.round(leftRegionWidth + handleGap + (rightRegionWidth - rightWidth) / 2),
          top: Math.round((outputHeight - rightHeight) / 2),
        },
      ])
      .png({ quality: 100 })
      .withMetadata({ density: 300 })
      .toBuffer();
  }

  if (!inputBuffer) {
    throw new Error("A mug artwork buffer is required.");
  }

  const resized = await sharp(inputBuffer)
    .resize({
      height: outputHeight,
      fit: "cover",
    })
    .png()
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const designWidth = meta.width ?? outputHeight;

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
