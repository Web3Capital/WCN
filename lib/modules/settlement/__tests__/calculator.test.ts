import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

const mockPrisma = {
  settlementCycle: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  poBRecord: {
    findMany: vi.fn(),
  },
  settlementLine: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => fn(mockPrisma)),
};

import { calculateSettlementForCycle } from "../calculator";

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.settlementLine.deleteMany.mockResolvedValue({ count: 0 });
  mockPrisma.settlementLine.createMany.mockResolvedValue({ count: 0 });
  mockPrisma.settlementCycle.update.mockResolvedValue({});
});

describe("calculateSettlementForCycle", () => {
  it("distributes pool proportionally across nodes", async () => {
    mockPrisma.settlementCycle.findUnique.mockResolvedValue({
      id: "cycle-1",
      startAt: new Date("2026-01-01"),
      endAt: new Date("2026-01-31"),
      pool: 100000,
      status: "DRAFT",
    });

    mockPrisma.poBRecord.findMany.mockResolvedValue([
      {
        id: "pob-1",
        score: 1000,
        attributions: [
          { nodeId: "node-a", shareBps: 6000 },
          { nodeId: "node-b", shareBps: 4000 },
        ],
      },
    ]);

    const result = await calculateSettlementForCycle("cycle-1");

    expect(result.pool).toBe(100000);
    expect(result.platformFee).toBe(5000);
    expect(result.distributablePool).toBe(95000);
    expect(result.lineCount).toBe(2);

    const nodeA = result.lines.find((l) => l.nodeId === "node-a");
    const nodeB = result.lines.find((l) => l.nodeId === "node-b");
    expect(nodeA!.allocation).toBeGreaterThan(nodeB!.allocation);
    expect(nodeA!.allocation + nodeB!.allocation).toBeCloseTo(95000, 0);
  });

  it("handles zero PoB records", async () => {
    mockPrisma.settlementCycle.findUnique.mockResolvedValue({
      id: "cycle-2",
      startAt: new Date("2026-01-01"),
      endAt: new Date("2026-01-31"),
      pool: 50000,
      status: "DRAFT",
    });

    mockPrisma.poBRecord.findMany.mockResolvedValue([]);

    const result = await calculateSettlementForCycle("cycle-2");
    expect(result.lineCount).toBe(0);
    expect(result.networkScore).toBe(0);
  });

  it("applies 5% platform fee", async () => {
    mockPrisma.settlementCycle.findUnique.mockResolvedValue({
      id: "cycle-3",
      startAt: new Date("2026-01-01"),
      endAt: new Date("2026-01-31"),
      pool: 200000,
      status: "RECONCILED",
    });

    mockPrisma.poBRecord.findMany.mockResolvedValue([]);

    const result = await calculateSettlementForCycle("cycle-3");
    expect(result.platformFee).toBe(10000);
    expect(result.distributablePool).toBe(190000);
  });

  it("throws for missing cycle", async () => {
    mockPrisma.settlementCycle.findUnique.mockResolvedValue(null);
    await expect(calculateSettlementForCycle("missing")).rejects.toThrow("not found");
  });

  it("aggregates across multiple PoB records", async () => {
    mockPrisma.settlementCycle.findUnique.mockResolvedValue({
      id: "cycle-4",
      startAt: new Date("2026-01-01"),
      endAt: new Date("2026-01-31"),
      pool: 100000,
      status: "DRAFT",
    });

    mockPrisma.poBRecord.findMany.mockResolvedValue([
      { id: "pob-1", score: 500, attributions: [{ nodeId: "node-a", shareBps: 10000 }] },
      { id: "pob-2", score: 500, attributions: [{ nodeId: "node-a", shareBps: 10000 }] },
    ]);

    const result = await calculateSettlementForCycle("cycle-4");
    expect(result.lineCount).toBe(1);
    expect(result.lines[0].pobCount).toBe(2);
    expect(result.lines[0].allocation).toBeCloseTo(95000, 0);
  });
});
