import type { PrismaClient, Prisma } from "@prisma/client";

/** Collect IDs of nodes owned by `userId`. */
export async function getOwnedNodeIds(prisma: PrismaClient, userId: string): Promise<string[]> {
  const nodes = await prisma.node.findMany({
    where: { ownerUserId: userId },
    select: { id: true }
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
