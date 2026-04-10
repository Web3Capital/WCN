import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { apiOk, apiCreated, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const scope = String(body?.scope ?? "").trim();
  const canWrite = Boolean(body?.canWrite ?? false);
  const auditLevel = Number(body?.auditLevel ?? 1);
  if (!scope) return apiValidationError([{ path: "scope", message: "Missing scope." }]);

  const perm = await prisma.agentPermission.create({
    data: {
      agentId: params.id,
      scope,
      canWrite,
      auditLevel: Number.isFinite(auditLevel) ? auditLevel : 1,
      metadata: body?.metadata ?? null,
    },
  });

  return apiCreated(perm);
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const permissionId = String(body?.permissionId ?? "").trim();
  if (!permissionId) return apiValidationError([{ path: "permissionId", message: "Missing permissionId." }]);

  await prisma.agentPermission.delete({ where: { id: permissionId } });
  return apiOk({ deleted: true });
}
