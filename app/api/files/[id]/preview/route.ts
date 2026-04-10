import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiOk, apiUnauthorized, apiNotFound } from "@/lib/core/api-response";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiUnauthorized();

  const prisma = getPrisma();
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) return apiNotFound("File");

  if (file.previewStatus !== "READY") {
    return apiNotFound("Preview not available");
  }

  await prisma.fileAccessLog.create({
    data: {
      fileId: id,
      userId: session.user.id,
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
