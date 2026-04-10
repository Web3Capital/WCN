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
if (typeof window === "undefined") {
  initWCN();
}
