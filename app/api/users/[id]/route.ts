import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import type { Role } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, role: true } });
  if (!existing) return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });

  const role = body?.role ? String(body.role) : null;
  if (!role || !["USER", "ADMIN"].includes(role)) {
    return NextResponse.json({ ok: false, error: "Invalid role. Must be USER or ADMIN." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { role: role as Role },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.USER_ROLE_CHANGE,
    targetType: "USER",
    targetId: params.id,
    metadata: { previousRole: existing.role, newRole: role }
  });

  return NextResponse.json({ ok: true, user: updated });
}
