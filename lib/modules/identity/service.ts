import type { AccountStatus, PrismaClient } from "@prisma/client";
import { canTransitionAccount } from "@/lib/state-machines/account";
import { AuditAction, writeAudit } from "@/lib/audit";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export class InvalidTransitionError extends Error {
  constructor(from: AccountStatus, to: AccountStatus) {
    super(`Cannot transition account from ${from} to ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export async function transitionAccountStatus(
  prisma: PrismaClient,
  userId: string,
  newStatus: AccountStatus,
  actorUserId: string,
  reason?: string,
): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { accountStatus: true },
  });

  if (!canTransitionAccount(user.accountStatus, newStatus)) {
    throw new InvalidTransitionError(user.accountStatus, newStatus);
  }

  const data: Record<string, unknown> = { accountStatus: newStatus };
  if (newStatus === "LOCKED") {
    data.lockedAt = new Date();
    data.lockReason = reason ?? "admin_action";
  }
  if (newStatus === "ACTIVE" && user.accountStatus === "LOCKED") {
    data.lockedAt = null;
    data.lockReason = null;
    data.failedLoginCount = 0;
  }
  if (newStatus === "OFFBOARDED") {
    data.tokenInvalidatedAt = new Date();
  }

  await prisma.user.update({ where: { id: userId }, data });

  await writeAudit({
    actorUserId,
    action: AuditAction.USER_STATUS_CHANGE,
    targetType: "USER",
    targetId: userId,
    metadata: { from: user.accountStatus, to: newStatus, reason },
  });

  await eventBus.emit(
    Events.USER_STATUS_CHANGED,
    { userId, oldStatus: user.accountStatus, newStatus, changedBy: actorUserId },
    { actorId: actorUserId },
  );
}

export async function updateProfile(
  prisma: PrismaClient,
  userId: string,
  data: { name?: string; image?: string },
): Promise<{ name: string | null; image: string | null }> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { name: true, image: true },
  });
  return updated;
}
