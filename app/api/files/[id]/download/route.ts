import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound } from "@/lib/core/api-response";
import { generatePresignedDownload } from "@/lib/modules/storage/service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("read", "file");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file || !file.storageKey) return apiNotFound("File");

  const downloadUrl = await generatePresignedDownload(file.storageKey);

  await prisma.fileAccessLog.create({
    data: { fileId: id, userId: auth.session.user!.id, action: "DOWNLOAD", workspaceId: file.workspaceId },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.FILE_DOWNLOAD,
    targetType: "FILE",
    targetId: id,
    metadata: { filename: file.filename },
  });

  return apiOk({ downloadUrl, filename: file.filename, mimeType: file.mimeType });
}
