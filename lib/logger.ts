import pino from "pino";
import { getRequestId } from "@/lib/core/request-id";

const level =
  (process.env.LOG_LEVEL as pino.Level | undefined) ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

/** Process-wide logger (JSON to stdout). Use `withApiContext` in Route Handlers. */
export const logger = pino({
  level,
  base: { service: "wcn-nextjs" },
});

/**
 * Child logger for HTTP APIs: binds `requestId` (from middleware / generator) and `route`.
 */
export function withApiContext(route: string, fields?: Record<string, unknown>) {
  return logger.child({
    route,
    requestId: getRequestId(),
    ...fields,
  });
}
