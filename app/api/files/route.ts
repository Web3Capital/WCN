import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, uploadFileSchema } from "@/lib/core/validation";
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

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(uploadFileSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const d = parsed.data;
  const storageKey = buildStorageKey(d.entityType, d.entityId, d.filename);

  const record = await prisma.file.create({
    data: {
      filename: d.filename,
      mimeType: d.contentType,
      sizeBytes: d.sizeBytes ?? null,
      storageKey,
      confidentiality: d.confidentiality,
      uploaderUserId: auth.session.user!.id,
      entityType: d.entityType,
      entityId: d.entityId,
      scanStatus: "PENDING",
    },
  });

  const presigned = await generatePresignedUpload(storageKey, d.contentType);

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.FILE_UPLOAD,
    targetType: "FILE",
    targetId: record.id,
    metadata: { filename: d.filename, entityType: d.entityType, entityId: d.entityId },
  });

  return apiOk({ file: record, upload: presigned });
}
