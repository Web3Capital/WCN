import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { HttpError, route } from "@/lib/core/api/route";
import { z } from "zod";

const emptyInputSchema = z.object({});

export const GET = route.session<z.infer<typeof emptyInputSchema>, unknown, { id: string }>({
  input: emptyInputSchema,
  rateLimit: "auth",
  handler: async ({ params, session }) => {
    if (!isAdminRole(session.user.role ?? "USER")) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required.");
    }

    const prisma = getPrisma();
    const project = await prisma.project.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!project) throw new HttpError(404, "NOT_FOUND", "Project not found.");

    const logs = await prisma.auditLog.findMany({
      where: { targetType: "PROJECT", targetId: params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { actor: { select: { name: true, email: true } } },
    });

    return { activity: logs };
  },
});
