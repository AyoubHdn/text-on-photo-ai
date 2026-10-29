export interface LegacyChargeLifecycleDeps<T> {
  charge: () => Promise<void>;
  execute: () => Promise<T>;
  finalizeFailure: (input: { errorMessage: string; refund: boolean }) => Promise<unknown>;
  getErrorMessage: (error: unknown) => string;
}

export async function runLegacyGenerationAfterReservation<T>(deps: LegacyChargeLifecycleDeps<T>): Promise<T> {
  let charged = false;
  try {
    await deps.charge();
    charged = true;
    return await deps.execute();
  } catch (error) {
    await deps.finalizeFailure({ errorMessage: deps.getErrorMessage(error), refund: charged });
    throw error;
  }
}

