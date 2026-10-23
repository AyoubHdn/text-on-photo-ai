import { useCallback, useState } from "react";

import { ASYNC_GENERATION_FEATURE_ENABLED } from "~/lib/asyncGeneration";
import { api, type RouterInputs, type RouterOutputs } from "~/utils/api";

type AsyncGenerationInput = RouterInputs["generate"]["generateIconAsync"];
export type AsyncGenerationStatus = NonNullable<
  RouterOutputs["generate"]["getGenerationStatus"]
>;

export function useAsyncGeneration() {
  const [generationRequestId, setGenerationRequestId] = useState<string | null>(
    null,
  );
  const startMutation = api.generate.generateIconAsync.useMutation();
  const statusQuery = api.generate.getGenerationStatus.useQuery(
    { generationRequestId: generationRequestId ?? "" },
    {
      enabled: ASYNC_GENERATION_FEATURE_ENABLED && Boolean(generationRequestId),
      refetchInterval: (data) =>
        data?.status === "completed" || data?.status === "failed"
          ? false
          : 1000,
    },
  );

  const start = useCallback(
    async (input: AsyncGenerationInput) => {
      if (!ASYNC_GENERATION_FEATURE_ENABLED) {
        throw new Error("Async generation is disabled.");
      }
      const result = await startMutation.mutateAsync(input);
      setGenerationRequestId(result.generationRequestId);
      return result;
    },
    [startMutation],
  );

  const reset = useCallback(() => {
    setGenerationRequestId(null);
    statusQuery.remove();
  }, [statusQuery]);

  return {
    start,
    reset,
    generationRequestId,
    status: statusQuery.data ?? null,
    isStarting: startMutation.isLoading,
    isPolling:
      Boolean(generationRequestId) &&
      statusQuery.data?.status !== "completed" &&
      statusQuery.data?.status !== "failed",
    error: startMutation.error ?? statusQuery.error ?? null,
  };
}
