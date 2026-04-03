import sharp from "sharp";

const HANDLE_GAP_RATIO = 0.18;

async function normalizeSidePreview(buffer: Buffer, outputSize: number) {
  return sharp(buffer)
    .rotate()
    .resize({
      width: outputSize,
      height: outputSize,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png({ quality: 100 })
    .withMetadata({ density: 300 })
    .toBuffer();
}

export async function extractCoupleMugSidePreviews(params: {
  wrapBuffer: Buffer;
  outputSize?: number;
}) {
  const outputSize = params.outputSize ?? 1024;
  const normalizedWrap = await sharp(params.wrapBuffer).png().toBuffer();
  const wrapMeta = await sharp(normalizedWrap).metadata();
  const width = wrapMeta.width ?? 2700;
  const height = wrapMeta.height ?? 1050;
  const handleGap = Math.round(width * HANDLE_GAP_RATIO);
  const sideWidth = Math.round((width - handleGap) / 2);

  const leftBuffer = await sharp(normalizedWrap)
    .extract({
      left: 0,
      top: 0,
      width: sideWidth,
      height,
    })
    .png()
    .toBuffer();

  const rightBuffer = await sharp(normalizedWrap)
    .extract({
      left: width - sideWidth,
      top: 0,
      width: sideWidth,
      height,
    })
    .png()
    .toBuffer();

  const [herSideBuffer, hisSideBuffer] = await Promise.all([
    normalizeSidePreview(leftBuffer, outputSize),
    normalizeSidePreview(rightBuffer, outputSize),
  ]);

  return {
    herSideBuffer,
    hisSideBuffer,
  };
}
