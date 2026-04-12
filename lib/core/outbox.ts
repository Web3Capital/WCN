/**
 * Transactional Outbox Pattern
 *
 * Ensures atomic state change + event emission by writing events
 * to the database in the same transaction as the state change.
 * A background poller reads undelivered events and emits them.
 */

import { getPrisma } from "@/lib/prisma";
import { eventBus } from "./event-bus";
import type { EventPayload } from "./event-bus";

/**
 * Write an event to the outbox within a transaction context.
 * Call this inside a Prisma $transaction block.
 *
 * Phase 2: Wire into mutation services (deals, pob, settlement) to guarantee
 * at-least-once event delivery with Transactional Outbox pattern.
 */
export async function writeToOutbox(
  tx: any,
  eventName: string,
  payload: EventPayload,
  context?: { actorId?: string; requestId?: string },
): Promise<string> {
  const record = await tx.outbox.create({
    data: {
      eventName,
      payload: payload as any,
      actorId: context?.actorId,
      requestId: context?.requestId,
    },
  });
  return record.id;
}

/**
 * Process undelivered outbox events.
 * Call from a cron job or post-transaction hook.
 * Returns the number of events processed.
 */
export async function processOutbox(batchSize: number = 50): Promise<number> {
  const prisma = getPrisma();

  const events = await prisma.outbox.findMany({
    where: { delivered: false, retryCount: { lt: 5 } },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  });

  let processed = 0;

  for (const event of events) {
    try {
      await eventBus.emit(
        event.eventName,
        event.payload as EventPayload,
        {
          actorId: event.actorId ?? undefined,
          requestId: event.requestId ?? undefined,
        },
      );

      await prisma.outbox.update({
        where: { id: event.id },
        data: { delivered: true, deliveredAt: new Date() },
      });

      processed++;
    } catch (error) {
      await prisma.outbox.update({
        where: { id: event.id },
        data: {
          retryCount: { increment: 1 },
          lastError: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  return processed;
}

/**
 * Clean up old delivered events (retention policy).
 * Call from a weekly cron job.
 */
export async function cleanupOutbox(
  retentionDays: number = 30,
): Promise<number> {
  const prisma = getPrisma();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const { count } = await prisma.outbox.deleteMany({
    where: { delivered: true, deliveredAt: { lt: cutoff } },
  });

  return count;
}

/**
 * Get outbox health metrics.
 */
export async function getOutboxMetrics(): Promise<{
  pendingCount: number;
  failedCount: number;
  oldestPending: Date | null;
}> {
  const prisma = getPrisma();

  const [pendingCount, failedCount, oldest] = await Promise.all([
    prisma.outbox.count({ where: { delivered: false } }),
    prisma.outbox.count({
      where: { delivered: false, retryCount: { gte: 5 } },
    }),
    prisma.outbox.findFirst({
      where: { delivered: false },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  return {
    pendingCount,
    failedCount,
    oldestPending: oldest?.createdAt ?? null,
  };
}
