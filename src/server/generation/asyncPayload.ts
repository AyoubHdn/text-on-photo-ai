export const ASYNC_DIGITAL_ART_INTERESTS = [
  "name_art",
  "arabic_name_art",
  "couples_art",
] as const;

export type AsyncDigitalArtInterest =
  (typeof ASYNC_DIGITAL_ART_INTERESTS)[number];

export type AsyncIconMetadata = {
  aspectRatio: string | null;
  model: string;
  category: string | null;
  subcategory: string | null;
  communityAlt: string | null;
  communityTitle: string | null;
  sourcePage: string | null;
};

export type AsyncGenerationOutput = {
  id: string;
  url: string;
  contentType: string;
  width?: number;
  height?: number;
};

export type AsyncGenerationSuccessCallback = {
  jobVersion: 1;
  generationRequestId: string;
  processingAttemptId: string;
  status: "success";
  prompt: string;
  iconMetadata: AsyncIconMetadata;
  digitalArtInterest: AsyncDigitalArtInterest | null;
  predictionId?: string;
  outputs: AsyncGenerationOutput[];
};

export function isAsyncDigitalArtInterest(
  value: unknown,
): value is AsyncDigitalArtInterest {
  return (
    typeof value === "string" &&
    (ASYNC_DIGITAL_ART_INTERESTS as readonly string[]).includes(value)
  );
}

function nullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

export function isAsyncIconMetadata(value: unknown): value is AsyncIconMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const metadata = value as Record<string, unknown>;
  return (
    nullableString(metadata.aspectRatio) &&
    typeof metadata.model === "string" &&
    nullableString(metadata.category) &&
    nullableString(metadata.subcategory) &&
    nullableString(metadata.communityAlt) &&
    nullableString(metadata.communityTitle) &&
    nullableString(metadata.sourcePage)
  );
}

export function parseAsyncGenerationSuccessCallback(
  value: unknown,
): AsyncGenerationSuccessCallback | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;
  if (
    payload.jobVersion !== 1 ||
    payload.status !== "success" ||
    typeof payload.generationRequestId !== "string" ||
    typeof payload.processingAttemptId !== "string" ||
    typeof payload.prompt !== "string" ||
    !isAsyncIconMetadata(payload.iconMetadata) ||
    (payload.digitalArtInterest !== null &&
      !isAsyncDigitalArtInterest(payload.digitalArtInterest)) ||
    !Array.isArray(payload.outputs)
  ) {
    return null;
  }

  const outputs: AsyncGenerationOutput[] = [];
  for (const rawOutput of payload.outputs) {
    if (!rawOutput || typeof rawOutput !== "object" || Array.isArray(rawOutput)) {
      return null;
    }
    const output = rawOutput as Record<string, unknown>;
    if (
      typeof output.id !== "string" ||
      typeof output.url !== "string" ||
      typeof output.contentType !== "string" ||
      (output.width !== undefined && !Number.isInteger(output.width)) ||
      (output.height !== undefined && !Number.isInteger(output.height))
    ) {
      return null;
    }
    outputs.push({
      id: output.id,
      url: output.url,
      contentType: output.contentType,
      width: output.width as number | undefined,
      height: output.height as number | undefined,
    });
  }

  if (outputs.length === 0) return null;
  return {
    jobVersion: 1,
    generationRequestId: payload.generationRequestId,
    processingAttemptId: payload.processingAttemptId,
    status: "success",
    prompt: payload.prompt,
    iconMetadata: payload.iconMetadata,
    digitalArtInterest: payload.digitalArtInterest as AsyncDigitalArtInterest | null,
    predictionId: typeof payload.predictionId === "string" ? payload.predictionId : undefined,
    outputs,
  };
}
export function applyAsyncDigitalArtInterestState(
  current: { first: AsyncDigitalArtInterest | null; latest: AsyncDigitalArtInterest | null },
  interest: AsyncDigitalArtInterest | null,
) {
  if (!interest) return current;
  return { first: current.first ?? interest, latest: interest };
}
