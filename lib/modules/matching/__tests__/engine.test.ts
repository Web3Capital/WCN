import { describe, it, expect } from "vitest";
import { scoreProjectCapital, DEFAULT_WEIGHTS, canTransitionMatch } from "../engine";

const baseProject = {
  sector: "DeFi",
  stage: "SEED" as const,
  fundraisingNeed: "$2M",
  workspaceId: "ws-1",
};

const baseCapital = {
  id: "cap-1",
  nodeId: "node-1",
  investmentFocus: ["DeFi", "SEED"],
  ticketMin: 500000,
  ticketMax: 5000000,
  jurisdictionLimit: [] as string[],
  blacklist: [] as string[],
};

describe("scoreProjectCapital", () => {
  it("returns a high score for perfectly matching profiles", () => {
    const result = scoreProjectCapital(baseProject, baseCapital);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(50);
  });

  it("returns null when nodeId is missing", () => {
    const cap = { ...baseCapital, nodeId: null };
    const result = scoreProjectCapital(baseProject, cap);
    expect(result).toBeNull();
  });

  it("returns null when sector is blacklisted", () => {
    const cap = { ...baseCapital, blacklist: ["defi"] };
    const result = scoreProjectCapital(baseProject, cap);
    expect(result).toBeNull();
  });

  it("gives lower score for mismatched sector", () => {
    const project = { ...baseProject, sector: "Gaming" };
    const result = scoreProjectCapital(project, baseCapital);
    expect(result).not.toBeNull();
    expect(result!.sectorScore).toBe(0);
  });

  it("gives lower score for out-of-range ticket", () => {
    const project = { ...baseProject, fundraisingNeed: "$100M" };
    const result = scoreProjectCapital(project, baseCapital);
    expect(result).not.toBeNull();
    expect(result!.ticketScore).toBe(0);
  });

  it("gives neutral scores when data is sparse", () => {
    const project = { sector: null, stage: "SEED" as const, fundraisingNeed: null, workspaceId: null };
    const cap = { ...baseCapital, investmentFocus: [], jurisdictionLimit: [] };
    const result = scoreProjectCapital(project, cap);
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
  });

  it("respects custom weights", () => {
    const sectorOnlyWeights = { sector: 1, stage: 0, ticket: 0, jurisdiction: 0 };
    const matched = scoreProjectCapital(baseProject, baseCapital, sectorOnlyWeights);
    const mismatched = scoreProjectCapital({ ...baseProject, sector: "Gaming" }, baseCapital, sectorOnlyWeights);
    expect(matched!.score).toBeGreaterThan(mismatched!.score);
  });

  it("jurisdiction score is 1 when no limits", () => {
    const result = scoreProjectCapital(baseProject, baseCapital);
    expect(result!.jurisdictionScore).toBe(1);
  });
});

describe("canTransitionMatch", () => {
  it("allows GENERATED -> INTEREST_EXPRESSED", () => {
    expect(canTransitionMatch("GENERATED", "INTEREST_EXPRESSED")).toBe(true);
  });

  it("allows GENERATED -> DECLINED", () => {
    expect(canTransitionMatch("GENERATED", "DECLINED")).toBe(true);
  });

  it("allows INTEREST_EXPRESSED -> CONVERTED_TO_DEAL", () => {
    expect(canTransitionMatch("INTEREST_EXPRESSED", "CONVERTED_TO_DEAL")).toBe(true);
  });

  it("blocks DECLINED -> anything", () => {
    expect(canTransitionMatch("DECLINED", "GENERATED")).toBe(false);
    expect(canTransitionMatch("DECLINED", "INTEREST_EXPRESSED")).toBe(false);
  });

  it("blocks CONVERTED_TO_DEAL -> anything", () => {
    expect(canTransitionMatch("CONVERTED_TO_DEAL", "DECLINED")).toBe(false);
  });
});
