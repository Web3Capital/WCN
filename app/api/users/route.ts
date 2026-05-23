import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { route } from "@/lib/core/api/route";
import { z } from "zod";

export const GET = route.permission({
  input: z.object({}),
  rateLimit: "auth",
  permission: { action: "read", resource: "user" },
  handler: async () => {
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

    return users;
  },
});
