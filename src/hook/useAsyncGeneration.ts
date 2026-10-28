import { useCallback, useEffect, useRef, useState } from "react";

import {
  ASYNC_GENERATION_FEATURE_ENABLED,
  clearPendingAsyncGeneration,
  isAmbiguousAsyncSubmissionError,
  isNewAsyncTerminalStatus,
  ObsoleteAsyncGenerationOperationError,
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

const MAX_CONSECUTIVE_NULL_STATUS_RESPONSES = 3;

type ActiveAsyncOperation = {
  token: number;
  userId: string | null;
  sourcePage: string;
  requestId: string;
};

function isValidAsyncGenerationInput(value: unknown): value is AsyncGenerationInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  if (
    typeof input.generationRequestId !== "string" ||
    typeof input.prompt !== "string" ||
    typeof input.aspectRatio !== "string" ||
    typeof input.model !== "string" ||
    typeof input.numberOfImages !== "number" ||
    !Number.isFinite(input.numberOfImages)
  ) return false;
  if (input.paidTrafficUser !== undefined && typeof input.paidTrafficUser !== "boolean") return false;
  if (input.sourcePage !== undefined && typeof input.sourcePage !== "string") return false;
  if (input.metadata !== undefined) {
    if (!input.metadata || typeof input.metadata !== "object") return false;
    for (const value of Object.values(input.metadata)) {
      if (value !== undefined && typeof value !== "string") return false;
    }
  }
  return true;
}

export function useAsyncGeneration(options: AsyncGenerationOptions) {
  const [generationRequestId, setGenerationRequestId] = useState<string | null>(
    null
  );
  const [statusCheckPaused, setStatusCheckPaused] = useState(false);
  const [statusCheckPauseReason, setStatusCheckPauseReason] = useState<"error" | "missing" | null>(null);
  const [pendingInput, setPendingInput] = useState<AsyncGenerationInput | null>(null);
  const onCompletedRef = useRef(options.onCompleted);
  const onFailedRef = useRef(options.onFailed);
  const onStatusErrorRef = useRef(options.onStatusError);
  const handledTerminalRequestIdRef = useRef<string | null>(null);
  const operationTokenRef = useRef(0);
  const activeOperationRef = useRef<ActiveAsyncOperation | null>(null);
  const nullStatusRef = useRef<{ requestId: string | null; count: number }>({
    requestId: null,
    count: 0,
  });
  const nullStatusNotifiedRequestIdRef = useRef<string | null>(null);
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
        setStatusCheckPauseReason("error");
        onStatusErrorRef.current?.(error);
      },
      onSuccess: (status) => {
        if (!generationRequestId || status !== null) {
          nullStatusRef.current = { requestId: generationRequestId, count: 0 };
          nullStatusNotifiedRequestIdRef.current = null;
          setStatusCheckPauseReason(null);
          return;
        }
        const previous = nullStatusRef.current;
        const count =
          previous.requestId === generationRequestId ? previous.count + 1 : 1;
        nullStatusRef.current = { requestId: generationRequestId, count };
        if (
          count >= MAX_CONSECUTIVE_NULL_STATUS_RESPONSES &&
          nullStatusNotifiedRequestIdRef.current !== generationRequestId
        ) {
          nullStatusNotifiedRequestIdRef.current = generationRequestId;
          setStatusCheckPaused(true);
          setStatusCheckPauseReason("missing");
          onStatusErrorRef.current?.(
            new Error(
              "Generation status is unavailable. Resume checking with the original request.",
            ),
          );
        }
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
    operationTokenRef.current += 1;
    activeOperationRef.current = null;
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
    nullStatusRef.current = { requestId: null, count: 0 };
    nullStatusNotifiedRequestIdRef.current = null;
    setStatusCheckPaused(false);
    setStatusCheckPauseReason(null);
    setGenerationRequestId(null);
    setPendingInput(null);
    removeStatus();

    if (!options.enabled || !ASYNC_GENERATION_FEATURE_ENABLED || !options.userId) {
      return;
    }
    const pending = readPendingAsyncGeneration(
      options.userId,
      options.sourcePage,
    );
    if (
      pending &&
      isValidAsyncGenerationInput(pending.input) &&
      pending.input.generationRequestId === pending.requestId
    ) {
      setGenerationRequestId(pending.requestId);
      setPendingInput(pending.input);
    }
  }, [options.enabled, options.sourcePage, options.userId, removeStatus]);

  const reset = useCallback(() => {
    operationTokenRef.current += 1;
    activeOperationRef.current = null;
    nullStatusRef.current = { requestId: null, count: 0 };
    nullStatusNotifiedRequestIdRef.current = null;
    clearPendingAsyncGeneration(options.userId, options.sourcePage);
    setGenerationRequestId(null);
    setPendingInput(null);
    setStatusCheckPaused(false);
    setStatusCheckPauseReason(null);
    removeStatus();
  }, [options.sourcePage, options.userId, removeStatus]);

  const resumeStatus = useCallback(async () => {
    if (!generationRequestId) return null;
    nullStatusRef.current = { requestId: generationRequestId, count: 0 };
    nullStatusNotifiedRequestIdRef.current = null;
    setStatusCheckPaused(false);
    setStatusCheckPauseReason(null);
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
      const token = operationTokenRef.current + 1;
      operationTokenRef.current = token;
      activeOperationRef.current = {
        token,
        userId: options.userId,
        sourcePage: options.sourcePage,
        requestId: input.generationRequestId,
      };
      setGenerationRequestId(input.generationRequestId);
      setPendingInput(input);
      writePendingAsyncGeneration(
        options.userId,
        options.sourcePage,
        input.generationRequestId,
        input,
      );
      setStatusCheckPaused(false);
      setStatusCheckPauseReason(null);
      try {
        const result = await startMutation.mutateAsync(input);
        const activeOperation = activeOperationRef.current;
        if (
          !activeOperation ||
          activeOperation.token !== token ||
          activeOperation.userId !== options.userId ||
          activeOperation.sourcePage !== options.sourcePage ||
          activeOperation.requestId !== input.generationRequestId
        ) {
          return result;
        }
        setGenerationRequestId(result.generationRequestId);
        setPendingInput(input);
        writePendingAsyncGeneration(
          options.userId,
          options.sourcePage,
          result.generationRequestId,
          input,
        );
        return result;
      } catch (error) {
        const activeOperation = activeOperationRef.current;
        const isCurrentOperation = Boolean(
          activeOperation &&
            activeOperation.token === token &&
            activeOperation.userId === options.userId &&
            activeOperation.sourcePage === options.sourcePage &&
            activeOperation.requestId === input.generationRequestId,
        );
        if (!isCurrentOperation) {
          throw new ObsoleteAsyncGenerationOperationError();
        }
        if (!isAmbiguousAsyncSubmissionError(error)) {
          activeOperationRef.current = null;
          clearPendingAsyncGeneration(options.userId, options.sourcePage);
          setGenerationRequestId(null);
          setPendingInput(null);
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

  const canRetrySubmission = Boolean(
    generationRequestId &&
      statusCheckPaused &&
      statusCheckPauseReason === "missing" &&
      pendingInput &&
      isValidAsyncGenerationInput(pendingInput) &&
      pendingInput.generationRequestId === generationRequestId,
  );
  const retrySubmission = useCallback(async () => {
    if (!canRetrySubmission || !pendingInput) return null;
    return start(pendingInput);
  }, [canRetrySubmission, pendingInput, start]);

  return {
    start,
    reset,
    resumeStatus,
    retrySubmission,
    generationRequestId,
    pendingInput,
    status: statusQuery.data ?? null,
    isStarting: startMutation.isLoading,
    isPolling:
      Boolean(generationRequestId) &&
      statusQuery.data?.status !== "completed" &&
      statusQuery.data?.status !== "failed",
    canResumeStatus: Boolean(
      generationRequestId &&
        statusCheckPaused &&
        (statusCheckPauseReason === "error" || !canRetrySubmission),
    ),
    canRetrySubmission,
    error: startMutation.error ?? statusQuery.error ?? null,
  };
}
