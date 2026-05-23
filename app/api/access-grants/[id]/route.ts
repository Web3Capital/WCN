import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { AuditAction, writeAudit } from "@/lib/audit";
import { HttpError, route } from "@/lib/core/api/route";
import { z } from "zod";

const emptyInputSchema = z.object({});

export const DELETE = route.permission<z.infer<typeof emptyInputSchema>, unknown, { id: string }>({
  input: emptyInputSchema,
  rateLimit: "write",
  permission: { action: "delete", resource: "file" },
  handler: async ({ params, session }) => {
    const { id } = params;
    const prisma = getPrisma();
    const grant = await prisma.accessGrant.findUnique({ where: { id } });
    if (!grant) throw new HttpError(404, "NOT_FOUND", "AccessGrant not found.");

    await prisma.accessGrant.delete({ where: { id } });

    await writeAudit({
      actorUserId: session.user.id,
      action: AuditAction.ACCESS_GRANT_REVOKE,
      targetType: "ACCESS_GRANT",
      targetId: id,
      workspaceId: grant.workspaceId,
    });

    return { deleted: true };
  },
});
