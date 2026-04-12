import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiNotFound, apiForbidden } from "@/lib/core/api-response";
import { getOwnedNodeIds } from "@/lib/member-data-scope";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("read", "file");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) return apiNotFound("File");

  if (file.workspaceId) {
    const membership = await prisma.workspaceMembership.findFirst({
      where: { workspaceId: file.workspaceId, userId: auth.session.user!.id },
      select: { id: true },
    });
    if (!membership) {
      const ownedNodeIds = await getOwnedNodeIds(prisma, auth.session.user!.id);
      if (!ownedNodeIds.length) return apiForbidden("No access to this file");
    }
  }

  if (file.previewStatus !== "READY") {
    return apiNotFound("Preview not available");
  }

  await prisma.fileAccessLog.create({
    data: {
      fileId: id,
      userId: auth.session.user!.id,
      action: "PREVIEW",
      workspaceId: file.workspaceId,
    },
  });

  return apiOk({
    filename: file.filename,
    mimeType: file.mimeType,
    storageKey: file.storageKey,
  });
}
