import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const scope = String(body?.scope ?? "").trim();
  const canWrite = Boolean(body?.canWrite ?? false);
  const auditLevel = Number(body?.auditLevel ?? 1);
  if (!scope) return NextResponse.json({ ok: false, error: "Missing scope." }, { status: 400 });

  const perm = await prisma.agentPermission.create({
    data: {
      agentId: params.id,
      scope,
      canWrite,
      auditLevel: Number.isFinite(auditLevel) ? auditLevel : 1,
      metadata: body?.metadata ?? null
    }
  });
  return NextResponse.json({ ok: true, permission: perm });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const permissionId = String(body?.permissionId ?? "").trim();
  if (!permissionId) return NextResponse.json({ ok: false, error: "Missing permissionId." }, { status: 400 });
  await prisma.agentPermission.delete({ where: { id: permissionId } });
  return NextResponse.json({ ok: true });
}

