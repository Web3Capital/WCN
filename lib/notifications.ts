import { getPrisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function createNotification(params: {
  userId: string;
  type?: NotificationType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
}) {
  const prisma = getPrisma();
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type ?? "GENERAL",
      title: params.title,
      body: params.body ?? null,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
    },
  });
}

export async function notifyMany(userIds: string[], params: {
  type?: NotificationType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
}) {
  const prisma = getPrisma();
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: params.type ?? "GENERAL",
      title: params.title,
      body: params.body ?? null,
      entityType: params.entityType ?? null,
      entityId: params.entityId ?? null,
    })),
  });
}
