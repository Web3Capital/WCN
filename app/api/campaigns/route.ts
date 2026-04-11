import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";
import { z } from "zod";
import { createCampaign, assignChannel, recordMetric, transitionCampaignStatus } from "@/lib/modules/distribution/campaign";

const campaignSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  targetType: z.string().optional(),
  budget: z.number().positive().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
});

const transitionSchema = z.object({
  action: z.literal("transition"),
  campaignId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]),
});

const assignChannelSchema = z.object({
  action: z.literal("assignChannel"),
  campaignId: z.string().min(1),
  nodeId: z.string().min(1),
  channel: z.string().min(1),
  deliverables: z.record(z.string(), z.unknown()).optional(),
});

const recordMetricSchema = z.object({
  action: z.literal("recordMetric"),
  campaignId: z.string().min(1),
  metricType: z.string().min(1),
  value: z.number(),
});

export async function GET(req: Request) {
  const auth = await requirePermission("read", "node");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const campaigns = await prisma.campaign.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
    include: { channels: true, metrics: true },
    take: 50,
  });

  return apiOk(campaigns);
}

export async function POST(req: Request) {
  const auth = await requirePermission("manage", "node");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  if (body?.action === "transition") {
    const parsed = transitionSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
    const result = await transitionCampaignStatus(prisma, parsed.data.campaignId, parsed.data.status);
    return apiOk(result);
  }

  if (body?.action === "assignChannel") {
    const parsed = assignChannelSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
    const result = await assignChannel(prisma, parsed.data.campaignId, parsed.data.nodeId, parsed.data.channel, parsed.data.deliverables);
    return apiOk(result);
  }

  if (body?.action === "recordMetric") {
    const parsed = recordMetricSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
    const result = await recordMetric(prisma, parsed.data.campaignId, parsed.data.metricType, parsed.data.value);
    return apiOk(result);
  }

  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const campaign = await createCampaign(prisma, parsed.data, auth.session.user!.id);
  return apiOk(campaign);
}
