/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import sharp from "sharp";
import { PRINTFUL_PRODUCTS } from "~/server/printful/products";
import { MUG_PRINT_CONFIG } from "~/server/printful/printAreas";
import { generateMugWrapImage } from "~/server/printful/generateMugWrapImage";
import { generateTshirtPrintImage } from "~/server/printful/generateTshirtPrintImage";

const SIGNING_SECRET =
  process.env.NEXTAUTH_SECRET ?? process.env.PRINTFUL_API_KEY ?? "preview-secret";

const buildCanonicalParams = (params: {
  productKey: string;
  imageUrl: string;
  aspect?: string;
  variantId?: string;
  previewMode?: string;
  expiresAt: string;
}) => {
  const searchParams = new URLSearchParams();
  searchParams.set("productKey", params.productKey);
  searchParams.set("imageUrl", params.imageUrl);
  searchParams.set("aspect", params.aspect ?? "");
  searchParams.set("variantId", params.variantId ?? "");
  searchParams.set("previewMode", params.previewMode ?? "");
  searchParams.set("expiresAt", params.expiresAt);
  return searchParams.toString();
};

const signParams = (canonical: string) =>
  crypto.createHmac("sha256", SIGNING_SECRET).update(canonical).digest("hex");

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const productKey = String(req.query.productKey ?? "");
  const imageUrl = String(req.query.imageUrl ?? "");
  const aspect = req.query.aspect ? String(req.query.aspect) : undefined;
  const variantId = req.query.variantId ? String(req.query.variantId) : undefined;
  const previewMode = req.query.previewMode
    ? String(req.query.previewMode)
    : undefined;
  const expiresAt = String(req.query.expiresAt ?? "");
  const signature = String(req.query.sig ?? "");

  if (!productKey || !imageUrl || !expiresAt || !signature) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const expiresAtMs = Number(expiresAt);
  if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) {
    return res.status(403).json({ error: "Expired preview URL" });
  }

  const canonical = buildCanonicalParams({
    productKey,
    imageUrl,
    aspect,
    variantId,
    previewMode,
    expiresAt,
  });

  const expectedSig = signParams(canonical);
  if (
    signature.length !== expectedSig.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
  ) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const product = PRINTFUL_PRODUCTS.find((p) => p.key === productKey);
  if (!product) {
    return res.status(400).json({ error: "Invalid product" });
  }

  try {
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return res.status(400).json({ error: "Failed to fetch image" });
    }

    const buffer = Buffer.from(await imageRes.arrayBuffer());

    let outputBuffer: Buffer;

    if (product.key === "mug") {
      const resolvedVariantId = Number(variantId ?? 1320);
      const mugConfig = MUG_PRINT_CONFIG[resolvedVariantId];
      if (!mugConfig) {
        return res.status(400).json({ error: "Invalid mug variant" });
      }

      outputBuffer = await generateMugWrapImage({
        inputBuffer: await sharp(buffer)
          .png({ quality: 100 })
          .withMetadata({ density: 300 })
          .toBuffer(),
        outputWidth: mugConfig.areaWidth,
        outputHeight: mugConfig.areaHeight,
        mode: (previewMode as "two-side" | "center" | "full-wrap") ?? "two-side",
      });
    } else if (product.key === "tshirt") {
      outputBuffer = await generateTshirtPrintImage({
        inputBuffer: buffer,
        printWidth: 3810,
        printHeight: 4572,
        aspect: (aspect as any) ?? "1:1",
      });
    } else {
      outputBuffer = await sharp(buffer)
        .png({ quality: 100 })
        .withMetadata({ density: 300 })
        .toBuffer();
    }

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return res.status(200).send(outputBuffer);
  } catch (error) {
    console.error("[PRINTFUL_PREVIEW_IMAGE_ERROR]", error);
    return res.status(500).json({ error: "Failed to generate preview image" });
  }
}
