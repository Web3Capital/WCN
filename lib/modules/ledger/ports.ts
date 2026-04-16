/**
 * @wcn/ledger — Hexagonal Port Interfaces
 *
 * White Paper §12: Value Layer — Three-Ledger Economic Model
 * Cash Ledger (fiat/stablecoin), Rights Ledger (seats/governance/quotas),
 * Incentive Ledger (points/deferred rewards/future equity mapping).
 */

export interface LedgerEntry {
  id: string;
  workspaceId: string | null;
  nodeId: string;
  type: string;
  action: string;
  amount: number;
  currency: string;
  reference: string | null;
  referenceType: string | null;
  notes: string | null;
  metadata: unknown | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerBalance {
  type: string;
  total: number;
  frozen: number;
  available: number;
  currency: string;
}

export interface LedgerPort {
  createEntry(data: Omit<LedgerEntry, "id" | "createdAt" | "updatedAt" | "version">): Promise<LedgerEntry>;
  getBalance(nodeId: string, type: string): Promise<LedgerBalance>;
  getBalances(nodeId: string): Promise<LedgerBalance[]>;
  getHistory(nodeId: string, type: string, opts?: { limit?: number; cursor?: string }): Promise<LedgerEntry[]>;
}
