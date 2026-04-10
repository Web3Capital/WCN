/**
 * @wcn/pob — Port Definitions
 */

export interface DealForAttribution {
  id: string;
  title: string;
  projectId: string | null;
  leadNodeId: string | null;
  closedAt: Date | null;
  participants: Array<{ nodeId: string | null; role: string }>;
  evidence: Array<{ id: string; nodeId: string | null }>;
}

export interface PoBCreateInput {
  businessType: string;
  baseValue: number;
  qualityMult: number;
  timeMult: number;
  score: number;
  dealId: string;
  projectId: string | null;
  nodeId: string;
  leadNodeId: string;
  supportingNodeIds: string[];
}

export interface AttributionInput {
  pobId: string;
  nodeId: string;
  role: string;
  shareBps: number;
  evidenceRefs: string[];
}

export interface PoBPort {
  findDealForAttribution(dealId: string): Promise<DealForAttribution | null>;
  findExistingPoB(dealId: string, businessType: string): Promise<{ id: string } | null>;
  createPoB(data: PoBCreateInput): Promise<{ id: string }>;
  updatePoB(id: string, data: { baseValue: number; qualityMult: number; timeMult: number; score: number }): Promise<void>;
  deleteAttributions(pobId: string): Promise<void>;
  createAttribution(data: AttributionInput): Promise<void>;
  createRiskFlag(entityType: string, entityId: string, severity: string, reason: string): Promise<void>;
  findAttributionsByPoB(pobId: string): Promise<Array<{ nodeId: string; role: string; shareBps: number; node?: { id: string; name: string; type: string } }>>;
}
