import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env.mjs";

type Body = {
  email?: unknown;
  source?: unknown;
};

function getMauticAuthHeader() {
  if (env.MAUTIC_API_TOKEN?.trim()) {
    return `Bearer ${env.MAUTIC_API_TOKEN.trim()}`;
  }
  return `Basic ${Buffer.from(`${env.MAUTIC_USERNAME}:${env.MAUTIC_PASSWORD}`).toString("base64")}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body as Body;
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
  const source =
    typeof body.source === "string" ? body.source.trim() : "exit-intent";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  try {
    const mauticUrl = `${env.MAUTIC_BASE_URL.replace(/\/+$/, "")}/api/contacts/new`;
    const response = await fetch(mauticUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: getMauticAuthHeader(),
      },
      body: JSON.stringify({
        email,
        tags: [source],
        last_interaction_brand: "namedesignai",
      }),
    });

    if (!response.ok && response.status !== 409) {
      const text = await response.text();
      console.error("[EMAIL_CAPTURE] Mautic error", response.status, text);
      return res.status(500).json({ error: "Failed to subscribe. Please try again." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[EMAIL_CAPTURE]", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}
