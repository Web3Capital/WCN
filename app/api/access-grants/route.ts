import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import type { ActorType, GrantScope, GrantType, Prisma } from "@prisma/client";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";
import { HttpError, route } from "@/lib/core/api/route";
import { createAccessGrantSchema } from "@/lib/core/validation";
import { z } from "zod";

const accessGrantQuerySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  workspaceId: z.string().optional(),
});

export const GET = route.permission({
  input: accessGrantQuerySchema,
  rateLimit: "auth",
  permission: { action: "read", resource: "file" },
  handler: async ({ input }) => {
    const prisma = getPrisma();
    const { entityType, entityId, workspaceId } = input;

    const where: Prisma.AccessGrantWhereInput = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (workspaceId) where.workspaceId = workspaceId;

    const grants = await prisma.accessGrant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return grants;
  },
});

export const POST = route.permission({
  input: createAccessGrantSchema,
  rateLimit: "write",
  permission: { action: "create", resource: "file" },
  successStatus: 201,
  handler: async ({ input, session }) => {
    const prisma = getPrisma();
    const { workspaceId, entityType, entityId, grantedToType, grantedToId, grantType, scope, expiresAt } = input;

    if (!isAdminRole(session.user.role ?? "USER")) {
      const membership = await prisma.workspaceMembership.findFirst({
        where: { workspaceId, userId: session.user.id },
        select: { id: true },
      });
      if (!membership) throw new HttpError(403, "FORBIDDEN", "You are not a member of this workspace.");
    }

    const grant = await prisma.accessGrant.create({
      data: {
        workspaceId,
        entityType,
        entityId,
        grantedToType: grantedToType as ActorType,
        grantedToId,
        grantType: grantType as GrantType,
        scope: scope as GrantScope,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        grantedById: session.user.id,
      },
    });

    await writeAudit({
      actorUserId: session.user.id,
      action: AuditAction.ACCESS_GRANT_CREATE,
      targetType: "ACCESS_GRANT",
      targetId: grant.id,
      workspaceId,
      metadata: { entityType, entityId, grantedToType, grantedToId, grantType },
    });

    return grant;
  },
});
