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
  const raw = error instanceof Error ? error.message : "Unknown database error";
  const detail = raw
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted-database-url]")
    .replace(/(?:password|secret|token|api[_-]?key)\s*[=:]\s*[^\s,]+/gi, "$1=[redacted]")
    .replace(/\s+/g, " ")
    .slice(0, 240);
  return { ok: false, code: "INTERNAL_DB_ERROR", detail };
}

