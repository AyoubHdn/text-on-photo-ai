// ~/server/api/routers/mautic-utils.ts
import { env } from "~/env.mjs";

export interface MauticResponse {
  contact?: unknown;
  errors?: string[];
  [key: string]: unknown;
}

export async function updateMauticContact(contact: {
  email: string;
  name?: string | null;
  credits?: number;
  plan?: string;
}): Promise<MauticResponse> {
  const mauticBaseUrl = env.MAUTIC_BASE_URL!;
  const mauticUsername = env.MAUTIC_USERNAME!;
  const mauticPassword = env.MAUTIC_PASSWORD!;
  const authHeader =
    "Basic " + Buffer.from(`${mauticUsername}:${mauticPassword}`).toString("base64");

  const [firstname, ...rest] = contact.name ? contact.name.split(" ") : [""];
  const lastname = rest.join(" ") || "";

  const payload: { [key: string]: unknown } = {
    email: contact.email,
    firstname,
    lastname,
  };

  if (contact.credits !== undefined) {
    payload.credits = contact.credits === 0 ? "No credits" : String(contact.credits);
  }

  if (contact.plan !== undefined) {
    payload.plan = contact.plan;
  }

  try {
    const searchResponse = await fetch(`${mauticBaseUrl}/api/contacts?search=email:${contact.email}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });
    const searchData = (await searchResponse.json()) as { contacts: Record<string, any> };
    const contactId = searchData.contacts ? Object.keys(searchData.contacts)[0] : null;

    if (contactId) {
      const updateResponse = await fetch(`${mauticBaseUrl}/api/contacts/${contactId}/edit`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });
      return (await updateResponse.json()) as MauticResponse;
    } else {
      const createResponse = await fetch(`${mauticBaseUrl}/api/contacts/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });
      return (await createResponse.json()) as MauticResponse;
    }
  } catch (err) {
    console.error(`Error syncing contact ${contact.email}:`, err);
    throw err;
  }
}