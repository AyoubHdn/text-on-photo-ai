import type { DbErrorCode, DbErrorResponse } from "./types";

export class DbServiceError extends Error {
  constructor(
    public readonly code: DbErrorCode,
    message = "Database service error",
  ) {
    super(message);
    this.name = "DbServiceError";
  }
}

export function toSafeErrorResponse(error: unknown): DbErrorResponse {
  if (error instanceof DbServiceError) {
    return { ok: false, code: error.code };
  }
  return { ok: false, code: "INTERNAL_DB_ERROR" };
}
