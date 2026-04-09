import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
  const auth = await requirePermission("read", "invite");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const assignments = await prisma.roleAssignment.findMany({
    where: {
      membership: { workspaceId },
      revokedAt: null,
    },
    include: {
      membership: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { grantedAt: "desc" },
  });

  return NextResponse.json({ ok: true, assignments });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
  const auth = await requirePermission("create", "invite");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const membershipId = String(body?.membershipId ?? "");
  const role = String(body?.role ?? "");

  if (!membershipId || !role) {
    return NextResponse.json({ ok: false, error: "membershipId and role required." }, { status: 400 });
  }

  const membership = await prisma.workspaceMembership.findFirst({
    where: { id: membershipId, workspaceId },
  });
  if (!membership) {
    return NextResponse.json({ ok: false, error: "Membership not found in this workspace." }, { status: 404 });
  }

  const assignment = await prisma.roleAssignment.create({
    data: {
      workspaceMembershipId: membershipId,
      role: role as any,
      grantedById: auth.session.user!.id,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.ROLE_ASSIGNMENT_GRANT,
    targetType: "ROLE_ASSIGNMENT",
    targetId: assignment.id,
    workspaceId,
    metadata: { membershipId, role },
  });

  return NextResponse.json({ ok: true, assignment }, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
  const auth = await requirePermission("delete", "invite");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const assignmentId = String(body?.assignmentId ?? "");

  if (!assignmentId) {
    return NextResponse.json({ ok: false, error: "assignmentId required." }, { status: 400 });
  }

  const assignment = await prisma.roleAssignment.findFirst({
    where: { id: assignmentId, membership: { workspaceId }, revokedAt: null },
  });
  if (!assignment) {
    return NextResponse.json({ ok: false, error: "Assignment not found." }, { status: 404 });
  }

  await prisma.roleAssignment.update({
    where: { id: assignmentId },
    data: { revokedAt: new Date() },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.ROLE_ASSIGNMENT_REVOKE,
    targetType: "ROLE_ASSIGNMENT",
    targetId: assignmentId,
    workspaceId,
  });

  return NextResponse.json({ ok: true });
}
