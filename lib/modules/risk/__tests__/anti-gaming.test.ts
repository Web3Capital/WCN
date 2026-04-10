import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  getPrisma: vi.fn(() => mockPrisma),
}));

const mockPrisma = {
  node: {
    findUnique: vi.fn(),
  },
  deal: {
    findUnique: vi.fn(),
    count: vi.fn(),
  },
  poBRecord: {
    count: vi.fn(),
  },
  evidence: {
    findFirst: vi.fn(),
  },
  riskFlag: {
    create: vi.fn(),
  },
};

import { checkSelfDealing, checkCircularDeal, checkNodeVelocity, checkDuplicateEvidence } from "../anti-gaming";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkSelfDealing", () => {
  it("returns CRITICAL when nodes are identical", async () => {
    const result = await checkSelfDealing("node-1", "node-1");
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("SELF_DEALING");
    expect(result!.level).toBe("CRITICAL");
  });

  it("returns HIGH when nodes share the same owner", async () => {
    mockPrisma.node.findUnique
      .mockResolvedValueOnce({ ownerUserId: "user-1" })
      .mockResolvedValueOnce({ ownerUserId: "user-1" });

    const result = await checkSelfDealing("node-a", "node-b");
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("SAME_OWNER");
    expect(result!.level).toBe("HIGH");
  });

  it("returns null for different owners", async () => {
    mockPrisma.node.findUnique
      .mockResolvedValueOnce({ ownerUserId: "user-1" })
      .mockResolvedValueOnce({ ownerUserId: "user-2" });

    const result = await checkSelfDealing("node-a", "node-b");
    expect(result).toBeNull();
  });

  it("returns null when nodeIds are null", async () => {
    const result = await checkSelfDealing(null, "node-1");
    expect(result).toBeNull();
  });
});

describe("checkCircularDeal", () => {
  it("flags when participant shares ownership with lead", async () => {
    mockPrisma.deal.findUnique.mockResolvedValue({
      leadNodeId: "lead",
      leadNode: { ownerUserId: "owner-1" },
      participants: [
        { nodeId: "collab", node: { ownerUserId: "owner-1" } },
      ],
    });

    const result = await checkCircularDeal("deal-1");
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("CIRCULAR_DEAL");
  });

  it("returns null for clean deals", async () => {
    mockPrisma.deal.findUnique.mockResolvedValue({
      leadNodeId: "lead",
      leadNode: { ownerUserId: "owner-1" },
      participants: [
        { nodeId: "collab", node: { ownerUserId: "owner-2" } },
      ],
    });

    const result = await checkCircularDeal("deal-1");
    expect(result).toBeNull();
  });
});

describe("checkNodeVelocity", () => {
  it("returns no flags under thresholds", async () => {
    mockPrisma.deal.count.mockResolvedValue(5);
    mockPrisma.poBRecord.count.mockResolvedValue(10);

    const flags = await checkNodeVelocity("node-1");
    expect(flags).toHaveLength(0);
  });

  it("flags excessive deal velocity", async () => {
    mockPrisma.deal.count.mockResolvedValue(25);
    mockPrisma.poBRecord.count.mockResolvedValue(10);

    const flags = await checkNodeVelocity("node-1");
    expect(flags.some((f) => f.rule === "DEAL_VELOCITY")).toBe(true);
  });

  it("flags excessive PoB velocity", async () => {
    mockPrisma.deal.count.mockResolvedValue(5);
    mockPrisma.poBRecord.count.mockResolvedValue(60);

    const flags = await checkNodeVelocity("node-1");
    expect(flags.some((f) => f.rule === "POB_VELOCITY")).toBe(true);
  });
});

describe("checkDuplicateEvidence", () => {
  it("returns null for unique hash", async () => {
    mockPrisma.evidence.findFirst.mockResolvedValue(null);
    const result = await checkDuplicateEvidence("abc123");
    expect(result).toBeNull();
  });

  it("flags duplicate hash", async () => {
    mockPrisma.evidence.findFirst.mockResolvedValue({ id: "ev-1", dealId: "d-1", nodeId: "n-1" });
    const result = await checkDuplicateEvidence("abc123");
    expect(result).not.toBeNull();
    expect(result!.rule).toBe("DUPLICATE_EVIDENCE");
  });

  it("returns null when hash is null", async () => {
    const result = await checkDuplicateEvidence(null);
    expect(result).toBeNull();
  });
});
