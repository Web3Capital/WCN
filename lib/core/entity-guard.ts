import { getPrisma } from "@/lib/prisma";

/**
 * Throws if the given entity is frozen in a workspace.
 * Call this before critical mutations (deals, tasks, evidence, settlement, payments).
 */
export async function assertNotFrozen(
  workspaceId: string,
  entityType: string,
  entityId: string,
): Promise<void> {
  const prisma = getPrisma();
  const freeze = await prisma.entityFreeze.findFirst({
    where: {
      workspaceId,
      entityType,
      entityId,
      liftedAt: null,
    },
    select: { id: true, reason: true },
  });

  if (freeze) {
    throw new Error(
      `Entity ${entityType}/${entityId} is frozen in workspace ${workspaceId}. Reason: ${freeze.reason ?? "No reason provided"}`,
    );
  }
}
