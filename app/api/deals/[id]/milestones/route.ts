import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiCreated, apiOk, apiUnauthorized, apiValidationError, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createDealMilestoneSchema } from "@/lib/core/validation";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "deal");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createDealMilestoneSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const milestone = await prisma.dealMilestone.create({
    data: {
      dealId: params.id,
      title: parsed.data.title,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    },
  });

  return apiCreated(milestone);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "deal");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const milestoneId = String(body?.milestoneId ?? "");
  if (!milestoneId) return apiValidationError([{ path: "milestoneId", message: "milestoneId required." }]);

  const milestone = await prisma.dealMilestone.findFirst({
    where: { id: milestoneId, dealId: params.id },
  });
  if (!milestone) return apiValidationError([{ path: "milestoneId", message: "Milestone not found for this deal." }]);

  const data: Record<string, unknown> = {};
  if (body?.title !== undefined) data.title = String(body.title);
  if (body?.doneAt !== undefined) data.doneAt = body.doneAt ? new Date(String(body.doneAt)) : null;
  if (body?.dueAt !== undefined) data.dueAt = body.dueAt ? new Date(String(body.dueAt)) : null;

  const updated = await prisma.dealMilestone.update({ where: { id: milestoneId }, data });

  return apiOk(updated);
}
