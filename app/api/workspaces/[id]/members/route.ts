import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, addWorkspaceMemberSchema } from "@/lib/core/validation";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("read", "invite");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const members = await prisma.workspaceMembership.findMany({
    where: { workspaceId: id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, accountStatus: true, role: true } },
      roleAssignments: { where: { revokedAt: null } },
    },
    orderBy: { createdAt: "asc" },
  });

  return apiOk(members);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
  const auth = await requirePermission("create", "invite");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(addWorkspaceMemberSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const { userId, role, territory, region } = parsed.data;

  const membership = await prisma.workspaceMembership.upsert({
    where: { userId_workspaceId: { userId, workspaceId } },
    create: { userId, workspaceId, territory: territory ?? null, region: region ?? null, isPrimary: false, status: "ACTIVE" },
    update: { territory: territory ?? null, region: region ?? null },
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

  return apiCreated(membership);
}
