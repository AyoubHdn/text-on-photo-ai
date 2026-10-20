import { executeGeneration } from "./handler.ts";
import { MockGenerationProvider } from "./provider.ts";
import { InMemoryGenerationStorage } from "./storage.ts";
import { SignedRootClient } from "./callback.ts";
import type { GenerationJobPayload } from "./types.ts";

export async function handler(event: GenerationJobPayload) {
  const provider = new MockGenerationProvider((globalThis as { GENERATION_MOCK_SCENARIO?: "success" | "delayed-success" | "failure" | "timeout" | "malformed" }).GENERATION_MOCK_SCENARIO ?? "success");
  const storage = new InMemoryGenerationStorage();
  const root = new SignedRootClient((globalThis as { GENERATION_INTERNAL_HMAC_SECRET?: string }).GENERATION_INTERNAL_HMAC_SECRET ?? "test-generation-secret");
  return executeGeneration(event, root, provider, storage);
}
