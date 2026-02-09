// src/server/printful/client.ts
/* eslint-disable @typescript-eslint/restrict-template-expressions */
const PRINTFUL_API_URL = "https://api.printful.com";

export async function printfulRequest<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
) {
  const res = await fetch(`${PRINTFUL_API_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printful API error: ${text}`);
  }

  return res.json() as Promise<T>;
}
