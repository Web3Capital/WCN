import { NextResponse } from "next/server";

/** Stable API error codes for clients and observability. */
export const ApiCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  POB_INVALID_TRANSITION: "POB_INVALID_TRANSITION",
  SETTLEMENT_INVALID_STATE: "SETTLEMENT_INVALID_STATE",
  SETTLEMENT_ALREADY_GENERATED: "SETTLEMENT_ALREADY_GENERATED"
} as const;

export type ApiErrorBody = {
  ok: false;
  error: { code: string; message: string; details: unknown };
};

export function apiError(
  code: string,
  message: string,
  status: number,
  details: unknown = null
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ ok: false, error: { code, message, details } }, { status });
}

/** Parse `{ ok: false, error: string | { message } }` from fetch JSON (client or server). */
export function getApiErrorMessageFromJson(data: unknown): string {
  if (!data || typeof data !== "object") return "Request failed.";
  const d = data as { error?: string | { message?: string } };
  if (typeof d.error === "string") return d.error;
  if (d.error && typeof d.error === "object" && typeof d.error.message === "string") return d.error.message;
  return "Request failed.";
}
