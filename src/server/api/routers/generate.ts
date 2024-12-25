import { TRPCError } from "@trpc/server";
import { z } from "zod";
import fetch from "node-fetch"; // Ensure this is installed
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import Replicate from "replicate";
import { env } from "~/env.mjs";
import { b64Image } from "~/data/b64Image";
import AWS from "aws-sdk";

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
async function generateIcon(prompt: string, numberOfImages = 1): Promise<string[]> {
  if (env.MOCK_REPLICATE === "true") {
    return Array(numberOfImages).fill(b64Image) as string[]; // Mock data for testing
  } else {
    const output = (await replicate.run("black-forest-labs/flux-schnell", {
      input: {
        prompt,
        go_fast: true,
        megapixels: "1",
        num_outputs: numberOfImages,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 80,
        num_inference_steps: 4,
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
}

export const generateRouter = createTRPCRouter({
  generateIcon: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
        color: z.string(),
        numberOfImages: z.number().min(1).max(10),
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

      const finalPrompt = `a nature with name ${input.prompt} with ${input.color} background`;

      // Generate the image as Base64
      const b64Images: string[] = await generateIcon(finalPrompt, input.numberOfImages);

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

      // Map created icons to return their URLs
      return createdIcons.map((icon) => ({
        imageUrl: `https://${BACKET_NAME}.s3.us-east-1.amazonaws.com/${icon.id}`,
      }));
    }),
});
