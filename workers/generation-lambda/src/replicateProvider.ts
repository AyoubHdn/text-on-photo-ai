import Replicate from "replicate";
import type { GenerationJobPayload, GenerationProvider, ProviderOutput, ProviderResult } from "./types.ts";

const DEFAULT_TIMEOUT_MS = 120_000;
const NANO_TIMEOUT_MS = 180_000;

type SupportedModel =
  | "black-forest-labs/flux-schnell"
  | "black-forest-labs/flux-dev"
  | "ideogram-ai/ideogram-v2-turbo"
  | "google/nano-banana-pro"
  | "google/nano-banana-2";

function timeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("REPLICATE_TIMEOUT")), milliseconds)),
  ]);
}

function inputFor(job: GenerationJobPayload): Record<string, unknown> {
  switch (job.model as SupportedModel) {
    case "black-forest-labs/flux-schnell":
      return { prompt: job.prompt, go_fast: false, megapixels: "1", num_outputs: job.numberOfImages, aspect_ratio: job.aspectRatio, output_format: "webp", output_quality: 80, num_inference_steps: 4 };
    case "black-forest-labs/flux-dev":
      return { prompt: job.prompt, go_fast: false, megapixels: "1", num_outputs: job.numberOfImages, aspect_ratio: job.aspectRatio, output_format: "webp", output_quality: 80, num_inference_steps: 28 };
    case "ideogram-ai/ideogram-v2-turbo":
      return { prompt: job.prompt, aspect_ratio: job.aspectRatio, resolution: "None", style_type: "General", magic_prompt_option: "Auto" };
    case "google/nano-banana-pro":
      return { prompt: job.prompt, aspect_ratio: job.aspectRatio, output_format: "png", safety_filter_level: "block_only_high", resolution: "2K", allow_fallback_model: true };
    case "google/nano-banana-2":
      return { prompt: job.prompt, aspect_ratio: job.aspectRatio, output_format: "png", resolution: "1K" };
    default:
      throw new Error("UNSUPPORTED_MODEL");
  }
}

async function bytesFromOutput(output: unknown): Promise<ProviderOutput> {
  if (typeof output === "string") return bytesFromUrl(output);
  if (output instanceof Uint8Array) return { bytes: output, contentType: "application/octet-stream" };
  if (output instanceof ArrayBuffer) return { bytes: new Uint8Array(output), contentType: "application/octet-stream" };
  if (output instanceof Blob) return { bytes: new Uint8Array(await output.arrayBuffer()), contentType: output.type || "application/octet-stream" };
  if (output && typeof output === "object" && "url" in output && typeof (output as { url?: unknown }).url === "string") return bytesFromUrl((output as { url: string }).url);
  if (output && typeof output === "object" && "blob" in output && typeof (output as { blob?: unknown }).blob === "function") {
    const blob = await (output as { blob: () => Promise<Blob> }).blob();
    return {
      bytes: new Uint8Array(await blob.arrayBuffer()),
      contentType: blob.type?.split(";", 1)[0] || "application/octet-stream",
    };
  }
  if (output && typeof (output as { getReader?: unknown }).getReader === "function") {
    const reader = (output as ReadableStream<Uint8Array>).getReader();
    const chunks: Uint8Array[] = [];
    while (true) { const next = await reader.read(); if (next.done) break; if (next.value) chunks.push(next.value); }
    const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { bytes, contentType: "application/octet-stream" };
  }
  throw new Error("INVALID_PROVIDER_OUTPUT");
}

async function bytesFromUrl(url: string): Promise<ProviderOutput> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PROVIDER_OUTPUT_DOWNLOAD_${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { bytes, contentType: response.headers.get("content-type")?.split(";", 1)[0] || "application/octet-stream" };
}

export class ReplicateGenerationProvider implements GenerationProvider {
  private readonly client: Replicate;
  constructor(token: string, private readonly fetcher: typeof fetch = fetch) {
    if (!token) throw new Error("REPLICATE_API_TOKEN_MISSING");
    this.client = new Replicate({ auth: token, fetch: fetcher });
  }

  async generate(job: GenerationJobPayload): Promise<ProviderResult> {
    const input = inputFor(job);
    if (job.model === "google/nano-banana-pro" || job.model === "google/nano-banana-2") {
      const prediction = await this.client.predictions.create({ model: job.model, input });
      const completed = await timeout(this.client.wait(prediction, { interval: 1000 }), NANO_TIMEOUT_MS);
      const raw = Array.isArray(completed.output) ? completed.output : [completed.output];
      return { predictionId: prediction.id, outputs: await Promise.all(raw.map(bytesFromOutput)) };
    }
    const raw = await timeout(this.client.run(job.model as `${string}/${string}`, { input }), DEFAULT_TIMEOUT_MS);
    const values = Array.isArray(raw) ? raw : [raw];
    return { outputs: await Promise.all(values.map(bytesFromOutput)) };
  }
}
