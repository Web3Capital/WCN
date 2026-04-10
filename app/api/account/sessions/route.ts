import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized } from "@/lib/core/api-response";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const sessions = await prisma.session.findMany({
    where: { userId: auth.session.user!.id },
    orderBy: { expires: "desc" },
    select: { id: true, expires: true, deviceInfo: true, ipAddress: true },
  });

  return apiOk(sessions);
}

export async function DELETE() {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const userId = auth.session.user!.id;

  const { count } = await prisma.session.deleteMany({ where: { userId } });

  await writeAudit({
    actorUserId: userId,
    action: AuditAction.SESSION_REVOKE_ALL,
    targetType: "USER",
    targetId: userId,
    metadata: { sessionsRevoked: count },
  });

  return apiOk({ revoked: count });
}
