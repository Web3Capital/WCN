import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized } from "@/lib/core/api-response";

export async function GET() {
  const auth = await requirePermission("read", "user");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { nodes: true, applications: true } },
    },
  });

  return apiOk(users);
}
