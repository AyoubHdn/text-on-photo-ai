/* eslint-disable @typescript-eslint/restrict-template-expressions */
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { env } from "~/env.mjs";

const s3 = new S3Client({
  region: env.NEXT_PUBLIC_S3_REGION,
  credentials: {
    accessKeyId: env.ACCESS_KEY_ID,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
});

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
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME,
      Key: key,
      Body: pngBuffer,
      ContentType: "image/png",
    })
  );

  return `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${key}`;
}
