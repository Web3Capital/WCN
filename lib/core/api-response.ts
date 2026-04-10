/**
 * Unified API response helpers.
 *
 * Every API route should use these instead of raw NextResponse.json().
 * This ensures consistent shape: { ok, data?, meta?, error? }
 */

import { NextResponse } from "next/server";
import type { ZodError } from "zod";

// ─── Success Responses ───────────────────────────────────────────

interface PaginationMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}

export function apiOk<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiCreated<T>(data: T): NextResponse {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function apiList<T>(data: T[], meta?: PaginationMeta): NextResponse {
  return NextResponse.json({ ok: true, data, meta }, { status: 200 });
}

// ─── Error Responses ────────────────────────────────────────────

interface ErrorBody {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: unknown,
): NextResponse<ErrorBody> {
  return NextResponse.json(
    { ok: false, error: { code, message, details: details ?? null } },
    { status },
  );
}

export function apiUnauthorized(message = "Authentication required."): NextResponse<ErrorBody> {
  return apiError("UNAUTHORIZED", message, 401);
}

export function apiForbidden(message = "Insufficient permissions."): NextResponse<ErrorBody> {
  return apiError("FORBIDDEN", message, 403);
}

export function apiNotFound(entity = "Resource"): NextResponse<ErrorBody> {
  return apiError("NOT_FOUND", `${entity} not found.`, 404);
}

export function apiValidationError(details: unknown): NextResponse<ErrorBody> {
  return apiError("VALIDATION_ERROR", "Invalid input.", 400, details);
}

export function apiConflict(message: string, details?: unknown): NextResponse<ErrorBody> {
  return apiError("CONFLICT", message, 409, details);
}

export function apiBusinessError(code: string, message: string, details?: unknown): NextResponse<ErrorBody> {
  return apiError(code, message, 422, details);
}

// ─── Zod Integration ────────────────────────────────────────────

export function zodToApiError(error: ZodError): NextResponse<ErrorBody> {
  const issues = error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
  return apiValidationError(issues);
}

// ─── Error Codes ────────────────────────────────────────────────

export const ErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONFLICT: "CONFLICT",

  // State machine violations
  INVALID_TRANSITION: "INVALID_TRANSITION",
  DEAL_INVALID_TRANSITION: "DEAL_INVALID_TRANSITION",
  NODE_INVALID_TRANSITION: "NODE_INVALID_TRANSITION",
  TASK_INVALID_TRANSITION: "TASK_INVALID_TRANSITION",
  EVIDENCE_INVALID_TRANSITION: "EVIDENCE_INVALID_TRANSITION",
  POB_INVALID_TRANSITION: "POB_INVALID_TRANSITION",
  SETTLEMENT_INVALID_STATE: "SETTLEMENT_INVALID_STATE",

  // Business rules
  DEAL_ALREADY_CLOSED: "DEAL_ALREADY_CLOSED",
  SETTLEMENT_ALREADY_GENERATED: "SETTLEMENT_ALREADY_GENERATED",
  ENTITY_FROZEN: "ENTITY_FROZEN",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  RATE_LIMITED: "RATE_LIMITED",
} as const;
