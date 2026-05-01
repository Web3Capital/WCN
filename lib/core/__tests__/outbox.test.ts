import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedFunction } from "vitest";

const hoisted = vi.hoisted(() => {
  return {
    eventBusEmit: vi.fn() as MockedFunction<(...args: unknown[]) => Promise<unknown>>,
    metricsIncrement: vi.fn(),
    metricsObserve: vi.fn(),
  };
});

vi.mock("@/lib/core/event-bus", () => ({
  eventBus: {
    emit: hoisted.eventBusEmit,
  },
}));

vi.mock("@/lib/core/metrics", () => ({
  metrics: {
    increment: hoisted.metricsIncrement,
    observe: hoisted.metricsObserve,
  },
}));

interface OutboxRow {
  id: string;
  eventName: string;
  payload: Record<string, unknown>;
  actorId: string | null;
  requestId: string | null;
  delivered: boolean;
  deliveredAt: Date | null;
  retryCount: number;
  lastError: string | null;
  createdAt: Date;
}

const outboxStore = new Map<string, OutboxRow>();

const mockPrisma = {
  outbox: {
    findMany: vi.fn(
      async ({
        where,
        orderBy,
        take,
        cursor,
        skip,
      }: {
        where: { delivered: boolean; retryCount?: { lt?: number; gte?: number } };
        orderBy?: { createdAt: "asc" | "desc" };
        take?: number;
        cursor?: { id: string };
        skip?: number;
      }) => {
        let rows = Array.from(outboxStore.values()).filter((r) => r.delivered === where.delivered);
        if (where.retryCount?.lt !== undefined) {
          rows = rows.filter((r) => r.retryCount < where.retryCount!.lt!);
        }
        if (where.retryCount?.gte !== undefined) {
          rows = rows.filter((r) => r.retryCount >= where.retryCount!.gte!);
        }
        if (orderBy?.createdAt === "asc") {
          rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        if (cursor?.id) {
          const idx = rows.findIndex((r) => r.id === cursor.id);
          if (idx >= 0) rows = rows.slice(idx + (skip ?? 0));
        }
        if (take) rows = rows.slice(0, take);
        return rows;
      },
    ),
    findUnique: vi.fn(
      async ({ where, select }: { where: { id: string }; select?: Record<string, boolean> }) => {
        const row = outboxStore.get(where.id);
        if (!row) return null;
        if (!select) return row;
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(select)) {
          if (v) out[k] = (row as unknown as Record<string, unknown>)[k];
        }
        return out;
      },
    ),
    update: vi.fn(
      async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<OutboxRow> & { retryCount?: { increment: number } };
      }) => {
        const row = outboxStore.get(where.id);
        if (!row) throw new Error("not found");
        const next: OutboxRow = { ...row };
        for (const [k, v] of Object.entries(data)) {
          if (k === "retryCount" && typeof v === "object" && v && "increment" in v) {
            next.retryCount = row.retryCount + (v as { increment: number }).increment;
          } else {
            (next as unknown as Record<string, unknown>)[k] = v;
          }
        }
        outboxStore.set(where.id, next);
        return next;
      },
    ),
    count: vi.fn(
      async ({ where }: { where: { delivered: boolean; retryCount?: { gte: number } } }) => {
        let rows = Array.from(outboxStore.values()).filter((r) => r.delivered === where.delivered);
        if (where.retryCount?.gte !== undefined) {
          rows = rows.filter((r) => r.retryCount >= where.retryCount!.gte!);
        }
        return rows.length;
      },
    ),
    findFirst: vi.fn(
      async ({
        where,
        orderBy,
        select,
      }: {
        where: { delivered: boolean };
        orderBy?: { createdAt: "asc" | "desc" };
        select?: { createdAt?: boolean };
      }) => {
        let rows = Array.from(outboxStore.values()).filter((r) => r.delivered === where.delivered);
        if (orderBy?.createdAt === "asc") {
          rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        }
        const first = rows[0];
        if (!first) return null;
        if (select?.createdAt) return { createdAt: first.createdAt };
        return first;
      },
    ),
    deleteMany: vi.fn(
      async ({ where }: { where: { delivered: boolean; deliveredAt?: { lt: Date } } }) => {
        const toDelete = Array.from(outboxStore.values()).filter((r) => {
          if (r.delivered !== where.delivered) return false;
          if (where.deliveredAt?.lt && (!r.deliveredAt || r.deliveredAt >= where.deliveredAt.lt)) return false;
          return true;
        });
        for (const r of toDelete) outboxStore.delete(r.id);
        return { count: toDelete.length };
      },
    ),
    create: vi.fn(
      async ({ data }: { data: Partial<OutboxRow> }) => {
        const id = `o_${outboxStore.size + 1}`;
        const row: OutboxRow = {
          id,
          eventName: data.eventName ?? "",
          payload: data.payload ?? {},
          actorId: data.actorId ?? null,
          requestId: data.requestId ?? null,
          delivered: false,
          deliveredAt: null,
          retryCount: 0,
          lastError: null,
          createdAt: new Date(),
        };
        outboxStore.set(id, row);
        return row;
      },
    ),
  },
};

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => mockPrisma,
}));

import {
  DLQ_THRESHOLD,
  processOutbox,
  getOutboxDlqDepth,
  getOutboxMetrics,
  cleanupOutbox,
  writeToOutbox,
  listDlqEvents,
  requeueOutboxEvent,
  discardOutboxEvent,
} from "../outbox";

function seed(rows: Partial<OutboxRow>[]): void {
  outboxStore.clear();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    outboxStore.set(r.id ?? `o_${i + 1}`, {
      id: r.id ?? `o_${i + 1}`,
      eventName: r.eventName ?? "test.event",
      payload: r.payload ?? {},
      actorId: r.actorId ?? null,
      requestId: r.requestId ?? null,
      delivered: r.delivered ?? false,
      deliveredAt: r.deliveredAt ?? null,
      retryCount: r.retryCount ?? 0,
      lastError: r.lastError ?? null,
      createdAt: r.createdAt ?? new Date(),
    });
  }
}

beforeEach(() => {
  outboxStore.clear();
  hoisted.eventBusEmit.mockReset();
  hoisted.eventBusEmit.mockResolvedValue(undefined);
  hoisted.metricsIncrement.mockClear();
  hoisted.metricsObserve.mockClear();
  for (const fn of Object.values(mockPrisma.outbox)) (fn as ReturnType<typeof vi.fn>).mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("DLQ_THRESHOLD", () => {
  it("is 5 (formerly an implicit literal in the query)", () => {
    expect(DLQ_THRESHOLD).toBe(5);
  });
});

describe("processOutbox — happy path", () => {
  it("delivers pending events and marks them delivered", async () => {
    seed([
      { id: "o_1", eventName: "node.created", retryCount: 0 },
      { id: "o_2", eventName: "deal.created", retryCount: 0 },
    ]);

    const result = await processOutbox();

    expect(result.delivered).toBe(2);
    expect(result.failed).toBe(0);
    expect(hoisted.eventBusEmit).toHaveBeenCalledTimes(2);
    expect(outboxStore.get("o_1")?.delivered).toBe(true);
    expect(outboxStore.get("o_1")?.deliveredAt).toBeInstanceOf(Date);
    expect(outboxStore.get("o_2")?.delivered).toBe(true);
  });

  it("emits delivered counter and age histogram per event", async () => {
    const oldEvent = new Date(Date.now() - 30_000);
    seed([{ id: "o_1", eventName: "node.created", createdAt: oldEvent }]);

    await processOutbox();

    expect(hoisted.metricsIncrement).toHaveBeenCalledWith(
      "outbox_events_processed_total",
      { event: "node.created", result: "delivered" },
    );
    const ageCalls = hoisted.metricsObserve.mock.calls.filter((c) => c[0] === "outbox_event_age_seconds");
    expect(ageCalls).toHaveLength(1);
    const [, ageValue, ageLabels] = ageCalls[0];
    expect(ageValue).toBeGreaterThan(25);
    expect(ageValue).toBeLessThan(60);
    expect(ageLabels).toEqual({ event: "node.created" });
  });

  it("respects batchSize", async () => {
    seed(Array.from({ length: 10 }, (_, i) => ({ id: `o_${i}`, eventName: "x" })));
    const result = await processOutbox(3);
    expect(result.delivered).toBe(3);
    expect(hoisted.eventBusEmit).toHaveBeenCalledTimes(3);
  });

  it("skips events at or above DLQ_THRESHOLD", async () => {
    seed([
      { id: "stuck", eventName: "x", retryCount: DLQ_THRESHOLD },
      { id: "fresh", eventName: "x", retryCount: 0 },
    ]);
    const result = await processOutbox();
    expect(result.delivered).toBe(1);
    expect(outboxStore.get("stuck")?.delivered).toBe(false);
    expect(outboxStore.get("stuck")?.retryCount).toBe(DLQ_THRESHOLD);
  });
});

describe("processOutbox — failure path", () => {
  it("increments retryCount and stores lastError on emit failure", async () => {
    seed([{ id: "o_fail", eventName: "x", retryCount: 0 }]);
    hoisted.eventBusEmit.mockRejectedValueOnce(new Error("handler boom"));

    const result = await processOutbox();

    expect(result.delivered).toBe(0);
    expect(result.failed).toBe(1);
    expect(outboxStore.get("o_fail")?.delivered).toBe(false);
    expect(outboxStore.get("o_fail")?.retryCount).toBe(1);
    expect(outboxStore.get("o_fail")?.lastError).toBe("handler boom");

    expect(hoisted.metricsIncrement).toHaveBeenCalledWith(
      "outbox_events_processed_total",
      { event: "x", result: "failed" },
    );
  });

  it("counts a final retry attempt as 'dlq' result, not 'failed'", async () => {
    seed([{ id: "o_dlq", eventName: "x", retryCount: DLQ_THRESHOLD - 1 }]);
    hoisted.eventBusEmit.mockRejectedValueOnce(new Error("final boom"));

    await processOutbox();

    expect(outboxStore.get("o_dlq")?.retryCount).toBe(DLQ_THRESHOLD);
    expect(hoisted.metricsIncrement).toHaveBeenCalledWith(
      "outbox_events_processed_total",
      { event: "x", result: "dlq" },
    );
    const retryObs = hoisted.metricsObserve.mock.calls.find(
      (c) => c[0] === "outbox_event_retry_count",
    );
    expect(retryObs).toBeDefined();
    expect(retryObs![1]).toBe(DLQ_THRESHOLD);
  });

  it("emits outbox_dlq_depth gauge after each batch", async () => {
    seed([
      { id: "stuck1", eventName: "x", retryCount: DLQ_THRESHOLD },
      { id: "stuck2", eventName: "x", retryCount: DLQ_THRESHOLD + 1 },
      { id: "fresh", eventName: "x", retryCount: 0 },
    ]);

    const result = await processOutbox();
    expect(result.dlq).toBe(2);

    const dlqObs = hoisted.metricsObserve.mock.calls.find((c) => c[0] === "outbox_dlq_depth");
    expect(dlqObs).toBeDefined();
    expect(dlqObs![1]).toBe(2);
  });
});

describe("getOutboxDlqDepth", () => {
  it("counts only stuck (retryCount >= DLQ_THRESHOLD) undelivered events", async () => {
    seed([
      { id: "fresh", retryCount: 0, delivered: false },
      { id: "trying", retryCount: DLQ_THRESHOLD - 1, delivered: false },
      { id: "stuck1", retryCount: DLQ_THRESHOLD, delivered: false },
      { id: "stuck2", retryCount: DLQ_THRESHOLD + 5, delivered: false },
      { id: "delivered_old", retryCount: DLQ_THRESHOLD + 1, delivered: true },
    ]);
    const depth = await getOutboxDlqDepth();
    expect(depth).toBe(2);
  });

  it("returns 0 when no stuck events exist", async () => {
    seed([{ id: "fresh", retryCount: 0 }]);
    expect(await getOutboxDlqDepth()).toBe(0);
  });
});

describe("getOutboxMetrics", () => {
  it("returns pendingCount, failedCount (alias of dlqDepth), dlqDepth, oldestPending", async () => {
    const old = new Date(Date.now() - 60_000);
    seed([
      { id: "p1", retryCount: 0, delivered: false, createdAt: old },
      { id: "p2", retryCount: 1, delivered: false, createdAt: new Date() },
      { id: "stuck", retryCount: DLQ_THRESHOLD, delivered: false, createdAt: new Date() },
    ]);

    const m = await getOutboxMetrics();
    expect(m.pendingCount).toBe(3);
    expect(m.dlqDepth).toBe(1);
    expect(m.failedCount).toBe(1); // back-compat alias
    expect(m.oldestPending?.getTime()).toBe(old.getTime());
  });

  it("returns oldestPending=null when no pending events", async () => {
    seed([{ id: "d", delivered: true, deliveredAt: new Date() }]);
    const m = await getOutboxMetrics();
    expect(m.pendingCount).toBe(0);
    expect(m.oldestPending).toBeNull();
  });
});

describe("cleanupOutbox", () => {
  it("deletes delivered events older than retentionDays", async () => {
    const old = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    const recent = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    seed([
      { id: "old1", delivered: true, deliveredAt: old },
      { id: "old2", delivered: true, deliveredAt: old },
      { id: "recent", delivered: true, deliveredAt: recent },
      { id: "pending", delivered: false },
    ]);
    const count = await cleanupOutbox(30);
    expect(count).toBe(2);
    expect(outboxStore.has("recent")).toBe(true);
    expect(outboxStore.has("pending")).toBe(true);
  });
});

describe("writeToOutbox", () => {
  it("creates a row and increments outbox_events_written_total", async () => {
    const tx = mockPrisma; // same shape; tx is just a typed client
    const id = await writeToOutbox(
      tx,
      "node.created",
      { nodeId: "n1", entityType: "NODE", entityId: "n1" },
      { actorId: "u1", requestId: "r1" },
    );

    expect(id).toBeTruthy();
    expect(outboxStore.size).toBe(1);
    const row = outboxStore.get(id);
    expect(row?.eventName).toBe("node.created");
    expect(row?.actorId).toBe("u1");
    expect(hoisted.metricsIncrement).toHaveBeenCalledWith(
      "outbox_events_written_total",
      { event: "node.created" },
    );
  });
});

describe("listDlqEvents", () => {
  it("returns only events with retryCount >= DLQ_THRESHOLD, oldest first", async () => {
    const t0 = new Date("2026-04-01T00:00:00Z");
    const t1 = new Date("2026-04-02T00:00:00Z");
    seed([
      { id: "fresh", retryCount: 0, createdAt: t1 },
      { id: "stuck-old", retryCount: DLQ_THRESHOLD, createdAt: t0 },
      { id: "stuck-new", retryCount: DLQ_THRESHOLD + 1, createdAt: t1 },
      { id: "delivered", retryCount: DLQ_THRESHOLD, delivered: true },
    ]);

    const rows = await listDlqEvents();
    expect(rows.map((r) => r.id)).toEqual(["stuck-old", "stuck-new"]);
  });

  it("respects limit (clamps to [1, 100]) and supports cursor pagination", async () => {
    const base = Date.now();
    seed(
      Array.from({ length: 5 }, (_, i) => ({
        id: `s_${i}`,
        retryCount: DLQ_THRESHOLD,
        createdAt: new Date(base + i * 1000),
      })),
    );

    const page1 = await listDlqEvents({ limit: 2 });
    // listDlqEvents takes limit + 1 to detect hasMore.
    expect(page1.map((r) => r.id)).toEqual(["s_0", "s_1", "s_2"]);

    const page2 = await listDlqEvents({ limit: 2, cursor: "s_1" });
    expect(page2.map((r) => r.id)).toEqual(["s_2", "s_3", "s_4"]);
  });

  it("returns empty when no DLQ events", async () => {
    seed([{ id: "fresh", retryCount: 0 }]);
    expect(await listDlqEvents()).toEqual([]);
  });
});

describe("requeueOutboxEvent", () => {
  it("resets retryCount and lastError on a stuck event", async () => {
    seed([{ id: "stuck", retryCount: DLQ_THRESHOLD + 2, lastError: "boom" }]);
    const r = await requeueOutboxEvent("stuck");
    expect(r).not.toBeNull();
    expect(outboxStore.get("stuck")?.retryCount).toBe(0);
    expect(outboxStore.get("stuck")?.lastError).toBeNull();
  });

  it("returns null for an event still in normal retry (not yet DLQ)", async () => {
    seed([{ id: "trying", retryCount: DLQ_THRESHOLD - 1 }]);
    const r = await requeueOutboxEvent("trying");
    expect(r).toBeNull();
    expect(outboxStore.get("trying")?.retryCount).toBe(DLQ_THRESHOLD - 1);
  });

  it("returns null for a delivered event (no resurrection)", async () => {
    seed([{ id: "done", retryCount: DLQ_THRESHOLD, delivered: true }]);
    expect(await requeueOutboxEvent("done")).toBeNull();
  });

  it("returns null for a non-existent id", async () => {
    expect(await requeueOutboxEvent("nope")).toBeNull();
  });
});

describe("discardOutboxEvent", () => {
  it("tombstones a stuck event without dispatching", async () => {
    seed([{ id: "stuck", retryCount: DLQ_THRESHOLD }]);
    const r = await discardOutboxEvent("stuck");
    expect(r).not.toBeNull();
    expect(outboxStore.get("stuck")?.delivered).toBe(true);
    expect(outboxStore.get("stuck")?.deliveredAt).toBeInstanceOf(Date);
    expect(hoisted.eventBusEmit).not.toHaveBeenCalled();
  });

  it("returns null for an event still in normal retry", async () => {
    seed([{ id: "trying", retryCount: DLQ_THRESHOLD - 1 }]);
    expect(await discardOutboxEvent("trying")).toBeNull();
  });

  it("returns null for already-delivered event", async () => {
    seed([{ id: "done", retryCount: DLQ_THRESHOLD, delivered: true }]);
    expect(await discardOutboxEvent("done")).toBeNull();
  });
});
