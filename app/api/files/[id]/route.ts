import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound } from "@/lib/core/api-response";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("read", "file");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const file = await prisma.file.findUnique({
    where: { id: params.id },
    include: { uploader: { select: { name: true, email: true } } },
  });

  if (!file) return apiNotFound("File");

  await prisma.fileAccessLog.create({
    data: {
      fileId: file.id,
      userId: auth.session.user!.id,
      action: "VIEW",
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.FILE_DOWNLOAD,
    targetType: "FILE",
    targetId: file.id,
    metadata: { filename: file.filename },
  });

  return apiOk(file);
}
