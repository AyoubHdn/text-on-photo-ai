import { generationGetMauticSyncStateFromService } from "~/server/cloudflare/dbService";
import { updateMauticContact } from "~/server/api/routers/mautic-utils";
import { syncAsyncGenerationMauticStateBestEffort } from "~/server/mautic/asyncGenerationSync";

export async function syncAsyncGenerationMauticForUser(
  userId: string | null | undefined,
): Promise<void> {
  if (!userId) return;
  try {
    const result = await generationGetMauticSyncStateFromService({ userId });
    if ("found" in result && result.found) {
      await syncAsyncGenerationMauticStateBestEffort(
        result.state,
        updateMauticContact,
      );
    }
  } catch (error) {
    console.error(
      "Async generation authoritative Mautic state read failed",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}
