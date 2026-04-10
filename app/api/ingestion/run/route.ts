import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiValidationError, apiError } from "@/lib/core/api-response";
import { runIngestion } from "@/lib/modules/ingestion/runner";
import { z } from "zod";

const schema = z.object({ sourceId: z.string().min(1) });

export async function POST(req: Request) {
  const auth = await requirePermission("manage", "node");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const prisma = getPrisma();
  try {
    const result = await runIngestion(prisma, parsed.data.sourceId);
    return apiOk(result);
  } catch (err: any) {
    return apiError("INGESTION_FAILED", err.message, 500);
  }
}
