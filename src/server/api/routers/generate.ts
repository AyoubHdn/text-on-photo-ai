// ~/server/api/routers/generate.ts

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import fetch from "node-fetch";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import Replicate from "replicate";
import { env } from "~/env.mjs";
import { b64Image } from "~/data/b64Image";
import AWS from "aws-sdk";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";
import { buffer as readStreamIntoBuffer } from "stream/consumers";
import { Readable } from "stream";

const s3 = new AWS.S3({
  credentials: {
    accessKeyId: env.ACCESS_KEY_ID,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
  region: "us-east-1",
});

const BUCKET_NAME = "name-design-ai";

const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

async function fetchAndEncodeImage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to fetch image from ${url}` });
  }
  const buf = await response.buffer();
  return buf.toString("base64");
}

// Main generation helper function
const generateIcon = async ({
  prompt,
  numberOfImages = 1,
  aspectRatio = "1:1",
  model,
  referenceImageUrl,
  userImageUrl,
}: {
  prompt: string;
  numberOfImages?: number;
  aspectRatio?: string;
  model: "flux-schnell" | "flux-dev" | "flux-kontext-dev" | "ideogram-ai/ideogram-v2-turbo";
  referenceImageUrl?: string;
  userImageUrl?: string;
}): Promise<string[]> => {
  let path: `${string}/${string}`;
  let input: Record<string, any>;

  // --- MODEL-SPECIFIC LOGIC ---
  if (model === "flux-schnell") {
    path = "black-forest-labs/flux-schnell";
    input = { prompt, num_outputs: numberOfImages, aspect_ratio: aspectRatio, output_format: "webp" };
  } else if (model === "flux-dev") {
    path = "black-forest-labs/flux-dev";
    input = { prompt, num_outputs: numberOfImages, aspect_ratio: aspectRatio, output_format: "webp" };
  } 
  // --- START: NEW FLUX-KONTEXT-DEV LOGIC ---
  else if (model === "flux-kontext-dev") {
    if (!referenceImageUrl) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A reference image is required for flux-kontext-dev." });
    }
    path = "black-forest-labs/flux-kontext-dev";
    
    // Convert the public URLs from your /styles/ folder into data URLs for Replicate
    const referenceImageAsDataUrl = `data:image/webp;base64,${await fetchAndEncodeImage(referenceImageUrl)}`;

    input = {
      prompt,
      image: referenceImageAsDataUrl,
      output_format: "png", // Kontext works best with PNG for quality edits
      output_quality: 90,
    };

    // If a user photo is provided for the upsell, add it to the input
    if (userImageUrl) {
      const userImageAsDataUrl = `data:image/jpeg;base64,${await fetchAndEncodeImage(userImageUrl)}`;
      input.user_image = userImageAsDataUrl;
    }
  } 
  // --- END: NEW FLUX-KONTEXT-DEV LOGIC ---
  else if (model === "ideogram-ai/ideogram-v2-turbo") {
    path = "ideogram-ai/ideogram-v2-turbo";
    input = { prompt, aspect_ratio: aspectRatio };
    if (numberOfImages > 1) numberOfImages = 1;
  } else {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid model selected" });
  }

  if (env.MOCK_REPLICATE === "true") {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Array(numberOfImages).fill(b64Image);
  }

  // --- API CALL ---
  const output = (await replicate.run(path, { input })) as string[] | string;

  if (Array.isArray(output)) {
    return Promise.all(output.map(fetchAndEncodeImage));
  } else if (typeof output === 'string') {
    // Handle single URL output (common for image-to-image models)
    return [await fetchAndEncodeImage(output)];
  } else {
     throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unexpected output from Replicate model" });
  }
};


export const generateRouter = createTRPCRouter({
  generateIcon: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
        numberOfImages: z.number().min(1).max(10).optional(),
        aspectRatio: z.string().optional(),
        model: z.enum([
          "flux-schnell",
          "flux-dev",
          "flux-kontext-dev",
          "ideogram-ai/ideogram-v2-turbo",
        ]),
        // --- STRATEGIC CHANGE: Add optional image URLs to the input schema ---
        referenceImageUrl: z.string().url().optional(),
        userImageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const creditCosts = {
        "flux-schnell": 1,
        "flux-dev": 4,
        "flux-kontext-dev": 8, // Define cost
        "ideogram-ai/ideogram-v2-turbo": 8,
      };

      const creditsNeeded = (creditCosts[input.model] ?? 1) * (input.numberOfImages ?? 1);

      // --- DEDUCT CREDITS ---
      const { count } = await ctx.prisma.user.updateMany({
        where: { id: ctx.session.user.id, credits: { gte: creditsNeeded } },
        data: { credits: { decrement: creditsNeeded } },
      });

      if (count <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You do not have enough credits" });
      }

      // Fetch updated user data
      const updatedUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });
      if (!updatedUser || !updatedUser.email) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found after credit update",
        });
      }

      // --- UPDATE MAUTIC (no changes) ---
      try {
        await updateMauticContact({
          email: updatedUser.email,
          name: updatedUser.name,
          brand_specific_credits: updatedUser.credits,
        },
          'namedesignai');
        console.log("Mautic contact updated after credit deduction.");
      } catch (err) {
        console.error("Error updating Mautic after credit deduction:", err);
      }
      
      // --- GENERATE IMAGES ---
      const b64Images = await generateIcon({
        prompt: input.prompt,
        numberOfImages: input.numberOfImages,
        aspectRatio: input.aspectRatio,
        model: input.model,
        referenceImageUrl: input.referenceImageUrl,
        userImageUrl: input.userImageUrl,
      });

      // --- UPLOAD TO S3 & STORE IN DB ---
      const createdIcons = await Promise.all(
        b64Images.map(async (b64Image) => {
          const icon = await ctx.prisma.icon.create({
            data: { prompt: input.prompt, userId: ctx.session.user.id },
          });

          await s3.putObject({
            Bucket: BUCKET_NAME,
            Body: Buffer.from(b64Image, "base64"),
            Key: icon.id,
            ContentEncoding: "base64",
            ContentType: input.model === 'flux-kontext-dev' ? 'image/png' : 'image/webp',
          }).promise();

          return icon;
        })
      );

      return createdIcons.map((icon) => ({
        imageUrl: `https://${BUCKET_NAME}.s3.us-east-1.amazonaws.com/${icon.id}`,
      }));
    }),
});