import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { AuditAction, writeAudit } from "@/lib/audit";
import { requiresTwoFactor } from "@/lib/permissions";
import { apiOk, apiNotFound, apiValidationError, apiConflict } from "@/lib/core/api-response";
import { parseBody, activateInviteSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: rawToken } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(activateInviteSchema, body);
  if (!parsed.ok) return apiValidationError(parsed.error.issues.map(i => ({ path: i.path.join("."), message: i.message })));

  const prisma = getPrisma();
  const { name, password } = parsed.data;

  const tokenHash = hashToken(rawToken);
  const invite = await prisma.invite.findUnique({ where: { tokenHash } });
  if (!invite) return apiNotFound("Invite");
  if (invite.activatedAt) return apiConflict("Invite already activated.");
  if (invite.revokedAt) return apiConflict("Invite has been revoked.");
  if (invite.expiresAt < new Date()) return apiConflict("Invite expired.");

  const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
  const passwordHash = await bcrypt.hash(password, 12);

  const needs2FA = requiresTwoFactor(invite.role);
  const initialStatus = needs2FA ? "PENDING_2FA" : "ACTIVE";

  let userId: string;
  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash, role: invite.role, accountStatus: initialStatus as any, name: name || existingUser.name },
    });
    userId = existingUser.id;
  } else {
    const user = await prisma.user.create({
      data: {
        email: invite.email,
        name: name || null,
        passwordHash,
        role: invite.role,
        accountStatus: initialStatus as any,
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

  return apiOk({
    needs2FA,
    message: needs2FA
      ? "Account created. Please set up two-factor authentication."
      : "Account activated. You can now log in.",
  });
}
