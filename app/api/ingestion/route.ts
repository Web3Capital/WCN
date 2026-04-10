import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiOk, apiCreated, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";
import { listAdapters } from "@/lib/modules/ingestion/registry";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().min(1),
  config: z.record(z.string(), z.unknown()).optional(),
  schedule: z.string().optional(),
  enabled: z.boolean().optional(),
});

export async function GET() {
  const auth = await requirePermission("manage", "node");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const sources = await prisma.ingestionSource.findMany({
    orderBy: { createdAt: "desc" },
    include: { runs: { take: 3, orderBy: { startedAt: "desc" } } },
  });

  return apiOk({ sources, adapters: listAdapters() });
}

export async function POST(req: Request) {
  const auth = await requirePermission("manage", "node");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const prisma = getPrisma();
  const source = await prisma.ingestionSource.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      config: (parsed.data.config as any) ?? {},
      schedule: parsed.data.schedule ?? null,
      enabled: parsed.data.enabled ?? true,
      createdById: auth.ok ? auth.session.user?.id ?? null : null,
    },
  });

  return apiCreated(source);
}
