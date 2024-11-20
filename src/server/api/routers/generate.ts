import { TRPCError } from "@trpc/server";
import { z } from "zod";
import fetch from "node-fetch"; // Install this if not already installed

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import Replicate from "replicate";
import { env } from "~/env.mjs";
import { b64Image } from "~/data/b64Image";
import AWS from "aws-sdk";
import { use } from "react";

const s3 = new AWS.S3({
  credentials:{
    accessKeyId: env.ACCESS_KEY_ID,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
  region: "eu-south-2",
})

const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

// Helper function to fetch image and encode it as Base64
async function fetchAndEncodeImage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to fetch image from ${url}`,
    });
  }
  const buffer = await response.buffer();
  return buffer.toString("base64");
}

// Generate the image and encode to Base64
async function generateIcon(prompt: string): Promise<string | undefined> {
  if (env.MOCK_REPLICATE === "true") {
    return b64Image;
  } else {
    // Call the Replicate API
    const output = (await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt: prompt,
        go_fast: true,
        megapixels: "1",
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "png", // Use a valid format
        output_quality: 80,
        num_inference_steps: 4,
      },
    })) as string[];

    // Assume output is an array of URLs
    const imageUrl = Array.isArray(output) ? output[0] : undefined;

    if (!imageUrl) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate image URL",
      });
    }

    // Fetch and encode the image as Base64
    return await fetchAndEncodeImage(imageUrl);
  }
}

export const generateRouter = createTRPCRouter({
  generateIcon: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Decrement credits
      const { count } = await ctx.prisma.user.updateMany({
        where: {
          id: ctx.session.user.id,
          credits: {
            gte: 1,
          },
        },
        data: {
          credits: {
            decrement: 1,
          },
        },
      });

      if (count <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You do not have enough credits",
        });
      }

      // Generate the image as Base64
      const b64Image = await generateIcon(input.prompt);

      const icon = await ctx.prisma.icon.create({
        data: {
          prompt: input.prompt,
          userId: ctx.session.user.id,
        },
      });

      await s3.putObject({
        Bucket: "wall-text-web-ai",
        Body: Buffer.from(b64Image!,"base64"),
        Key: icon.id,
        ContentEncoding:"base64",
        ContentType: "image/png",
      }).promise();

      return {
        imageBase64: b64Image, // Return the Base64 string
      };
    }),
});