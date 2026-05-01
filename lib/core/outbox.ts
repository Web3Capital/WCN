/**
 * Transactional Outbox Pattern
 *
 * Ensures atomic state change + event emission by writing events
 * to the database in the same transaction as the state change.
 * A background poller (cron at `/api/cron/outbox`) reads undelivered
 * events and emits them, with retry on failure.
 *
 * Failure surfaces (and where they're observed):
 *   - Transient handler failure → retryCount++, lastError stored, retried
 *     up to DLQ_THRESHOLD attempts.
 *   - Stuck (retryCount >= DLQ_THRESHOLD) → counted as the dead-letter
 *     queue. Surfaced via `getOutboxDlqDepth` and the
 *     `outbox_dlq_depth` metric. Operators triage manually.
 *   - Outbox depth growing → `outbox_pending_count` gauge climbs;
 *     `outbox_oldest_pending_age_seconds` increases. Symptom of cron
 *     not running, dispatcher errors, or handlers blocking.
 */

import { getPrisma } from "@/lib/prisma";
import { eventBus } from "./event-bus";
import type { EventPayload } from "./event-bus";
import { metrics } from "./metrics";

/**
 * Maximum number of dispatch attempts before an outbox event is treated
 * as dead-letter. The poller's `retryCount: { lt: DLQ_THRESHOLD }` filter
 * prevents stuck events from blocking the head of the queue.
 *
 * Formerly an implicit literal `5` in the query; promoted to a named
 * constant so DLQ semantics live in one place.
 */
export const DLQ_THRESHOLD = 5;

/**
 * Write an event to the outbox within a transaction context.
 * Call this inside a Prisma `$transaction` block.
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
  metrics.increment("outbox_events_written_total", { event: eventName });
  return record.id;
}

/**
 * Process undelivered outbox events.
 *
 * Called from `/api/cron/outbox` (every 5 min) and fire-and-forget from
 * mutation use-cases post-commit (latency optimization).
 *
 * Emits per-event metrics:
 *   - outbox_events_processed_total{event, result=delivered|failed|dlq}
 *   - outbox_event_age_seconds{event} (delivered only — time spent in queue)
 *   - outbox_event_retry_count{event} (final retry count on failure)
 *
 * Returns counts of {delivered, failed, dlq} for the caller to log/return.
 */
export async function processOutbox(
  batchSize: number = 50,
): Promise<{ delivered: number; failed: number; dlq: number }> {
  const prisma = getPrisma();

  const events = await prisma.outbox.findMany({
    where: { delivered: false, retryCount: { lt: DLQ_THRESHOLD } },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  });

  let delivered = 0;
  let failed = 0;

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

      const deliveredAt = new Date();
      await prisma.outbox.update({
        where: { id: event.id },
        data: { delivered: true, deliveredAt },
      });

      const ageSeconds = (deliveredAt.getTime() - event.createdAt.getTime()) / 1000;
      metrics.observe("outbox_event_age_seconds", ageSeconds, { event: event.eventName });
      metrics.increment("outbox_events_processed_total", {
        event: event.eventName,
        result: "delivered",
      });
      delivered++;
    } catch (error) {
      const newRetryCount = event.retryCount + 1;
      await prisma.outbox.update({
        where: { id: event.id },
        data: {
          retryCount: { increment: 1 },
          lastError: error instanceof Error ? error.message : String(error),
        },
      });

      const isDlq = newRetryCount >= DLQ_THRESHOLD;
      metrics.increment("outbox_events_processed_total", {
        event: event.eventName,
        result: isDlq ? "dlq" : "failed",
      });
      if (isDlq) {
        metrics.observe("outbox_event_retry_count", newRetryCount, {
          event: event.eventName,
        });
      }
      failed++;
    }
  }

  // Snapshot DLQ depth post-batch for monitoring (gauge-style).
  const dlq = await getOutboxDlqDepth();
  metrics.observe("outbox_dlq_depth", dlq, {});

  return { delivered, failed, dlq };
}

/**
 * Count of dead-letter events: undelivered with retryCount at or above
 * DLQ_THRESHOLD. These are stuck — the poller will not pick them up
 * again; an operator must inspect and re-queue or discard.
 */
export async function getOutboxDlqDepth(): Promise<number> {
  const prisma = getPrisma();
  return prisma.outbox.count({
    where: { delivered: false, retryCount: { gte: DLQ_THRESHOLD } },
  });
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
 * Get outbox health metrics. Used by `/api/health` and the outbox cron
 * to surface depth + age + DLQ.
 *
 * Field shape preserves `pendingCount` / `failedCount` for callers that
 * already exist (e.g. `app/api/health/route.ts`); `dlqDepth` is the
 * preferred name and is identical to `failedCount`.
 */
export async function getOutboxMetrics(): Promise<{
  pendingCount: number;
  failedCount: number;
  /** Alias of `failedCount` — preferred forward-going name. */
  dlqDepth: number;
  oldestPending: Date | null;
}> {
  const prisma = getPrisma();

  const [pendingCount, dlqDepth, oldest] = await Promise.all([
    prisma.outbox.count({ where: { delivered: false } }),
    getOutboxDlqDepth(),
    prisma.outbox.findFirst({
      where: { delivered: false },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  return {
    pendingCount,
    failedCount: dlqDepth,
    dlqDepth,
    oldestPending: oldest?.createdAt ?? null,
  };
}
