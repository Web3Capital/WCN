import { describe, it, expect, vi } from "vitest";
import {
  ownsNode,
  ownsProject,
  ownsTask,
  ownsPoB,
  ownsEvidence,
  ownsAgent,
} from "../resource-scope";
import type { PrismaClient } from "@prisma/client";

/**
 * Mock Prisma. Each helper does at most two queries:
 *   - prisma.node.findMany({ where: { ownerUserId } }) for getOwnedNodeIds
 *   - prisma.<resource>.findFirst({ where: { AND: [{ id }, memberXxxWhere(ids)] } })
 *
 * We assert: (a) found row → returns true; (b) not found → returns false;
 * (c) when ownedNodeIds is empty, the second query is skipped (short-circuit).
 */

type FindMock = ReturnType<typeof vi.fn>;

function buildPrisma(opts: {
  ownedNodes?: Array<{ id: string }>;
  findFirstResult?: { id: string } | null;
}): { prisma: PrismaClient; nodeFindMany: FindMock; resourceFindFirst: FindMock } {
  const nodeFindMany = vi.fn().mockResolvedValue(opts.ownedNodes ?? []);
  const resourceFindFirst = vi.fn().mockResolvedValue(opts.findFirstResult ?? null);
  const nodeFindFirst = vi.fn().mockResolvedValue(opts.findFirstResult ?? null);
  const prisma = {
    node: { findMany: nodeFindMany, findFirst: nodeFindFirst },
    project: { findFirst: resourceFindFirst },
    task: { findFirst: resourceFindFirst },
    poBRecord: { findFirst: resourceFindFirst },
    evidence: { findFirst: resourceFindFirst },
    agent: { findFirst: resourceFindFirst },
  } as unknown as PrismaClient;
  return { prisma, nodeFindMany, resourceFindFirst };
}

describe("ownsNode", () => {
  it("returns true when node ownerUserId matches", async () => {
    const { prisma } = buildPrisma({ findFirstResult: { id: "node_1" } });
    expect(await ownsNode(prisma, "user_1", "node_1")).toBe(true);
  });

  it("returns false when no row", async () => {
    const { prisma } = buildPrisma({ findFirstResult: null });
    expect(await ownsNode(prisma, "user_1", "node_999")).toBe(false);
  });

  it("queries node directly with ownerUserId — does not consult memberWhere", async () => {
    const { prisma, nodeFindMany } = buildPrisma({});
    await ownsNode(prisma, "user_1", "node_1");
    // ownsNode is a direct check; should NOT call getOwnedNodeIds.
    expect(nodeFindMany).not.toHaveBeenCalled();
  });
});

describe.each([
  ["ownsProject", ownsProject],
  ["ownsTask", ownsTask],
  ["ownsPoB", ownsPoB],
  ["ownsEvidence", ownsEvidence],
  ["ownsAgent", ownsAgent],
] as const)("%s", (_name, fn) => {
  it("returns false short-circuit when user owns zero nodes (no resource query)", async () => {
    const { prisma, resourceFindFirst } = buildPrisma({ ownedNodes: [] });
    expect(await fn(prisma, "user_1", "res_1")).toBe(false);
    expect(resourceFindFirst).not.toHaveBeenCalled();
  });

  it("returns true when resource exists in member scope", async () => {
    const { prisma } = buildPrisma({
      ownedNodes: [{ id: "node_a" }, { id: "node_b" }],
      findFirstResult: { id: "res_1" },
    });
    expect(await fn(prisma, "user_1", "res_1")).toBe(true);
  });

  it("returns false when resource is outside member scope", async () => {
    const { prisma } = buildPrisma({
      ownedNodes: [{ id: "node_a" }],
      findFirstResult: null,
    });
    expect(await fn(prisma, "user_1", "res_999")).toBe(false);
  });

  it("accepts a cached ownedNodeIds (skips getOwnedNodeIds query)", async () => {
    const { prisma, nodeFindMany } = buildPrisma({
      findFirstResult: { id: "res_1" },
    });
    await fn(prisma, "user_1", "res_1", ["node_a", "node_b"]);
    expect(nodeFindMany).not.toHaveBeenCalled();
  });
});
