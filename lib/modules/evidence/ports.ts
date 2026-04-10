/**
 * @wcn/evidence — Port Definitions
 */

export interface DealForEvidence {
  id: string;
  title: string;
  projectId: string | null;
  leadNodeId: string | null;
  evidence: Array<{ id: string; type: string; title: string }>;
  tasks: Array<{ id: string; evidences: Array<{ id: string; type: string }> }>;
  milestones: Array<{ id: string; title: string; doneAt: Date | null }>;
}

export interface EvidencePort {
  findDealForEvidence(dealId: string): Promise<DealForEvidence | null>;
  findExistingPacket(dealId: string): Promise<{ id: string } | null>;
  createEvidence(data: { type: string; title: string; summary: string; dealId: string; projectId: string | null; nodeId: string | null; reviewStatus: string }): Promise<{ id: string }>;
  updateEvidence(id: string, data: { summary: string }): Promise<void>;
  findEvidenceByDeal(dealId: string, excludeRejected: boolean): Promise<Array<{ type: string }>>;
}
