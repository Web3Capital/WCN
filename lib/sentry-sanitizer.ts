/**
 * Shared Sentry event sanitizer.
 *
 * Strips PII / secrets from events before they leave the host. Used by
 * sentry.{server,client,edge}.config.ts via Sentry.init({ beforeSend }).
 *
 * Why centralized: PII surface area only grows. One file = one audit target.
 */

import type { ErrorEvent, EventHint } from "@sentry/nextjs";

const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-admin-secret",
  "x-cron-secret",
  "x-csrf-token",
  "proxy-authorization",
]);

const SENSITIVE_QUERY_PARAMS = new Set([
  "secret",
  "token",
  "code",
  "password",
  "newPassword",
  "signature",
  "nonce",
  "api_key",
  "apiKey",
  "access_token",
  "refresh_token",
]);

const SENSITIVE_BODY_KEYS = new Set([
  "password",
  "passwordHash",
  "newPassword",
  "currentPassword",
  "secret",
  "token",
  "signature",
  "privateKey",
  "mnemonic",
  "seedPhrase",
  "totp",
  "otp",
  "code",
  "ssn",
  "taxId",
]);

const REDACTED = "[Filtered]";

function redactHeaders(headers: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!headers) return headers;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = SENSITIVE_HEADER_NAMES.has(k.toLowerCase()) ? REDACTED : v;
  }
  return out;
}

function redactUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url, "http://placeholder");
    let mutated = false;
    for (const param of Array.from(u.searchParams.keys())) {
      if (SENSITIVE_QUERY_PARAMS.has(param) || SENSITIVE_QUERY_PARAMS.has(param.toLowerCase())) {
        u.searchParams.set(param, REDACTED);
        mutated = true;
      }
    }
    return mutated ? (u.host === "placeholder" ? `${u.pathname}${u.search}` : u.toString()) : url;
  } catch {
    return url;
  }
}

function redactObject(obj: unknown, depth = 0): unknown {
  if (depth > 6) return obj; // safety on cycles / huge graphs
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((v) => redactObject(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_BODY_KEYS.has(k)) {
      out[k] = REDACTED;
    } else if (typeof v === "object" && v !== null) {
      out[k] = redactObject(v, depth + 1);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function sanitizeSentryEvent(event: ErrorEvent, _hint?: EventHint): ErrorEvent | null {
  if (event.request) {
    event.request.headers = redactHeaders(event.request.headers);
    event.request.url = redactUrl(event.request.url);
    if (event.request.cookies) event.request.cookies = REDACTED as unknown as typeof event.request.cookies;
    if (event.request.data) event.request.data = redactObject(event.request.data) as typeof event.request.data;
    if (event.request.query_string && typeof event.request.query_string === "string") {
      event.request.query_string = redactUrl(`?${event.request.query_string}`)?.replace(/^\?/, "") ?? event.request.query_string;
    }
  }
  if (event.user) {
    // Keep id; drop email/username/ip address by default. Override per-event if needed.
    event.user = { id: event.user.id };
  }
  if (event.extra) event.extra = redactObject(event.extra) as typeof event.extra;
  if (event.contexts) event.contexts = redactObject(event.contexts) as typeof event.contexts;
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => ({
      ...b,
      data: b.data ? (redactObject(b.data) as typeof b.data) : b.data,
    }));
  }
  return event;
}
