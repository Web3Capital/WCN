import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent } from "./lib/sentry-sanitizer";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: !!process.env.SENTRY_DSN,
  sendDefaultPii: false,
  beforeSend: sanitizeSentryEvent,
});
