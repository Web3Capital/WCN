import { describe, it, expect, vi, beforeEach } from "vitest";
import { DomainEventBus } from "@/lib/core/event-bus";

describe("EventBus", () => {
  let bus: DomainEventBus;

  beforeEach(() => {
    bus = new DomainEventBus();
  });

  it("delivers events to subscribers", async () => {
    const handler = vi.fn();
    bus.on("test.event", handler);
    await bus.emit("test.event", { foo: "bar" });
    expect(handler).toHaveBeenCalledWith({ foo: "bar" }, expect.objectContaining({ eventName: "test.event" }));
  });

  it("delivers to multiple subscribers", async () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    bus.on("test.multi", h1);
    bus.on("test.multi", h2);
    await bus.emit("test.multi", { x: 1 });
    expect(h1).toHaveBeenCalledTimes(1);
    expect(h2).toHaveBeenCalledTimes(1);
  });

  it("calls onAny handler for every event", async () => {
    const handler = vi.fn();
    bus.onAny(handler);
    await bus.emit("a.event", { a: 1 });
    await bus.emit("b.event", { b: 2 });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("isolates handler errors", async () => {
    const good = vi.fn();
    const bad = vi.fn(() => { throw new Error("boom"); });
    bus.on("test.err", bad);
    bus.on("test.err", good);
    await bus.emit("test.err", {});
    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalled();
  });

  it("passes actorId in metadata", async () => {
    const handler = vi.fn();
    bus.on("test.actor", handler);
    await bus.emit("test.actor", {}, { actorId: "user-123" });
    expect(handler).toHaveBeenCalledWith({}, expect.objectContaining({ actorId: "user-123" }));
  });

  it("generates unique event IDs", async () => {
    const ids: string[] = [];
    bus.on("test.id", async (_payload, meta) => { ids.push(meta.eventId); });
    await bus.emit("test.id", {});
    await bus.emit("test.id", {});
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("listEvents returns registered event names", () => {
    bus.on("x.y", vi.fn());
    bus.on("a.b", vi.fn());
    const events = bus.listEvents();
    expect(events).toContain("x.y");
    expect(events).toContain("a.b");
  });
});
