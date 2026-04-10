import { describe, it, expect } from "vitest";
import { canTransitionTask, validNextTaskStatuses } from "@/lib/state-machines/task";
import { canTransitionDeal } from "@/lib/state-machines/deal";
import { canTransitionNode } from "@/lib/state-machines/node";
import { canTransitionEvidence } from "@/lib/state-machines/evidence-pob";
import { canTransitionAccount } from "@/lib/state-machines/account";

describe("Task State Machine", () => {
  it("allows DRAFT -> ASSIGNED", () => {
    expect(canTransitionTask("DRAFT", "ASSIGNED")).toBe(true);
  });

  it("allows IN_PROGRESS -> SUBMITTED", () => {
    expect(canTransitionTask("IN_PROGRESS", "SUBMITTED")).toBe(true);
  });

  it("allows SUBMITTED -> ACCEPTED", () => {
    expect(canTransitionTask("SUBMITTED", "ACCEPTED")).toBe(true);
  });

  it("allows SUBMITTED -> REWORK", () => {
    expect(canTransitionTask("SUBMITTED", "REWORK")).toBe(true);
  });

  it("blocks DRAFT -> CLOSED", () => {
    expect(canTransitionTask("DRAFT", "CLOSED")).toBe(false);
  });

  it("blocks CANCELLED -> anything", () => {
    expect(canTransitionTask("CANCELLED", "DRAFT")).toBe(false);
    expect(canTransitionTask("CANCELLED", "IN_PROGRESS")).toBe(false);
  });

  it("blocks CLOSED -> anything", () => {
    expect(canTransitionTask("CLOSED", "DRAFT")).toBe(false);
  });

  it("returns valid next statuses for SUBMITTED", () => {
    const next = validNextTaskStatuses("SUBMITTED");
    expect(next).toContain("ACCEPTED");
    expect(next).toContain("REWORK");
    expect(next).not.toContain("DRAFT");
  });

  it("handles legacy OPEN status", () => {
    expect(canTransitionTask("OPEN", "ASSIGNED")).toBe(true);
    expect(canTransitionTask("OPEN", "IN_PROGRESS")).toBe(true);
  });
});

describe("Deal State Machine", () => {
  it("allows SOURCED -> MATCHED", () => {
    expect(canTransitionDeal("SOURCED", "MATCHED")).toBe(true);
  });

  it("allows DD -> TERM_SHEET", () => {
    expect(canTransitionDeal("DD", "TERM_SHEET")).toBe(true);
  });

  it("blocks terminal states", () => {
    expect(canTransitionDeal("FUNDED", "SOURCED")).toBe(false);
    expect(canTransitionDeal("PASSED", "SOURCED")).toBe(false);
  });
});

describe("Node State Machine", () => {
  it("allows DRAFT -> SUBMITTED", () => {
    expect(canTransitionNode("DRAFT", "SUBMITTED")).toBe(true);
  });

  it("allows APPROVED -> CONTRACTING", () => {
    expect(canTransitionNode("APPROVED", "CONTRACTING")).toBe(true);
  });

  it("blocks OFFBOARDED -> anything", () => {
    expect(canTransitionNode("OFFBOARDED", "DRAFT")).toBe(false);
  });
});

describe("Evidence State Machine", () => {
  it("allows DRAFT -> SUBMITTED", () => {
    expect(canTransitionEvidence("DRAFT", "SUBMITTED")).toBe(true);
  });

  it("allows SUBMITTED -> UNDER_REVIEW", () => {
    expect(canTransitionEvidence("SUBMITTED", "UNDER_REVIEW")).toBe(true);
  });

  it("allows UNDER_REVIEW -> APPROVED", () => {
    expect(canTransitionEvidence("UNDER_REVIEW", "APPROVED")).toBe(true);
  });

  it("allows UNDER_REVIEW -> REJECTED", () => {
    expect(canTransitionEvidence("UNDER_REVIEW", "REJECTED")).toBe(true);
  });

  it("blocks SUBMITTED -> APPROVED directly", () => {
    expect(canTransitionEvidence("SUBMITTED", "APPROVED")).toBe(false);
  });
});

describe("Account State Machine", () => {
  it("allows ACTIVE -> SUSPENDED", () => {
    expect(canTransitionAccount("ACTIVE", "SUSPENDED")).toBe(true);
  });

  it("blocks OFFBOARDED -> anything", () => {
    expect(canTransitionAccount("OFFBOARDED", "ACTIVE")).toBe(false);
  });
});
