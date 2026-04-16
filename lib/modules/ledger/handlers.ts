/**
 * @wcn/ledger — Event Handlers
 *
 * Listens to settlement and deal events to create ledger entries.
 */

import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export function initLedgerHandlers(): void {
  // When settlement is distributed, create CASH ledger entries per node
  eventBus.on(Events.SETTLEMENT_DISTRIBUTED, async (payload) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Ledger] Settlement distributed: cycle=${payload.cycleId}, nodes=${payload.nodeCount}`);
    }
    // Future: auto-create CASH CREDIT entries per settlement line
  });

  eventBus.on(Events.LEDGER_ENTRY_CREATED, async (payload) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Ledger] Entry: ${payload.action} ${payload.amount} ${payload.type} for node=${payload.nodeId}`);
    }
  });
}
