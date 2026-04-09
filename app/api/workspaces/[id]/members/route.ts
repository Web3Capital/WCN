import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("read", "invite");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const members = await prisma.workspaceMembership.findMany({
    where: { workspaceId: id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, accountStatus: true, role: true } },
      roleAssignments: { where: { revokedAt: null } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, members });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
  const auth = await requirePermission("create", "invite");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId ?? "");
  const role = String(body?.role ?? "USER");
  const territory = body?.territory ?? null;
  const region = body?.region ?? null;

  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId required." }, { status: 400 });
  }

  const membership = await prisma.workspaceMembership.upsert({
    where: { userId_workspaceId: { userId, workspaceId } },
    create: { userId, workspaceId, territory, region, isPrimary: false, status: "ACTIVE" },
    update: { territory, region },
  });

  await prisma.roleAssignment.create({
    data: {
      workspaceMembershipId: membership.id,
      role: role as any,
      grantedById: auth.session.user!.id,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.MEMBERSHIP_CREATE,
    targetType: "WORKSPACE_MEMBERSHIP",
    targetId: membership.id,
    workspaceId,
    metadata: { userId, role },
  });

  return NextResponse.json({ ok: true, membership }, { status: 201 });
}
