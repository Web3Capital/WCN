import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { route } from "@/lib/core/api/route";
import { notificationActionSchema } from "@/lib/core/validation";
import { z } from "zod";

const notificationQuerySchema = z.object({
  unread: z.string().optional(),
});

export const GET = route.session({
  input: notificationQuerySchema,
  rateLimit: "auth",
  handler: async ({ input, session }) => {
    const prisma = getPrisma();
    const userId = session.user.id;
    const unreadOnly = input.unread === "true";

    const where: Record<string, unknown> = { userId };
    if (unreadOnly) where.readAt = null;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({ where: { userId, readAt: null } });

    return { notifications, unreadCount };
  },
});

export const POST = route.session({
  input: notificationActionSchema,
  rateLimit: "write",
  handler: async ({ input, session }) => {
    const prisma = getPrisma();

    if (input.action === "markAllRead") {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, readAt: null },
        data: { readAt: new Date() },
      });
      return { marked: "all" };
    }

    await prisma.notification.updateMany({
      where: { id: input.id, userId: session.user.id },
      data: { readAt: new Date() },
    });
    return { marked: input.id };
  },
});
