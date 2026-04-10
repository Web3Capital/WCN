import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiNotFound } from "@/lib/core/api-response";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("read", "file");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const file = await prisma.file.findUnique({ where: { id: params.id } });
  if (!file) return apiNotFound("File");

  const rootId = file.parentFileId || file.id;

  const versions = await prisma.file.findMany({
    where: {
      OR: [
        { id: rootId },
        { parentFileId: rootId },
      ],
    },
    orderBy: { version: "desc" },
    include: { uploader: { select: { name: true, email: true } } },
  });

  return apiOk(versions);
}
