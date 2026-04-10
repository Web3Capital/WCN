/**
 * @wcn/settlement — Event Handlers
 */
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { SettlementDistributedEvent } from "@/lib/core/event-types";
import { notifyMany } from "@/lib/notifications";
import { getPrisma } from "@/lib/prisma";
import { calculateSettlementForCycle } from "./calculator";

let _initialized = false;

export function initSettlementHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  eventBus.on<SettlementDistributedEvent>(Events.SETTLEMENT_DISTRIBUTED, async (payload) => {
    try {
      await calculateSettlementForCycle(payload.cycleId);
    } catch (e) {
      console.error("[Settlement] Calc failed for cycle", payload.cycleId, e);
    }
  });

  eventBus.on<SettlementDistributedEvent>(Events.SETTLEMENT_DISTRIBUTED, async (payload) => {
    const prisma = getPrisma();
    const lines = await prisma.settlementLine.findMany({
      where: { cycleId: payload.cycleId },
      select: { nodeId: true },
      distinct: ["nodeId"],
    });
    const nodeIds = lines.map((l) => l.nodeId);
    if (!nodeIds.length) return;
    const nodes = await prisma.node.findMany({
      where: { id: { in: nodeIds } },
      select: { ownerUserId: true },
    });
    const userIds = nodes
      .map((n) => n.ownerUserId)
      .filter((id): id is string => !!id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "SETTLEMENT_CLOSING",
        title: "Settlement distributed — check your balance",
        entityType: "Settlement",
        entityId: payload.cycleId,
      });
    }
  });
}
