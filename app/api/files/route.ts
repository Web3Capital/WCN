import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";
import { generatePresignedUpload, buildStorageKey } from "@/lib/modules/storage/service";

export async function GET(req: Request) {
  const auth = await requirePermission("read", "file");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");

  const where: Record<string, unknown> = { deletedAt: null };
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;

  const files = await prisma.file.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { uploader: { select: { name: true, email: true } } },
  });

  return apiOk(files);
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "file");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.filename || !body?.entityType || !body?.entityId) {
    return apiValidationError([{ path: "body", message: "filename, entityType, entityId required." }]);
  }

  const prisma = getPrisma();
  const storageKey = buildStorageKey(body.entityType, body.entityId, body.filename);
  const contentType = body.contentType ?? "application/octet-stream";

  const record = await prisma.file.create({
    data: {
      filename: body.filename,
      mimeType: contentType,
      sizeBytes: body.sizeBytes ?? null,
      storageKey,
      confidentiality: (body.confidentiality as any) ?? "PUBLIC",
      uploaderUserId: auth.session.user!.id,
      entityType: body.entityType,
      entityId: body.entityId,
      scanStatus: "PENDING",
    },
  });

  const presigned = await generatePresignedUpload(storageKey, contentType);

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.FILE_UPLOAD,
    targetType: "FILE",
    targetId: record.id,
    metadata: { filename: body.filename, entityType: body.entityType, entityId: body.entityId },
  });

  return apiOk({ file: record, upload: presigned });
}
