/**
 * @wcn/ledger — Three-Ledger Economic Service
 *
 * White Paper §12: Value Layer
 * Cash Ledger — fiat, stablecoin, service fees, success commissions
 * Rights Ledger — node seats, governance positions, quotas
 * Incentive Ledger — points, deferred rewards, future equity mapping
 */

import { getPrisma } from "@/lib/prisma";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { LedgerBalance } from "./ports";

// ─── Constants ─────────────────────────────────────────────────

const CREDIT_ACTIONS = ["CREDIT", "RELEASE"];
const DEBIT_ACTIONS = ["DEBIT", "SLASH"];
const FREEZE_ACTIONS = ["FREEZE", "ESCROW"];
const UNFREEZE_ACTIONS = ["UNFREEZE"];

// ─── Core Service ──────────────────────────────────────────────

export async function createEntry(data: {
  workspaceId?: string;
  nodeId: string;
  type: "CASH" | "RIGHTS" | "INCENTIVE";
  action: "CREDIT" | "DEBIT" | "FREEZE" | "UNFREEZE" | "SLASH" | "RELEASE" | "ESCROW";
  amount: number;
  currency?: string;
  reference?: string;
  referenceType?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}) {
  const prisma = getPrisma();

  const entry = await prisma.ledger.create({
    data: {
      workspaceId: data.workspaceId ?? null,
      nodeId: data.nodeId,
      type: data.type,
      action: data.action,
      amount: data.amount,
      currency: data.currency ?? "USD",
      reference: data.reference ?? null,
      referenceType: data.referenceType ?? null,
      notes: data.notes ?? null,
      metadata: (data.metadata ?? undefined) as any,
    },
  });

  await eventBus.emit(Events.LEDGER_ENTRY_CREATED, {
    entryId: entry.id,
    nodeId: entry.nodeId,
    type: entry.type,
    action: entry.action,
    amount: entry.amount,
    reference: data.reference,
  });

  return entry;
}

export async function getBalance(nodeId: string, type: string): Promise<LedgerBalance> {
  const prisma = getPrisma();

  const entries = await prisma.ledger.findMany({
    where: { nodeId, type: type as any },
    select: { action: true, amount: true, currency: true },
  });

  let credits = 0;
  let debits = 0;
  let frozen = 0;
  let currency = "USD";

  for (const entry of entries) {
    currency = entry.currency;
    if (CREDIT_ACTIONS.includes(entry.action)) credits += entry.amount;
    if (DEBIT_ACTIONS.includes(entry.action)) debits += entry.amount;
    if (FREEZE_ACTIONS.includes(entry.action)) frozen += entry.amount;
    if (UNFREEZE_ACTIONS.includes(entry.action)) frozen -= entry.amount;
  }

  const total = credits - debits;
  frozen = Math.max(0, frozen);
  const available = Math.max(0, total - frozen);

  return { type, total, frozen, available, currency };
}

export async function getBalances(nodeId: string): Promise<LedgerBalance[]> {
  const types = ["CASH", "RIGHTS", "INCENTIVE"] as const;
  return Promise.all(types.map((type) => getBalance(nodeId, type)));
}

export async function getHistory(
  nodeId: string,
  type: string,
  opts?: { limit?: number; cursor?: string },
) {
  const prisma = getPrisma();
  const limit = opts?.limit ?? 50;

  return prisma.ledger.findMany({
    where: {
      nodeId,
      type: type as any,
      ...(opts?.cursor ? { id: { lt: opts.cursor } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function freezeBalance(
  nodeId: string,
  type: "CASH" | "RIGHTS" | "INCENTIVE",
  amount: number,
  reference?: string,
  notes?: string,
) {
  return createEntry({
    nodeId,
    type,
    action: "FREEZE",
    amount,
    reference,
    referenceType: "FREEZE",
    notes,
  });
}

export async function releaseEscrow(
  nodeId: string,
  type: "CASH" | "RIGHTS" | "INCENTIVE",
  amount: number,
  reference?: string,
  notes?: string,
) {
  return createEntry({
    nodeId,
    type,
    action: "RELEASE",
    amount,
    reference,
    referenceType: "RELEASE",
    notes,
  });
}
