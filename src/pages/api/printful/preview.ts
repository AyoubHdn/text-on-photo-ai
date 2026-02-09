/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/pages/api/printful/preview.ts
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";

import { PRINTFUL_PRODUCTS } from "~/server/printful/products";
import { CREDIT_COSTS } from "~/server/credits/constants";
import { deductCreditsOrThrow } from "~/server/credits/deductCredits";

import { createMockupTask } from "~/server/printful/mockup";
import { pollMockupTask } from "~/server/printful/pollMockup";
import { convertWebpToPngAndUpload } from "~/server/image/convertWebpToPng";
import { generateMugWrapImage } from "~/server/printful/generateMugWrapImage";
import { MUG_PRINT_CONFIG } from "~/server/printful/printAreas";
import sharp from "sharp";
import { generateTshirtPrintImage } from "~/server/printful/generateTshirtPrintImage";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { productKey, imageUrl, aspect, variantId: variantIdFromClient, previewMode } = req.body as {
    productKey?: string;
    imageUrl?: string;
    aspect?: "1:1" | "4:5" | "3:2" | "16:9";
    variantId?: number;
    previewMode?: "two-side" | "center" | "full-wrap";
  };


  if (!productKey || !imageUrl) {
    return res.status(400).json({ error: "Missing parameters" });
  }

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
        session.user.id
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
        session.user.id
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
        session.user.id
      );
    }

    /* ---------------- OTHER PRODUCTS ---------------- */
    else {
      printImageUrl = await convertWebpToPngAndUpload(
        printReadyBuffer,
        session.user.id
      );
    }

  try {
    // ✅ 1. Deduct credits FIRST (before Printful cost)
    await deductCreditsOrThrow(
      session.user.id,
      CREDIT_COSTS.PRODUCT_PREVIEW
    );

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

    const mockupRes = await fetch(mockupUrl);
    if (!mockupRes.ok) {
      throw new Error("Failed to fetch mockup image");
    }

    const mockupBuffer = Buffer.from(await mockupRes.arrayBuffer());
    const stableMockupUrl = await convertWebpToPngAndUpload(
      mockupBuffer,
      session.user.id
    );

    return res.status(200).json({
      success: true,
      mockupUrl: stableMockupUrl,
      product,
    });
  } catch (error) {
    console.error("[PRINTFUL_PREVIEW_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.toLowerCase().includes("not enough credits")) {
      return res.status(402).json({
        error: "INSUFFICIENT_CREDITS",
      });
    }

    const retryMatch = errorMessage.match(/after (\d+) seconds/);
    const retryAfter = retryMatch ? Number(retryMatch[1]) : null;

    return res.status(429).json({
      error: "PRINTFUL_RATE_LIMIT",
      retryAfter, // seconds
    });
  }
}
