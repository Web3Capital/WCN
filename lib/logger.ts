import pino from "pino";
import { generateRequestId } from "@/lib/core/request-id";

const level =
  (process.env.LOG_LEVEL as pino.Level | undefined) ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

/** Process-wide logger (JSON to stdout). Use `withApiContext` in Route Handlers. */
export const logger = pino({
  level,
  base: { service: "wcn-nextjs" },
});

/**
 * Child logger for HTTP APIs: binds `requestId` and `route`.
 * Uses a freshly-generated requestId rather than awaiting `headers()` so callers
 * can stay sync. Routes that need to correlate with middleware's x-request-id
 * should await `getRequestId()` and pass it explicitly via `fields`.
 */
export function withApiContext(route: string, fields?: Record<string, unknown>) {
  return logger.child({
    route,
    requestId: generateRequestId(),
    ...fields,
  });
}
