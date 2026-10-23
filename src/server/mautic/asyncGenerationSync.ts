import type { AsyncDigitalArtInterest } from "~/server/generation/asyncPayload";

export type AsyncGenerationMauticState = {
  email: string | null;
  name: string | null;
  credits: string;
  hasGeneratedDesign: boolean;
  firstDigitalArtInterest: AsyncDigitalArtInterest | null;
  latestDigitalArtInterest: AsyncDigitalArtInterest | null;
};

export type AsyncGenerationMauticContactInput = {
  email: string;
  name: string | null;
  brand_specific_credits: string;
  customFields: Record<string, string | number | null>;
};

export function buildAsyncGenerationMauticContactInput(
  state: AsyncGenerationMauticState,
): AsyncGenerationMauticContactInput | null {
  if (!state.email) return null;
  return {
    email: state.email,
    name: state.name,
    brand_specific_credits: state.credits,
    customFields: {
      has_generated_design: state.hasGeneratedDesign ? 1 : 0,
      first_digital_art_interes: state.firstDigitalArtInterest,
      latest_digital_art_intere: state.latestDigitalArtInterest,
    },
  };
}

export async function syncAsyncGenerationMauticStateBestEffort(
  state: AsyncGenerationMauticState | null,
  updateContact: (
    input: AsyncGenerationMauticContactInput,
    brand: "namedesignai",
  ) => Promise<{ errors?: unknown[] }>,
): Promise<void> {
  const input = state ? buildAsyncGenerationMauticContactInput(state) : null;
  if (!input) return;

  try {
    const result = await updateContact(input, "namedesignai");
    if (result.errors?.length) {
      console.error("Async generation Mautic sync failed", {
        errorCount: result.errors.length,
      });
    }
  } catch (error) {
    console.error(
      "Async generation Mautic sync failed",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}
