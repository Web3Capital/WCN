import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { HttpError, route } from "@/lib/core/api/route";
import { z } from "zod";

export const GET = route.permission({
  input: z.object({}),
  rateLimit: "auth",
  permission: { action: "read", resource: "file" },
  handler: async ({ params }) => {
    const prisma = getPrisma();
    const file = await prisma.file.findUnique({ where: { id: params.id } });
    if (!file) throw new HttpError(404, "NOT_FOUND", "File not found.");

    const rootId = file.parentFileId || file.id;

    return prisma.file.findMany({
      where: {
        OR: [
          { id: rootId },
          { parentFileId: rootId },
        ],
      },
      orderBy: { version: "desc" },
      include: { uploader: { select: { name: true, email: true } } },
    });
  },
});
