/**
 * WCN Domain Event Bus
 *
 * In-process event emitter for domain events. Designed to be swapped to
 * Redis Streams or Kafka without changing emitter/handler signatures.
 *
 * All handlers execute concurrently via Promise.allSettled — a failed
 * handler never blocks the emitter or other handlers.
 */

export type EventPayload = Record<string, any>;

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

class DomainEventBus {
  private handlers = new Map<string, HandlerEntry[]>();
  private wildcardHandlers: HandlerEntry[] = [];

  /**
   * Register a handler for a specific event.
   */
  on<T extends EventPayload = EventPayload>(
    event: string,
    handler: EventHandler<T>,
  ): () => void {
    const entry: HandlerEntry = { handler: handler as EventHandler, once: false };
    const list = this.handlers.get(event) || [];
    list.push(entry);
    this.handlers.set(event, list);
    return () => this.off(event, handler as EventHandler);
  }

  /**
   * Register a one-time handler.
   */
  once<T extends EventPayload = EventPayload>(
    event: string,
    handler: EventHandler<T>,
  ): void {
    const entry: HandlerEntry = { handler: handler as EventHandler, once: true };
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
   * Returns results so callers can inspect failures if needed.
   */
  async emit<T extends EventPayload = EventPayload>(
    event: string,
    payload: T,
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
