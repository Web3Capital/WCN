import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuditAction, writeAudit } from "@/lib/audit";
import { requiresTwoFactor } from "@/lib/permissions";

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const password = String(body?.password ?? "");
  const name = String(body?.name ?? "").trim();

  if (password.length < 8) {
    return NextResponse.json({ ok: false, error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const invite = await prisma.invite.findUnique({ where: { token: params.token } });
  if (!invite) {
    return NextResponse.json({ ok: false, error: "Invalid invite." }, { status: 404 });
  }
  if (invite.activatedAt) {
    return NextResponse.json({ ok: false, error: "Invite already activated." }, { status: 410 });
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: "Invite expired." }, { status: 410 });
  }

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
  }

  if (invite.workspaceId) {
    await prisma.workspaceMembership.upsert({
      where: { userId_workspaceId: { userId, workspaceId: invite.workspaceId } },
      create: { userId, workspaceId: invite.workspaceId, role: invite.role },
      update: { role: invite.role },
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

  return NextResponse.json({
    ok: true,
    needs2FA,
    message: needs2FA
      ? "Account created. Please set up two-factor authentication."
      : "Account activated. You can now log in.",
  });
}
