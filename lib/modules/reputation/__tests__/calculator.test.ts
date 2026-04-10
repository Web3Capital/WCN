import { describe, it, expect } from "vitest";
import { calculateCompositeScore, determineTier, applyDecay, type ReputationComponents } from "../calculator";

describe("Reputation Calculator", () => {
  const baseComponents: ReputationComponents = {
    pobScore: 500,
    taskCompletionRate: 0.8,
    evidenceQuality: 0.9,
    disputeRate: 0.1,
    slaCompliance: 0.95,
    tenureMonths: 12,
    dealCount: 10,
  };

  describe("calculateCompositeScore", () => {
    it("calculates a composite score from all components", () => {
      const score = calculateCompositeScore(baseComponents);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1000);
    });

    it("returns higher score for better components", () => {
      const good = calculateCompositeScore(baseComponents);
      const bad = calculateCompositeScore({
        ...baseComponents,
        pobScore: 10,
        taskCompletionRate: 0.1,
        evidenceQuality: 0.1,
        disputeRate: 0.9,
        dealCount: 0,
      });
      expect(good).toBeGreaterThan(bad);
    });

    it("caps at 1000", () => {
      const maxed = calculateCompositeScore({
        pobScore: 3000,
        taskCompletionRate: 1.0,
        evidenceQuality: 1.0,
        disputeRate: 0,
        slaCompliance: 1.0,
        tenureMonths: 50,
        dealCount: 50,
      });
      expect(maxed).toBeLessThanOrEqual(1000);
    });

    it("returns 0 or low score for zero components", () => {
      const score = calculateCompositeScore({
        pobScore: 0,
        taskCompletionRate: 0,
        evidenceQuality: 0,
        disputeRate: 1,
        slaCompliance: 0,
        tenureMonths: 0,
        dealCount: 0,
      });
      expect(score).toBeLessThan(50);
    });
  });

  describe("determineTier", () => {
    it("returns DIAMOND for score >= 800", () => {
      expect(determineTier(800)).toBe("DIAMOND");
      expect(determineTier(1000)).toBe("DIAMOND");
    });

    it("returns PLATINUM for 600-799", () => {
      expect(determineTier(600)).toBe("PLATINUM");
      expect(determineTier(799)).toBe("PLATINUM");
    });

    it("returns GOLD for 400-599", () => {
      expect(determineTier(400)).toBe("GOLD");
      expect(determineTier(599)).toBe("GOLD");
    });

    it("returns SILVER for 200-399", () => {
      expect(determineTier(200)).toBe("SILVER");
      expect(determineTier(399)).toBe("SILVER");
    });

    it("returns BRONZE for < 200", () => {
      expect(determineTier(0)).toBe("BRONZE");
      expect(determineTier(199)).toBe("BRONZE");
    });
  });

  describe("applyDecay", () => {
    it("returns original score for 0 inactive months", () => {
      expect(applyDecay(500, 0)).toBe(500);
    });

    it("reduces score for inactive months", () => {
      const decayed = applyDecay(500, 3);
      expect(decayed).toBeLessThan(500);
      expect(decayed).toBeGreaterThan(0);
    });

    it("applies compound decay", () => {
      const d1 = applyDecay(500, 1);
      const d3 = applyDecay(500, 3);
      const d6 = applyDecay(500, 6);
      expect(d1).toBeGreaterThan(d3);
      expect(d3).toBeGreaterThan(d6);
    });

    it("returns 0 for negative months", () => {
      expect(applyDecay(500, -1)).toBe(500);
    });
  });
});
