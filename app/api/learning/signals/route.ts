import "@/lib/core/init";
import { requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, apiForbidden, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createLearningSignalSchema } from "@/lib/core/validation";
import { captureSignal, getUnprocessedSignals, getSignalStats } from "@/lib/modules/learning";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();
  if (!isAdminRole(auth.session.user?.role ?? "USER")) return apiForbidden();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const statsOnly = searchParams.get("stats") === "1";

  if (statsOnly) {
    const stats = await getSignalStats();
    return apiOk(stats);
  }

  if (!type) {
    return apiOk({ error: "type query param required (or use stats=1)" });
  }

  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const signals = await getUnprocessedSignals(type, limit);
  return apiOk(signals);
}

export async function POST(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();
  if (!isAdminRole(auth.session.user?.role ?? "USER")) return apiForbidden();

  const body = await req.json();
  const parsed = parseBody(createLearningSignalSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const signal = await captureSignal(parsed.data);
  return apiCreated(signal);
}
