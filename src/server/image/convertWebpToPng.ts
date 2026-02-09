/* eslint-disable @typescript-eslint/restrict-template-expressions */
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3 = new S3Client({ region: process.env.NEXT_PUBLIC_S3_REGION });

export async function convertWebpToPngAndUpload(
  webpBuffer: Buffer,
  userId: string
): Promise<string> {
  const pngBuffer = await sharp(webpBuffer)
    .png({ quality: 100 })
    .toBuffer();

  const key = `print-images/${userId}/${crypto.randomUUID()}.png`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: key,
      Body: pngBuffer,
      ContentType: "image/png",
    })
  );

  return `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${key}`;
}
