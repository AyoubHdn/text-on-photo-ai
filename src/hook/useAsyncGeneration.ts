import { useCallback, useEffect, useRef, useState } from "react";

import {
  ASYNC_GENERATION_FEATURE_ENABLED,
  isNewAsyncTerminalStatus,
} from "~/lib/asyncGeneration";
import { api, type RouterInputs, type RouterOutputs } from "~/utils/api";

type AsyncGenerationInput = RouterInputs["generate"]["generateIconAsync"];
export type AsyncGenerationStatus = NonNullable<
  RouterOutputs["generate"]["getGenerationStatus"]
>;

type AsyncGenerationOptions = {
  enabled: boolean;
  onCompleted?: (status: AsyncGenerationStatus) => void;
  onFailed?: (status: AsyncGenerationStatus) => void;
};

export function useAsyncGeneration(options: AsyncGenerationOptions) {
  const [generationRequestId, setGenerationRequestId] = useState<string | null>(
    null
  );
  const startMutation = api.generate.generateIconAsync.useMutation();
  const statusQuery = api.generate.getGenerationStatus.useQuery(
    { generationRequestId: generationRequestId ?? "" },
    {
      enabled:
        options.enabled &&
        ASYNC_GENERATION_FEATURE_ENABLED &&
        Boolean(generationRequestId),
      refetchInterval: (data) =>
        data?.status === "completed" || data?.status === "failed"
          ? false
          : 1000,
    }
  );
  const onCompletedRef = useRef(options.onCompleted);
  const onFailedRef = useRef(options.onFailed);
  const handledTerminalRequestIdRef = useRef<string | null>(null);
  useEffect(() => {
    onCompletedRef.current = options.onCompleted;
    onFailedRef.current = options.onFailed;
  }, [options.onCompleted, options.onFailed]);

  const reset = useCallback(() => {
    setGenerationRequestId(null);
    statusQuery.remove();
  }, [statusQuery]);

  useEffect(() => {
    const status = statusQuery.data;
    if (
      !status ||
      !isNewAsyncTerminalStatus(
        generationRequestId,
        status.status,
        handledTerminalRequestIdRef.current
      )
    ) {
      return;
    }

    handledTerminalRequestIdRef.current = generationRequestId;
    if (status.status === "completed") {
      onCompletedRef.current?.(status);
    } else {
      onFailedRef.current?.(status);
    }
    reset();
  }, [generationRequestId, reset, statusQuery.data]);

  const start = useCallback(
    async (input: AsyncGenerationInput) => {
      if (!options.enabled || !ASYNC_GENERATION_FEATURE_ENABLED) {
        throw new Error("Async generation is disabled.");
      }
      handledTerminalRequestIdRef.current = null;
      setGenerationRequestId(input.generationRequestId);
      const result = await startMutation.mutateAsync(input);
      setGenerationRequestId(result.generationRequestId);
      return result;
    },
    [options.enabled, startMutation]
  );

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
