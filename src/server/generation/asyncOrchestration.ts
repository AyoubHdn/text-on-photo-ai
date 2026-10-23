import type { AsyncDigitalArtInterest, AsyncIconMetadata } from "./asyncPayload";

export const GENERATION_REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,120}$/;

export type AsyncGenerationJob = {
  generationRequestId: string;
  status: "started" | "processing" | "completed" | "failed";
  imageUrls: string[];
  outputIconIds: string[];
};

export type PublicGenerationStatus = Pick<
  AsyncGenerationJob,
  "generationRequestId" | "status" | "imageUrls" | "outputIconIds"
> & {
  errorMessage: string | null;
};

export type GenerationReservation =
  | { outcome: "CREATED" | "EXISTING"; job: AsyncGenerationJob }
  | { ok: false; code: string };

export type AsyncGenerationDispatchPayload = {
  jobVersion: 1;
  generationRequestId: string;
  processingAttemptId: string;
  model: string;
  prompt: string;
  numberOfImages: number;
  aspectRatio: string;
  outputIds: string[];
  callbackUrl: string;
  iconMetadata: AsyncIconMetadata;
  digitalArtInterest: AsyncDigitalArtInterest | null;
};

export type AsyncGenerationOrchestrationResult =
  | { kind: "started"; job: AsyncGenerationJob; payload: AsyncGenerationDispatchPayload }
  | { kind: "existing"; job: AsyncGenerationJob }
  | { kind: "error"; code: string };

export function isValidGenerationRequestId(value: string) {
  return GENERATION_REQUEST_ID_PATTERN.test(value);
}

export function toPublicGenerationStatus(job: AsyncGenerationJob): PublicGenerationStatus {
  return {
    generationRequestId: job.generationRequestId,
    status: job.status,
    imageUrls: job.imageUrls,
    outputIconIds: job.outputIconIds,
    errorMessage: job.status === "failed" ? "Generation failed. Your credits were refunded." : null,
  };
}

export async function reserveAndDispatchGeneration(options: {
  reserve: (input: Record<string, unknown>) => Promise<GenerationReservation>;
  reserveInput: Record<string, unknown>;
  payloadBase: Omit<AsyncGenerationDispatchPayload, "processingAttemptId">;
  createProcessingAttemptId: () => string;
  dispatch: (payload: AsyncGenerationDispatchPayload) => Promise<void>;
  failIfUnclaimed: (input: { generationRequestId: string; errorMessage: string }) => Promise<unknown>;
}): Promise<AsyncGenerationOrchestrationResult> {
  const reservation = await options.reserve(options.reserveInput);
  if ("ok" in reservation) return { kind: "error", code: reservation.code };
  if (reservation.outcome === "EXISTING") return { kind: "existing", job: reservation.job };

  const payload = {
    ...options.payloadBase,
    processingAttemptId: options.createProcessingAttemptId(),
  } as AsyncGenerationDispatchPayload;

  try {
    await options.dispatch(payload);
  } catch (error) {
    try {
      await options.failIfUnclaimed({
        generationRequestId: payload.generationRequestId,
        errorMessage: "GENERATION_LAMBDA_DISPATCH_FAILED",
      });
    } catch (compensationError) {
      console.error("Generation dispatch compensation failed", compensationError);
    }
    throw error;
  }

  return { kind: "started", job: reservation.job, payload };
}
