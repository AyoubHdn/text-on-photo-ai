import { loadStripe } from "@stripe/stripe-js";
import { env } from "~/env.mjs";
import { api } from "~/utils/api";

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_KEY);

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const part of cookies) {
    const [k, ...rest] = part.split("=");
    if (k === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

function getMetaTrackingParams() {
  const fbp = readCookie("_fbp");
  let fbc = readCookie("_fbc");
  const fbclid =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("fbclid")
      : null;
  if (!fbc && fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
  }
  return {
    fbp: fbp ?? undefined,
    fbc: fbc ?? undefined,
  };
}

export function useBuyCredits() {
  const checkout = api.checkout.createCheckout.useMutation();

  return {
    buyCredits: async (
      plan: "starter" | "pro" | "elite",
      options?: {
        returnPath?: string;
        purchaseContext?: "generate" | "preview" | "remove_background";
        openInNewTab?: boolean;
      }
    ) => {
      try {
        const response = await checkout.mutateAsync({
          plan,
          returnPath: options?.returnPath,
          purchaseContext: options?.purchaseContext,
          tracking: getMetaTrackingParams(),
        });

        if (options?.openInNewTab && response.url) {
          window.open(response.url, "_blank", "noopener,noreferrer");
          return;
        }

        const stripe = await stripePromise;
        await stripe?.redirectToCheckout({
          sessionId: response.id,
        });
      } catch (error) {
        console.error("Error in buyCredits:", error);
        throw error;
      }
    },
  };
}
