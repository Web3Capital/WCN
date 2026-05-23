import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { AuditAction, writeAudit } from "@/lib/audit";
import { route } from "@/lib/core/api/route";
import { z } from "zod";

export const GET = route.session({
  input: z.object({}),
  rateLimit: "auth",
  handler: async ({ session }) => {
    const prisma = getPrisma();
    const sessions = await prisma.session.findMany({
      where: { userId: session.user.id },
      orderBy: { expires: "desc" },
      select: { id: true, expires: true, deviceInfo: true, ipAddress: true },
    });

    return sessions;
  },
});

export const DELETE = route.session({
  input: z.object({}),
  rateLimit: "write",
  handler: async ({ session }) => {
    const prisma = getPrisma();
    const userId = session.user.id;

    const [{ count }] = await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId } }),
      prisma.user.update({
        where: { id: userId },
        data: { tokenInvalidatedAt: new Date() },
      }),
    ]);

    await writeAudit({
      actorUserId: userId,
      action: AuditAction.SESSION_REVOKE_ALL,
      targetType: "USER",
      targetId: userId,
      metadata: { sessionsRevoked: count },
    });

    return { revoked: count };
  },
});
