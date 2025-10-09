/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/server/api/routers/photoGift.ts

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import fetch from "node-fetch";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import Replicate from "replicate";
import { env } from "~/env.mjs";
import { b64Image as mockB64Image } from "~/data/b64Image"; // MERGED: Using the project's mock data file
import AWS from "aws-sdk";
import { updateMauticContact } from "~/server/api/routers/mautic-utils"; // MERGED: Using project's Mautic utils
import { buffer as readStreamIntoBuffer } from "stream/consumers";
import { Readable } from "stream";

// MERGED: Using S3 config directly from generate.ts for consistency
const s3 = new AWS.S3({
  credentials: {
    accessKeyId: env.ACCESS_KEY_ID,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
  region:  env.S3_REGION,
});

const BUCKET_NAME = env.S3_BUCKET;
if (!BUCKET_NAME) {
  throw new Error("S3_BUCKET_NAME env var is not set.");
}

const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

// MERGED: Using the exact fetch/encode helper from generate.ts
async function fetchAndEncodeImage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to fetch image from ${url}` });
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

// This is our new img2img worker function, combining logic from both files.
async function generateAiPhoto(
  prompt: string,
  modelName: "flux-kontext-pro" | "flux-kontext-max",
  inputImageS3Url: string,
  aspectRatio: "match_input_image" | "1:1" | "16:9" | "9:16"
): Promise<string> { // Returns a single base64 string

  const replicatePath = modelName === "flux-kontext-pro" 
    ? "black-forest-labs/flux-kontext-pro" 
    : "black-forest-labs/flux-kontext-max";

  // MERGED: This is the critical img2img input structure from faceLogo.ts
  const replicateApiInput = {
    prompt,
    input_image: inputImageS3Url,
    aspect_ratio: aspectRatio, // Flexible for user photos
    output_format: "png",
    safety_tolerance: 2,
    seed: Math.floor(Math.random() * 1_000_000_000),
  };

  console.log(`PHOTOGIFT.TS: Calling ${modelName} with input:`, JSON.stringify(replicateApiInput));

  if (env.MOCK_REPLICATE === "true") {
    return mockB64Image;
  }

  const outputFromReplicate: unknown = await replicate.run(replicatePath, { input: replicateApiInput });
  
  // MERGED: Using the superior, robust stream/buffer handling logic from generate.ts
  let base64Image: string;
  function isNodeReadableStream(obj: any): obj is Readable { return obj instanceof Readable; }
  function isWebReadableStream(obj: any): obj is ReadableStream<Uint8Array> { return typeof obj?.getReader === "function"; }
  if (isNodeReadableStream(outputFromReplicate)) {
    const streamBuffer = await readStreamIntoBuffer(outputFromReplicate);
    base64Image = streamBuffer.toString("base64");
  } else if (isWebReadableStream(outputFromReplicate)) {
    const reader = outputFromReplicate.getReader();
    const chunks: Uint8Array[] = [];
    while (true) { const { value, done } = await reader.read(); if (done) break; if (value) chunks.push(value); }
    base64Image = Buffer.concat(chunks).toString("base64");
  } else if (Buffer.isBuffer(outputFromReplicate)) {
    base64Image = outputFromReplicate.toString("base64");
  } else if (typeof outputFromReplicate === 'string' && outputFromReplicate.startsWith('http')) {
    base64Image = await fetchAndEncodeImage(outputFromReplicate);
  } else if (Array.isArray(outputFromReplicate) && outputFromReplicate.length > 0 && typeof outputFromReplicate[0] === 'string') {
      base64Image = await fetchAndEncodeImage(outputFromReplicate[0]);
  } else {
    console.error("PHOTOGIFT.TS: Unexpected output type from model:", outputFromReplicate);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unexpected or empty output type from AI model." });
  }
  
  if (!base64Image || base64Image.length < 100) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to obtain valid image data from AI model." });
  }
  return base64Image;
}


export const photoGiftRouter = createTRPCRouter({
  generatePhotoGift: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
        inputImageS3Url: z.string().url(),
        model: z.enum(["flux-kontext-pro", "flux-kontext-max"]),
        optionalText: z.string().optional(),
        aspectRatio: z.enum(['match_input_image', '1:1', '16:9', '9:16']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const creditsNeeded = 10;
      const { count } = await ctx.prisma.user.updateMany({
        where: { id: ctx.session.user.id, credits: { gte: creditsNeeded } },
        data: { credits: { decrement: creditsNeeded } },
      });

      if (count <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You do not have enough credits." });
      }
      
      const updatedUser = await ctx.prisma.user.findUnique({ where: { id: ctx.session.user.id } });
      if (updatedUser?.email) {
        try {
          await updateMauticContact({ email: updatedUser.email, name: updatedUser.name, brand_specific_credits: updatedUser.credits }, 'namedesignai');
        } catch (err) { console.error("Error updating Mautic:", err); }
      }
      
      const base64ImageString = await generateAiPhoto(
        input.prompt, input.model, input.inputImageS3Url, input.aspectRatio
      );

      // CORRECTED: Changed ctx.prisma.image to ctx.prisma.icon
      const createdIcon = await ctx.prisma.icon.create({
        data: {
          prompt: input.prompt,
          userId: ctx.session.user.id,
        },
      });

      await s3.putObject({
        Bucket: BUCKET_NAME,
        Body: Buffer.from(base64ImageString, "base64"),
        // CORRECTED: Changed createdImage.id to createdIcon.id
        Key: createdIcon.id,
        ContentEncoding: "base64",
        ContentType: "image/png",
      }).promise();

      return {
        // CORRECTED: Changed createdImage.id to createdIcon.id
        imageUrl: `https://${BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com/${createdIcon.id}`,
      };
    }),
});