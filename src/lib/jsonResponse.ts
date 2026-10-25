export function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getJsonString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  return typeof value[key] === "string" ? value[key] : undefined;
}

export function getJsonNumber(
  value: Record<string, unknown>,
  key: string,
): number | undefined {
  return typeof value[key] === "number" ? value[key] : undefined;
}
