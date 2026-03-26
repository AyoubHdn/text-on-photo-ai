/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/pages/api/printful/preview.ts
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { env } from "~/env.mjs";

import { PRINTFUL_PRODUCTS } from "~/server/printful/products";

import { createMockupTask } from "~/server/printful/mockup";
import { pollMockupTask } from "~/server/printful/pollMockup";
import { convertWebpToPngAndUpload } from "~/server/image/convertWebpToPng";
import { generateMugWrapImage } from "~/server/printful/generateMugWrapImage";
import { MUG_PRINT_CONFIG } from "~/server/printful/printAreas";
import sharp from "sharp";
import { generateTshirtPrintImage } from "~/server/printful/generateTshirtPrintImage";

const MOCKUP_FETCH_ATTEMPTS = 3;
const MOCKUP_FETCH_RETRY_MS = 1200;
const TRUSTED_S3_HOST = `${env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com`;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTrustedAssetUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === TRUSTED_S3_HOST;
  } catch {
    return false;
  }
}

function getErrorCode(error: unknown): string | undefined {
  const maybeErr = error as { code?: string; cause?: { code?: string } };
  return maybeErr?.code ?? maybeErr?.cause?.code;
}

function isNetworkFetchError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : "";
  const code = (getErrorCode(error) ?? "").toUpperCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("getaddrinfo") ||
    msg.includes("enotfound") ||
    msg.includes("eai_again") ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT"
  );
}

async function fetchMockupWithRetry(url: string): Promise<Response> {
  let lastError: unknown = null;

  for (let i = 0; i < MOCKUP_FETCH_ATTEMPTS; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;

      // Retry only transient upstream statuses.
      if (response.status >= 500 || response.status === 429) {
        lastError = new Error(`Mockup fetch upstream status: ${response.status}`);
      } else {
        throw new Error(`Failed to fetch mockup image (status ${response.status})`);
      }
    } catch (error) {
      lastError = error;
      if (!isNetworkFetchError(error) && i === MOCKUP_FETCH_ATTEMPTS - 1) {
        throw error;
      }
    }

    if (i < MOCKUP_FETCH_ATTEMPTS - 1) {
      await delay(MOCKUP_FETCH_RETRY_MS * (i + 1));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch mockup image after retries");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const session = await getServerSession(req, res, authOptions);

  const { productKey, imageUrl, aspect, variantId: variantIdFromClient, previewMode } = req.body as {
    productKey?: string;
    imageUrl?: string;
    aspect?: "1:1" | "4:5" | "3:2" | "16:9";
    variantId?: number;
    previewMode?: "two-side" | "center" | "full-wrap";
    paidTrafficUser?: boolean;
  };
  const paidTrafficUser = Boolean(req.body?.paidTrafficUser);

  if (!session?.user?.id && !paidTrafficUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }


  if (!productKey || !imageUrl) {
    return res.status(400).json({ error: "Missing parameters" });
  }
  if (!isTrustedAssetUrl(imageUrl)) {
    return res.status(400).json({ error: "Invalid image URL" });
  }
  if (paidTrafficUser && productKey !== "mug") {
    return res.status(403).json({ error: "RAMADAN_MUG_ONLY" });
  }

  const uploadOwnerId = session?.user?.id ?? "guest-paid-traffic";

    // ALWAYS convert for Printful
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
    throw new Error("Failed to fetch image for Printful");
    }

    const buffer = Buffer.from(await imageRes.arrayBuffer());

    const printReadyBuffer = await sharp(buffer)
    .png({ quality: 100 })
    .withMetadata({
        density: 300, // 🔥 THIS IS THE MISSING PIECE
    })
    .toBuffer();

    const product = PRINTFUL_PRODUCTS.find(p => p.key === productKey);
    if (!product) {
      return res.status(400).json({ error: "Invalid product" });
    }

    let printImageUrl: string;

    /* ---------------- POSTER ---------------- */
    if (product.key === "poster") {
      printImageUrl = await convertWebpToPngAndUpload(
        printReadyBuffer,
        uploadOwnerId
      );
    }

    /* ---------------- MUG ---------------- */
    else if (product.key === "mug") {
      const resolvedVariantId = variantIdFromClient ?? 1320;
      const mugConfig = MUG_PRINT_CONFIG[resolvedVariantId];

      if (!mugConfig) {
        throw new Error(`Invalid mug variant: ${resolvedVariantId}`);
      }

      const wrappedBuffer = await generateMugWrapImage({
        inputBuffer: printReadyBuffer,
        outputWidth: mugConfig.areaWidth,
        outputHeight: mugConfig.areaHeight,
        mode: previewMode ?? product.defaultPreviewMode,
      });

      printImageUrl = await convertWebpToPngAndUpload(
        wrappedBuffer,
        uploadOwnerId
      );
    }

    /* ---------------- T-SHIRT ---------------- */
    else if (product.key === "tshirt") {
      const tshirtBuffer = await generateTshirtPrintImage({
        inputBuffer: buffer, // ORIGINAL buffer
        printWidth: 3810,
        printHeight: 4572,
        aspect: aspect ?? "1:1",
      });

      printImageUrl = await convertWebpToPngAndUpload(
        tshirtBuffer,
        uploadOwnerId
      );
    }

    /* ---------------- OTHER PRODUCTS ---------------- */
    else {
      printImageUrl = await convertWebpToPngAndUpload(
        printReadyBuffer,
        uploadOwnerId
      );
    }

  try {
    // ✅ 2. Create Printful mockup task
    let variantId: number;
    let effectiveAspect: string | undefined;
    let effectivePreviewMode: "two-side" | "center" | "full-wrap" | undefined;

    /* ---------------- POSTER ---------------- */
    if (product.key === "poster") {
      const selectedAspect = aspect ?? "1:1";

      const size = product.sizes.find(
        (s) => s.aspect === selectedAspect
      );

      if (!size) {
        throw new Error(`No poster size for aspect ${selectedAspect}`);
      }

      variantId = size.variantId;
      effectiveAspect = selectedAspect;
    }

    /* ---------------- MUG ---------------- */
    else if (product.key === "mug") {
      // Default to 11oz if user didn't select a size yet
      const DEFAULT_MUG_VARIANT = 1320; // White Glossy Mug 11 oz

      variantId = variantIdFromClient ?? DEFAULT_MUG_VARIANT;
      effectiveAspect = undefined;
      effectivePreviewMode = previewMode ?? product.defaultPreviewMode;

    }

    /* ---------------- T-SHIRT ---------------- */
    else if (product.key === "tshirt") {
      const DEFAULT_TSHIRT_VARIANT = 4012;
      variantId = variantIdFromClient ?? DEFAULT_TSHIRT_VARIANT;
      effectiveAspect = undefined;
    }
    /* ---------------- OTHER PRODUCTS ---------------- */

    else {
      throw new Error("Unsupported product");
    }

    const task = await createMockupTask(
      product,
      printImageUrl,
      variantId,
      effectiveAspect,
      
    );

    // 🔴 ADD THIS BLOCK
    if (!task?.result?.task_key) {
    console.error("Printful task creation failed:", task);
    throw new Error("Printful did not return task_key");
    }

    // ✅ 3. Poll until mockup is ready
    const mockupUrl = await pollMockupTask(task.result.task_key);

    if (!mockupUrl) {
      throw new Error("Mockup not generated");
    }

    const mockupRes = await fetchMockupWithRetry(mockupUrl);

    const mockupBuffer = Buffer.from(await mockupRes.arrayBuffer());
    const stableMockupUrl = await convertWebpToPngAndUpload(
      mockupBuffer,
      uploadOwnerId
    );

    return res.status(200).json({
      success: true,
      mockupUrl: stableMockupUrl,
      product,
      chargedCredits: 0,
      usedFreeRamadanPreview: false,
    });
  } catch (error) {
    console.error("[PRINTFUL_PREVIEW_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorCode = getErrorCode(error)?.toUpperCase();

    const retryMatch = errorMessage.match(/after (\d+) seconds/i);
    if (retryMatch) {
      const retryAfter = Number(retryMatch[1]);
      return res.status(429).json({
        error: "PRINTFUL_RATE_LIMIT",
        retryAfter: Number.isFinite(retryAfter) ? retryAfter : null,
      });
    }

    if (
      isNetworkFetchError(error) ||
      errorCode === "ENOTFOUND" ||
      errorCode === "EAI_AGAIN" ||
      errorCode === "ETIMEDOUT" ||
      errorCode === "ECONNRESET"
    ) {
      return res.status(503).json({
        error: "MOCKUP_FETCH_NETWORK_ERROR",
      });
    }

    return res.status(500).json({
      error: "PRINTFUL_PREVIEW_ERROR",
    });
  }
}
