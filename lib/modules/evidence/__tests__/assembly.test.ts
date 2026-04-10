import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

vi.mock("@/lib/core/event-bus", () => ({
  eventBus: { emit: vi.fn() },
}));

const mockPrisma = {
  evidence: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  deal: {
    findUnique: vi.fn(),
  },
};

import { checkCompleteness } from "../assembly";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkCompleteness", () => {
  it("returns complete when all required types present", async () => {
    mockPrisma.evidence.findMany.mockResolvedValue([
      { type: "CONTRACT" },
      { type: "TRANSFER" },
      { type: "REPORT" },
    ]);

    const result = await checkCompleteness("deal-1");
    expect(result.complete).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.score).toBeGreaterThanOrEqual(100);
  });

  it("returns incomplete when missing CONTRACT", async () => {
    mockPrisma.evidence.findMany.mockResolvedValue([
      { type: "TRANSFER" },
    ]);

    const result = await checkCompleteness("deal-1");
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("CONTRACT");
    expect(result.score).toBe(50);
  });

  it("returns incomplete when no evidence", async () => {
    mockPrisma.evidence.findMany.mockResolvedValue([]);

    const result = await checkCompleteness("deal-1");
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("CONTRACT");
    expect(result.missing).toContain("TRANSFER");
  });

  it("handles duplicate types correctly", async () => {
    mockPrisma.evidence.findMany.mockResolvedValue([
      { type: "CONTRACT" },
      { type: "CONTRACT" },
      { type: "TRANSFER" },
    ]);

    const result = await checkCompleteness("deal-1");
    expect(result.complete).toBe(true);
    expect(result.present).toContain("CONTRACT");
    expect(result.present).toContain("TRANSFER");
  });
});
