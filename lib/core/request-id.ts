/**
 * Request ID Correlation
 *
 * Ensures every request has a unique ID for tracing across
 * logs, events, and external services.
 */

import { headers } from "next/headers";
import crypto from "crypto";

const REQUEST_ID_HEADER = "x-request-id";

export function getRequestId(): string {
  try {
    const headersList = headers();
    const existing = headersList.get(REQUEST_ID_HEADER);
    if (existing) return existing;
  } catch {
    // headers() not available outside request context
  }
  return generateRequestId();
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}
