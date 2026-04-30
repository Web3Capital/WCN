/**
 * WCN Domain Event Bus
 *
 * In-process event emitter for domain events. Designed to be swapped to
 * Redis Streams or Kafka without changing emitter/handler signatures.
 *
 * All handlers execute concurrently via Promise.allSettled — a failed
 * handler never blocks the emitter or other handlers.
 *
 * Type Safety (v2):
 * - New code: `eventBus.emit(Events.DEAL_CREATED, { ... })` — payload
 *   is type-checked via EventMap when the event name is a known literal.
 * - Legacy code: `eventBus.emit<DealCreatedEvent>(Events.DEAL_CREATED, { ... })`
 *   — explicit generic still works via overload for backward compatibility.
 */

import type { EventMap } from "./event-types";

export type EventPayload = Record<string, any>;

/** Resolve the payload type for an event: typed if in EventMap, else fallback. */
export type ResolvedPayload<E extends string> =
  E extends keyof EventMap ? EventMap[E] : EventPayload;

export type EventHandler<T extends EventPayload = EventPayload> = (
  payload: T,
  meta: EventMeta,
) => Promise<void>;

export interface EventMeta {
  eventId: string;
  eventName: string;
  emittedAt: Date;
  actorId?: string;
  requestId?: string;
}

interface HandlerEntry {
  handler: EventHandler;
  once: boolean;
}

let _idCounter = 0;
function nextEventId(): string {
  return `evt_${Date.now()}_${++_idCounter}`;
}

export class DomainEventBus {
  private handlers = new Map<string, HandlerEntry[]>();
  private wildcardHandlers: HandlerEntry[] = [];

  /**
   * Register a handler for a specific event.
   *
   * Overload 1 (preferred): infer payload type from EventMap via event name literal.
   * Overload 2 (legacy): explicit generic payload type — backward compatible.
   */
  on<E extends keyof EventMap>(event: E, handler: EventHandler<EventMap[E]>): () => void;
  on<T extends EventPayload = EventPayload>(event: string, handler: EventHandler<T>): () => void;
  on(event: string, handler: EventHandler): () => void {
    const entry: HandlerEntry = { handler, once: false };
    const list = this.handlers.get(event) || [];
    list.push(entry);
    this.handlers.set(event, list);
    return () => this.off(event, handler);
  }

  /**
   * Register a one-time handler.
   */
  once<E extends keyof EventMap>(event: E, handler: EventHandler<EventMap[E]>): void;
  once<T extends EventPayload = EventPayload>(event: string, handler: EventHandler<T>): void;
  once(event: string, handler: EventHandler): void {
    const entry: HandlerEntry = { handler, once: true };
    const list = this.handlers.get(event) || [];
    list.push(entry);
    this.handlers.set(event, list);
  }

  /**
   * Register a wildcard handler that receives ALL events.
   * Used by audit module to log everything.
   */
  onAny(handler: EventHandler): () => void {
    const entry: HandlerEntry = { handler, once: false };
    this.wildcardHandlers.push(entry);
    return () => {
      this.wildcardHandlers = this.wildcardHandlers.filter((e) => e.handler !== handler);
    };
  }

  /**
   * Remove a specific handler.
   */
  off(event: string, handler: EventHandler): void {
    const list = this.handlers.get(event);
    if (!list) return;
    this.handlers.set(
      event,
      list.filter((e) => e.handler !== handler),
    );
  }

  /**
   * Emit a domain event. All matching handlers run concurrently.
   *
   * Overload 1 (preferred): payload type-checked via EventMap from event name.
   * Overload 2 (legacy): explicit generic payload type — backward compatible.
   */
  async emit<E extends keyof EventMap>(event: E, payload: EventMap[E], context?: { actorId?: string; requestId?: string }): Promise<PromiseSettledResult<void>[]>;
  async emit<T extends EventPayload = EventPayload>(event: string, payload: T, context?: { actorId?: string; requestId?: string }): Promise<PromiseSettledResult<void>[]>;
  async emit(
    event: string,
    payload: EventPayload,
    context?: { actorId?: string; requestId?: string },
  ): Promise<PromiseSettledResult<void>[]> {
    const meta: EventMeta = {
      eventId: nextEventId(),
      eventName: event,
      emittedAt: new Date(),
      actorId: context?.actorId,
      requestId: context?.requestId,
    };

    const specificHandlers = this.handlers.get(event) || [];
    const toRun = [...specificHandlers, ...this.wildcardHandlers];

    const results = await Promise.allSettled(
      toRun.map(async (entry) => {
        try {
          await entry.handler(payload, meta);
        } catch (err) {
          console.error(
            `[EventBus] Handler failed for "${event}" (${meta.eventId}):`,
            err,
          );
          throw err;
        }
      }),
    );

    // Remove one-time handlers
    const remaining = specificHandlers.filter((e) => !e.once);
    if (remaining.length !== specificHandlers.length) {
      this.handlers.set(event, remaining);
    }

    return results;
  }

  /**
   * List registered event names (for debugging/admin).
   */
  listEvents(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Count handlers for an event (for testing).
   */
  handlerCount(event: string): number {
    return (this.handlers.get(event) || []).length;
  }

  /**
   * Remove all handlers (for testing).
   */
  reset(): void {
    this.handlers.clear();
    this.wildcardHandlers = [];
    _idCounter = 0;
  }
}

/**
 * Singleton event bus instance.
 * Import this everywhere: `import { eventBus } from "@/lib/core/event-bus"`
 */
export const eventBus = new DomainEventBus();
