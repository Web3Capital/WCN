import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";
import { HttpError, route } from "@/lib/core/api/route";
import { z } from "zod";

export const GET = route.permission({
  input: z.object({}),
  rateLimit: "auth",
  permission: { action: "read", resource: "file" },
  handler: async ({ params, session }) => {
    const prisma = getPrisma();
    const file = await prisma.file.findUnique({
      where: { id: params.id },
      include: { uploader: { select: { name: true, email: true } } },
    });

    if (!file) throw new HttpError(404, "NOT_FOUND", "File not found.");

    if (!isAdminRole(session.user.role) && file.uploaderUserId !== session.user.id) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required.");
    }

    await prisma.fileAccessLog.create({
      data: {
        fileId: file.id,
        userId: session.user.id,
        action: "VIEW",
      },
    });

    await writeAudit({
      actorUserId: session.user.id,
      action: AuditAction.FILE_DOWNLOAD,
      targetType: "FILE",
      targetId: file.id,
      metadata: { filename: file.filename },
    });

    return file;
  },
});
