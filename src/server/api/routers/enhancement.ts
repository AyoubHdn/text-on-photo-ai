// ~/server/api/routers/enhancement.ts
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import fetch from "node-fetch";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import Replicate from "replicate";
import { env } from "~/env.mjs";
import AWS from "aws-sdk";
import { buffer as streamToBuffer } from "stream/consumers";
import { Readable } from "stream";

// --- CONFIGURATION ---
const s3 = new AWS.S3({
  credentials: { accessKeyId: env.ACCESS_KEY_ID, secretAccessKey: env.SECRET_ACCESS_KEY },
  region: env.S3_REGION,
});
const BUCKET_NAME = env.S3_BUCKET;
const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

const modelMap = {
  "flux-kontext-pro": "black-forest-labs/flux-kontext-pro",
  "flux-kontext-max": "black-forest-labs/flux-kontext-max",
};

// --- START: THE FINAL, ROBUST HELPER FUNCTION (INSPIRED BY faceLogo.ts) ---
async function enhanceImageWithAI(
  prompt: string,
  modelName: "flux-kontext-pro" | "flux-kontext-max",
  referenceS3Url: string
): Promise<Buffer> { // Returns a Buffer directly
  const replicatePath = modelMap[modelName];
  if (!replicatePath) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Model ${modelName} not configured.` });
  }

  const replicateApiInput: Record<string, any> = {
    prompt,
    input_image: referenceS3Url, // Use the direct S3 URL
    aspect_ratio: 'match_input_image',
    output_format: "png",
  };

  console.log(`[ENHANCE_HELPER] Calling Replicate with model: ${replicatePath}`);
  const outputFromReplicate: unknown = await replicate.run(replicatePath as `${string}/${string}`, { input: replicateApiInput });
  console.log(`[ENHANCE_HELPER] Replicate raw output (typeof): ${typeof outputFromReplicate}`);
  
  // --- This is the proven, multi-check logic from your working faceLogo.ts file ---
  function isNodeReadableStream(obj: any): obj is Readable { return obj instanceof Readable; }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  function isWebReadableStream(obj: any): obj is ReadableStream<Uint8Array> { return typeof obj?.getReader === "function"; }

  if (isNodeReadableStream(outputFromReplicate)) {
    console.log("[ENHANCE_HELPER] Processing Node.js ReadableStream from Replicate.");
    return await streamToBuffer(outputFromReplicate);
  }

  if (isWebReadableStream(outputFromReplicate)) {
    console.log("[ENHANCE_HELPER] Processing Web ReadableStream from Replicate.");
    const reader = outputFromReplicate.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks);
  }

  if (Array.isArray(outputFromReplicate) && outputFromReplicate.length > 0 && typeof outputFromReplicate[0] === 'string') {
    console.log(`[ENHANCE_HELPER] Processing URL from array: ${outputFromReplicate[0]}`);
    const response = await fetch(outputFromReplicate[0]);
    return await response.buffer();
  }
  
  if (typeof outputFromReplicate === 'string' && outputFromReplicate.startsWith('http')) {
      console.log(`[ENHANCE_HELPER] Processing direct URL: ${outputFromReplicate}`);
      const response = await fetch(outputFromReplicate);
      return await response.buffer();
  }

  console.error("[ENHANCE_HELPER] Unexpected output type from Replicate model:", outputFromReplicate);
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unexpected or empty output type from AI model." });
}
// --- END: THE FINAL, ROBUST HELPER FUNCTION ---


export const enhancementRouter = createTRPCRouter({
  enhanceImage: protectedProcedure
    .input(z.object({
        prompt: z.string(),
        model: z.enum(["flux-kontext-pro", "flux-kontext-max"]),
        referenceImageUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
        const creditCost = 5;
        const { count } = await ctx.prisma.user.updateMany({
            where: { id: ctx.session.user.id, credits: { gte: creditCost } },
            data: { credits: { decrement: creditCost } },
        });
        if (count <= 0) { throw new TRPCError({ code: "BAD_REQUEST", message: "You do not have enough credits for AI enhancement." }); }

        console.log("[ENHANCE_ROUTER] Calling helper function...");
        const finalImageBuffer = await enhanceImageWithAI(input.prompt, input.model, input.referenceImageUrl);
        
        const icon = await ctx.prisma.icon.create({
            data: { prompt: `AI Enhance: ${input.prompt}`, userId: ctx.session.user.id },
        });
        
        console.log(`[ENHANCE_ROUTER] Uploading final image to S3 with key: ${icon.id}`);
        await s3.putObject({
            Bucket: BUCKET_NAME,
            Body: finalImageBuffer,
            Key: icon.id,
            ContentType: 'image/png',
        }).promise();

        const finalS3Url = `https://${BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com/${icon.id}`;
        console.log(`[ENHANCE_ROUTER] Successfully uploaded to S3: ${finalS3Url}`);
        
        return [{ imageUrl: finalS3Url }];
    }),
});