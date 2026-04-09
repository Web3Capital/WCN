import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET() {
  const auth = await requirePermission("read", "invite");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const userId = auth.session.user!.id;

  const memberships = await prisma.workspaceMembership.findMany({
    where: { userId },
    include: {
      workspace: true,
      roleAssignments: { where: { revokedAt: null } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, workspaces: memberships });
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "invite");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const slug = String(body?.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

  if (!name || !slug) {
    return NextResponse.json({ ok: false, error: "Name and slug required." }, { status: 400 });
  }

  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "Slug already taken." }, { status: 409 });
  }

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      description: body?.description ?? null,
      status: "ACTIVE",
    },
  });

  const membership = await prisma.workspaceMembership.create({
    data: {
      userId: auth.session.user!.id,
      workspaceId: workspace.id,
      isPrimary: true,
      status: "ACTIVE",
    },
  });

  await prisma.roleAssignment.create({
    data: {
      workspaceMembershipId: membership.id,
      role: auth.session.user!.role as any,
      grantedById: auth.session.user!.id,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.WORKSPACE_CREATE,
    targetType: "WORKSPACE",
    targetId: workspace.id,
  });

  return NextResponse.json({ ok: true, workspace }, { status: 201 });
}
