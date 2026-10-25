import { z } from "zod";

/**
 * Specify your server-side environment variables schema here. This way you can ensure the app isn't
 * built with invalid env vars.
 */
const server = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXTAUTH_SECRET:
    process.env.NODE_ENV === "production"
      ? z.string().min(1)
      : z.string().min(1).optional(),
  NEXTAUTH_URL: z.preprocess(
    // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
    // Since NextAuth.js automatically uses the VERCEL_URL if present.
    (str) => process.env.VERCEL_URL ?? str,
    // VERCEL_URL doesn't include `https` so it cant be validated as a URL
    process.env.VERCEL ? z.string().min(1) : z.string().url(),
  ),
  // Add `.min(1) on ID and SECRET if you want to make sure they're not empty
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  REPLICATE_API_TOKEN: z.string(),
  MOCK_REPLICATE: z.string(),
  SECRET_ACCESS_KEY: z.string(),
  ACCESS_KEY_ID: z.string(),
  GENERATION_LAMBDA_REGION: z.string().optional(),
  GENERATION_LAMBDA_FUNCTION_NAME: z.string().optional(),
  GENERATION_LAMBDA_ACCESS_KEY_ID: z.string().optional(),
  GENERATION_LAMBDA_SECRET_ACCESS_KEY: z.string().optional(),
  GENERATION_INTERNAL_HMAC_SECRET: z.string().optional(),
  ASYNC_GENERATION_ENABLED: z.enum(["true", "false"]).optional(),
  GENERATION_EXECUTION_SCOPE: z.string().optional(),
  STRIPE_SECRET_KEY: z.string(),
  HOST_NAME: z.string(),
  STRIPE_WEB_HOOK_SECRET: z.string(),
  PRICE_ID_STARTER: z.string(),
  PRICE_ID_PRO: z.string(),
  PRICE_ID_ELITE: z.string(),
  MAUTIC_BASE_URL: z.string(),
  MAUTIC_API_TOKEN: z.string().optional(),
  MAUTIC_USERNAME: z.string(),
  MAUTIC_PASSWORD: z.string(),
  MAUTIC_ORDER_CONFIRMED_TEMPLATE_ID: z.string().optional(),
  MAUTIC_ORDER_SHIPPED_TEMPLATE_ID: z.string().optional(),
  MAUTIC_ORDER_DELIVERED_TEMPLATE_ID: z.string().optional(),
  MAUTIC_TRACKING_NUMBER_FIELD: z.string().optional(),
  MAUTIC_TRACKING_URL_FIELD: z.string().optional(),
  MAUTIC_TRACKING_CARRIER_FIELD: z.string().optional(),
  CRON_SECRET: z.string(),
  CPX_SECURITY_HASH: z.string(),
  CPX_APP_ID: z.string(),
  IPAPI_KEY: z.string(),
  META_PIXEL_ID: z.string(),
  META_ACCESS_TOKEN: z.string(),
});

/**
 * Specify your client-side environment variables schema here. This way you can ensure the app isn't
 * built with invalid env vars. To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
const client = z.object({
  // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
  NEXT_PUBLIC_STRIPE_KEY: z.string(),
  NEXT_PUBLIC_S3_REGION: z.string(),
  NEXT_PUBLIC_S3_BUCKET_NAME: z.string(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_CONTENT_SLOT_ID: z.string().optional(),
});

/**
 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
 * middlewares) or client-side so we need to destruct manually.
 *
 * @type {Record<keyof z.infer<typeof server> | keyof z.infer<typeof client>, string | undefined>}
 */
const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
  MOCK_REPLICATE: process.env.MOCK_REPLICATE,
  SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
  ACCESS_KEY_ID: process.env.ACCESS_KEY_ID,
  GENERATION_LAMBDA_REGION: process.env.GENERATION_LAMBDA_REGION,
  GENERATION_LAMBDA_FUNCTION_NAME: process.env.GENERATION_LAMBDA_FUNCTION_NAME,
  GENERATION_LAMBDA_ACCESS_KEY_ID: process.env.GENERATION_LAMBDA_ACCESS_KEY_ID,
  GENERATION_LAMBDA_SECRET_ACCESS_KEY: process.env.GENERATION_LAMBDA_SECRET_ACCESS_KEY,
  GENERATION_INTERNAL_HMAC_SECRET: process.env.GENERATION_INTERNAL_HMAC_SECRET,
  ASYNC_GENERATION_ENABLED: process.env.ASYNC_GENERATION_ENABLED,
  GENERATION_EXECUTION_SCOPE: process.env.GENERATION_EXECUTION_SCOPE,
  NEXT_PUBLIC_STRIPE_KEY: process.env.NEXT_PUBLIC_STRIPE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  HOST_NAME: process.env.HOST_NAME,
  STRIPE_WEB_HOOK_SECRET: process.env.STRIPE_WEB_HOOK_SECRET,
  PRICE_ID_STARTER: process.env.PRICE_ID_STARTER,
  PRICE_ID_PRO: process.env.PRICE_ID_PRO,
  PRICE_ID_ELITE: process.env.PRICE_ID_ELITE,
  MAUTIC_BASE_URL: process.env.MAUTIC_BASE_URL,
  MAUTIC_API_TOKEN: process.env.MAUTIC_API_TOKEN,
  MAUTIC_USERNAME: process.env.MAUTIC_USERNAME,
  MAUTIC_PASSWORD: process.env.MAUTIC_PASSWORD,
  MAUTIC_ORDER_CONFIRMED_TEMPLATE_ID: process.env.MAUTIC_ORDER_CONFIRMED_TEMPLATE_ID,
  MAUTIC_ORDER_SHIPPED_TEMPLATE_ID: process.env.MAUTIC_ORDER_SHIPPED_TEMPLATE_ID,
  MAUTIC_ORDER_DELIVERED_TEMPLATE_ID: process.env.MAUTIC_ORDER_DELIVERED_TEMPLATE_ID,
  MAUTIC_TRACKING_NUMBER_FIELD: process.env.MAUTIC_TRACKING_NUMBER_FIELD,
  MAUTIC_TRACKING_URL_FIELD: process.env.MAUTIC_TRACKING_URL_FIELD,
  MAUTIC_TRACKING_CARRIER_FIELD: process.env.MAUTIC_TRACKING_CARRIER_FIELD,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_S3_REGION: process.env.NEXT_PUBLIC_S3_REGION,
  NEXT_PUBLIC_S3_BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
  NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
  NEXT_PUBLIC_ADSENSE_CLIENT_ID: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  NEXT_PUBLIC_ADSENSE_CONTENT_SLOT_ID:
    process.env.NEXT_PUBLIC_ADSENSE_CONTENT_SLOT_ID,
  CPX_SECURITY_HASH: process.env.CPX_SECURITY_HASH,
  CPX_APP_ID: process.env.CPX_APP_ID,
  IPAPI_KEY: process.env.IPAPI_KEY,
  META_PIXEL_ID: process.env.META_PIXEL_ID,
  META_ACCESS_TOKEN: process.env.META_ACCESS_TOKEN,
  // Add more client-side env vars here
  // Make sure to prefix them with `NEXT_PUBLIC_`
  // e.g.
  // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
};

// Don't touch the part below
// --------------------------

const merged = server.merge(client);

/** @typedef {z.input<typeof merged>} MergedInput */
/** @typedef {z.infer<typeof merged>} MergedOutput */
/** @typedef {z.SafeParseReturnType<MergedInput, MergedOutput>} MergedSafeParseReturn */

const isServer = typeof window === "undefined";

/**
 * Keep client/server access protection in both the validated path and the
 * explicit SKIP_ENV_VALIDATION escape hatch. The escape hatch intentionally
 * skips parsing, but it does not make raw process.env the validated value.
 *
 * @param {Record<string, string | undefined>} values
 * @returns {MergedOutput}
 */
function createEnvProxy(values) {
  return new Proxy(
    /** @type {MergedOutput} */ (/** @type {unknown} */ (values)),
    {
      get(target, prop) {
        if (typeof prop !== "string") return undefined;
        if (!isServer && !prop.startsWith("NEXT_PUBLIC_"))
          throw new Error(
            process.env.NODE_ENV === "production"
              ? "❌ Attempted to access a server-side environment variable on the client"
              : `❌ Attempted to access server-side environment variable '${prop}' on the client`,
          );
        return target[/** @type {keyof typeof target} */ (prop)];
      },
    },
  );
}

/** @returns {MergedOutput} */
function loadValidatedEnv() {
  const parsed = /** @type {MergedSafeParseReturn} */ (
    isServer
      ? merged.safeParse(processEnv)
      : client.safeParse(processEnv)
  );

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables");
  }

  return createEnvProxy(parsed.data);
}

/** @returns {MergedOutput} */
function loadUnvalidatedEnv() {
  return createEnvProxy(processEnv);
}

const env = process.env.SKIP_ENV_VALIDATION
  ? loadUnvalidatedEnv()
  : loadValidatedEnv();

export { env };
