import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import type { AccountStatus } from "@prisma/client";
import { AuditAction, writeAudit } from "@/lib/audit";
import { requiresTwoFactor } from "@/lib/permissions";
import { HttpError, route } from "@/lib/core/api/route";
import { activateInviteSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { z } from "zod";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

const activateInviteInputSchema = z.object(activateInviteSchema.shape);

export const POST = route.public<z.infer<typeof activateInviteInputSchema>, unknown, { token: string }>({
  input: activateInviteInputSchema,
  rateLimit: "auth",
  handler: async ({ input, params }) => {
    const { token: rawToken } = params;

    const prisma = getPrisma();
    const { name, password } = input;

    const tokenHash = hashToken(rawToken);
    const invite = await prisma.invite.findUnique({ where: { tokenHash } });
    if (!invite) throw new HttpError(404, "NOT_FOUND", "Invite not found.");
    if (invite.activatedAt) throw new HttpError(409, "CONFLICT", "Invite already activated.");
    if (invite.revokedAt) throw new HttpError(409, "CONFLICT", "Invite has been revoked.");
    if (invite.expiresAt < new Date()) throw new HttpError(409, "CONFLICT", "Invite expired.");

    const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
    const passwordHash = await bcrypt.hash(password, 12);

    const needs2FA = requiresTwoFactor(invite.role);
    const initialStatus: AccountStatus = needs2FA ? "PENDING_2FA" : "ACTIVE";

    let userId: string;
    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash, role: invite.role, accountStatus: initialStatus, name: name || existingUser.name },
      });
      userId = existingUser.id;
    } else {
      const user = await prisma.user.create({
        data: {
          email: invite.email,
          name: name || null,
          passwordHash,
          role: invite.role,
          accountStatus: initialStatus,
        },
      });
      userId = user.id;

      await eventBus.emit(Events.USER_CREATED, {
        userId,
        email: invite.email,
        role: invite.role,
      });
    }

    if (invite.workspaceId) {
      const membership = await prisma.workspaceMembership.upsert({
        where: { userId_workspaceId: { userId, workspaceId: invite.workspaceId } },
        create: { userId, workspaceId: invite.workspaceId, isPrimary: true },
        update: {},
      });

      await prisma.roleAssignment.create({
        data: {
          workspaceMembershipId: membership.id,
          role: invite.role,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { activeWorkspaceId: invite.workspaceId, activeRole: invite.role },
      });
    }

    await prisma.invite.update({
      where: { id: invite.id },
      data: { activatedAt: new Date() },
    });

    await writeAudit({
      actorUserId: userId,
      action: AuditAction.INVITE_ACTIVATE,
      targetType: "INVITE",
      targetId: invite.id,
      metadata: { email: invite.email, role: invite.role, needs2FA },
    });

    return {
      needs2FA,
      message: needs2FA
        ? "Account created. Please set up two-factor authentication."
        : "Account activated. You can now log in.",
    };
  },
});
