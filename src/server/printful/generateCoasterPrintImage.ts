import sharp from "sharp";

export async function generateCoasterPrintImage({
  inputBuffer,
  printWidth,
  printHeight,
}: {
  inputBuffer: Buffer;
  printWidth: number;
  printHeight: number;
}) {
  return sharp(inputBuffer)
    .resize({
      width: printWidth,
      height: printHeight,
      fit: "cover",
      position: "centre",
    })
    .png({ quality: 100 })
    .withMetadata({ density: 300 })
    .toBuffer();
}
