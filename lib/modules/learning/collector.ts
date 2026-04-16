/**
 * @wcn/learning — Learning Signal Collector
 *
 * White Paper §05: Formal Definition, component L (Learning Loop)
 * Captures signals from system events for future model improvement.
 *
 * Signal types:
 * - MATCH_FEEDBACK: match quality assessment after conversion/decline
 * - SCORE_ADJUSTMENT: manual reputation override events
 * - POLICY_OVERRIDE: cases where policies were bypassed
 * - ATTRIBUTION_DISPUTE: disagreements on contribution attribution
 * - SETTLEMENT_ANOMALY: unusual settlement patterns
 */

import { getPrisma } from "@/lib/prisma";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

// ─── Signal Types ──────────────────────────────────────────────

export const SignalTypes = {
  MATCH_FEEDBACK: "MATCH_FEEDBACK",
  SCORE_ADJUSTMENT: "SCORE_ADJUSTMENT",
  POLICY_OVERRIDE: "POLICY_OVERRIDE",
  ATTRIBUTION_DISPUTE: "ATTRIBUTION_DISPUTE",
  SETTLEMENT_ANOMALY: "SETTLEMENT_ANOMALY",
} as const;

// ─── Core Collector ────────────────────────────────────────────

export async function captureSignal(data: {
  workspaceId?: string;
  signalType: string;
  sourceEvent: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
}) {
  const prisma = getPrisma();

  const signal = await prisma.learningSignal.create({
    data: {
      workspaceId: data.workspaceId ?? null,
      signalType: data.signalType,
      sourceEvent: data.sourceEvent,
      entityType: data.entityType,
      entityId: data.entityId,
      payload: data.payload as any,
    },
  });

  await eventBus.emit(Events.LEARNING_SIGNAL_CAPTURED, {
    signalId: signal.id,
    signalType: signal.signalType,
    sourceEvent: signal.sourceEvent,
    entityType: signal.entityType,
    entityId: signal.entityId,
  });

  return signal;
}

export async function getUnprocessedSignals(type: string, limit = 50) {
  const prisma = getPrisma();
  return prisma.learningSignal.findMany({
    where: { signalType: type, processed: false },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function markProcessed(signalId: string) {
  const prisma = getPrisma();
  await prisma.learningSignal.update({
    where: { id: signalId },
    data: { processed: true, processedAt: new Date() },
  });
}

export async function getSignalStats(): Promise<Record<string, number>> {
  const prisma = getPrisma();
  const counts = await prisma.learningSignal.groupBy({
    by: ["signalType"],
    _count: { id: true },
    where: { processed: false },
  });

  const stats: Record<string, number> = {};
  for (const row of counts) {
    stats[row.signalType] = row._count.id;
  }
  return stats;
}
