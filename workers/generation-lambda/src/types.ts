export const JOB_VERSION = 1 as const;
export const SUPPORTED_MODELS = new Set([
  "black-forest-labs/flux-schnell",
  "black-forest-labs/flux-dev",
  "ideogram-ai/ideogram-v2-turbo",
  "google/nano-banana-pro",
  "google/nano-banana-2",
]);
export const SUPPORTED_APP_MODELS = new Set([
  "flux-schnell",
  "flux-dev",
  "ideogram-ai/ideogram-v2-turbo",
  "google/nano-banana-pro",
  "google/nano-banana-2",
]);
export const DIGITAL_ART_INTERESTS = new Set([
  "name_art",
  "arabic_name_art",
  "couples_art",
]);

export type DigitalArtInterest = "name_art" | "arabic_name_art" | "couples_art";
export interface GenerationIconMetadata {
  aspectRatio: string | null;
  model: string;
  category: string | null;
  subcategory: string | null;
  communityAlt: string | null;
  communityTitle: string | null;
  sourcePage: string | null;
}

export interface GenerationJobPayload {
  jobVersion: 1;
  generationRequestId: string;
  processingAttemptId: string;
  model: string;
  prompt: string;
  numberOfImages: number;
  aspectRatio: string;
  outputIds: string[];
  callbackUrl: string;
  iconMetadata: GenerationIconMetadata;
  digitalArtInterest: DigitalArtInterest | null;
}

export interface ProviderOutput { bytes: Uint8Array; contentType: string; width?: number; height?: number; }
export interface ProviderResult { predictionId?: string; outputs: ProviderOutput[]; }
export interface GenerationProvider { generate(job: GenerationJobPayload): Promise<ProviderResult>; }
export interface StorageObject { key: string; bytes: Uint8Array; contentType: string; }
export interface GenerationStorage { putObject(object: StorageObject): Promise<void>; }
export interface RootClient {
  claim(job: GenerationJobPayload, leaseSeconds: number): Promise<{ outcome: "CLAIMED" | "ALREADY_CLAIMED" | "TERMINAL" }>;
  setPredictionId(job: GenerationJobPayload, predictionId: string): Promise<{ outcome: "UPDATED" | "NOOP" }>;
  success(job: GenerationJobPayload, outputs: Array<{ id: string; url: string; contentType: string; width?: number; height?: number }>, predictionId?: string): Promise<unknown>;
  failure(job: GenerationJobPayload, errorCode: string, errorMessage: string): Promise<unknown>;
}
