/**
 * @wcn/settlement — Port Definitions
 */

export interface SettlementCycleRecord {
  id: string;
  pool: number;
  startAt: Date;
  endAt: Date;
  status: string;
  reconciledAt: Date | null;
}

export interface PoBForSettlement {
  id: string;
  score: number;
  attributions: Array<{ nodeId: string; shareBps: number }>;
}

export interface SettlementLineRecord {
  id: string;
  cycleId: string;
  nodeId: string;
  scoreTotal: number;
  allocation: number;
  pobCount: number;
  node?: { id: string; name: string; type: string };
}

export interface SettlementPort {
  findCycleById(id: string): Promise<SettlementCycleRecord | null>;
  findPoBsForCycle(cycleId: string, startAt: Date, endAt: Date): Promise<PoBForSettlement[]>;
  replaceSettlementLines(cycleId: string, lines: Array<{ nodeId: string; scoreTotal: number; allocation: number; pobCount: number }>): Promise<void>;
  updateCycleReconciledAt(cycleId: string): Promise<void>;
  findLinesByCycle(cycleId: string): Promise<SettlementLineRecord[]>;
}
