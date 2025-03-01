// /server/api/routers/mautic-utils.ts

import { env } from "~/env.mjs";
import type { User } from "@prisma/client";

export interface MauticResponse {
  contact?: unknown;
  errors?: string[];
  [key: string]: unknown;
}

export async function updateMauticContact(contact: {
  email: string;
  name?: string | null;
  credits?: number;
}): Promise<MauticResponse> {
  const mauticBaseUrl = env.MAUTIC_BASE_URL!;
  const mauticUsername = env.MAUTIC_USERNAME!;
  const mauticPassword = env.MAUTIC_PASSWORD!;
  const authHeader =
    "Basic " + Buffer.from(`${mauticUsername}:${mauticPassword}`).toString("base64");

  // Split the name into first and last names.
  const [firstname, ...rest] = contact.name ? contact.name.split(" ") : [""];
  const lastname = rest.join(" ") || "";

  // Build payload for update or creation.
  // If credits is defined, send "No credits" when it's 0; otherwise, send the credit value as a string.
  const payload: { [key: string]: unknown } = {
    email: contact.email,
    firstname,
    lastname,
  };

  if (contact.credits !== undefined) {
    payload.credits = contact.credits === 0 ? "No credits" : String(contact.credits);
  }

  const response = await fetch(`${mauticBaseUrl}/api/contacts/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as MauticResponse;
  return data;
}
