export interface Env {
  HYPERDRIVE: Hyperdrive;
}

export interface HealthResponse {
  ok: true;
  service: "namedesignai-db";
}

export interface DiagnosticResponse {
  ok: true;
}

export type DbErrorCode =
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "DEPENDENCY_UNAVAILABLE"
  | "INTERNAL_DB_ERROR";

export interface DbErrorResponse {
  ok: false;
  code: DbErrorCode;
}
