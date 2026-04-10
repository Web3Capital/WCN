import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiCreated, apiUnauthorized, apiConflict, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createWorkspaceSchema } from "@/lib/core/validation";

export async function GET() {
  const auth = await requirePermission("read", "invite");
  if (!auth.ok) return apiUnauthorized();

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

  return apiOk(memberships);
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "invite");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createWorkspaceSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const { name, slug, description } = parsed.data;

  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (existing) return apiConflict("Slug already taken.");

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      description: description ?? null,
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

  return apiCreated(workspace);
}
