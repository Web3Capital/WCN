import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  getOwnedNodeIds,
  memberProjectsWhere,
  memberTasksWhere,
  memberPoBWhere,
  memberAgentsWhere,
  memberEvidenceWhere,
  memberAgentRunsWhere,
} from "../member-data-scope";

function mkPrisma(returnedNodes: { id: string }[]) {
  const mock = {
    node: {
      findMany: vi.fn(async () => returnedNodes),
    },
  };
  return mock as unknown as PrismaClient & { node: { findMany: ReturnType<typeof vi.fn> } };
}

describe("getOwnedNodeIds — workspace scoping contract", () => {
  it("queries by ownerUserId only when no workspaceId is supplied", async () => {
    const prisma = mkPrisma([{ id: "n1" }, { id: "n2" }]);
    const ids = await getOwnedNodeIds(prisma, "u1");
    expect(prisma.node.findMany).toHaveBeenCalledWith({
      where: { ownerUserId: "u1" },
      select: { id: true },
    });
    expect(ids).toEqual(["n1", "n2"]);
  });

  it("treats explicit null workspaceId as no scope (cross-workspace)", async () => {
    const prisma = mkPrisma([{ id: "n1" }]);
    await getOwnedNodeIds(prisma, "u1", { workspaceId: null });
    expect(prisma.node.findMany).toHaveBeenCalledWith({
      where: { ownerUserId: "u1" },
      select: { id: true },
    });
  });

  it("adds workspaceId to the WHERE clause when provided", async () => {
    const prisma = mkPrisma([{ id: "n1" }]);
    await getOwnedNodeIds(prisma, "u1", { workspaceId: "ws_42" });
    expect(prisma.node.findMany).toHaveBeenCalledWith({
      where: { ownerUserId: "u1", workspaceId: "ws_42" },
      select: { id: true },
    });
  });

  it("ignores empty-string workspaceId rather than filtering on '' (defensive)", async () => {
    const prisma = mkPrisma([{ id: "n1" }]);
    await getOwnedNodeIds(prisma, "u1", { workspaceId: "" });
    expect(prisma.node.findMany).toHaveBeenCalledWith({
      where: { ownerUserId: "u1" },
      select: { id: true },
    });
  });
});

describe("member*Where — shape contracts (transitive workspace scope via ownedNodeIds)", () => {
  const ids = ["n1", "n2"];

  it("memberProjectsWhere joins through node ownership", () => {
    expect(memberProjectsWhere(ids)).toEqual({
      node: { ownerUserId: { not: null }, id: { in: ids } },
    });
  });

  it("memberTasksWhere unions owner and assignee scopes", () => {
    expect(memberTasksWhere(ids)).toEqual({
      OR: [
        { ownerNodeId: { in: ids } },
        { assignments: { some: { nodeId: { in: ids } } } },
      ],
    });
  });

  it("memberPoBWhere unions node, task, and project paths", () => {
    const w = memberPoBWhere(ids);
    expect(w.OR).toHaveLength(3);
    expect(w.OR?.[0]).toEqual({ nodeId: { in: ids } });
  });

  it("memberAgentsWhere scopes by ownerNodeId", () => {
    expect(memberAgentsWhere(ids)).toEqual({ ownerNodeId: { in: ids } });
  });

  it("memberEvidenceWhere mirrors PoB shape", () => {
    const w = memberEvidenceWhere(ids);
    expect(w.OR).toHaveLength(3);
  });

  it("memberAgentRunsWhere scopes through agent ownership", () => {
    expect(memberAgentRunsWhere(ids)).toEqual({
      agent: { ownerNodeId: { in: ids } },
    });
  });

  it("empty ownedNodeIds still produces a valid (empty-result) where", () => {
    expect(memberProjectsWhere([])).toEqual({
      node: { ownerUserId: { not: null }, id: { in: [] } },
    });
  });
});
