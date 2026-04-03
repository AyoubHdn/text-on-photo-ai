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
import {
  getCoupleNameMugV1Style,
  type CoupleNameMugMode,
  type CoupleNameMugStyleId,
} from "~/config/coupleNameMugV1Style";
import { RAMADAN_MUG_V2_STYLES } from "~/config/ramadanMugV2Styles";
import {
  getArabicTierByModel,
  isArabicGeneratorSourcePage,
} from "~/config/arabicGenerator";
import { buildArabicNameMugPrompt } from "~/lib/arabicNameMugPrompt";
import { buildCoupleNameMugWrapPrompt } from "~/lib/coupleNameMugPrompt";
import {
  getDigitalArtInterestFromSourcePage,
  recordDigitalArtInterest,
} from "~/server/mautic/digitalArtInterest";
import { buildRamadanMugV2Prompt } from "~/server/prompts/ramadanMugV2Prompt";
import { createHash, randomUUID } from "crypto";
import { extractCoupleMugSidePreviews } from "~/server/image/extractCoupleMugSidePreviews";
import { MUG_PRINT_CONFIG } from "~/server/printful/printAreas";
import sharp from "sharp";

const s3 = new AWS.S3({
  credentials: {
    accessKeyId: env.ACCESS_KEY_ID,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
  region: env.NEXT_PUBLIC_S3_REGION,
});

const BUCKET_NAME = env.NEXT_PUBLIC_S3_BUCKET_NAME;
const TRUSTED_S3_HOST = `${BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com`;

const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

const ASPECT_RATIO_VALUES = ["1:1", "4:5", "3:2", "16:9", "21:9"] as const;
type AspectRatioValue = (typeof ASPECT_RATIO_VALUES)[number];
type GenerationAspectRatio = AspectRatioValue | "match_input_image";
type GenerationCustomSize = { width: number; height: number };
const FLUX_2_PRO_MAX_WIDTH = 1440;
const FLUX_2_DEV_MAX_WIDTH = 1440;
const FLUX_2_KLEIN_SUPPORTED_ASPECT_RATIOS = [
  "1:1",
  "16:9",
  "9:16",
  "3:2",
  "2:3",
  "4:3",
  "3:4",
  "5:4",
  "4:5",
  "21:9",
  "9:21",
  "match_input_image",
] as const;

const FRIENDLY_GENERATION_BUSY_MESSAGE =
  "Generation is temporarily busy at our AI provider due to high demand. Please try again shortly. If generation fails, your credits are refunded automatically.";
const DEFAULT_GENERATION_TIMEOUT_MS = 120000;
const NANO_BANANA_ATTEMPT_TIMEOUT_BY_MODEL_MS = {
  "google/nano-banana": DEFAULT_GENERATION_TIMEOUT_MS,
  "google/nano-banana-pro": 180000,
  "google/nano-banana-2": DEFAULT_GENERATION_TIMEOUT_MS,
} as const;
const NANO_BANANA_MAX_ATTEMPT_TIMEOUT_MS = Math.max(
  ...Object.values(NANO_BANANA_ATTEMPT_TIMEOUT_BY_MODEL_MS),
);
const NANO_BANANA_TIMEOUT_MESSAGE_PREFIX =
  "Generation timed out while waiting for ";
const GENERATION_REQUEST_WAIT_TIMEOUT_MS =
  Math.max(DEFAULT_GENERATION_TIMEOUT_MS, NANO_BANANA_MAX_ATTEMPT_TIMEOUT_MS) +
  10000;
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

function isTrustedAssetUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === TRUSTED_S3_HOST;
  } catch {
    return false;
  }
}

function getS3PublicUrl(key: string) {
  return `https://${BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${key}`;
}

async function uploadS3Buffer(params: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  await s3
    .putObject({
      Bucket: BUCKET_NAME,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
    .promise();

  return getS3PublicUrl(params.key);
}

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
    lower.includes("canceled") ||
    lower.includes("cancelled") ||
    lower.includes("aborted") ||
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
    model === "black-forest-labs/flux-2-pro" ||
    model === "black-forest-labs/flux-2-dev" ||
    model === "black-forest-labs/flux-2-klein-9b" ||
    model === "black-forest-labs/flux-kontext-pro" ||
    model === "google/nano-banana" ||
    model === "google/nano-banana-pro" ||
    model === "google/nano-banana-2"
  );
}

function isSingleOutputModel(model: string) {
  return (
    model === "ideogram-ai/ideogram-v2-turbo" ||
    model === "black-forest-labs/flux-2-pro" ||
    model === "black-forest-labs/flux-2-dev" ||
    model === "black-forest-labs/flux-2-klein-9b" ||
    model === "black-forest-labs/flux-kontext-pro" ||
    model === "google/nano-banana" ||
    model === "google/nano-banana-pro" ||
    model === "google/nano-banana-2"
  );
}

function clampCustomSizeToMaxWidth(
  size: GenerationCustomSize,
  maxWidth: number,
): GenerationCustomSize {
  if (size.width <= maxWidth) {
    return size;
  }

  const scale = maxWidth / size.width;
  return {
    width: maxWidth,
    height: Math.max(1, Math.round(size.height * scale)),
  };
}

async function prepareFlux2ProReferenceImage(params: {
  sourceUrl: string;
  generationRequestId: string;
  slot: "her" | "his";
}) {
  const response = await fetch(params.sourceUrl);
  if (!response.ok) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to fetch reference image from ${params.sourceUrl}`,
    });
  }

  const sourceBuffer = await response.buffer();
  const processedBuffer = await sharp(sourceBuffer)
    .rotate()
    .resize({
      width: 1280,
      height: 1280,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({
      quality: 86,
      mozjpeg: true,
    })
    .toBuffer();

  const key = `reference-images/couple-mug/flux-2-pro/${params.generationRequestId}_${params.slot}_${randomUUID()}.jpg`;

  return uploadS3Buffer({
    key,
    body: processedBuffer,
    contentType: "image/jpeg",
  });
}

function pickClosestAspectRatioForKlein(size: GenerationCustomSize) {
  const targetRatio = size.width / Math.max(size.height, 1);
  const candidates = FLUX_2_KLEIN_SUPPORTED_ASPECT_RATIOS.filter(
    (value) => value !== "match_input_image",
  );

  let best = candidates[0] ?? "21:9";
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const [width, height] = candidate.split(":").map(Number);
    if (!width || !height) continue;
    const ratio = width / height;
    const distance = Math.abs(ratio - targetRatio);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return best;
}

async function runNanoBananaPrediction(
  model: "google/nano-banana" | "google/nano-banana-pro" | "google/nano-banana-2",
  input: Record<string, any>,
  context?: {
    logContext?: GenerationLogContext;
    onPredictionCreated?: (predictionId: string) => Promise<void> | void;
  },
) {
  const timeoutMs = NANO_BANANA_ATTEMPT_TIMEOUT_BY_MODEL_MS[model];
  const timeoutMessage = `${NANO_BANANA_TIMEOUT_MESSAGE_PREFIX}${model}`;
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
      timeoutMs,
      timeoutMessage,
    );

    return {
      output: completedPrediction.output,
      predictionId: prediction.id,
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith(NANO_BANANA_TIMEOUT_MESSAGE_PREFIX)) {
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
  aspectRatio: GenerationAspectRatio = "1:1",
  model:
    | "flux-schnell"
    | "flux-dev"
    | "black-forest-labs/flux-2-pro"
    | "black-forest-labs/flux-2-dev"
    | "black-forest-labs/flux-2-klein-9b"
    | "black-forest-labs/flux-kontext-pro"
    | "ideogram-ai/ideogram-v2-turbo"
    | "google/nano-banana"
    | "google/nano-banana-pro"
    | "google/nano-banana-2",
  options?: {
    inputImageUrls?: string[];
    customSize?: GenerationCustomSize;
  },
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
  if (
    model === "google/nano-banana" ||
    model === "google/nano-banana-pro" ||
    model === "google/nano-banana-2"
  ) {
    path = model;
    input = {
      prompt,
      aspect_ratio: aspectRatio,
      output_format: "png",
    };
    if (model === "google/nano-banana-pro") {
      input.safety_filter_level = "block_only_high";
    }
    if (model === "google/nano-banana-pro") {
      input.resolution = "2K";
      input.allow_fallback_model = true;
    }
    if (model === "google/nano-banana-2") {
      input.resolution = "1K";
    }
    if (options?.inputImageUrls?.length) {
      input.image_input = options.inputImageUrls;
    }
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
    if (options?.inputImageUrls?.[0]) {
      input.image = options.inputImageUrls[0];
      input.prompt_strength = 0.82;
    }
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
    if (options?.inputImageUrls?.[0]) {
      input.image = options.inputImageUrls[0];
      input.prompt_strength = 0.82;
    }
  } else if (model === "black-forest-labs/flux-kontext-pro") {
    path = "black-forest-labs/flux-kontext-pro";
    input = {
      prompt,
      output_format: "png",
      prompt_upsampling: true,
      safety_tolerance: 2,
      aspect_ratio: options?.inputImageUrls?.[0] ? "match_input_image" : aspectRatio,
    };
    if (options?.inputImageUrls?.[0]) {
      input.input_image = options.inputImageUrls[0];
    }
    if (numberOfImages > 1) numberOfImages = 1;
  } else if (model === "black-forest-labs/flux-2-pro") {
    path = model;
    input = {
      prompt,
      output_format: "png",
      prompt_upsampling: false,
      safety_tolerance: 2,
    };
    if (options?.customSize) {
      const scaledCustomSize = clampCustomSizeToMaxWidth(
        options.customSize,
        FLUX_2_PRO_MAX_WIDTH,
      );
      input.aspect_ratio = "custom";
      input.width = scaledCustomSize.width;
      input.height = scaledCustomSize.height;
    } else {
      input.aspect_ratio = aspectRatio;
    }
    if (options?.inputImageUrls?.length) {
      input.input_images = options.inputImageUrls;
    }
    if (numberOfImages > 1) numberOfImages = 1;
  } else if (model === "black-forest-labs/flux-2-dev") {
    path = model;
    input = {
      prompt,
      output_format: "png",
      prompt_upsampling: false,
      safety_tolerance: 2,
    };
    if (options?.customSize) {
      const scaledCustomSize = clampCustomSizeToMaxWidth(
        options.customSize,
        FLUX_2_DEV_MAX_WIDTH,
      );
      input.aspect_ratio = "custom";
      input.width = scaledCustomSize.width;
      input.height = scaledCustomSize.height;
    } else {
      input.aspect_ratio = aspectRatio;
    }
    if (options?.inputImageUrls?.length) {
      input.input_images = options.inputImageUrls;
    }
    if (numberOfImages > 1) numberOfImages = 1;
  } else if (model === "black-forest-labs/flux-2-klein-9b") {
    path = model;
    input = {
      prompt,
      output_format: "png",
      prompt_upsampling: false,
      safety_tolerance: 2,
    };
    if (options?.customSize) {
      input.aspect_ratio = pickClosestAspectRatioForKlein(options.customSize);
    } else {
      input.aspect_ratio = aspectRatio;
    }
    if (options?.inputImageUrls?.length) {
      input.input_images = options.inputImageUrls;
    }
    if (numberOfImages > 1) numberOfImages = 1;
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
    if (
      model === "google/nano-banana" ||
      model === "google/nano-banana-pro" ||
      model === "google/nano-banana-2"
    ) {
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

async function storeGeneratedAsset(params: {
  prisma: PrismaClient;
  prompt: string;
  userId: string | null;
  metadata: Record<string, unknown>;
  buffer: Buffer;
  contentType: string;
}) {
  const normalizedBuffer =
    params.contentType === "image/png"
      ? await sharp(params.buffer)
          .png({ quality: 100 })
          .withMetadata({ density: 300 })
          .toBuffer()
      : params.buffer;

  const icon = await params.prisma.icon.create({
    data: {
      prompt: params.prompt,
      userId: params.userId ?? undefined,
      isPublic: false,
      metadata: params.metadata as Prisma.InputJsonValue,
    },
  });

  await s3
    .putObject({
      Bucket: BUCKET_NAME,
      Body: normalizedBuffer,
      Key: icon.id,
      ContentType: params.contentType,
    })
    .promise();

  return getS3PublicUrl(icon.id);
}

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
                undefined,
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
                undefined,
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
  generateCoupleNameMugDesign: publicProcedure
    .input(
      z.object({
        generationRequestId: z.string().trim().min(1).max(120),
        herName: z.string().trim().min(2).max(40),
        hisName: z.string().trim().min(2).max(40),
        centerText: z.string().trim().max(50).optional(),
        mode: z.enum(["names_only", "avatar_name"]),
        style: z.string().trim().min(1),
        herPhotoUrl: z.string().url().optional(),
        hisPhotoUrl: z.string().url().optional(),
        sourcePage: z
          .enum([
            "couple-name-mug-v1",
            "couple-avatar-name-mug-v1",
            "couple-names-only-mug-v1",
          ])
          .default("couple-name-mug-v1"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.mode === "avatar_name" && (!input.herPhotoUrl || !input.hisPhotoUrl)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Both photos are required for the avatar version.",
        });
      }

      const userId = ctx.session?.user?.id ?? null;
      const clientIp = getClientIp(ctx.req);
      if (!userId) {
        enforceGuestGenerationRateLimit(`${input.sourcePage}:${clientIp}`);
      }

      const styleConfig = getCoupleNameMugV1Style(input.style as CoupleNameMugStyleId);
      if (styleConfig.id !== input.style) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid style selected.",
        });
      }

      const wrapPrompt = buildCoupleNameMugWrapPrompt({
        mode: input.mode,
        styleId: styleConfig.id,
        herName: input.herName,
        hisName: input.hisName,
        centerText: input.centerText,
      });
      const promptHash = hashValue(wrapPrompt);
      const inputHash = hashValue(
        JSON.stringify({
          herName: input.herName,
          hisName: input.hisName,
          centerText: input.centerText ?? null,
          style: input.style,
          herPhotoUrl: input.herPhotoUrl ?? null,
          hisPhotoUrl: input.hisPhotoUrl ?? null,
          mode: input.mode,
          model: "black-forest-labs/flux-2-pro",
          sourcePage: input.sourcePage,
          userId,
        }),
      );
      const logContext: GenerationLogContext = {
        generationRequestId: input.generationRequestId,
        userId,
        sourcePage: input.sourcePage,
        requestType: "generateCoupleNameMugDesign",
        model: "black-forest-labs/flux-2-pro",
        promptHash,
        inputHash,
      };

      const totalCredits = new Prisma.Decimal(9);

      const imageUrls = await executeIdempotentGenerationRequest(
        {
          prisma: ctx.prisma,
          ...logContext,
          creditsCharged: userId ? totalCredits : undefined,
        },
        async ({ updatePredictionId }) => {
          let updatedUser:
            | { credits: Prisma.Decimal; email: string | null; name: string | null }
            | null = null;

          if (userId) {
            updatedUser = await ctx.prisma.$transaction(async (tx) => {
              const existingUser = await tx.user.findUnique({
                where: { id: userId },
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

              return tx.user.update({
                where: { id: userId },
                data: {
                  credits: creditsDecimal.minus(totalCredits),
                  hasGeneratedDesign: true,
                },
                select: { credits: true, email: true, name: true },
              });
            });

            if (updatedUser?.email) {
              try {
                await updateMauticContact(
                  {
                    email: updatedUser.email,
                    name: updatedUser.name,
                    brand_specific_credits: updatedUser.credits,
                    customFields: {
                      has_generated_design: 1,
                    },
                  },
                  "namedesignai",
                );
              } catch (err) {
                console.error("Error updating Mautic after couple mug credit deduction:", err);
              }
            }
          }

          try {
            const mugConfig = MUG_PRINT_CONFIG[1320];
            if (!mugConfig) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Mug print configuration not found.",
              });
            }

            const referenceImageUrls =
              input.mode === "avatar_name"
                ? [input.herPhotoUrl as string, input.hisPhotoUrl as string]
                : [];

            if (
              referenceImageUrls.some((imageUrl) => !isTrustedAssetUrl(imageUrl))
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Uploaded photos must use a trusted image URL.",
              });
            }

            const preparedReferenceImageUrls =
              input.mode === "avatar_name"
                ? await Promise.all([
                    prepareFlux2ProReferenceImage({
                      sourceUrl: input.herPhotoUrl as string,
                      generationRequestId: input.generationRequestId,
                      slot: "her",
                    }),
                    prepareFlux2ProReferenceImage({
                      sourceUrl: input.hisPhotoUrl as string,
                      generationRequestId: input.generationRequestId,
                      slot: "his",
                    }),
                  ])
                : [];

            const generatedWrap = await generateImages(
              wrapPrompt,
              1,
              "1:1",
              "black-forest-labs/flux-2-pro",
              {
                inputImageUrls: preparedReferenceImageUrls,
                customSize: {
                  width: 1440,
                  height: 576,
                },
              },
              {
                logContext,
                onPredictionCreated: updatePredictionId,
              },
            );
            const wrapBaseImage = generatedWrap.imagesBase64[0];
            if (!wrapBaseImage) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "No generated image returned by provider.",
              });
            }

            const wrapBuffer = await sharp(Buffer.from(wrapBaseImage, "base64"))
              .resize({
                width: mugConfig.areaWidth,
                height: mugConfig.areaHeight,
                fit: "fill",
              })
              .png({ quality: 100 })
              .withMetadata({ density: 300 })
              .toBuffer();

            const { herSideBuffer, hisSideBuffer } =
              await extractCoupleMugSidePreviews({
                wrapBuffer,
              });

            const herSideUrl = await storeGeneratedAsset({
              prisma: ctx.prisma,
              prompt: wrapPrompt,
              userId,
              metadata: {
                kind: "couple_mug_side",
                sourcePage: input.sourcePage,
                paidTrafficUser: true,
                side: "her",
                mode: input.mode,
                styleId: styleConfig.id,
                generatedFrom: "full-wrap",
              },
              buffer: herSideBuffer,
              contentType: "image/png",
            });
            const hisSideUrl = await storeGeneratedAsset({
              prisma: ctx.prisma,
              prompt: wrapPrompt,
              userId,
              metadata: {
                kind: "couple_mug_side",
                sourcePage: input.sourcePage,
                paidTrafficUser: true,
                side: "his",
                mode: input.mode,
                styleId: styleConfig.id,
                generatedFrom: "full-wrap",
              },
              buffer: hisSideBuffer,
              contentType: "image/png",
            });

            const wrapUrl = await storeGeneratedAsset({
              prisma: ctx.prisma,
              prompt: `Couple mug wrap for ${input.herName} and ${input.hisName}`,
              userId,
              metadata: {
                kind: "couple_mug_wrap",
                sourcePage: input.sourcePage,
                paidTrafficUser: true,
                mode: input.mode,
                styleId: styleConfig.id,
              },
              buffer: wrapBuffer,
              contentType: "image/png",
            });

            return {
              imageUrls: [herSideUrl, hisSideUrl, wrapUrl],
              predictionId: generatedWrap.predictionId,
            };
          } catch (generationOrStorageError) {
            if (userId) {
              try {
                const refundedUser = await ctx.prisma.$transaction(async (tx) => {
                  const existingUser = await tx.user.findUnique({
                    where: { id: userId },
                    select: { credits: true, email: true, name: true },
                  });
                  if (!existingUser) return null;

                  const restoredCredits = new Prisma.Decimal(existingUser.credits).plus(
                    totalCredits,
                  );

                  return tx.user.update({
                    where: { id: userId },
                    data: { credits: restoredCredits },
                    select: { credits: true, email: true, name: true },
                  });
                });

                if (refundedUser?.email) {
                  try {
                    await updateMauticContact(
                      {
                        email: refundedUser.email,
                        name: refundedUser.name,
                        brand_specific_credits: refundedUser.credits,
                      },
                      "namedesignai",
                    );
                  } catch (mauticErr) {
                    console.error("Error updating Mautic after couple mug refund:", mauticErr);
                  }
                }
              } catch (refundError) {
                console.error("Couple mug credit refund failed:", refundError);
              }
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
              message: "Generation failed. Please try again.",
            });
          }
        },
      );

      return {
        herDesignUrl: imageUrls[0] ?? null,
        hisDesignUrl: imageUrls[1] ?? null,
        wrapUrl: imageUrls[2] ?? null,
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
                undefined,
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
              undefined,
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
