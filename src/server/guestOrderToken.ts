import crypto from "crypto";
import { env } from "~/env.mjs";

type GuestOrderPayload = {
  o: string;
  exp: number;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TOKEN_SECRET = env.NEXTAUTH_SECRET ?? env.STRIPE_SECRET_KEY;

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(data: string): string {
  return crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("base64url");
}

export function createGuestOrderToken(orderId: string): string {
  const payload: GuestOrderPayload = {
    o: orderId,
    exp: Date.now() + ONE_DAY_MS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyGuestOrderToken(
  token: string | null | undefined,
  orderId: string,
): boolean {
  if (!token) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;
  if (sign(encodedPayload) !== signature) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as GuestOrderPayload;
    if (payload.o !== orderId) return false;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}
