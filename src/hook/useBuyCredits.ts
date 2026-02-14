import { loadStripe } from "@stripe/stripe-js";
import { env } from "~/env.mjs";
import { api } from "~/utils/api";

const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_KEY);

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
