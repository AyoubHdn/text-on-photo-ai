/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// ~/server/api/routers/s3.ts
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { env } from "~/env.mjs";
import { TRPCError } from "@trpc/server";

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: env.ACCESS_KEY_ID,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = "name-design-ai";

export const s3Router = createTRPCRouter({
  createPresignedUrl: protectedProcedure
    .input(z.object({
      filename: z.string(),
      filetype: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Generate a unique key for the file in S3
        const key = `${Date.now()}_${input.filename}`;

        const { url, fields } = await createPresignedPost(s3Client, {
          Bucket: BUCKET_NAME,
          Key: key,
          Conditions: [
            ["content-length-range", 0, 10485760], // up to 10 MB
            ["starts-with", "$Content-Type", "image/"],
          ],
          Fields: {
            'Content-Type': input.filetype,
          },
          Expires: 600, // 10 minutes
        });

        // This is the final, public URL the file will have after upload
        const publicUrl = `https://${BUCKET_NAME}.s3.us-east-1.amazonaws.com/${key}`;

        return { url, fields, publicUrl };
      } catch (error) {
        console.error("Error creating presigned URL:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create upload URL." });
      }
    }),
});