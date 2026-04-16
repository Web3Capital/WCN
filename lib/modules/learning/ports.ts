/**
 * @wcn/learning — Hexagonal Port Interfaces
 *
 * White Paper §05: Formal Definition, component L (Learning Loop).
 * System learns from events to improve matching, scoring, and policies.
 */

export interface LearningSignalRecord {
  id: string;
  workspaceId: string | null;
  signalType: string;
  sourceEvent: string;
  entityType: string;
  entityId: string;
  payload: unknown;
  processed: boolean;
  processedAt: Date | null;
  createdAt: Date;
}

export interface LearningPort {
  captureSignal(data: Omit<LearningSignalRecord, "id" | "createdAt" | "processed" | "processedAt">): Promise<LearningSignalRecord>;
  getUnprocessedSignals(type: string, limit?: number): Promise<LearningSignalRecord[]>;
  markProcessed(signalId: string): Promise<void>;
  getSignalStats(): Promise<Record<string, number>>;
}
