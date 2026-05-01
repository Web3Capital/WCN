import { describe, expect, it } from "vitest";
import type { Role } from "@prisma/client";
import type { Session } from "next-auth";
import { getAvailableActions, getAvailableActionsMap } from "../available-actions";

function mkSession(role: Role): Session {
  return {
    user: {
      id: "u1",
      role,
      accountStatus: "ACTIVE",
      nodeIds: [],
      activeWorkspaceId: null,
      activeRole: role,
    },
    expires: "",
  };
}

describe("getAvailableActions", () => {
  it("returns empty array when session is null", () => {
    expect(getAvailableActions(null, "node")).toEqual([]);
  });

  it("returns empty array when session has no role", () => {
    const broken = { user: {} } as unknown as Session;
    expect(getAvailableActions(broken, "node")).toEqual([]);
  });

  it("USER has only `read` on read-only resources, nothing on others", () => {
    const session = mkSession("USER");
    expect(getAvailableActions(session, "node")).toEqual(["read"]);
    expect(getAvailableActions(session, "settlement")).toEqual([]);
    expect(getAvailableActions(session, "user")).toEqual([]);
  });

  it("FOUNDER has full access to most resources", () => {
    const session = mkSession("FOUNDER");
    const actions = getAvailableActions(session, "settlement");
    expect(actions).toEqual(
      expect.arrayContaining([
        "read",
        "create",
        "update",
        "delete",
        "export",
      ]),
    );
  });

  it("REVIEWER has review on evidence + pob but only read on node", () => {
    const session = mkSession("REVIEWER");
    expect(getAvailableActions(session, "evidence")).toEqual(
      expect.arrayContaining(["read", "review"]),
    );
    expect(getAvailableActions(session, "pob")).toEqual(
      expect.arrayContaining(["read", "review"]),
    );
    expect(getAvailableActions(session, "node")).toEqual(["read"]);
  });

  it("FINANCE_ADMIN has settlement update + export but not delete", () => {
    const session = mkSession("FINANCE_ADMIN");
    const actions = getAvailableActions(session, "settlement");
    expect(actions).toEqual(
      expect.arrayContaining(["read", "create", "update", "export"]),
    );
    expect(actions).not.toContain("delete");
  });

  it("OBSERVER has only read across visible resources", () => {
    const session = mkSession("OBSERVER");
    expect(getAvailableActions(session, "settlement")).toEqual(["read"]);
    expect(getAvailableActions(session, "node")).toEqual(["read"]);
    expect(getAvailableActions(session, "user")).toEqual([]);
  });
});

describe("getAvailableActionsMap", () => {
  it("returns a map keyed by resource", () => {
    const session = mkSession("REVIEWER");
    const map = getAvailableActionsMap(session, ["node", "evidence", "pob"] as const);
    expect(map.node).toEqual(["read"]);
    expect(map.evidence).toEqual(expect.arrayContaining(["read", "review"]));
    expect(map.pob).toEqual(expect.arrayContaining(["read", "review"]));
  });

  it("returns all-empty when session is null", () => {
    const map = getAvailableActionsMap(null, ["node", "deal"] as const);
    expect(map.node).toEqual([]);
    expect(map.deal).toEqual([]);
  });
});
