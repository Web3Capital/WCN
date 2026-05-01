import type { PrismaClient, Prisma } from "@prisma/client";

/**
 * Optional scope hints for member-data-scope helpers.
 *
 * Tenant scoping (Phase 1, app-layer enforcement — see `prisma/schema.prisma`
 * near `model Workspace`):
 *
 * - `workspaceId: string`  → restrict node ownership lookup to that workspace.
 *   Downstream `member*Where` predicates inherit the scope transitively
 *   because they JOIN through `node.id ∈ ownedNodeIds`.
 * - `workspaceId: null` or omitted → no workspace filter (cross-workspace
 *   visibility). Safe today because no UI workspace switcher is exposed.
 *   Once the switcher ships, every call site that omits `workspaceId` must
 *   be reviewed — see `lib/auth/workspace-context.ts`.
 */
export interface ScopeOptions {
  workspaceId?: string | null;
}

/** Collect IDs of nodes owned by `userId`, optionally scoped to a workspace. */
export async function getOwnedNodeIds(
  prisma: PrismaClient,
  userId: string,
  opts: ScopeOptions = {},
): Promise<string[]> {
  const where: Prisma.NodeWhereInput = { ownerUserId: userId };
  if (opts.workspaceId) {
    where.workspaceId = opts.workspaceId;
  }
  const nodes = await prisma.node.findMany({
    where,
    select: { id: true },
  });
  return nodes.map((n) => n.id);
}

/** Projects visible to a member: linked to one of their nodes. */
export function memberProjectsWhere(ownedNodeIds: string[]): Prisma.ProjectWhereInput {
  return { node: { ownerUserId: { not: null }, id: { in: ownedNodeIds } } };
}

/** Tasks visible to a member: owned by their node OR assigned to their node. */
export function memberTasksWhere(ownedNodeIds: string[]): Prisma.TaskWhereInput {
  return {
    OR: [
      { ownerNodeId: { in: ownedNodeIds } },
      { assignments: { some: { nodeId: { in: ownedNodeIds } } } }
    ]
  };
}

/** PoB visible to a member: linked to their node, or linked to a visible task/project. */
export function memberPoBWhere(ownedNodeIds: string[]): Prisma.PoBRecordWhereInput {
  return {
    OR: [
      { nodeId: { in: ownedNodeIds } },
      { task: { OR: [{ ownerNodeId: { in: ownedNodeIds } }, { assignments: { some: { nodeId: { in: ownedNodeIds } } } }] } },
      { project: { node: { id: { in: ownedNodeIds } } } }
    ]
  };
}

/** Agents visible to a member: owned by one of their nodes. */
export function memberAgentsWhere(ownedNodeIds: string[]): Prisma.AgentWhereInput {
  return { ownerNodeId: { in: ownedNodeIds } };
}

/** Evidence visible to a member: linked to their node, visible task, or visible project. */
export function memberEvidenceWhere(ownedNodeIds: string[]): Prisma.EvidenceWhereInput {
  return {
    OR: [
      { nodeId: { in: ownedNodeIds } },
      { task: { OR: [{ ownerNodeId: { in: ownedNodeIds } }, { assignments: { some: { nodeId: { in: ownedNodeIds } } } }] } },
      { project: { node: { id: { in: ownedNodeIds } } } }
    ]
  };
}

/** Agent runs visible to a member: agent is owned by their node. */
export function memberAgentRunsWhere(ownedNodeIds: string[]): Prisma.AgentRunWhereInput {
  return { agent: { ownerNodeId: { in: ownedNodeIds } } };
}

/** Dashboard summary counts scoped to a member. */
export async function scopedSummaryCounts(
  prisma: PrismaClient,
  userId: string,
  ownedNodeIds: string[]
) {
  const [ownedNodes, scopedProjects, scopedTasks, scopedPoB] = await Promise.all([
    ownedNodeIds.length,
    prisma.project.count({ where: memberProjectsWhere(ownedNodeIds) }),
    prisma.task.count({ where: memberTasksWhere(ownedNodeIds) }),
    prisma.poBRecord.count({ where: memberPoBWhere(ownedNodeIds) })
  ]);
  return { ownedNodes, scopedProjects, scopedTasks, scopedPoB };
}
