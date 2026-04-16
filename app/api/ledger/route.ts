import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiCreated, apiUnauthorized, apiForbidden, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createLedgerEntrySchema } from "@/lib/core/validation";
import { createEntry, getHistory } from "@/lib/modules/ledger";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const { searchParams } = new URL(req.url);
  const nodeId = searchParams.get("nodeId");
  const type = searchParams.get("type");
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  if (!nodeId || !type) {
    return apiOk({ error: "nodeId and type are required" });
  }

  const entries = await getHistory(nodeId, type, { limit, cursor });
  return apiOk(entries);
}

export async function POST(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();
  if (!isAdminRole(auth.session.user?.role ?? "USER")) return apiForbidden();

  const body = await req.json();
  const parsed = parseBody(createLedgerEntrySchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const { reference, referenceType, notes, ...rest } = parsed.data;
  const entry = await createEntry({
    ...rest,
    reference: reference ?? undefined,
    referenceType: referenceType ?? undefined,
    notes: notes ?? undefined,
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? "system",
    action: AuditAction.LEDGER_ENTRY_CREATE,
    targetType: "LEDGER",
    targetId: entry.id,
    metadata: { type: entry.type, action: entry.action, amount: entry.amount },
  });

  return apiCreated(entry);
}
