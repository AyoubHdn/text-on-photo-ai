import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export async function sha256Hex(value: string): Promise<string> {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export async function signGenerationMessage(
  secret: string,
  timestamp: string,
  nonce: string,
  rawBody: string,
): Promise<string> {
  const bodyHash = await sha256Hex(rawBody);
  return createHmac("sha256", secret)
    .update(`${timestamp}.${nonce}.${bodyHash}`, "utf8")
    .digest("hex");
}

export async function verifyGenerationSignature(
  secret: string,
  timestamp: string,
  nonce: string,
  rawBody: string,
  signature: string,
  now = Date.now(),
): Promise<boolean> {
  if (!secret || !timestamp || !nonce || !/^[0-9]+$/.test(timestamp) || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const timestampMs = Number(timestamp);
  if (!Number.isSafeInteger(timestampMs) || Math.abs(now - timestampMs) > 5 * 60 * 1000) return false;
  const expected = await signGenerationMessage(secret, timestamp, nonce, rawBody);
  const left = Buffer.from(expected.toLowerCase(), "utf8");
  const right = Buffer.from(signature.toLowerCase(), "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export class NonceReplayGuard {
  private readonly seen = new Map<string, number>();
  private readonly ttlMs: number;
  constructor(ttlMs = 5 * 60 * 1000) { this.ttlMs = ttlMs; }
  accept(nonce: string, now = Date.now()): boolean {
    for (const [key, expires] of this.seen) if (expires <= now) this.seen.delete(key);
    if (!nonce || this.seen.has(nonce)) return false;
    this.seen.set(nonce, now + this.ttlMs); return true;
  }
}
