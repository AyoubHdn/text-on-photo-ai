import { executeGeneration } from "./handler.ts";
import { SignedRootClient } from "./callback.ts";
import { ReplicateGenerationProvider } from "./replicateProvider.ts";
import { S3GenerationStorage } from "./s3Storage.ts";
import type { GenerationJobPayload } from "./types.ts";

export async function realHandler(event: GenerationJobPayload) {
  const rootUrl = event.callbackUrl;
  const secret = process.env.GENERATION_INTERNAL_HMAC_SECRET;
  const token = process.env.REPLICATE_API_TOKEN;
  const bucket = process.env.GENERATION_S3_BUCKET ?? process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
  const region = process.env.GENERATION_S3_REGION ?? process.env.NEXT_PUBLIC_S3_REGION ?? "us-east-1";
  if (!secret || !token || !bucket) throw new Error("GENERATION_LAMBDA_CONFIGURATION_MISSING");
  return executeGeneration(event, new SignedRootClient(secret), new ReplicateGenerationProvider(token), new S3GenerationStorage(bucket, region));
}

export const handler = realHandler;
