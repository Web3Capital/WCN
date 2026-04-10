/**
 * @wcn/risk — Port Definitions
 */

export interface NodeOwnership {
  ownerUserId: string | null;
}

export interface DealForRisk {
  leadNodeId: string | null;
  leadNode: NodeOwnership | null;
  participants: Array<{ nodeId: string | null; node: NodeOwnership | null }>;
}

export interface RiskPort {
  findNodeOwner(nodeId: string): Promise<NodeOwnership | null>;
  findDealForCircularCheck(dealId: string): Promise<DealForRisk | null>;
  countRecentDeals(nodeId: string, since: Date): Promise<number>;
  countRecentPoB(nodeId: string, since: Date): Promise<number>;
  findEvidenceByHash(hash: string, excludeId?: string): Promise<{ id: string; dealId: string | null; nodeId: string | null } | null>;
  createRiskFlag(entityType: string, entityId: string, severity: string, reason: string): Promise<{ id: string }>;
}
