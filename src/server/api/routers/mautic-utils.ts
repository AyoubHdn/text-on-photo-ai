// ~/server/api/routers/mautic-utils.ts
import { env } from "~/env.mjs"; // Ensure this path is correct

// Define a more structured response type, can be expanded
export interface MauticApiResponse {
  contact?: { id?: number; [key: string]: any };
  errors?: Array<{ message: string; code: number; type: string }>;
  [key: string]: unknown; // Allows for other properties Mautic might send
}

// Define the shape of the data we'll send to Mautic (payload for create/update)
// This includes all possible fields we might want to set.
interface MauticContactPayload {
  email: string;
  firstname?: string;
  lastname?: string;
  // NameDesignAI specific
  credits?: string | number; // Mautic might prefer strings for some custom fields
  plan?: string;
  // GamingLogoAI specific
  gaming_credits?: string | number;
  gaming_plan?: string;
  // Brand tracking
  brand_origin?: string[]; // For multi-select
  last_interaction_brand?: string;
}

// Your existing function signature, slightly adapted for brand context
export async function updateMauticContact(
  contactInput: { // This is the data from your app
    email: string;
    name?: string | null;
    // These will be specific to the brand calling the function
    brand_specific_credits?: number | null;
    brand_specific_plan?: string | null;
  },
  currentBrand: 'namedesignai' | 'gaminglogoai'
): Promise<MauticApiResponse> {
  const mauticBaseUrl = env.MAUTIC_BASE_URL;
  const mauticUsername = env.MAUTIC_USERNAME;
  const mauticPassword = env.MAUTIC_PASSWORD;

  if (!mauticBaseUrl || !mauticUsername || !mauticPassword) {
    console.error("MAUTIC_UTIL: Mautic credentials or base URL are not configured.");
    // Returning an error structure consistent with MauticApiResponse
    return { errors: [{ message: "Mautic configuration missing", code: 500, type: "configuration_error" }] };
  }

  const authHeader = "Basic " + Buffer.from(`${mauticUsername}:${mauticPassword}`).toString("base64");

  const [firstnameFromInput, ...restName] = contactInput.name ? contactInput.name.split(" ") : [""];
  const lastnameFromInput = restName.join(" ") || "";

  // Prepare the base payload for Mautic
  const mauticPayloadForApi: Partial<MauticContactPayload> = {
    email: contactInput.email,
    ...(firstnameFromInput && { firstname: firstnameFromInput }),
    ...(lastnameFromInput && { lastname: lastnameFromInput }),
    last_interaction_brand: currentBrand,
    credits: undefined, // Explicitly undefined initially
    plan: undefined,    // Explicitly undefined initially
    gaming_credits: undefined, // Explicitly undefined initially
    gaming_plan: undefined,    // Explicitly undefined initially
    brand_origin: undefined,
  };

  // Add brand-specific credit/plan fields to the payload
  if (currentBrand === 'namedesignai') {
    if (contactInput.brand_specific_credits !== undefined && contactInput.brand_specific_credits !== null) {
      mauticPayloadForApi.credits = contactInput.brand_specific_credits === 0 ? "No credits" : String(contactInput.brand_specific_credits);
    }
    if (contactInput.brand_specific_plan) {
      mauticPayloadForApi.plan = contactInput.brand_specific_plan; // Assuming Mautic's 'plan' field alias
    }
  } else if (currentBrand === 'gaminglogoai') {
    if (contactInput.brand_specific_credits !== undefined && contactInput.brand_specific_credits !== null) {
      // Assuming Mautic's 'gaming_credits' field alias
      mauticPayloadForApi.gaming_credits = contactInput.brand_specific_credits === 0 ? "No credits" : String(contactInput.brand_specific_credits);
    }
    if (contactInput.brand_specific_plan) {
      mauticPayloadForApi.gaming_plan = contactInput.brand_specific_plan; // Assuming Mautic's 'gaming_plan' field alias
    }
    mauticPayloadForApi.credits = undefined;
    mauticPayloadForApi.plan = undefined;
  }

  try {
    // 1. Search for existing contact
    const searchResponse = await fetch(`${mauticBaseUrl}/api/contacts?search=email:${encodeURIComponent(contactInput.email)}&limit=1`, {
      method: "GET",
      headers: { Authorization: authHeader },
    });

    if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error(`MAUTIC_UTIL: Error searching contact ${contactInput.email} - Status ${searchResponse.status}:`, errorText);
        return { errors: [{ message: `Mautic search error: ${errorText}`, code: searchResponse.status, type: "api_error" }] };
    }

    const searchData = await searchResponse.json() as { total?: string | number; contacts?: Record<string, { id: number; fields?: { all?: Record<string, any> } }> };
    const existingContactIdStr = searchData.contacts && Object.keys(searchData.contacts).length > 0 ? Object.keys(searchData.contacts)[0] : null;
    const existingMauticContactData = existingContactIdStr ? searchData.contacts?.[existingContactIdStr] : null;

    let mauticApiUrl: string;
    let httpMethod: 'POST' | 'PATCH';

    if (existingMauticContactData?.id) {
      // Contact Exists - Prepare for PATCH
      console.log(`MAUTIC_UTIL: Found existing contact ID: ${existingMauticContactData.id} for ${contactInput.email}`);
      mauticApiUrl = `${mauticBaseUrl}/api/contacts/${existingMauticContactData.id}/edit`;
      httpMethod = "PATCH";

      // Handle multi-select 'brand_origin' for existing contact
      const rawBrandOrigins: unknown = existingMauticContactData.fields?.all?.brand_origin;
      let currentBrandOrigins: string[] = [];

      if (typeof rawBrandOrigins === 'string' && rawBrandOrigins.trim() !== '') {
        currentBrandOrigins = rawBrandOrigins.includes('|') ? rawBrandOrigins.split('|') : [rawBrandOrigins];
      } else if (Array.isArray(rawBrandOrigins)) {
        currentBrandOrigins = rawBrandOrigins.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
      }
      currentBrandOrigins = currentBrandOrigins.map(s => s.trim()).filter(Boolean);

      if (!currentBrandOrigins.includes(currentBrand)) {
        currentBrandOrigins.push(currentBrand);
      }
      mauticPayloadForApi.brand_origin = currentBrandOrigins.length > 0 ? currentBrandOrigins : undefined;

    } else {
      // Contact Does Not Exist - Prepare for POST
      console.log(`MAUTIC_UTIL: No Mautic contact found for ${contactInput.email}. Creating new.`);
      mauticApiUrl = `${mauticBaseUrl}/api/contacts/new`;
      httpMethod = "POST";
      mauticPayloadForApi.brand_origin = [currentBrand]; // Initialize as an array
    }

    // 2. Create or Update contact
    const response = await fetch(mauticApiUrl, {
      method: httpMethod,
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(mauticPayloadForApi),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`MAUTIC_UTIL: Error ${httpMethod === 'POST' ? 'creating' : 'updating'} contact ${contactInput.email} - Status ${response.status}:`, errorText);
      return { errors: [{ message: `Mautic ${httpMethod} error: ${errorText}`, code: response.status, type: "api_error" }] };
    }

    const responseData = await response.json() as MauticApiResponse;
    console.log(`MAUTIC_UTIL: Successfully ${httpMethod === 'POST' ? 'created' : 'updated'} Mautic contact for ${contactInput.email}:`, responseData.contact ?? responseData);
    return responseData;

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Mautic processing error";
    console.error(`MAUTIC_UTIL: Error processing contact ${contactInput.email} for brand ${currentBrand}:`, message);
    // Ensure a MauticApiResponse is returned even in case of unexpected errors
    return { errors: [{ message, code: 500, type: "internal_error" }] };
  }
}