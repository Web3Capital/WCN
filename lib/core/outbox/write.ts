/**
 * Transactional outbox writer.
 *
 * Phase A of the PoB Event Sourcing pilot (ADR-0004). Route handlers wrap
 * their DB mutation and `writeOutbox(...)` in the same `prisma.$transaction`
 * so the domain event row commits atomically with the entity write — if the
 * outer transaction rolls back, no event leaks to the bus.
 *
 * The Inngest consumer (Phase A.4) polls the Outbox table, marks rows
 * `delivered`, and forwards them. Phase A only owns the producer side.
 *
 * Type-safety: when `eventName` is a known literal from `Events`, the
 * payload is checked against `EventMap` (same overload pattern as
 * `DomainEventBus.emit`). String fallback exists for ad-hoc events.
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import type { EventMap } from "@/lib/core/event-types";

export type OutboxTx = Prisma.TransactionClient | PrismaClient;

export interface WriteOutboxMeta {
  actorId?: string | null;
  requestId?: string | null;
}

export interface WriteOutboxResult {
  id: string;
}

export async function writeOutbox<E extends keyof EventMap>(
  tx: OutboxTx,
  eventName: E,
  payload: EventMap[E],
  meta?: WriteOutboxMeta,
): Promise<WriteOutboxResult>;
export async function writeOutbox(
  tx: OutboxTx,
  eventName: string,
  payload: Record<string, unknown>,
  meta?: WriteOutboxMeta,
): Promise<WriteOutboxResult>;
export async function writeOutbox(
  tx: OutboxTx,
  eventName: string,
  payload: Record<string, unknown>,
  meta?: WriteOutboxMeta,
): Promise<WriteOutboxResult> {
  const row = await tx.outbox.create({
    data: {
      eventName,
      payload: payload as Prisma.InputJsonValue,
      actorId: meta?.actorId ?? null,
      requestId: meta?.requestId ?? null,
    },
    select: { id: true },
  });
  return row;
}
