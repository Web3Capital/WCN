import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import crypto from "crypto";

export async function GET(req: Request) {
  const auth = await requirePermission("read", "file");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  const where: Record<string, unknown> = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  const files = await prisma.file.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { uploader: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ ok: true, files });
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "file");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ ok: false, error: "Form data required." }, { status: 400 });
  }

  const file = formData.get("file") as globalThis.File | null;
  const entityType = formData.get("entityType") as string;
  const entityId = formData.get("entityId") as string;
  const confidentiality = (formData.get("confidentiality") as string) || "PUBLIC";

  if (!file || !entityType || !entityId) {
    return NextResponse.json({ ok: false, error: "file, entityType, entityId required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");

  const storagePath = `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { writeFile, mkdir } = await import("fs/promises");
  await mkdir("uploads", { recursive: true }).catch(() => {});
  await writeFile(storagePath, buffer);

  const record = await prisma.file.create({
    data: {
      filename: file.name,
      mimeType: file.type || null,
      sizeBytes: buffer.length,
      storagePath,
      hash,
      confidentiality: confidentiality as any,
      uploaderUserId: auth.session.user!.id,
      entityType,
      entityId,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.FILE_UPLOAD,
    targetType: "FILE",
    targetId: record.id,
    metadata: { filename: file.name, entityType, entityId, hash, sizeBytes: buffer.length },
  });

  return NextResponse.json({ ok: true, file: record });
}
