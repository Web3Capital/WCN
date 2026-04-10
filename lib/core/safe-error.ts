/**
 * Production-safe error responses. Never leak stack traces or internal details.
 */

const SAFE_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Invalid input provided.",
  NOT_FOUND: "Resource not found.",
  UNAUTHORIZED: "Authentication required.",
  FORBIDDEN: "You do not have permission to perform this action.",
  CONFLICT: "The operation conflicts with the current state.",
  RATE_LIMITED: "Too many requests. Please try again later.",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again.",
};

export function safeErrorMessage(code: string, devMessage: string): string {
  if (process.env.NODE_ENV === "development") return devMessage;
  return SAFE_MESSAGES[code] || SAFE_MESSAGES.INTERNAL_ERROR;
}

export function sanitizeError(error: unknown): string {
  if (process.env.NODE_ENV === "development") {
    return error instanceof Error ? error.message : String(error);
  }
  return "An unexpected error occurred.";
}
