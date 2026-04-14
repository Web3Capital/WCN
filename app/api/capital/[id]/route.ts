import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, zodToApiError } from "@/lib/core/api-response";
import { parseBody, updateCapitalSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const profile = await prisma.capitalProfile.findUnique({
    where: { id: params.id },
    include: {
      node: { select: { id: true, name: true, ownerUserId: true } },
      deals: { select: { id: true, title: true, stage: true }, take: 20 },
    },
  });

  if (!profile) return apiNotFound("CapitalProfile");

  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin && profile.node?.ownerUserId !== auth.session.user?.id) {
    const redacted = { ...profile, contactEmail: null, restrictions: null, blacklist: [] };
    return apiOk(redacted);
  }

  return apiOk(profile);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "capital");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(updateCapitalSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const existing = await prisma.capitalProfile.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, nodeId: true, node: { select: { ownerUserId: true } } },
  });
  if (!existing) return apiNotFound("CapitalProfile");

  if (!isAdminRole(auth.session.user?.role ?? "USER") && existing.node?.ownerUserId !== auth.session.user!.id) {
    return apiUnauthorized();
  }

  const data: Record<string, unknown> = {};
  const d = parsed.data;

  const stringFields = ["name", "entity", "investorType", "aum", "restrictions", "decisionTimeline", "contactName", "contactEmail", "notes"] as const;
  for (const f of stringFields) {
    if (d[f] !== undefined) data[f] = d[f] ? String(d[f]).trim() : null;
  }

  if (d.status !== undefined) data.status = d.status;
  if (d.ticketMin !== undefined) data.ticketMin = d.ticketMin;
  if (d.ticketMax !== undefined) data.ticketMax = d.ticketMax;
  if (d.maxConcurrentDeals !== undefined) data.maxConcurrentDeals = d.maxConcurrentDeals;
  if (d.activeDealCount !== undefined) data.activeDealCount = d.activeDealCount;
  if (d.totalDeployed !== undefined) data.totalDeployed = d.totalDeployed;
  if (d.totalDeals !== undefined) data.totalDeals = d.totalDeals;
  if (d.avgTicketSize !== undefined) data.avgTicketSize = d.avgTicketSize;
  if (d.responseSpeed !== undefined) data.responseSpeed = d.responseSpeed;
  if (d.activityScore !== undefined) data.activityScore = d.activityScore;
  if (d.nodeId !== undefined) data.nodeId = d.nodeId ?? null;

  const arrayFields = ["investmentFocus", "instruments", "jurisdictionLimit", "structurePref", "blacklist"] as const;
  for (const f of arrayFields) {
    if (d[f] !== undefined) data[f] = d[f];
  }

  const profile = await prisma.capitalProfile.update({ where: { id: params.id }, data });

  if (d.status && d.status !== existing.status) {
    await writeAudit({
      actorUserId: auth.session.user?.id ?? null,
      action: AuditAction.CAPITAL_STATUS_CHANGE,
      targetType: "CAPITAL",
      targetId: params.id,
      metadata: { previousStatus: existing.status, newStatus: d.status },
    });
  }

  const changedFields = Object.keys(data);
  if (changedFields.length > 0) {
    await eventBus.emit(Events.CAPITAL_PROFILE_UPDATED, {
      capitalProfileId: params.id,
      nodeId: existing.nodeId ?? "",
      changedFields,
    }, { actorId: auth.session.user?.id });
  }

  return apiOk(profile);
}
