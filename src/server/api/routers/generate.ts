// ~/server/api/routers/generate.ts

import { TRPCError } from "@trpc/server";
import { Prisma, type PrismaClient } from "@prisma/client";
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
import { ARABIC_NAME_MUG_V1_STYLES } from "~/config/arabicNameMugV1Styles";
import { RAMADAN_MUG_V2_STYLES } from "~/config/ramadanMugV2Styles";
import {
  getArabicTierByModel,
  isArabicGeneratorSourcePage,
} from "~/config/arabicGenerator";
import { buildArabicNameMugPrompt } from "~/lib/arabicNameMugPrompt";
import {
  getDigitalArtInterestFromSourcePage,
  recordDigitalArtInterest,
} from "~/server/mautic/digitalArtInterest";
import { buildRamadanMugV2Prompt } from "~/server/prompts/ramadanMugV2Prompt";
import { createHash } from "crypto";

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
const GENERATION_REQUEST_WAIT_TIMEOUT_MS = DEFAULT_GENERATION_TIMEOUT_MS + 10000;
const GENERATION_REQUEST_POLL_INTERVAL_MS = 500;
const GUEST_GENERATION_WINDOW_MS = 10 * 60 * 1000;
const GUEST_GENERATION_MAX_REQUESTS = 5;
const GUEST_GENERATION_DEDUP_TTL_MS = 2 * 60 * 1000;
const GENERATION_REQUEST_IN_FLIGHT_TTL_MS = 3 * 60 * 1000;
const guestGenerationRateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>();
const guestGenerationInFlightMap = new Map<
  string,
  { promise: Promise<string>; expiresAt: number }
>();
const generationRequestInFlightMap = new Map<
  string,
  { promise: Promise<string[]>; expiresAt: number }
>();

type GenerationLogContext = {
  generationRequestId: string;
  userId: string | null;
  sourcePage: string | null;
  requestType: string;
  model: string;
  promptHash: string;
  inputHash: string;
};

type ExecuteGenerationRequestParams = GenerationLogContext & {
  prisma: PrismaClient;
  creditsCharged?: Prisma.Decimal | null;
};

type ExecuteGenerationResult = {
  imageUrls: string[];
  predictionId?: string | null;
};

type GenerateImagesResult = {
  imagesBase64: string[];
  predictionId: string | null;
};

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function logGenerationEvent(
  event: string,
  params: GenerationLogContext & {
    sourceFunction: string;
    predictionId?: string | null;
    deduped?: boolean;
    dedupeSource?: string | null;
    error?: string | null;
  },
) {
  console.log(
    "[GENERATION]",
    JSON.stringify({
      timestamp: new Date().toISOString(),
      sourcePath: "src/server/api/routers/generate.ts",
      event,
      predictionId: null,
      deduped: false,
      dedupeSource: null,
      error: null,
      ...params,
    }),
  );
}

function parseStoredImageUrls(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function getStoredGenerationError(
  request: { errorMessage: string | null },
  fallback = "Generation failed. Please try again.",
) {
  return request.errorMessage?.trim() || fallback;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function getOrCreateGenerationRequestPromise(
  key: string,
  factory: () => Promise<string[]>,
): Promise<string[]> {
  const now = Date.now();
  const existing = generationRequestInFlightMap.get(key);
  if (existing && existing.expiresAt > now) {
    return existing.promise;
  }

  const promise = factory().finally(() => {
    const current = generationRequestInFlightMap.get(key);
    if (current?.promise === promise) {
      generationRequestInFlightMap.delete(key);
    }
  });

  generationRequestInFlightMap.set(key, {
    promise,
    expiresAt: now + GENERATION_REQUEST_IN_FLIGHT_TTL_MS,
  });

  return promise;
}

function getClientIp(
  req: { headers?: Record<string, string | string[] | undefined> } | undefined,
) {
  const forwarded = req?.headers?.["x-forwarded-for"];
  const candidate =
    typeof forwarded === "string"
      ? forwarded.split(",")[0]
      : Array.isArray(forwarded)
      ? forwarded[0]
      : undefined;
  return candidate?.trim() || "unknown";
}

function enforceGuestGenerationRateLimit(key: string) {
  const now = Date.now();
  const existing = guestGenerationRateLimitMap.get(key);
  if (!existing || now >= existing.resetAt) {
    guestGenerationRateLimitMap.set(key, {
      count: 1,
      resetAt: now + GUEST_GENERATION_WINDOW_MS,
    });
    return;
  }

  if (existing.count >= GUEST_GENERATION_MAX_REQUESTS) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded. Please try again in a few minutes.",
    });
  }

  guestGenerationRateLimitMap.set(key, {
    count: existing.count + 1,
    resetAt: existing.resetAt,
  });
}

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

async function waitForGenerationRequestResult(
  prisma: PrismaClient,
  logContext: GenerationLogContext,
) {
  const deadline = Date.now() + GENERATION_REQUEST_WAIT_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const existing = await prisma.generationRequest.findUnique({
      where: { generationRequestId: logContext.generationRequestId },
      select: {
        status: true,
        resultImageUrls: true,
        errorMessage: true,
        predictionId: true,
      },
    });

    if (!existing) {
      break;
    }

    if (existing.status === "completed") {
      const imageUrls = parseStoredImageUrls(existing.resultImageUrls);
      logGenerationEvent("generation_request_deduped", {
        ...logContext,
        sourceFunction: "waitForGenerationRequestResult",
        predictionId: existing.predictionId,
        deduped: true,
        dedupeSource: "database_completed",
      });
      return imageUrls;
    }

    if (existing.status === "failed") {
      const message = getStoredGenerationError(existing);
      logGenerationEvent("generation_request_deduped", {
        ...logContext,
        sourceFunction: "waitForGenerationRequestResult",
        predictionId: existing.predictionId,
        deduped: true,
        dedupeSource: "database_failed",
        error: message,
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message,
      });
    }

    await sleep(GENERATION_REQUEST_POLL_INTERVAL_MS);
  }

  logGenerationEvent("generation_request_wait_timed_out", {
    ...logContext,
    sourceFunction: "waitForGenerationRequestResult",
    deduped: true,
    dedupeSource: "database_inflight_timeout",
    error: "Timed out while waiting for an existing generation request to finish.",
  });

  throw new TRPCError({
    code: "CONFLICT",
    message: "Generation is already in progress. Please wait a moment and try again.",
  });
}

async function reuseExistingGenerationRequestIfAvailable(
  prisma: PrismaClient,
  logContext: GenerationLogContext,
) {
  const existing = await prisma.generationRequest.findUnique({
    where: { generationRequestId: logContext.generationRequestId },
    select: {
      status: true,
      resultImageUrls: true,
      errorMessage: true,
      predictionId: true,
    },
  });

  if (!existing) {
    return null;
  }

  if (existing.status === "completed") {
    const imageUrls = parseStoredImageUrls(existing.resultImageUrls);
    logGenerationEvent("generation_request_deduped", {
      ...logContext,
      sourceFunction: "reuseExistingGenerationRequestIfAvailable",
      predictionId: existing.predictionId,
      deduped: true,
      dedupeSource: "database_completed",
    });
    return imageUrls;
  }

  if (existing.status === "failed") {
    const message = getStoredGenerationError(existing);
    logGenerationEvent("generation_request_deduped", {
      ...logContext,
      sourceFunction: "reuseExistingGenerationRequestIfAvailable",
      predictionId: existing.predictionId,
      deduped: true,
      dedupeSource: "database_failed",
      error: message,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message,
    });
  }

  logGenerationEvent("generation_request_deduped", {
    ...logContext,
    sourceFunction: "reuseExistingGenerationRequestIfAvailable",
    predictionId: existing.predictionId,
    deduped: true,
    dedupeSource: "database_inflight",
  });
  return waitForGenerationRequestResult(prisma, logContext);
}

async function executeIdempotentGenerationRequest(
  params: ExecuteGenerationRequestParams,
  factory: (helpers: {
    updatePredictionId: (predictionId: string) => Promise<void>;
  }) => Promise<ExecuteGenerationResult>,
) {
  const logContext: GenerationLogContext = {
    generationRequestId: params.generationRequestId,
    userId: params.userId,
    sourcePage: params.sourcePage,
    requestType: params.requestType,
    model: params.model,
    promptHash: params.promptHash,
    inputHash: params.inputHash,
  };

  return getOrCreateGenerationRequestPromise(
    params.generationRequestId,
    async () => {
      const existingResult = await reuseExistingGenerationRequestIfAvailable(
        params.prisma,
        logContext,
      );
      if (existingResult) {
        return existingResult;
      }

      try {
        await params.prisma.generationRequest.create({
          data: {
            generationRequestId: params.generationRequestId,
            userId: params.userId,
            sourcePage: params.sourcePage,
            requestType: params.requestType,
            model: params.model,
            promptHash: params.promptHash,
            inputHash: params.inputHash,
            creditsCharged: params.creditsCharged ?? undefined,
          },
        });
        logGenerationEvent("generation_request_created", {
          ...logContext,
          sourceFunction: "executeIdempotentGenerationRequest",
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          logGenerationEvent("generation_request_deduped", {
            ...logContext,
            sourceFunction: "executeIdempotentGenerationRequest",
            deduped: true,
            dedupeSource: "database_race",
          });
          return waitForGenerationRequestResult(params.prisma, logContext);
        }
        throw error;
      }

      const updatePredictionId = async (predictionId: string) => {
        await params.prisma.generationRequest.update({
          where: { generationRequestId: params.generationRequestId },
          data: { predictionId },
        });
      };

      try {
        const result = await factory({ updatePredictionId });
        const predictionId = result.predictionId ?? null;

        await params.prisma.generationRequest.update({
          where: { generationRequestId: params.generationRequestId },
          data: {
            status: "completed",
            predictionId: predictionId ?? undefined,
            resultImageUrls: result.imageUrls,
            errorMessage: null,
            completedAt: new Date(),
            failedAt: null,
          },
        });

        logGenerationEvent("generation_request_completed", {
          ...logContext,
          sourceFunction: "executeIdempotentGenerationRequest",
          predictionId,
        });

        return result.imageUrls;
      } catch (error) {
        const message =
          error instanceof TRPCError
            ? error.message
            : normalizeGenerationErrorMessage(error);

        try {
          await params.prisma.generationRequest.update({
            where: { generationRequestId: params.generationRequestId },
            data: {
              status: "failed",
              errorMessage: message,
              failedAt: new Date(),
            },
          });
        } catch (updateError) {
          console.error("Failed to mark generation request as failed:", updateError);
        }

        logGenerationEvent("generation_request_failed", {
          ...logContext,
          sourceFunction: "executeIdempotentGenerationRequest",
          error: message,
        });

        throw error;
      }
    },
  );
}

function getGuestGenerationRequestKey(params: {
  sourcePage?: string;
  ip: string;
  name: string;
  style: string;
  recipient: string;
}) {
  return [
    (params.sourcePage ?? "ramadan-mug-v2").trim().toLowerCase(),
    params.ip.trim().toLowerCase(),
    params.name.trim().toLowerCase(),
    params.style.trim().toLowerCase(),
    params.recipient.trim().toLowerCase(),
  ].join(":");
}

function getOrCreateGuestGenerationPromise(
  key: string,
  factory: () => Promise<string>,
): Promise<string> {
  const now = Date.now();
  const existing = guestGenerationInFlightMap.get(key);
  if (existing && existing.expiresAt > now) {
    return existing.promise;
  }

  const promise = factory().finally(() => {
    const current = guestGenerationInFlightMap.get(key);
    if (current?.promise === promise) {
      guestGenerationInFlightMap.delete(key);
    }
  });

  guestGenerationInFlightMap.set(key, {
    promise,
    expiresAt: now + GUEST_GENERATION_DEDUP_TTL_MS,
  });

  return promise;
}

function isPngOutputModel(model: string) {
  return (
    model === "ideogram-ai/ideogram-v2-turbo" ||
    model === "google/nano-banana-pro" ||
    model === "google/nano-banana-2"
  );
}

function isSingleOutputModel(model: string) {
  return (
    model === "ideogram-ai/ideogram-v2-turbo" ||
    model === "google/nano-banana-pro" ||
    model === "google/nano-banana-2"
  );
}

async function runNanoBananaPrediction(
  model: "google/nano-banana-pro" | "google/nano-banana-2",
  input: Record<string, any>,
  context?: {
    logContext?: GenerationLogContext;
    onPredictionCreated?: (predictionId: string) => Promise<void> | void;
  },
) {
  const prediction = await replicate.predictions.create({
    model,
    input,
  });

  if (context?.logContext) {
    logGenerationEvent("replicate_prediction_created", {
      ...context.logContext,
      sourceFunction: "runNanoBananaPrediction",
      predictionId: prediction.id,
    });
  }

  await context?.onPredictionCreated?.(prediction.id);

  try {
    const completedPrediction = await withTimeout(
      replicate.wait(prediction, { interval: 1000 }),
      NANO_BANANA_ATTEMPT_TIMEOUT_MS,
      "Generation timed out while waiting for Nano Banana",
    );

    return {
      output: completedPrediction.output,
      predictionId: prediction.id,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Generation timed out while waiting for Nano Banana")
    ) {
      if (context?.logContext) {
        logGenerationEvent("replicate_prediction_cancel_requested", {
          ...context.logContext,
          sourceFunction: "runNanoBananaPrediction",
          predictionId: prediction.id,
          error: error.message,
        });
      }
      try {
        await replicate.predictions.cancel(prediction.id);
      } catch (cancelError) {
        console.warn(
          `[NANO_BANANA_CANCEL_FAILED] ${prediction.id}`,
          cancelError instanceof Error ? cancelError.message : cancelError,
        );
      }
    }

    throw error;
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
const generateImages = async (
  prompt: string,
  numberOfImages = 1,
  aspectRatio: AspectRatioValue = "1:1",
  model:
    | "flux-schnell"
    | "flux-dev"
    | "ideogram-ai/ideogram-v2-turbo"
    | "google/nano-banana-pro"
    | "google/nano-banana-2",
  context?: {
    logContext?: GenerationLogContext;
    onPredictionCreated?: (predictionId: string) => Promise<void> | void;
  },
): Promise<GenerateImagesResult> => {
  let path: `${string}/${string}`;
  let input: Record<string, any>;
  let outputs: string[] = [];
  let predictionId: string | null = null;

  // --- 1. CONFIGURATION ---
  if (model === "google/nano-banana-pro" || model === "google/nano-banana-2") {
    path = model;
    input = {
      prompt,
      aspect_ratio: aspectRatio,
      output_format: "png",
      resolution: model === "google/nano-banana-2" ? "1K" : "2K",
      safety_filter_level: "block_only_high",
    };
  } else if (model === "flux-schnell") {
    path = "black-forest-labs/flux-schnell";
    input = {
      prompt,
      go_fast: false,
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
      go_fast: false,
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
    return {
      imagesBase64: Array(numberOfImages).fill(b64Image) as string[],
      predictionId: null,
    };
  }

  // --- 2. EXECUTION ---
  console.log(`Calling Replicate model: ${model}`);
  let rawOutput: unknown;
  try {
    if (model === "google/nano-banana-pro" || model === "google/nano-banana-2") {
      const nanoBananaResult = await runNanoBananaPrediction(model, input, context);
      rawOutput = nanoBananaResult.output;
      predictionId = nanoBananaResult.predictionId;
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

  return {
    imagesBase64: outputs,
    predictionId,
  };
};

export const generateRouter = createTRPCRouter({
  generateGuestDesign: publicProcedure
    .input(
      z.object({
        generationRequestId: z.string().trim().min(1).max(120),
        name: z.string().trim().min(2).max(40),
        style: z.string().trim().min(1),
        recipient: z
          .enum([
            "My Husband",
            "My Wife",
            "My Father",
            "My Mother",
            "Someone Special",
          ])
          .default("Someone Special"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const styleConfig = RAMADAN_MUG_V2_STYLES.find((s) => s.id === input.style);
      if (!styleConfig) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid style selected.",
        });
      }

      const clientIp = getClientIp(ctx.req);
      const rateLimitKey = `ramadan-mug-v2:${clientIp}`;
      enforceGuestGenerationRateLimit(rateLimitKey);

      const requestKey = getGuestGenerationRequestKey({
        ip: clientIp,
        name: input.name,
        style: input.style,
        recipient: input.recipient,
      });

      const designUrl = await getOrCreateGuestGenerationPromise(
        requestKey,
        async () => {
          const prompt = buildRamadanMugV2Prompt({
            name: input.name,
            recipient: input.recipient,
            stylePrompt: styleConfig.basePrompt,
          });
          const promptHash = hashValue(prompt);
          const inputHash = hashValue(
            JSON.stringify({
              aspectRatio: "1:1",
              model: "google/nano-banana-pro",
              name: input.name,
              recipient: input.recipient,
              sourcePage: "ramadan-mug-v2",
              style: input.style,
            }),
          );
          const logContext: GenerationLogContext = {
            generationRequestId: input.generationRequestId,
            userId: null,
            sourcePage: "ramadan-mug-v2",
            requestType: "generateGuestDesign",
            model: "google/nano-banana-pro",
            promptHash,
            inputHash,
          };

          const imageUrls = await executeIdempotentGenerationRequest(
            {
              prisma: ctx.prisma,
              ...logContext,
            },
            async ({ updatePredictionId }) => {
              const generated = await generateImages(
                prompt,
                1,
                "1:1",
                "google/nano-banana-pro",
                {
                  logContext,
                  onPredictionCreated: updatePredictionId,
                },
              );
              const firstImage = generated.imagesBase64[0];
              if (!firstImage) {
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "No generated image returned by provider.",
                });
              }

              const icon = await ctx.prisma.icon.create({
                data: {
                  prompt,
                  userId: null,
                  metadata: {
                    sourcePage: "ramadan-mug-v2",
                    paidTrafficUser: true,
                    styleId: styleConfig.id,
                  },
                },
              });

              await s3
                .putObject({
                  Bucket: BUCKET_NAME,
                  Body: Buffer.from(firstImage, "base64"),
                  Key: icon.id,
                  ContentEncoding: "base64",
                  ContentType: "image/png",
                })
                .promise();

              return {
                imageUrls: [
                  `https://${BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${icon.id}`,
                ],
                predictionId: generated.predictionId,
              };
            },
          );

          const firstImageUrl = imageUrls[0];
          if (!firstImageUrl) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "No generated image URL was stored.",
            });
          }

          return firstImageUrl;
        },
      );

      return {
        design_url: designUrl,
      };
    }),
  generatePaidMugGuestDesign: publicProcedure
    .input(
      z.object({
        generationRequestId: z.string().trim().min(1).max(120),
        name: z.string().trim().min(2).max(40),
        style: z.string().trim().min(1),
        giftIntent: z
          .enum(["Me", "My Husband", "My Wife", "My Mom", "Someone Special"])
          .default("Someone Special"),
        sourcePage: z.literal("arabic-name-mug-v1").default("arabic-name-mug-v1"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const styleConfig = ARABIC_NAME_MUG_V1_STYLES.find((s) => s.id === input.style);
      if (!styleConfig) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid style selected.",
        });
      }

      const clientIp = getClientIp(ctx.req);
      const rateLimitKey = `${input.sourcePage}:${clientIp}`;
      enforceGuestGenerationRateLimit(rateLimitKey);

      const requestKey = getGuestGenerationRequestKey({
        sourcePage: input.sourcePage,
        ip: clientIp,
        name: input.name,
        style: input.style,
        recipient: input.giftIntent,
      });

      const designUrl = await getOrCreateGuestGenerationPromise(
        requestKey,
        async () => {
          const prompt = buildArabicNameMugPrompt({
            name: input.name,
            giftIntent: input.giftIntent,
            stylePrompt: styleConfig.basePrompt,
          });
          const promptHash = hashValue(prompt);
          const inputHash = hashValue(
            JSON.stringify({
              aspectRatio: "1:1",
              giftIntent: input.giftIntent,
              model: "google/nano-banana-pro",
              name: input.name,
              sourcePage: input.sourcePage,
              style: input.style,
            }),
          );
          const logContext: GenerationLogContext = {
            generationRequestId: input.generationRequestId,
            userId: null,
            sourcePage: input.sourcePage,
            requestType: "generatePaidMugGuestDesign",
            model: "google/nano-banana-pro",
            promptHash,
            inputHash,
          };

          const imageUrls = await executeIdempotentGenerationRequest(
            {
              prisma: ctx.prisma,
              ...logContext,
            },
            async ({ updatePredictionId }) => {
              const generated = await generateImages(
                prompt,
                1,
                "1:1",
                "google/nano-banana-pro",
                {
                  logContext,
                  onPredictionCreated: updatePredictionId,
                },
              );
              const firstImage = generated.imagesBase64[0];
              if (!firstImage) {
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "No generated image returned by provider.",
                });
              }

              const icon = await ctx.prisma.icon.create({
                data: {
                  prompt,
                  userId: null,
                  metadata: {
                    sourcePage: input.sourcePage,
                    paidTrafficUser: true,
                    styleId: styleConfig.id,
                    giftIntent: input.giftIntent,
                  },
                },
              });

              await s3
                .putObject({
                  Bucket: BUCKET_NAME,
                  Body: Buffer.from(firstImage, "base64"),
                  Key: icon.id,
                  ContentEncoding: "base64",
                  ContentType: "image/png",
                })
                .promise();

              return {
                imageUrls: [
                  `https://${BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${icon.id}`,
                ],
                predictionId: generated.predictionId,
              };
            },
          );

          const firstImageUrl = imageUrls[0];
          if (!firstImageUrl) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "No generated image URL was stored.",
            });
          }

          return firstImageUrl;
        },
      );

      return {
        design_url: designUrl,
      };
    }),
  generateIcon: publicProcedure
    .input(
      z.object({
        generationRequestId: z.string().trim().min(1).max(120),
        prompt: z.string(),
        numberOfImages: z.number().min(1).max(10),
        aspectRatio: z.enum(ASPECT_RATIO_VALUES).default("1:1"),
        model: z.enum([
          "flux-schnell",
          "flux-dev",
          "ideogram-ai/ideogram-v2-turbo",
          "google/nano-banana-pro",
          "google/nano-banana-2",
        ]),
        metadata: z
          .object({
            category: z.string().optional(),
            subcategory: z.string().optional(),
            communityAlt: z.string().optional(),
            communityTitle: z.string().optional(),
          })
          .optional(),
        paidTrafficUser: z.boolean().optional(),
        sourcePage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const sourcePage = (input.sourcePage ?? "").trim().toLowerCase();
      const isArabicGeneratorRequest = isArabicGeneratorSourcePage(sourcePage);
      const arabicTier = getArabicTierByModel(input.model);
      const isRamadanGuestSource =
        sourcePage === "ramadan-mug" || sourcePage === "ramadan-mug-men";
      const isEligibleGuestGeneration = !userId && input.paidTrafficUser && isRamadanGuestSource;

      if (!userId && !isEligibleGuestGeneration) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Sign in is required for this generator.",
        });
      }

      if (isArabicGeneratorRequest && !arabicTier) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid Arabic model selected.",
        });
      }

      if (!isArabicGeneratorRequest && input.model === "google/nano-banana-2") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This model is only available for Arabic generation.",
        });
      }

      const defaultModelConfig = {
        "flux-schnell": { credits: 1 },
        "flux-dev": { credits: 3 },
        "ideogram-ai/ideogram-v2-turbo": { credits: 5 },
        "google/nano-banana-pro": { credits: 4 },
        "google/nano-banana-2": { credits: 3 },
      } as const;

      const modelConfig =
        isArabicGeneratorRequest && arabicTier
          ? { credits: arabicTier.credits }
          : defaultModelConfig[input.model];

      if (!modelConfig) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid model selected",
        });
      }

      const effectiveNumberOfImages = isSingleOutputModel(input.model)
        ? 1
        : input.numberOfImages;
      const promptHash = hashValue(input.prompt);
      const inputHash = hashValue(
        JSON.stringify({
          aspectRatio: input.aspectRatio,
          metadata: {
            category: input.metadata?.category ?? null,
            subcategory: input.metadata?.subcategory ?? null,
            communityAlt: input.metadata?.communityAlt ?? null,
            communityTitle: input.metadata?.communityTitle ?? null,
          },
          model: input.model,
          numberOfImages: effectiveNumberOfImages,
          paidTrafficUser: Boolean(input.paidTrafficUser),
          prompt: input.prompt,
          sourcePage: input.sourcePage ?? null,
          userId: userId ?? null,
        }),
      );
      const logContext: GenerationLogContext = {
        generationRequestId: input.generationRequestId,
        userId: userId ?? null,
        sourcePage: input.sourcePage ?? null,
        requestType: "generateIcon",
        model: input.model,
        promptHash,
        inputHash,
      };

      if (isEligibleGuestGeneration) {
        if (input.model !== "google/nano-banana-pro" || input.numberOfImages !== 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This offer supports one Nano Banana generation per request.",
          });
        }
        const imageUrls = await executeIdempotentGenerationRequest(
          {
            prisma: ctx.prisma,
            ...logContext,
          },
          async ({ updatePredictionId }) => {
            try {
              const generated = await generateImages(
                input.prompt,
                1,
                input.aspectRatio,
                input.model,
                {
                  logContext,
                  onPredictionCreated: updatePredictionId,
                },
              );

              const createdIcons = await Promise.all(
                generated.imagesBase64.map(async (image: string) => {
                  const icon = await ctx.prisma.icon.create({
                    data: {
                      prompt: input.prompt,
                      userId: null,
                      metadata: {
                        aspectRatio: input.aspectRatio ?? null,
                        model: input.model,
                        category: input.metadata?.category ?? null,
                        subcategory: input.metadata?.subcategory ?? null,
                        communityAlt: input.metadata?.communityAlt ?? null,
                        communityTitle: input.metadata?.communityTitle ?? null,
                        sourcePage: input.sourcePage ?? null,
                        paidTrafficUser: true,
                      },
                    },
                  });

                  await s3
                    .putObject({
                      Bucket: BUCKET_NAME,
                      Body: Buffer.from(image, "base64"),
                      Key: icon.id,
                      ContentEncoding: "base64",
                      ContentType: isPngOutputModel(input.model) ? "image/png" : "image/webp",
                    })
                    .promise();

                  return `https://${BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${icon.id}`;
                }),
              );

              return {
                imageUrls: createdIcons,
                predictionId: generated.predictionId,
              };
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
          },
        );

        return imageUrls.map((imageUrl) => ({
          imageUrl,
        }));
      }
      const authedUserId = userId as string;

      // Calculate total credits needed (Decimal-safe)
      const creditsPerImage = new Prisma.Decimal(modelConfig.credits);
      const imageCount = new Prisma.Decimal(effectiveNumberOfImages);
      const totalCredits = creditsPerImage.times(imageCount);
      const imageUrls = await executeIdempotentGenerationRequest(
        {
          prisma: ctx.prisma,
          ...logContext,
          creditsCharged: totalCredits,
        },
        async ({ updatePredictionId }) => {
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
            const generated = await generateImages(
              input.prompt,
              effectiveNumberOfImages,
              input.aspectRatio,
              input.model,
              {
                logContext,
                onPredictionCreated: updatePredictionId,
              },
            );

            // Store images in DB & upload to S3
            const createdIcons = await Promise.all(
              generated.imagesBase64.map(async (image: string) => {
                const icon = await ctx.prisma.icon.create({
                  data: {
                    prompt: input.prompt,
                    userId: authedUserId,
                    metadata: {
                      aspectRatio: input.aspectRatio ?? null,
                      model: input.model,
                      category: input.metadata?.category ?? null,
                      subcategory: input.metadata?.subcategory ?? null,
                      communityAlt: input.metadata?.communityAlt ?? null,
                      communityTitle: input.metadata?.communityTitle ?? null,
                      sourcePage: input.sourcePage ?? null,
                    },
                  },
                });

                try {
                  await s3
                    .putObject({
                      Bucket: BUCKET_NAME,
                      Body: Buffer.from(image, "base64"),
                      Key: icon.id,
                      ContentEncoding: "base64",
                      ContentType: isPngOutputModel(input.model) ? "image/png" : "image/webp",
                    })
                    .promise();
                } catch (s3Error) {
                  console.error("S3 Upload Error:", s3Error);
                  throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to upload image to S3",
                  });
                }

                return `https://${BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${icon.id}`;
              }),
            );

            const digitalArtInterest = getDigitalArtInterestFromSourcePage(
              input.sourcePage,
            );
            if (digitalArtInterest) {
              try {
                await recordDigitalArtInterest({
                  prisma: ctx.prisma,
                  userId: authedUserId,
                  interest: digitalArtInterest,
                });
              } catch (interestError) {
                console.error("Digital art interest update failed:", interestError);
              }
            }

            return {
              imageUrls: createdIcons,
              predictionId: generated.predictionId,
            };
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
        },
      );

      return imageUrls.map((imageUrl) => ({
        imageUrl,
      }));
    }),
});
