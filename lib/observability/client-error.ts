/**
 * Tiny client-safe error reporter for the dashboard.
 *
 * Why: dashboard subpages had ~13 raw `console.error` sites for caught
 * fetch/abort errors that never reached Sentry, even though @sentry/nextjs
 * is fully configured (sentry.client.config.ts). This helper closes that
 * gap with a one-liner that:
 *   1. Logs to the browser console in development for DX
 *   2. Captures to Sentry as a tagged exception
 *   3. Stays a no-op when Sentry isn't initialised (e.g. local dev with no
 *      DSN), so consumers don't have to gate on env vars
 *
 * Usage:
 *   import { captureClientError } from "@/lib/observability/client-error";
 *   captureClientError("Tasks.refresh", err);
 *   captureClientError("Deal.activity", err, { dealId });
 */

"use client";

import * as Sentry from "@sentry/nextjs";

export type ClientErrorContext = Record<string, string | number | boolean | null | undefined>;

export function captureClientError(
  scope: string,
  err: unknown,
  context?: ClientErrorContext,
): void {
  if (process.env.NODE_ENV !== "production") {
    // Keep dev-time visibility — preserves the `[Scope] message` shape the
    // dashboard previously logged, so existing console-log hunting still works.
    // eslint-disable-next-line no-console
    console.error(`[${scope}]`, err, context ?? "");
  }

  try {
    Sentry.withScope((s) => {
      s.setTag("dashboard.scope", scope);
      if (context) {
        for (const [k, v] of Object.entries(context)) {
          if (v !== undefined && v !== null) s.setExtra(k, v);
        }
      }
      const error =
        err instanceof Error
          ? err
          : new Error(typeof err === "string" ? err : `Non-Error thrown in ${scope}`);
      Sentry.captureException(error);
    });
  } catch {
    // Sentry init can fail in environments without DSN; never let reporting
    // throw into the calling component.
  }
}
