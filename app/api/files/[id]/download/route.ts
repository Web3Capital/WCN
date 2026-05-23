import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";
import { HttpError, route } from "@/lib/core/api/route";
import { generatePresignedDownload } from "@/lib/modules/storage/service";
import { z } from "zod";

export const GET = route.permission({
  input: z.object({}),
  rateLimit: "auth",
  permission: { action: "read", resource: "file" },
  handler: async ({ params, session }) => {
    const { id } = params;
    const prisma = getPrisma();
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file || !file.storageKey) throw new HttpError(404, "NOT_FOUND", "File not found.");

    if (!isAdminRole(session.user.role) && file.uploaderUserId !== session.user.id) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required.");
    }

    const downloadUrl = await generatePresignedDownload(file.storageKey);

    await prisma.fileAccessLog.create({
      data: { fileId: id, userId: session.user.id, action: "DOWNLOAD", workspaceId: file.workspaceId },
    });

    await writeAudit({
      actorUserId: session.user.id,
      action: AuditAction.FILE_DOWNLOAD,
      targetType: "FILE",
      targetId: id,
      metadata: { filename: file.filename },
    });

    return { downloadUrl, filename: file.filename, mimeType: file.mimeType };
  },
});
