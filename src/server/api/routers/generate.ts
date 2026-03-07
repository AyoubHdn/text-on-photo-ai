// ~/server/api/routers/generate.ts

import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import fetch from "node-fetch";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
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
  region: env.NEXT_PUBLIC_S3_REGION,
});

const BUCKET_NAME = env.NEXT_PUBLIC_S3_BUCKET_NAME;

const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

const ASPECT_RATIO_VALUES = ["1:1", "4:5", "3:2", "16:9"] as const;
type AspectRatioValue = (typeof ASPECT_RATIO_VALUES)[number];

const FRIENDLY_GENERATION_BUSY_MESSAGE =
  "Generation is temporarily busy at our AI provider due to high demand. Please try again shortly. If generation fails, your credits are refunded automatically.";
const DEFAULT_GENERATION_TIMEOUT_MS = 120000;
const NANO_BANANA_ATTEMPT_TIMEOUT_MS = 45000;
const NANO_BANANA_MAX_ATTEMPTS = 3;
const NANO_BANANA_RETRY_DELAYS_MS = [3000, 7000] as const;

function normalizeGenerationErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "";

  const lower = raw.toLowerCase();
  if (
    lower.includes("prediction failed") ||
    lower.includes("service is currently unavailable") ||
    lower.includes("(e003)") ||
    lower.includes("timeout") ||
    lower.includes("timed out")
  ) {
    return FRIENDLY_GENERATION_BUSY_MESSAGE;
  }

  return raw || "Generation failed. Please try again.";
}

function isRetryableProviderError(error: unknown): boolean {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "";
  const lower = raw.toLowerCase();
  return (
    lower.includes("prediction failed") ||
    lower.includes("service is currently unavailable") ||
    lower.includes("(e003)") ||
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  );
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// Helper function to fetch an image from a URL and encode it as Base64
async function fetchAndEncodeImage(url: string): Promise<string> {
  console.log("Fetching image from:", url);
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
  aspectRatio: AspectRatioValue = "1:1",
  model: "flux-schnell" | "flux-dev" | "ideogram-ai/ideogram-v2-turbo" | "google/nano-banana-pro"
): Promise<string[]> => {
  let path: `${string}/${string}`;
  let input: Record<string, any>;
  let outputs: string[] = [];

  // --- 1. CONFIGURATION ---
  if (model === "google/nano-banana-pro") {
    path = "google/nano-banana-pro";
    input = {
      prompt,
      aspect_ratio: aspectRatio,
      output_format: "png",
      resolution: "2K",
      safety_filter_level: "block_only_high",
    };
  } else if (model === "flux-schnell") {
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
    if (numberOfImages > 1) numberOfImages = 1;
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

  // --- 2. EXECUTION ---
  console.log(`Calling Replicate model: ${model}`);
  let rawOutput: unknown;
  try {
    if (model === "google/nano-banana-pro") {
      let lastError: unknown = null;
      for (let attempt = 1; attempt <= NANO_BANANA_MAX_ATTEMPTS; attempt++) {
        try {
          rawOutput = await withTimeout(
            replicate.run(path, { input }),
            NANO_BANANA_ATTEMPT_TIMEOUT_MS,
            "Generation timed out while waiting for Nano Banana",
          );
          lastError = null;
          break;
        } catch (attemptError) {
          lastError = attemptError;
          const canRetry =
            isRetryableProviderError(attemptError) &&
            attempt < NANO_BANANA_MAX_ATTEMPTS;
          if (!canRetry) {
            throw attemptError;
          }
          const delayMs = NANO_BANANA_RETRY_DELAYS_MS[attempt - 1] ?? 5000;
          console.warn(
            `[NANO_BANANA_RETRY] attempt ${attempt} failed; retrying in ${delayMs}ms`,
            attemptError instanceof Error ? attemptError.message : attemptError,
          );
          await sleep(delayMs);
        }
      }
      if (lastError) {
        throw lastError;
      }
    } else {
      rawOutput = await withTimeout(
        replicate.run(path, { input }),
        DEFAULT_GENERATION_TIMEOUT_MS,
        "Generation timed out while waiting for model response",
      );
    }
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: normalizeGenerationErrorMessage(error),
    });
  }
  console.log("Replicate output type:", typeof rawOutput);
  // console.log("Replicate raw output:", rawOutput); // Uncomment to debug structure if needed

  // --- 3. OUTPUT PARSING (FIXED) ---

  // Helper type guards
  function isNodeReadableStream(obj: any): obj is Readable { return obj instanceof Readable; }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  function isWebReadableStream(obj: any): obj is ReadableStream<Uint8Array> { return typeof obj?.getReader === "function"; }

  // Case A: Single String URL
  if (typeof rawOutput === "string") {
    outputs = [await fetchAndEncodeImage(rawOutput)];
  }
  // Case B: Array of Strings
  else if (Array.isArray(rawOutput)) {
    if (rawOutput.length === 0) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Empty output array" });
    outputs = await Promise.all(rawOutput.map((item) => fetchAndEncodeImage(String(item))));
  }
  // Case C: Object / Stream (Generic handling for ANY model)
  else if (rawOutput && typeof rawOutput === 'object') {
    let base64Image: string;

    if (isNodeReadableStream(rawOutput)) {
      // Node.js Stream
      const streamBuffer = await readStreamIntoBuffer(rawOutput);
      base64Image = streamBuffer.toString("base64");
    } else if (isWebReadableStream(rawOutput)) {
      // Web Stream
      const reader = rawOutput.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      base64Image = Buffer.concat(chunks).toString("base64");
    } else if (Buffer.isBuffer(rawOutput)) {
      // Buffer
      base64Image = rawOutput.toString("base64");
    } else if ('url' in rawOutput && typeof (rawOutput).url === "string") {
      // Object with URL property
      base64Image = await fetchAndEncodeImage((rawOutput).url);
    } else {
      console.error("Unknown Object Structure:", JSON.stringify(rawOutput));
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected object structure from AI model",
      });
    }
    outputs = [base64Image];
  } 
  else {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected output format from AI model",
    });
  }

  return outputs;
};

export const generateRouter = createTRPCRouter({
  generateIcon: publicProcedure
    .input(
      z.object({
        prompt: z.string(),
        numberOfImages: z.number().min(1).max(10),
        aspectRatio: z.enum(ASPECT_RATIO_VALUES).default("1:1"),
        model: z.enum([
          "flux-schnell",
          "flux-dev",
          "ideogram-ai/ideogram-v2-turbo",
          "google/nano-banana-pro",
        ]),
        metadata: z
          .object({
            category: z.string().optional(),
            subcategory: z.string().optional(),
          })
          .optional(),
        paidTrafficUser: z.boolean().optional(),
        sourcePage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const sourcePage = (input.sourcePage ?? "").trim().toLowerCase();
      const isRamadanGuestSource =
        sourcePage === "ramadan-mug" || sourcePage === "ramadan-mug-men";
      const isEligibleGuestGeneration = !userId && input.paidTrafficUser && isRamadanGuestSource;

      if (!userId && !isEligibleGuestGeneration) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Sign in is required for this generator.",
        });
      }

      // Define credit costs
      const modelConfig = {
        "flux-schnell": { credits: 1 },
        "flux-dev": { credits: 3 },
        "ideogram-ai/ideogram-v2-turbo": { credits: 5 },
        "google/nano-banana-pro": { credits: 4 },
      }[input.model];

      if (!modelConfig) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid model selected",
        });
      }

      if (isEligibleGuestGeneration) {
        if (input.model !== "google/nano-banana-pro" || input.numberOfImages !== 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This offer supports one Nano Banana generation per request.",
          });
        }
        try {
          const b64Images: string[] = await generateIcon(
            input.prompt,
            1,
            input.aspectRatio,
            input.model,
          );

          const createdIcons = await Promise.all(
            b64Images.map(async (image: string) => {
              const icon = await ctx.prisma.icon.create({
                data: {
                  prompt: input.prompt,
                  userId: null,
                  metadata: {
                    aspectRatio: input.aspectRatio ?? null,
                    model: input.model,
                    category: input.metadata?.category ?? null,
                    subcategory: input.metadata?.subcategory ?? null,
                    sourcePage: input.sourcePage ?? null,
                    paidTrafficUser: true,
                  },
                },
              });

              const isPng =
                input.model === "ideogram-ai/ideogram-v2-turbo" ||
                input.model === "google/nano-banana-pro";

              await s3
                .putObject({
                  Bucket: BUCKET_NAME,
                  Body: Buffer.from(image, "base64"),
                  Key: icon.id,
                  ContentEncoding: "base64",
                  ContentType: isPng ? "image/png" : "image/webp",
                })
                .promise();

              return icon;
            }),
          );

          return createdIcons.map((icon) => ({
            imageUrl: `https://${BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${icon.id}`,
          }));
        } catch (guestGenerationError) {
          if (guestGenerationError instanceof TRPCError) {
            throw guestGenerationError;
          }
          if (guestGenerationError instanceof Error) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: normalizeGenerationErrorMessage(guestGenerationError),
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Generation failed. Please try again.",
          });
        }
      }
      const authedUserId = userId as string;

      // Calculate total credits needed (Decimal-safe)
      const creditsPerImage = new Prisma.Decimal(modelConfig.credits);
      const imageCount = new Prisma.Decimal(
        input.model === "ideogram-ai/ideogram-v2-turbo" ||
          input.model === "google/nano-banana-pro"
          ? 1
          : input.numberOfImages
      );
      const totalCredits = creditsPerImage.times(imageCount);

      // Deduct credits before generation; refund on downstream failure.
      const updatedUser = await ctx.prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: { id: authedUserId },
          select: { credits: true, email: true, name: true },
        });

        if (!existingUser) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "User not found after credit update",
          });
        }

        const creditsDecimal = new Prisma.Decimal(existingUser.credits);
        if (creditsDecimal.lessThan(totalCredits)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You do not have enough credits",
          });
        }

        const updatedCredits = creditsDecimal.minus(totalCredits);
        return tx.user.update({
          where: { id: authedUserId },
          data: {
            credits: updatedCredits,
            hasGeneratedDesign: true,
          },
          select: { credits: true, email: true, name: true },
        });
      });

      // Update Mautic contact
      if (updatedUser.email) {
        try {
          await updateMauticContact({
            email: updatedUser.email,
            name: updatedUser.name,
            brand_specific_credits: updatedUser.credits,
            customFields: {
              has_generated_design: 1,
            },
          },
            'namedesignai');
          console.log("Mautic contact updated after credit deduction.");
        } catch (err) {
          console.error("Error updating Mautic after credit deduction:", err);
        }
      }

      try {
        // Generate images
        const b64Images: string[] = await generateIcon(
          input.prompt,
          input.model === "ideogram-ai/ideogram-v2-turbo" || input.model === "google/nano-banana-pro"
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
                userId: authedUserId,
                metadata: {
                  aspectRatio: input.aspectRatio ?? null,
                  model: input.model,
                  category: input.metadata?.category ?? null,
                  subcategory: input.metadata?.subcategory ?? null,
                },
              },
            });

            try {
              // Determine Content Type
              const isPng = input.model === "ideogram-ai/ideogram-v2-turbo" || input.model === "google/nano-banana-pro";

              await s3
                .putObject({
                  Bucket: BUCKET_NAME,
                  Body: Buffer.from(image, "base64"),
                  Key: icon.id,
                  ContentEncoding: "base64",
                  ContentType: isPng ? "image/png" : "image/webp",
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
          imageUrl: `https://${BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${icon.id}`,
        }));
      } catch (generationOrStorageError) {
        // If generation/storage fails after deduction, refund in full.
        try {
          const refundedUser = await ctx.prisma.$transaction(async (tx) => {
            const existingUser = await tx.user.findUnique({
              where: { id: authedUserId },
              select: { credits: true, email: true, name: true },
            });
            if (!existingUser) return null;

            const restoredCredits = new Prisma.Decimal(existingUser.credits).plus(totalCredits);
            return tx.user.update({
              where: { id: authedUserId },
              data: { credits: restoredCredits },
              select: { credits: true, email: true, name: true },
            });
          });

          if (refundedUser?.email) {
            try {
              await updateMauticContact({
                email: refundedUser.email,
                name: refundedUser.name,
                brand_specific_credits: refundedUser.credits,
              }, "namedesignai");
            } catch (mauticErr) {
              console.error("Error updating Mautic after refund:", mauticErr);
            }
          }
        } catch (refundError) {
          console.error("Credit refund failed after generation/storage error:", refundError);
        }

        if (generationOrStorageError instanceof TRPCError) {
          throw generationOrStorageError;
        }
        if (generationOrStorageError instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: normalizeGenerationErrorMessage(generationOrStorageError),
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Generation failed. Credits were refunded.",
        });
      }
    }),
});
