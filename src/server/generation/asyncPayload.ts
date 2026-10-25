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


export type AsyncGenerationSuccessCallbackValidation =
  | { ok: true; value: AsyncGenerationSuccessCallback }
  | { ok: false; reasons: string[] };

function invalidCallback(...reasons: string[]): AsyncGenerationSuccessCallbackValidation {
  return { ok: false, reasons };
}

export function validateAsyncGenerationSuccessCallback(value: unknown): AsyncGenerationSuccessCallbackValidation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalidCallback("payload_not_object");
  const payload = value as Record<string, unknown>;
  const reasons: string[] = [];
  if (payload.jobVersion !== 1) reasons.push("jobVersion_invalid");
  if (payload.status !== "success") reasons.push("status_invalid");
  if (typeof payload.generationRequestId !== "string") reasons.push("generationRequestId_invalid");
  if (typeof payload.processingAttemptId !== "string") reasons.push("processingAttemptId_invalid");
  if (typeof payload.prompt !== "string") reasons.push("prompt_missing_or_invalid");
  if (!isAsyncIconMetadata(payload.iconMetadata)) reasons.push("iconMetadata_missing_or_invalid");
  if (payload.digitalArtInterest !== null && !isAsyncDigitalArtInterest(payload.digitalArtInterest)) reasons.push("digitalArtInterest_missing_or_invalid");
  if (!Array.isArray(payload.outputs)) reasons.push("outputs_missing_or_invalid");
  if (Array.isArray(payload.outputs)) {
    payload.outputs.forEach((rawOutput, index) => {
      if (!rawOutput || typeof rawOutput !== "object" || Array.isArray(rawOutput)) {
        reasons.push("outputs[" + index + "]_not_object");
        return;
      }
      const output = rawOutput as Record<string, unknown>;
      if (typeof output.id !== "string") reasons.push("outputs[" + index + "].id_invalid");
      if (typeof output.url !== "string") reasons.push("outputs[" + index + "].url_invalid");
      if (typeof output.contentType !== "string") reasons.push("outputs[" + index + "].contentType_invalid");
      if (output.width !== undefined && !Number.isInteger(output.width)) reasons.push("outputs[" + index + "].width_invalid");
      if (output.height !== undefined && !Number.isInteger(output.height)) reasons.push("outputs[" + index + "].height_invalid");
    });
    if (payload.outputs.length === 0) reasons.push("outputs_empty");
  }
  if (reasons.length > 0) return invalidCallback(...reasons);
  const outputs = (payload.outputs as Array<Record<string, unknown>>).map((output) => ({
    id: output.id as string,
    url: output.url as string,
    contentType: output.contentType as string,
    width: output.width as number | undefined,
    height: output.height as number | undefined,
  }));
  return { ok: true, value: {
    jobVersion: 1,
    generationRequestId: payload.generationRequestId as string,
    processingAttemptId: payload.processingAttemptId as string,
    status: "success",
    prompt: payload.prompt as string,
    iconMetadata: payload.iconMetadata as AsyncIconMetadata,
    digitalArtInterest: payload.digitalArtInterest as AsyncDigitalArtInterest | null,
    predictionId: typeof payload.predictionId === "string" ? payload.predictionId : undefined,
    outputs,
  }};
}

export function parseAsyncGenerationSuccessCallback(
  value: unknown,
): AsyncGenerationSuccessCallback | null {
  const result = validateAsyncGenerationSuccessCallback(value);
  return result.ok ? result.value : null;
}

export function applyAsyncDigitalArtInterestState(
  current: { first: AsyncDigitalArtInterest | null; latest: AsyncDigitalArtInterest | null },
  interest: AsyncDigitalArtInterest | null,
) {
  if (!interest) return current;
  return { first: current.first ?? interest, latest: interest };
}
