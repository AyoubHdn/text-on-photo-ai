// =========================================
// ~/server/api/routers/generate.ts
// =========================================

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import fetch from "node-fetch"; // Ensure this is installed
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import Replicate from "replicate";
import { env } from "~/env.mjs";
import { b64Image } from "~/data/b64Image";
import AWS from "aws-sdk";
import { updateMauticContact } from "~/server/api/routers/mautic-utils"; // Import your Mautic update function

// Configure AWS S3
const s3 = new AWS.S3({
  credentials: {
    accessKeyId: env.ACCESS_KEY_ID,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
  region: "us-east-1",
});

const BACKET_NAME = "name-design-ai";

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

// Generate the image and encode it as Base64
const generateIcon = async (
  prompt: string,
  numberOfImages = 1,
  aspectRatio = "1:1", // Default aspect ratio
  model = "flux-schnell" // Default model
): Promise<string[]> => {
  const config = model === "flux-schnell"
    ? { steps: 4, path: "black-forest-labs/flux-schnell" as `${string}/${string}` }
    : { steps: 28, path: "black-forest-labs/flux-dev" as `${string}/${string}` };

  if (env.MOCK_REPLICATE === "true") {
    return Array(numberOfImages).fill(b64Image) as string[]; // Mock data for testing
  } else {
    const output = (await replicate.run(config.path, {
      input: {
        prompt,
        go_fast: true,
        megapixels: "1",
        num_outputs: numberOfImages,
        aspect_ratio: aspectRatio,
        output_format: "webp",
        output_quality: 80,
        num_inference_steps: config.steps,
      },
    })) as string[];

    if (!Array.isArray(output) || output.length === 0) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate image URLs",
      });
    }

    return Promise.all(output.map(fetchAndEncodeImage));
  }
};

// TRPC Router
export const generateRouter = createTRPCRouter({
  generateIcon: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
        numberOfImages: z.number().min(1).max(10),
        aspectRatio: z.string().optional(),
        model: z.string(), 
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Determine cost
      const modelConfig =
        input.model === "flux-schnell"
          ? { credits: 1 }
          : { credits: 4 };

      const totalCredits = modelConfig.credits * input.numberOfImages;

      // Deduct credits
      const { count } = await ctx.prisma.user.updateMany({
        where: {
          id: ctx.session.user.id,
          credits: {
            gte: totalCredits,
          },
        },
        data: {
          credits: {
            decrement: totalCredits,
          },
        },
      });

      if (count <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You do not have enough credits",
        });
      }

      // Fetch updated user
      const updatedUser = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });
      if (!updatedUser || !updatedUser.email) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found after credit update",
        });
      }

      // Update Mautic
      try {
        await updateMauticContact({
          email: updatedUser.email,
          name: updatedUser.name,
          credits: updatedUser.credits,
        });
        console.log("Mautic contact updated after credit deduction.");
      } catch (err) {
        console.error("Error updating Mautic after credit deduction:", err);
      }

      // Generate images
      const b64Images: string[] = await generateIcon(
        input.prompt,
        input.numberOfImages,
        input.aspectRatio,
        input.model
      );

      // Store images in DB and S3
      const createdIcons = await Promise.all(
        b64Images.map(async (image: string) => {
          const icon = await ctx.prisma.icon.create({
            data: {
              prompt: input.prompt,
              userId: ctx.session.user.id,
            },
          });

          await s3
            .putObject({
              Bucket: BACKET_NAME,
              Body: Buffer.from(image, "base64"),
              Key: icon.id,
              ContentEncoding: "base64",
              ContentType: "image/webp",
            })
            .promise();

          return icon;
        })
      );

      return createdIcons.map((icon) => ({
        imageUrl: `https://${BACKET_NAME}.s3.us-east-1.amazonaws.com/${icon.id}`,
      }));
    }),
});
