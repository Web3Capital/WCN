import { describe, expect, it } from "vitest";
import { STATUS_COLORS, colorForStatus } from "../badge-colors";

describe("colorForStatus", () => {
  it("returns the mapped class for known statuses", () => {
    expect(colorForStatus("LIVE")).toBe("badge-green");
    expect(colorForStatus("PENDING")).toBe("badge-amber");
    expect(colorForStatus("REJECTED")).toBe("badge-red");
    expect(colorForStatus("UNDER_REVIEW")).toBe("badge-purple");
  });

  it("returns empty string for unmapped statuses (so the badge degrades gracefully)", () => {
    expect(colorForStatus("UNKNOWN_STATUS_FOO")).toBe("");
    expect(colorForStatus("")).toBe("");
  });

  it("covers every Node status value used in the SM transitions matrix", () => {
    // Mirror of `lib/core/state-machine.ts` NodeMachine keys. If a new
    // node status is added without a color mapping, this fails — keep
    // the visual language complete.
    const nodeStatuses = [
      "DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEED_MORE_INFO", "APPROVED",
      "REJECTED", "CONTRACTING", "LIVE", "WATCHLIST", "PROBATION",
      "SUSPENDED", "OFFBOARDED", "ACTIVE",
    ];
    for (const s of nodeStatuses) {
      expect(STATUS_COLORS[s], `Node status ${s} has no color mapping`).toBeTruthy();
    }
  });

  it("covers every Settlement status used in the SM transitions matrix", () => {
    const settlementStatuses = [
      "DRAFT", "RECONCILED", "LOCK_PENDING_APPROVAL", "LOCKED",
      "EXPORTED", "REOPEN_PENDING_APPROVAL", "REOPENED", "FINALIZED",
    ];
    for (const s of settlementStatuses) {
      expect(STATUS_COLORS[s], `Settlement status ${s} has no color mapping`).toBeTruthy();
    }
  });
});
