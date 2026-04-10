import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound } from "@/lib/core/api-response";
import { generatePresignedUpload } from "@/lib/modules/storage/service";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("create", "file");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) return apiNotFound("File");
  if (!file.storageKey) return apiNotFound("File has no storage key");

  const presigned = await generatePresignedUpload(
    file.storageKey,
    file.mimeType ?? "application/octet-stream",
  );

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.FILE_PRESIGN,
    targetType: "FILE",
    targetId: id,
    workspaceId: file.workspaceId,
  });

  return apiOk(presigned);
}
