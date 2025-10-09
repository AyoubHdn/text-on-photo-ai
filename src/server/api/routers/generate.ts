/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
// Rename this import to avoid clashing with local variables
import { buffer as readStreamIntoBuffer } from "stream/consumers";
import { Readable } from "stream";

const s3 = new AWS.S3({
  credentials: {
    accessKeyId: env.ACCESS_KEY_ID,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
  region: env.S3_REGION,
});

const BUCKET_NAME = env.S3_BUCKET;

const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

// Helper function to fetch an image from a URL and encode it as Base64
async function fetchAndEncodeImage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to fetch image from ${url}`,
    });
  }
  const buf = await response.buffer();
  return buf.toString("base64");
}

// Generate the image and encode it as Base64
const generateIcon = async (
  prompt: string,
  numberOfImages = 1,
  aspectRatio = "1:1",
  model = "flux-schnell"
): Promise<string[]> => {
  let path: `${string}/${string}`;
  let input: Record<string, any>;
  let outputs: string[] = [];

  // Model-specific settings
  if (model === "flux-schnell") {
    path = "black-forest-labs/flux-schnell";
    input = {
      prompt,
      go_fast: true,
      megapixels: "1",
      num_outputs: numberOfImages,
      aspect_ratio: aspectRatio,
      output_format: "webp",
      output_quality: 80,
      num_inference_steps: 4,
    };
  } else if (model === "flux-dev") {
    path = "black-forest-labs/flux-dev";
    input = {
      prompt,
      go_fast: true,
      megapixels: "1",
      num_outputs: numberOfImages,
      aspect_ratio: aspectRatio,
      output_format: "webp",
      output_quality: 80,
      num_inference_steps: 28,
    };
  } else if (model === "ideogram-ai/ideogram-v2-turbo") {
    path = "ideogram-ai/ideogram-v2-turbo";
    input = {
      prompt,
      aspect_ratio: aspectRatio,
      resolution: "None",
      style_type: "General",
      magic_prompt_option: "Auto",
    };
    // Ideogram generates only one image at a time
    if (numberOfImages > 1) {
      console.warn("Ideogram only supports one image per request; ignoring additional images.");
      numberOfImages = 1;
    }
  } else {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid model selected",
    });
  }

  // Mock mode for testing
  if (env.MOCK_REPLICATE === "true") {
    return Array(numberOfImages).fill(b64Image) as string[];
  }

  // Actual API calls
  if (model === "ideogram-ai/ideogram-v2-turbo") {
    const output = await replicate.run(path, { input });
    console.log("Ideogram output type:", typeof output);
    console.log("Ideogram output:", output);

    let base64Image: string;

    // Type-guard for Node.js Readable stream
    function isNodeReadableStream(obj: any): obj is Readable {
      return obj instanceof Readable;
    }

    // Type-guard for Web ReadableStream
    function isWebReadableStream(obj: any): obj is ReadableStream<Uint8Array> {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return typeof obj?.getReader === "function";
    }

    if (isNodeReadableStream(output)) {
      // It's a Node.js Readable stream
      const streamBuffer = await readStreamIntoBuffer(output);
      base64Image = streamBuffer.toString("base64");
    } else if (isWebReadableStream(output)) {
      // It's a Web ReadableStream
      const reader = output.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      base64Image = Buffer.concat(chunks).toString("base64");
    } else if (Buffer.isBuffer(output)) {
      // Already a Buffer
      base64Image = output.toString("base64");
    } else if (typeof output === "string") {
      // If it's a URL, fetch and encode
      base64Image = await fetchAndEncodeImage(output);
    } else if (
      typeof output === "object" &&
      output !== null &&
      "url" in output &&
      typeof output.url === "string"
    ) {
      // If it's an object with a .url property
      base64Image = await fetchAndEncodeImage(output.url);
    } else {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected output type from Ideogram model",
      });
    }
    outputs = [base64Image];
  } else {
    // For flux models, we expect an array of URLs
    const output = (await replicate.run(path, { input })) as string[];
    if (!Array.isArray(output) || output.length === 0) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate image URLs",
      });
    }
    // Convert each URL to base64
    outputs = await Promise.all(output.map(fetchAndEncodeImage));
  }

  return outputs;
};

export const generateRouter = createTRPCRouter({
  generateIcon: protectedProcedure
    .input(
      z.object({
        prompt: z.string(),
        numberOfImages: z.number().min(1).max(10),
        aspectRatio: z.string().optional(),
        model: z.enum([
          "flux-schnell",
          "flux-dev",
          "ideogram-ai/ideogram-v2-turbo",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Define credit costs
      const modelConfig = {
        "flux-schnell": { credits: 1 },
        "flux-dev": { credits: 4 },
        "ideogram-ai/ideogram-v2-turbo": { credits: 8 },
      }[input.model];

      if (!modelConfig) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid model selected",
        });
      }

      // Calculate total credits needed
      const totalCredits =
        modelConfig.credits *
        (input.model === "ideogram-ai/ideogram-v2-turbo"
          ? 1
          : input.numberOfImages);

      // Deduct credits
      const { count } = await ctx.prisma.user.updateMany({
        where: {
          id: ctx.session.user.id,
          credits: { gte: totalCredits },
        },
        data: {
          credits: { decrement: totalCredits },
        },
      });

      if (count <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You do not have enough credits",
        });
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

      // Update Mautic contact
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

      // Generate images
      const b64Images: string[] = await generateIcon(
        input.prompt,
        input.model === "ideogram-ai/ideogram-v2-turbo"
          ? 1
          : input.numberOfImages,
        input.aspectRatio,
        input.model
      );

      // Store images in DB & upload to S3
      const createdIcons = await Promise.all(
        b64Images.map(async (image: string) => {
          const icon = await ctx.prisma.icon.create({
            data: {
              prompt: input.prompt,
              userId: ctx.session.user.id,
            },
          });

          try {
            await s3
              .putObject({
                Bucket: BUCKET_NAME,
                Body: Buffer.from(image, "base64"),
                Key: icon.id,
                ContentEncoding: "base64",
                ContentType:
                  input.model === "ideogram-ai/ideogram-v2-turbo"
                    ? "image/png"
                    : "image/webp",
              })
              .promise();
          } catch (s3Error) {
            console.error("S3 Upload Error:", s3Error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to upload image to S3",
            });
          }

          return icon;
        })
      );

      // Return the URLs
      return createdIcons.map((icon) => ({
        imageUrl: `https://${BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com/${icon.id}`,
      }));
    }),
});
