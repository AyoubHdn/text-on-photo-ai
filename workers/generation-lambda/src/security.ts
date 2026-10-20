const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("");

export async function sha256Hex(value: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

export async function signGenerationMessage(secret: string, timestamp: string, nonce: string, rawBody: string): Promise<string> {
  const bodyHash = await sha256Hex(rawBody);
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${nonce}.${bodyHash}`)));
}

export async function verifyGenerationSignature(secret: string, timestamp: string, nonce: string, rawBody: string, signature: string, now = Date.now()): Promise<boolean> {
  if (!secret || !timestamp || !nonce || !/^[0-9]+$/.test(timestamp) || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const timestampMs = Number(timestamp);
  if (!Number.isSafeInteger(timestampMs) || Math.abs(now - timestampMs) > 5 * 60 * 1000) return false;
  const expected = await signGenerationMessage(secret, timestamp, nonce, rawBody);
  const left = encoder.encode(expected.toLowerCase()); const right = encoder.encode(signature.toLowerCase());
  if (left.length !== right.length) return false;
  let difference = 0; for (let index = 0; index < left.length; index++) difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  return difference === 0;
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
