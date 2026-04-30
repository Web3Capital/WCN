/**
 * Row-level ownership checks for individual resources.
 *
 * The Week 2 RBAC migration replaces `requireAdmin()` with
 * `requirePermission(action, resource)`. That answers "is this role
 * allowed to do X to this resource type?" — but not "is this specific
 * row theirs to mutate?". These helpers answer the second question.
 *
 * Used together:
 *
 *   const auth = await requirePermission("update", "node");
 *   if (!auth.ok) return apiUnauthorized();
 *   if (!isAdminRole(auth.session.user.role) &&
 *       !(await ownsNode(prisma, auth.session.user.id, id))) {
 *     return apiUnauthorized();
 *   }
 *
 * The membership semantics here MUST match the list-scope semantics in
 * lib/member-data-scope.ts — otherwise a user could see a resource in
 * the list but not mutate it (or vice versa). Each helper is implemented
 * by re-using the corresponding `memberXxxWhere` builder.
 */

import type { PrismaClient } from "@prisma/client";
import {
  getOwnedNodeIds,
  memberProjectsWhere,
  memberTasksWhere,
  memberPoBWhere,
  memberEvidenceWhere,
  memberAgentsWhere,
} from "@/lib/member-data-scope";

async function ensureOwnedNodeIds(
  prisma: PrismaClient,
  userId: string,
  cached?: string[],
): Promise<string[]> {
  return cached ?? (await getOwnedNodeIds(prisma, userId));
}

/** Direct ownership: user is the recorded owner of the node. */
export async function ownsNode(
  prisma: PrismaClient,
  userId: string,
  nodeId: string,
): Promise<boolean> {
  const node = await prisma.node.findFirst({
    where: { id: nodeId, ownerUserId: userId },
    select: { id: true },
  });
  return node !== null;
}

/** Project membership: project is linked to a node owned by this user. */
export async function ownsProject(
  prisma: PrismaClient,
  userId: string,
  projectId: string,
  ownedNodeIds?: string[],
): Promise<boolean> {
  const ids = await ensureOwnedNodeIds(prisma, userId, ownedNodeIds);
  if (ids.length === 0) return false;
  const project = await prisma.project.findFirst({
    where: { AND: [{ id: projectId }, memberProjectsWhere(ids)] },
    select: { id: true },
  });
  return project !== null;
}

/** Task membership: owned by user's node OR assigned to user's node. */
export async function ownsTask(
  prisma: PrismaClient,
  userId: string,
  taskId: string,
  ownedNodeIds?: string[],
): Promise<boolean> {
  const ids = await ensureOwnedNodeIds(prisma, userId, ownedNodeIds);
  if (ids.length === 0) return false;
  const task = await prisma.task.findFirst({
    where: { AND: [{ id: taskId }, memberTasksWhere(ids)] },
    select: { id: true },
  });
  return task !== null;
}

/** PoB membership: linked to a visible node/task/project. */
export async function ownsPoB(
  prisma: PrismaClient,
  userId: string,
  pobId: string,
  ownedNodeIds?: string[],
): Promise<boolean> {
  const ids = await ensureOwnedNodeIds(prisma, userId, ownedNodeIds);
  if (ids.length === 0) return false;
  const pob = await prisma.poBRecord.findFirst({
    where: { AND: [{ id: pobId }, memberPoBWhere(ids)] },
    select: { id: true },
  });
  return pob !== null;
}

/** Evidence membership: same scope as PoB (node / task / project). */
export async function ownsEvidence(
  prisma: PrismaClient,
  userId: string,
  evidenceId: string,
  ownedNodeIds?: string[],
): Promise<boolean> {
  const ids = await ensureOwnedNodeIds(prisma, userId, ownedNodeIds);
  if (ids.length === 0) return false;
  const evidence = await prisma.evidence.findFirst({
    where: { AND: [{ id: evidenceId }, memberEvidenceWhere(ids)] },
    select: { id: true },
  });
  return evidence !== null;
}

/** Agent membership: agent is owned by one of the user's nodes. */
export async function ownsAgent(
  prisma: PrismaClient,
  userId: string,
  agentId: string,
  ownedNodeIds?: string[],
): Promise<boolean> {
  const ids = await ensureOwnedNodeIds(prisma, userId, ownedNodeIds);
  if (ids.length === 0) return false;
  const agent = await prisma.agent.findFirst({
    where: { AND: [{ id: agentId }, memberAgentsWhere(ids)] },
    select: { id: true },
  });
  return agent !== null;
}
