import { useCallback, useEffect, useRef, useState } from "react";

import {
  ASYNC_GENERATION_FEATURE_ENABLED,
  clearPendingAsyncGeneration,
  isAmbiguousAsyncSubmissionError,
  isNewAsyncTerminalStatus,
  readPendingAsyncGeneration,
  writePendingAsyncGeneration,
} from "~/lib/asyncGeneration";
import { api, type RouterInputs, type RouterOutputs } from "~/utils/api";

type AsyncGenerationInput = RouterInputs["generate"]["generateIconAsync"];
export type AsyncGenerationStatus = NonNullable<
  RouterOutputs["generate"]["getGenerationStatus"]
>;

type AsyncGenerationOptions = {
  enabled: boolean;
  userId: string | null;
  sourcePage: string;
  onCompleted?: (status: AsyncGenerationStatus) => void;
  onFailed?: (status: AsyncGenerationStatus) => void;
  onStatusError?: (error: unknown) => void;
};

export function useAsyncGeneration(options: AsyncGenerationOptions) {
  const [generationRequestId, setGenerationRequestId] = useState<string | null>(
    null
  );
  const [statusCheckPaused, setStatusCheckPaused] = useState(false);
  const onCompletedRef = useRef(options.onCompleted);
  const onFailedRef = useRef(options.onFailed);
  const onStatusErrorRef = useRef(options.onStatusError);
  const handledTerminalRequestIdRef = useRef<string | null>(null);
  const previousScopeRef = useRef<{ userId: string; sourcePage: string } | null>(
    null,
  );
  const startMutation = api.generate.generateIconAsync.useMutation();
  const statusQuery = api.generate.getGenerationStatus.useQuery(
    { generationRequestId: generationRequestId ?? "" },
    {
      enabled:
        options.enabled &&
        ASYNC_GENERATION_FEATURE_ENABLED &&
        Boolean(generationRequestId) &&
        !statusCheckPaused,
      refetchInterval: (data) =>
        statusCheckPaused ||
        data?.status === "completed" ||
        data?.status === "failed"
          ? false
          : 1000,
      retry: false,
      onError: (error) => {
        setStatusCheckPaused(true);
        onStatusErrorRef.current?.(error);
      },
    }
  );
  const removeStatus = statusQuery.remove;
  useEffect(() => {
    onCompletedRef.current = options.onCompleted;
    onFailedRef.current = options.onFailed;
    onStatusErrorRef.current = options.onStatusError;
  }, [options.onCompleted, options.onFailed, options.onStatusError]);

  useEffect(() => {
    const previousScope = previousScopeRef.current;
    if (
      previousScope &&
      (previousScope.userId !== options.userId ||
        previousScope.sourcePage !== options.sourcePage)
    ) {
      clearPendingAsyncGeneration(previousScope.userId, previousScope.sourcePage);
    }
    previousScopeRef.current = options.userId
      ? { userId: options.userId, sourcePage: options.sourcePage }
      : null;
    handledTerminalRequestIdRef.current = null;
    setStatusCheckPaused(false);
    setGenerationRequestId(null);
    removeStatus();

    if (!options.enabled || !ASYNC_GENERATION_FEATURE_ENABLED || !options.userId) {
      return;
    }
    const pendingRequestId = readPendingAsyncGeneration(
      options.userId,
      options.sourcePage,
    );
    if (pendingRequestId) setGenerationRequestId(pendingRequestId);
  }, [options.enabled, options.sourcePage, options.userId, removeStatus]);

  const reset = useCallback(() => {
    clearPendingAsyncGeneration(options.userId, options.sourcePage);
    setGenerationRequestId(null);
    setStatusCheckPaused(false);
    removeStatus();
  }, [options.sourcePage, options.userId, removeStatus]);

  const resumeStatus = useCallback(async () => {
    if (!generationRequestId) return null;
    setStatusCheckPaused(false);
    return statusQuery.refetch();
  }, [generationRequestId, statusQuery.refetch]);

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
    clearPendingAsyncGeneration(options.userId, options.sourcePage);
    if (status.status === "completed") {
      onCompletedRef.current?.(status);
    } else {
      onFailedRef.current?.(status);
    }
    reset();
  }, [
    generationRequestId,
    options.sourcePage,
    options.userId,
    reset,
    statusQuery.data,
  ]);

  const start = useCallback(
    async (input: AsyncGenerationInput) => {
      if (!options.enabled || !ASYNC_GENERATION_FEATURE_ENABLED) {
        throw new Error("Async generation is disabled.");
      }
      handledTerminalRequestIdRef.current = null;
      setGenerationRequestId(input.generationRequestId);
      writePendingAsyncGeneration(
        options.userId,
        options.sourcePage,
        input.generationRequestId,
      );
      setStatusCheckPaused(false);
      try {
        const result = await startMutation.mutateAsync(input);
        setGenerationRequestId(result.generationRequestId);
        writePendingAsyncGeneration(
          options.userId,
          options.sourcePage,
          result.generationRequestId,
        );
        return result;
      } catch (error) {
        if (!isAmbiguousAsyncSubmissionError(error)) {
          clearPendingAsyncGeneration(options.userId, options.sourcePage);
          setGenerationRequestId(null);
          removeStatus();
        }
        throw error;
      }
    },
    [
      options.enabled,
      options.sourcePage,
      options.userId,
      removeStatus,
      startMutation,
    ]
  );

  return {
    start,
    reset,
    resumeStatus,
    generationRequestId,
    status: statusQuery.data ?? null,
    isStarting: startMutation.isLoading,
    isPolling:
      Boolean(generationRequestId) &&
      statusQuery.data?.status !== "completed" &&
      statusQuery.data?.status !== "failed",
    canResumeStatus: Boolean(generationRequestId && statusCheckPaused),
    error: startMutation.error ?? statusQuery.error ?? null,
  };
}
