/**
 * WCN Platform Initialization
 *
 * Called once on server startup to register event handlers
 * and initialize cross-cutting concerns.
 */

import { initEventHandlers } from "./event-handlers";
import { initEmailHandlers } from "@/lib/modules/email/dispatcher";

let _initialized = false;

export function initWCN(): void {
  if (_initialized) return;
  _initialized = true;
  initEventHandlers();
  initEmailHandlers();
}

// Auto-initialize on import in server context
// Skip if no database URL is configured (e.g., during CI/CD build)
if (typeof window === "undefined" && (process.env.POSTGRES_URL || process.env.DATABASE_URL)) {
  initWCN();
}
