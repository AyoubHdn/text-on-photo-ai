import type { GenerationJobPayload, GenerationProvider, ProviderResult } from "./types.ts";

export type MockProviderScenario = "success" | "delayed-success" | "failure" | "timeout" | "malformed";

export class MockGenerationProvider implements GenerationProvider {
  calls = 0;
  private readonly scenario: MockProviderScenario;
  private readonly delayMs: number;
  constructor(scenario: MockProviderScenario = "success", delayMs = 0) { this.scenario = scenario; this.delayMs = delayMs; }
  async generate(job: GenerationJobPayload): Promise<ProviderResult> {
    this.calls++;
    if (this.scenario === "timeout") await new Promise((resolve) => setTimeout(resolve, 25));
    if (this.scenario === "delayed-success") await new Promise((resolve) => setTimeout(resolve, this.delayMs || 10));
    if (this.scenario === "failure" || this.scenario === "timeout") throw new Error(this.scenario === "timeout" ? "PROVIDER_TIMEOUT" : "PROVIDER_FAILURE");
    if (this.scenario === "malformed") return { predictionId: "mock-prediction", outputs: [] };
    return { predictionId: "mock-prediction", outputs: Array.from({ length: job.numberOfImages }, (_, index) => ({ bytes: new TextEncoder().encode(`mock-image-${index}`), contentType: "image/webp", width: 64, height: 64 })) };
  }
}
