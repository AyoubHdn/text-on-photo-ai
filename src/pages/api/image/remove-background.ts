/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/pages/api/image/remove-background.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { prisma } from "~/server/db";
import Replicate from "replicate";
import { env } from "~/env.mjs";
import AWS from "aws-sdk";
import fetch from "node-fetch";
import { CREDIT_COSTS } from "~/server/credits/constants";
import { Prisma } from "@prisma/client";
import { Readable } from "stream";
import { buffer as readStreamIntoBuffer } from "stream/consumers";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";

const BUCKET_NAME = env.NEXT_PUBLIC_S3_BUCKET_NAME;

const s3 = new AWS.S3({
  credentials: {
    accessKeyId: env.ACCESS_KEY_ID,
    secretAccessKey: env.SECRET_ACCESS_KEY,
  },
  region: env.NEXT_PUBLIC_S3_REGION,
});

const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

const BRIA_MODEL = "bria/remove-background";

function getImageIdFromUrl(imageUrl: string): string {
  try {
    const url = new URL(imageUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? imageUrl;
  } catch {
    const parts = imageUrl.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? imageUrl;
  }
}

async function resolveReplicateOutput(
  output: unknown
): Promise<{ url?: string; buffer?: Buffer }> {
  if (typeof output === "string") return { url: output };
  if (Array.isArray(output) && output.length > 0) {
    return resolveReplicateOutput(output[0]);
  }
  if (output instanceof Readable) {
    const buf = await readStreamIntoBuffer(output);
    return { buffer: buf };
  }
  if (output && typeof output === "object") {
    const maybeStream = output as { getReader?: unknown; stream?: unknown };
    if (typeof maybeStream.getReader === "function") {
      const reader = (maybeStream as ReadableStream<Uint8Array>).getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      return { buffer: Buffer.concat(chunks) };
    }
    if (typeof maybeStream.stream === "function") {
      const stream = (maybeStream as { stream: () => ReadableStream<Uint8Array> }).stream();
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      return { buffer: Buffer.concat(chunks) };
    }
  }
  if (output && typeof output === "object") {
    const maybe = output as {
      url?: unknown;
      output?: unknown;
      image?: unknown;
      result?: unknown;
      file?: unknown;
      arrayBuffer?: unknown;
      buffer?: unknown;
      data?: unknown;
      text?: unknown;
      slice?: unknown;
    };

    if (typeof maybe.url === "string") {
      return { url: maybe.url };
    }
    if (typeof maybe.url === "function") {
      const resolved = await maybe.url();
      if (typeof resolved === "string") return { url: resolved };
    }
    if (typeof maybe.arrayBuffer === "function") {
      const ab = await maybe.arrayBuffer();
      return { buffer: Buffer.from(ab) };
    }
    if (typeof maybe.text === "function") {
      const text = await maybe.text();
      if (typeof text === "string" && text.startsWith("http")) {
        return { url: text };
      }
    }
    if (maybe.buffer && Buffer.isBuffer(maybe.buffer)) {
      return { buffer: maybe.buffer };
    }
    if (maybe.data && Buffer.isBuffer(maybe.data)) {
      return { buffer: maybe.data };
    }
    if (maybe.output) return resolveReplicateOutput(maybe.output);
    if (maybe.image) return resolveReplicateOutput(maybe.image);
    if (maybe.result) return resolveReplicateOutput(maybe.result);
    if (maybe.file) return resolveReplicateOutput(maybe.file);
  }
  throw new Error("Unexpected output format from background removal model");
}

async function uploadTransparentPng(buffer: Buffer, userId: string, imageId: string) {
  const key = `transparent-images/${userId}/${imageId}.png`;

  await s3
    .putObject({
      Bucket: BUCKET_NAME,
      Body: buffer,
      Key: key,
      ContentType: "image/png",
    })
    .promise();

  return `https://${BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${key}`;
}

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

  const { imageId } = req.body as { imageId?: string };
  if (!imageId) {
    return res.status(400).json({ error: "Missing imageId" });
  }

  const icon = await prisma.icon.findFirst({
    where: { id: imageId, userId: session.user.id },
    select: {
      id: true,
      userId: true,
      transparentImageUrl: true,
      backgroundRemovedAt: true,
    },
  });

  if (!icon) {
    return res.status(404).json({ error: "Image not found" });
  }

  if (icon.transparentImageUrl) {
    return res.status(200).json({
      transparentImageUrl: icon.transparentImageUrl,
      alreadyExists: true,
    });
  }

  // Charge only once per image (idempotent).
  if (!icon.backgroundRemovedAt) {
    try {
      await prisma.$transaction(async (tx) => {
        const claimed = await tx.icon.updateMany({
          where: {
            id: imageId,
            userId: session.user.id,
            backgroundRemovedAt: null,
            transparentImageUrl: null,
          },
          data: {
            backgroundRemovedAt: new Date(),
          },
        });

        if (claimed.count === 0) {
          return;
        }

        const amountDecimal = new Prisma.Decimal(CREDIT_COSTS.BACKGROUND_REMOVAL);

        const user = await tx.user.findUnique({
          where: { id: session.user.id },
          select: { credits: true },
        });

        if (!user) {
          throw new Error("INSUFFICIENT_CREDITS");
        }

        const userCredits = new Prisma.Decimal(user.credits);
        if (userCredits.lessThan(amountDecimal)) {
          await tx.icon.updateMany({
            where: { id: imageId, userId: session.user.id },
            data: { backgroundRemovedAt: null },
          });
          throw new Error("INSUFFICIENT_CREDITS");
        }

        const updatedCredits = userCredits.minus(amountDecimal);
        await tx.user.update({
          where: { id: session.user.id },
          data: { credits: updatedCredits },
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
        return res.status(402).json({ error: "INSUFFICIENT_CREDITS" });
      }
      console.error("[REMOVE_BACKGROUND_CREDIT_ERROR]", error);
      return res.status(500).json({ error: "Credit deduction failed" });
    }

    const updatedUserForMautic = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true, email: true, name: true },
    });

    if (updatedUserForMautic?.email) {
      try {
        await updateMauticContact(
          {
            email: updatedUserForMautic.email,
            name: updatedUserForMautic.name,
            brand_specific_credits: updatedUserForMautic.credits,
          },
          "namedesignai"
        );
      } catch (mauticErr) {
        console.error("[REMOVE_BACKGROUND_MAUTIC_SYNC_ERROR]", mauticErr);
      }
    }
  }

  const originalImageUrl = `https://${BUCKET_NAME}.s3.${env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${icon.id}`;

  try {
    let outputUrl: string | null = null;
    let outputBuffer: Buffer | null = null;

    if (env.MOCK_REPLICATE === "true") {
      outputUrl = originalImageUrl;
    } else {
      const rawOutput = await replicate.run(BRIA_MODEL, {
        input: {
          image_url: originalImageUrl,
          preserve_alpha: true,
        },
      });
      if (process.env.NODE_ENV !== "production") {
        console.log("[REMOVE_BACKGROUND] raw output type:", typeof rawOutput);
        try {
          console.log("[REMOVE_BACKGROUND] raw output:", JSON.stringify(rawOutput));
        } catch {
          console.log("[REMOVE_BACKGROUND] raw output (non-serializable)");
        }
        try {
          console.log("[REMOVE_BACKGROUND] raw output keys:", Object.keys(rawOutput as object));
          console.log(
            "[REMOVE_BACKGROUND] raw output proto:",
            Object.getPrototypeOf(rawOutput as object)?.constructor?.name
          );
        } catch {
          console.log("[REMOVE_BACKGROUND] raw output meta unavailable");
        }
      }
      const resolved = await resolveReplicateOutput(rawOutput);
      outputUrl = resolved.url ?? null;
      outputBuffer = resolved.buffer ?? null;
    }

    let buffer: Buffer;
    if (outputBuffer) {
      buffer = outputBuffer;
    } else if (outputUrl) {
      const response = await fetch(outputUrl);
      if (!response.ok) {
        throw new Error("Failed to download transparent image");
      }
      buffer = Buffer.from(await response.arrayBuffer());
    } else {
      throw new Error("No output from background removal model");
    }
    const imageKeyId = getImageIdFromUrl(originalImageUrl);
    const transparentImageUrl = await uploadTransparentPng(
      buffer,
      icon.userId ?? session.user.id,
      imageKeyId
    );

    const updated = await prisma.icon.update({
      where: { id: imageId },
      data: {
        transparentImageUrl,
        backgroundRemovedAt: icon.backgroundRemovedAt ?? new Date(),
      },
      select: {
        transparentImageUrl: true,
      },
    });

    return res.status(200).json({
      transparentImageUrl: updated.transparentImageUrl,
      alreadyExists: false,
    });
  } catch (error) {
    console.error("[REMOVE_BACKGROUND_ERROR]", error);
    return res.status(500).json({ error: "Background removal failed" });
  }
}
