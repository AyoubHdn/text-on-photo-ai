// src/server/image/prepareForPrint.ts
import sharp from "sharp";

export async function prepareForPrint(
  input: Buffer,
  size = 3000
) {
  return sharp(input)
    .resize(size, size, {
      fit: "cover",
    })
    .png({ quality: 100 })
    .toBuffer();
}
