import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { AuditAction, writeAudit } from "@/lib/audit";
import { route } from "@/lib/core/api/route";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  image: z.string().url().max(500).optional(),
}).refine((d) => d.name !== undefined || d.image !== undefined, {
  message: "At least one field required",
});

export const GET = route.session({
  input: z.object({}),
  rateLimit: "auth",
  handler: async ({ session }) => {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        accountStatus: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { nodes: true, applications: true } },
      },
    });

    return user;
  },
});

export const PATCH = route.session({
  input: profileSchema,
  rateLimit: "write",
  handler: async ({ input, session }) => {
    const prisma = getPrisma();
    const userId = session.user.id;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: input,
      select: { id: true, name: true, email: true, image: true },
    });

    await writeAudit({
      actorUserId: userId,
      action: AuditAction.USER_STATUS_CHANGE,
      targetType: "USER",
      targetId: userId,
      metadata: { action: "profile_update", fields: Object.keys(input) },
    });

    return updated;
  },
});
