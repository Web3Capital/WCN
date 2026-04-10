import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";
import { z } from "zod";
import { createCampaign } from "@/lib/modules/distribution/campaign";

const campaignSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  targetType: z.string().optional(),
  budget: z.number().positive().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
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

  const body = await req.json().catch(() => ({}));
  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const prisma = getPrisma();
  const campaign = await createCampaign(prisma, parsed.data, auth.session.user!.id);
  return apiOk(campaign);
}
