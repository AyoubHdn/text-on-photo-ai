import { JOB_VERSION, SUPPORTED_MODELS, type GenerationJobPayload, type GenerationProvider, type GenerationStorage, type RootClient } from "./types.ts";

export function validateJob(job: unknown): asserts job is GenerationJobPayload {
  if (!job || typeof job !== "object") throw new Error("INVALID_JOB");
  const candidate = job as Partial<GenerationJobPayload>;
  if (candidate.jobVersion !== JOB_VERSION || typeof candidate.generationRequestId !== "string" || !/^[A-Za-z0-9_-]{1,120}$/.test(candidate.generationRequestId) || typeof candidate.processingAttemptId !== "string" || !candidate.processingAttemptId || typeof candidate.model !== "string" || !SUPPORTED_MODELS.has(candidate.model) || typeof candidate.prompt !== "string" || !Number.isInteger(candidate.numberOfImages) || !candidate.numberOfImages || candidate.numberOfImages > 10 || typeof candidate.aspectRatio !== "string" || !Array.isArray(candidate.outputIds) || candidate.outputIds.length !== candidate.numberOfImages || candidate.outputIds.some((id, index) => id !== `${candidate.generationRequestId}-${index}`) || typeof candidate.callbackUrl !== "string" || !/^https?:\/\//.test(candidate.callbackUrl)) throw new Error("INVALID_JOB");
}

export async function executeGeneration(job: GenerationJobPayload, root: RootClient, provider: GenerationProvider, storage: GenerationStorage, leaseSeconds = 300): Promise<{ outcome: string; providerCalls?: number }> {
  validateJob(job);
  const claim = await root.claim(job, leaseSeconds);
  if (claim.outcome !== "CLAIMED") return { outcome: claim.outcome };
  try {
    const result = await provider.generate(job);
    if (result.predictionId) await root.setPredictionId(job, result.predictionId);
    if (result.outputs.length !== job.numberOfImages) throw new Error("MALFORMED_PROVIDER_OUTPUT");
    const descriptors = [];
    for (const [index, output] of result.outputs.entries()) {
      const key = job.outputIds[index]!;
      await storage.putObject({ key, bytes: output.bytes, contentType: output.contentType });
      const publicUrl = (storage as unknown as { publicUrl?: (value: string) => string }).publicUrl;
      descriptors.push({ id: key, url: publicUrl ? publicUrl(key) : key, contentType: output.contentType, width: output.width, height: output.height });
    }
    await root.success(job, descriptors, result.predictionId);
    return { outcome: "COMPLETED", providerCalls: 1 };
  } catch (error) {
    const message = error instanceof Error ? error.message : "GENERATION_FAILURE";
    await root.failure(job, message, message);
    return { outcome: "FAILED", providerCalls: 1 };
  }
}
