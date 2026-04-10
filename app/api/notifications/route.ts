import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { apiOk, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, notificationActionSchema } from "@/lib/core/validation";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const userId = auth.session.user!.id;
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const where: Record<string, unknown> = { userId };
  if (unreadOnly) where.readAt = null;

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({ where: { userId, readAt: null } });

  return apiOk({ notifications, unreadCount });
}

export async function POST(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(notificationActionSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  if (parsed.data.action === "markAllRead") {
    await prisma.notification.updateMany({
      where: { userId: auth.session.user!.id, readAt: null },
      data: { readAt: new Date() },
    });
    return apiOk({ marked: "all" });
  }

  await prisma.notification.update({
    where: { id: parsed.data.id },
    data: { readAt: new Date() },
  });
  return apiOk({ marked: parsed.data.id });
}
