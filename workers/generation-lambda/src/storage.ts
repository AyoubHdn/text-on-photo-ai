import type { GenerationStorage, StorageObject } from "./types.ts";

export class InMemoryGenerationStorage implements GenerationStorage {
  readonly objects = new Map<string, StorageObject>();
  fail = false;
  async putObject(object: StorageObject): Promise<void> { if (this.fail) throw new Error("STORAGE_FAILURE"); this.objects.set(object.key, object); }
  publicUrl(key: string): string { return `https://mock-storage.invalid/${key}`; }
}
