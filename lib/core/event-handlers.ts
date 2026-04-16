/**
 * Central Event Handler Registration — Orchestrator
 *
 * Delegates to per-module handler files that each own their reactions.
 * Import this once at app startup (e.g., in lib/core/init.ts).
 *
 * Phase A-2: Event Sovereignty — each module registers its own listeners.
 */

import { initAuditHandler } from "./handlers/audit";
import { initDealHandlers } from "@/lib/modules/deals/handlers";
import { initMatchingHandlers } from "@/lib/modules/matching/handlers";
import { initEvidenceHandlers } from "@/lib/modules/evidence/handlers";
import { initPoBHandlers } from "@/lib/modules/pob/handlers";
import { initSettlementHandlers } from "@/lib/modules/settlement/handlers";
import { initReputationHandlers } from "@/lib/modules/reputation/handlers";
import { initRiskHandlers } from "@/lib/modules/risk/handlers";
import { initAgentHandlers } from "@/lib/modules/agents/handlers";
import { initNotificationHandlers } from "@/lib/modules/notification/handlers";
import { initSearchHandlers } from "@/lib/modules/search/handlers";
import { initRealtimeHandlers } from "@/lib/modules/realtime/handlers";
import { initPolicyHandlers } from "@/lib/modules/policy/handlers";
import { initLedgerHandlers } from "@/lib/modules/ledger/handlers";
import { initLearningHandlers } from "@/lib/modules/learning/handlers";

let _initialized = false;

/**
 * Register all cross-module event handlers.
 * Call once at startup. Subsequent calls are no-ops.
 */
export function initEventHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  initAuditHandler();
  initDealHandlers();
  initMatchingHandlers();
  initEvidenceHandlers();
  initPoBHandlers();
  initSettlementHandlers();
  initReputationHandlers();
  initRiskHandlers();
  initAgentHandlers();
  initNotificationHandlers();
  initSearchHandlers();
  initRealtimeHandlers();
  initPolicyHandlers();
  initLedgerHandlers();
  initLearningHandlers();

  if (process.env.NODE_ENV === "development") {
    console.log("[WCN] Event handlers initialized (15 modules)");
  }
}
