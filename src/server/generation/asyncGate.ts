import { TRPCError } from "@trpc/server";

/**
 * Async generation is opt-in at the server boundary. Any value other than the
 * exact string "true" keeps the route disabled.
 */
export function assertAsyncGenerationEnabled(value: string | undefined): void {
  if (value === "true") return;

  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message: "Async generation is disabled.",
  });
}
