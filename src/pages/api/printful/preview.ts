/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/pages/api/printful/preview.ts
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "~/server/auth";

import { PRINTFUL_PRODUCTS } from "~/server/printful/products";
import { CREDIT_COSTS } from "~/server/credits/constants";
import { deductCreditsOrThrow } from "~/server/credits/deductCredits";

import { createMockupTask } from "~/server/printful/mockup";
import { pollMockupTask } from "~/server/printful/pollMockup";

const PREVIEW_CACHE_TTL_MS = 60 * 60 * 1000;
const PREVIEW_PENDING_TTL_MS = 20 * 1000;

type CachedPreview = {
  mockupUrl: string;
  expiresAt: number;
};

type PendingPreview = {
  expiresAt: number;
};

const previewCache = new Map<string, CachedPreview>();
const pendingCache = new Map<string, PendingPreview>();

const buildCacheKey = (params: {
  productKey: string;
  imageUrl: string;
  aspect?: string;
  variantId: number;
  previewMode?: string;
}) =>
  JSON.stringify({
    productKey: params.productKey,
    imageUrl: params.imageUrl,
    aspect: params.aspect ?? "",
    variantId: params.variantId,
    previewMode: params.previewMode ?? "",
  });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let cacheKey: string | null = null;
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      productKey,
      imageUrl,
      aspect,
      variantId: variantIdFromClient,
      previewMode,
    } = req.body as {
      productKey?: string;
      imageUrl?: string;
      aspect?: "1:1" | "4:5" | "3:2" | "16:9";
      variantId?: number;
      previewMode?: "two-side" | "center" | "full-wrap";
    };

    if (!productKey || !imageUrl) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const product = PRINTFUL_PRODUCTS.find((p) => p.key === productKey);
    if (!product) {
      return res.status(400).json({ error: "Invalid product" });
    }

    const baseUrl = (() => {
      const proto =
        (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
      const host =
        (req.headers["x-forwarded-host"] as string | undefined) ??
        req.headers.host ??
        "";
      return `${proto}://${host}`;
    })();

    const buildPreviewImageUrl = (params: {
      productKey: string;
      imageUrl: string;
      aspect?: string;
      variantId?: number;
      previewMode?: string;
    }) => {
      const expiresAt = Date.now() + 5 * 60 * 1000;
      const searchParams = new URLSearchParams();
      searchParams.set("productKey", params.productKey);
      searchParams.set("imageUrl", params.imageUrl);
      searchParams.set("aspect", params.aspect ?? "");
      searchParams.set(
        "variantId",
        params.variantId ? String(params.variantId) : ""
      );
      searchParams.set("previewMode", params.previewMode ?? "");
      searchParams.set("expiresAt", String(expiresAt));

      const canonical = searchParams.toString();
      const secret =
        process.env.NEXTAUTH_SECRET ??
        process.env.PRINTFUL_API_KEY ??
        "preview-secret";
      const signature = crypto
        .createHmac("sha256", secret)
        .update(canonical)
        .digest("hex");
      searchParams.set("sig", signature);

      return `${baseUrl}/api/printful/preview-image?${searchParams.toString()}`;
    };

    // âœ… 1. Deduct credits FIRST (before Printful cost)
    await deductCreditsOrThrow(session.user.id, CREDIT_COSTS.PRODUCT_PREVIEW);

    // âœ… 2. Create Printful mockup task
    let variantId: number;
    let effectiveAspect: string | undefined;
    let effectivePreviewMode: "two-side" | "center" | "full-wrap" | undefined;

    /* ---------------- POSTER ---------------- */
    if (product.key === "poster") {
      const selectedAspect = aspect ?? "1:1";

      const size = product.sizes.find((s) => s.aspect === selectedAspect);

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

    const printImageUrl = buildPreviewImageUrl({
      productKey: product.key,
      imageUrl,
      aspect: effectiveAspect,
      variantId,
      previewMode: effectivePreviewMode,
    });

    cacheKey = buildCacheKey({
      productKey: product.key,
      imageUrl,
      aspect: effectiveAspect,
      variantId,
      previewMode: effectivePreviewMode,
    });

    const cached = previewCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.status(200).json({
        success: true,
        mockupUrl: cached.mockupUrl,
        product,
        cached: true,
      });
    }

    const pending = pendingCache.get(cacheKey);
    if (pending && pending.expiresAt > Date.now()) {
      const retryAfter = Math.ceil((pending.expiresAt - Date.now()) / 1000);
      return res.status(200).json({
        status: "PREVIEW_PENDING",
        retryAfter,
      });
    }

    const task = await createMockupTask(
      product,
      printImageUrl,
      variantId,
      effectiveAspect
    );

    if (!task?.result?.task_key) {
      console.error("Printful task creation failed:", task);
      throw new Error("Printful did not return task_key");
    }

    // âœ… 3. Poll until mockup is ready
    const mockupUrl = await pollMockupTask(task.result.task_key);

    if (!mockupUrl) {
      throw new Error("Mockup not generated");
    }

    previewCache.set(cacheKey, {
      mockupUrl,
      expiresAt: Date.now() + PREVIEW_CACHE_TTL_MS,
    });
    pendingCache.delete(cacheKey);

    return res.status(200).json({
      success: true,
      mockupUrl,
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

    if (errorMessage.toLowerCase().includes("mockup timeout")) {
      if (cacheKey) {
        pendingCache.set(cacheKey, {
          expiresAt: Date.now() + PREVIEW_PENDING_TTL_MS,
        });
      }
      const fallbackRetryAfter = Math.ceil(PREVIEW_PENDING_TTL_MS / 1000);
      return res.status(200).json({
        status: "PREVIEW_PENDING",
        retryAfter: fallbackRetryAfter,
      });
    }

    const retryMatch = errorMessage.match(/after (\d+) seconds/);
    const retryAfter = retryMatch ? Number(retryMatch[1]) : null;

    if (retryAfter) {
      return res.status(429).json({
        error: "PRINTFUL_RATE_LIMIT",
        retryAfter, // seconds
      });
    }

    return res.status(500).json({
      error: "PREVIEW_FAILED",
      message: errorMessage,
    });
  }
}
