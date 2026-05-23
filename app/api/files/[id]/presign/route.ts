import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { AuditAction, writeAudit } from "@/lib/audit";
import { HttpError, route } from "@/lib/core/api/route";
import { generatePresignedUpload } from "@/lib/modules/storage/service";
import { z } from "zod";

export const POST = route.permission({
  input: z.object({}),
  rateLimit: "write",
  permission: { action: "create", resource: "file" },
  handler: async ({ params, session }) => {
    const { id } = params;
    const prisma = getPrisma();
    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) throw new HttpError(404, "NOT_FOUND", "File not found.");
    if (!file.storageKey) throw new HttpError(404, "NOT_FOUND", "File has no storage key not found.");

    const presigned = await generatePresignedUpload(
      file.storageKey,
      file.mimeType ?? "application/octet-stream",
    );

    await writeAudit({
      actorUserId: session.user.id,
      action: AuditAction.FILE_PRESIGN,
      targetType: "FILE",
      targetId: id,
      workspaceId: file.workspaceId,
    });

    return presigned;
  },
});
