import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("delete", "file");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const grant = await prisma.accessGrant.findUnique({ where: { id } });
  if (!grant) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  await prisma.accessGrant.delete({ where: { id } });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.ACCESS_GRANT_REVOKE,
    targetType: "ACCESS_GRANT",
    targetId: id,
    workspaceId: grant.workspaceId,
  });

  return NextResponse.json({ ok: true });
}
