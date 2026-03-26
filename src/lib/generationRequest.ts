export function createGenerationRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `gen_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
