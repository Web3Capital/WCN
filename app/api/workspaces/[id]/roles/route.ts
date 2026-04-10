import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiCreated, apiUnauthorized, apiNotFound, apiValidationError } from "@/lib/core/api-response";
import { parseBody, assignWorkspaceRoleSchema, revokeWorkspaceRoleSchema } from "@/lib/core/validation";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
  const auth = await requirePermission("read", "invite");
  if (!auth.ok) return apiUnauthorized();

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

  return apiOk(assignments);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
  const auth = await requirePermission("create", "invite");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(assignWorkspaceRoleSchema, body);
  if (!parsed.ok) return apiValidationError(parsed.error.issues.map(i => ({ path: i.path.join("."), message: i.message })));

  const prisma = getPrisma();
  const { membershipId, role } = parsed.data;

  const membership = await prisma.workspaceMembership.findFirst({
    where: { id: membershipId, workspaceId },
  });
  if (!membership) return apiNotFound("Membership in this workspace");

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

  return apiCreated(assignment);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
  const auth = await requirePermission("delete", "invite");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(revokeWorkspaceRoleSchema, body);
  if (!parsed.ok) return apiValidationError(parsed.error.issues.map(i => ({ path: i.path.join("."), message: i.message })));

  const prisma = getPrisma();
  const { assignmentId } = parsed.data;

  const assignment = await prisma.roleAssignment.findFirst({
    where: { id: assignmentId, membership: { workspaceId }, revokedAt: null },
  });
  if (!assignment) return apiNotFound("RoleAssignment");

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

  return apiOk({ revoked: true });
}
