import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiUnauthorized, apiNotFound } from "@/lib/core/api-response";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();
  if (!isAdminRole(auth.session.user?.role ?? "USER")) return apiUnauthorized();

  const prisma = getPrisma();
  const project = await prisma.project.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!project) return apiNotFound("Project");

  const logs = await prisma.auditLog.findMany({
    where: { targetType: "PROJECT", targetId: params.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { name: true, email: true } } },
  });

  return apiOk({ activity: logs });
}
