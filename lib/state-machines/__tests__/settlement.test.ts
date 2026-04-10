import { describe, it, expect } from "vitest";
import { canTransitionSettlement, validNextSettlementStatuses } from "../settlement";
import type { SettlementCycleStatus } from "@prisma/client";

describe("Settlement State Machine", () => {
  describe("canTransitionSettlement", () => {
    it("DRAFT → RECONCILED is valid", () => {
      expect(canTransitionSettlement("DRAFT" as SettlementCycleStatus, "RECONCILED" as SettlementCycleStatus)).toBe(true);
    });

    it("DRAFT → LOCKED is invalid (must reconcile first)", () => {
      expect(canTransitionSettlement("DRAFT" as SettlementCycleStatus, "LOCKED" as SettlementCycleStatus)).toBe(false);
    });

    it("RECONCILED → LOCKED is valid", () => {
      expect(canTransitionSettlement("RECONCILED" as SettlementCycleStatus, "LOCKED" as SettlementCycleStatus)).toBe(true);
    });

    it("LOCKED → EXPORTED is valid", () => {
      expect(canTransitionSettlement("LOCKED" as SettlementCycleStatus, "EXPORTED" as SettlementCycleStatus)).toBe(true);
    });

    it("LOCKED → FINALIZED is valid", () => {
      expect(canTransitionSettlement("LOCKED" as SettlementCycleStatus, "FINALIZED" as SettlementCycleStatus)).toBe(true);
    });

    it("FINALIZED → anything is invalid (terminal state)", () => {
      expect(canTransitionSettlement("FINALIZED" as SettlementCycleStatus, "DRAFT" as SettlementCycleStatus)).toBe(false);
      expect(canTransitionSettlement("FINALIZED" as SettlementCycleStatus, "REOPENED" as SettlementCycleStatus)).toBe(false);
    });

    it("EXPORTED → FINALIZED is valid", () => {
      expect(canTransitionSettlement("EXPORTED" as SettlementCycleStatus, "FINALIZED" as SettlementCycleStatus)).toBe(true);
    });

    it("REOPENED → RECONCILED is valid", () => {
      expect(canTransitionSettlement("REOPENED" as SettlementCycleStatus, "RECONCILED" as SettlementCycleStatus)).toBe(true);
    });

    it("RECONCILED → DRAFT (rollback) is valid", () => {
      expect(canTransitionSettlement("RECONCILED" as SettlementCycleStatus, "DRAFT" as SettlementCycleStatus)).toBe(true);
    });
  });

  describe("validNextSettlementStatuses", () => {
    it("DRAFT has RECONCILED as only option", () => {
      const next = validNextSettlementStatuses("DRAFT" as SettlementCycleStatus);
      expect(next).toContain("RECONCILED");
      expect(next.length).toBe(1);
    });

    it("FINALIZED has no valid transitions", () => {
      const next = validNextSettlementStatuses("FINALIZED" as SettlementCycleStatus);
      expect(next).toEqual([]);
    });

    it("LOCKED has multiple options", () => {
      const next = validNextSettlementStatuses("LOCKED" as SettlementCycleStatus);
      expect(next.length).toBeGreaterThan(1);
      expect(next).toContain("EXPORTED");
      expect(next).toContain("FINALIZED");
    });
  });
});
