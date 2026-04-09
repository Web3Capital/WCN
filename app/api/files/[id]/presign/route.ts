import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { randomBytes } from "crypto";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("create", "file");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const storageKey = `uploads/${file.entityType}/${file.entityId}/${randomBytes(8).toString("hex")}/${file.filename}`;

  await prisma.file.update({
    where: { id },
    data: { storageKey, scanStatus: "PENDING" },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.FILE_PRESIGN,
    targetType: "FILE",
    targetId: id,
    workspaceId: file.workspaceId,
  });

  return NextResponse.json({
    ok: true,
    presignedUrl: `/api/files/${id}/upload`,
    storageKey,
    expiresIn: 3600,
  });
}
