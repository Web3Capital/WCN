/**
 * @wcn/reputation — Port Definitions
 */

export interface NodeForReputation {
  createdAt: Date;
}

export interface ReputationPort {
  findNode(nodeId: string): Promise<NodeForReputation | null>;
  countPoBScores(nodeId: string): Promise<Array<{ score: number | null }>>;
  countTasksByStatus(nodeId: string): Promise<Array<{ status: string }>>;
  countEvidenceByReviewStatus(nodeId: string): Promise<Array<{ reviewStatus: string }>>;
  countDisputes(nodeId: string): Promise<number>;
  countDealsByStage(nodeId: string): Promise<Array<{ stage: string }>>;
  upsertReputationScore(nodeId: string, score: number, tier: string, components: Record<string, unknown>): Promise<void>;
  createReputationHistory(nodeId: string, score: number, tier: string): Promise<void>;
}
