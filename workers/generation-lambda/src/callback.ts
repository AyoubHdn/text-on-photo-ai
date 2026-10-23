import { signGenerationMessage } from "./security.ts";
import type { GenerationJobPayload, RootClient } from "./types.ts";

export class SignedRootClient implements RootClient {
  private readonly secret: string;
  private readonly fetcher: typeof fetch;
  constructor(secret: string, fetcher: typeof fetch = fetch) { this.secret = secret; this.fetcher = fetcher; }
  private async post(path: string, payload: unknown): Promise<any> { const rawBody = JSON.stringify(payload); const timestamp = String(Date.now()); const nonce = crypto.randomUUID(); const signature = await signGenerationMessage(this.secret, timestamp, nonce, rawBody); const response = await this.fetcher(path, { method: "POST", headers: { "content-type": "application/json", "x-generation-timestamp": timestamp, "x-generation-nonce": nonce, "x-generation-signature": signature }, body: rawBody }); if (!response.ok) throw new Error(`ROOT_${response.status}`); return response.json(); }
  claim(job: GenerationJobPayload, leaseSeconds: number) { return this.post(job.callbackUrl.replace(/\/callback$/, "/claim"), { jobVersion: 1, generationRequestId: job.generationRequestId, processingAttemptId: job.processingAttemptId, leaseSeconds }); }
  setPredictionId(job: GenerationJobPayload, predictionId: string) { return this.post(job.callbackUrl.replace(/\/callback$/, "/prediction"), { jobVersion: 1, generationRequestId: job.generationRequestId, processingAttemptId: job.processingAttemptId, predictionId }); }
  success(job: GenerationJobPayload, outputs: Array<{ id: string; url: string; contentType: string; width?: number; height?: number }>, predictionId?: string) { return this.post(job.callbackUrl, { jobVersion: 1, generationRequestId: job.generationRequestId, processingAttemptId: job.processingAttemptId, status: "success", prompt: job.prompt, iconMetadata: job.iconMetadata, digitalArtInterest: job.digitalArtInterest, predictionId, outputs }); }
  failure(job: GenerationJobPayload, errorCode: string, errorMessage: string) { return this.post(job.callbackUrl, { jobVersion: 1, generationRequestId: job.generationRequestId, processingAttemptId: job.processingAttemptId, status: "failure", errorCode, errorMessage }); }
}
