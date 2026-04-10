/**
 * @wcn/deals — Port Definitions
 * Data access contracts for the deals domain. Implementations are in adapters/.
 */

export interface DealRecord {
  id: string;
  title: string;
  description: string | null;
  stage: string;
  leadNodeId: string;
  projectId: string | null;
  capitalId: string | null;
  nextAction: string | null;
  nextActionDueAt: Date | null;
  riskTags: string[];
  confidentialityLevel: string;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealListItem extends DealRecord {
  project?: { id: string; name: string } | null;
  capital?: { id: string; name: string } | null;
  leadNode?: { id: string; name: string } | null;
  _count?: { participants: number; milestones: number; notes: number; tasks: number };
}

export interface DealDetail extends DealRecord {
  project?: { id: string; name: string; status: string; sector: string | null } | null;
  capital?: { id: string; name: string; status: string } | null;
  leadNode?: { id: string; name: string } | null;
  participants: Array<{ node: { id: string; name: string } | null; joinedAt?: Date }>;
  milestones: Array<{ id: string; title: string; doneAt: Date | null; createdAt: Date }>;
  notes: Array<{ id: string; content: string; createdAt: Date }>;
  tasks: Array<{ id: string; title: string; status: string; type: string }>;
  evidence: Array<{ id: string; title: string; type: string; reviewStatus: string }>;
  pobRecords: Array<{ id: string; businessType: string; status: string; score: number }>;
  _count?: { participants: number; milestones: number; notes: number; tasks: number; evidence: number };
}

export interface DealCreateInput {
  title: string;
  leadNodeId: string;
  description?: string | null;
  projectId?: string | null;
  capitalId?: string | null;
  nextAction?: string | null;
  confidentialityLevel?: string;
}

export interface DealUpdateData {
  title?: string;
  description?: string | null;
  stage?: string;
  nextAction?: string | null;
  nextActionDueAt?: Date | null;
  riskTags?: string[];
  confidentialityLevel?: string;
  closedAt?: Date | null;
}

export interface DealPort {
  findMany(params: { where?: Record<string, unknown>; take?: number }): Promise<DealListItem[]>;
  findById(id: string): Promise<DealDetail | null>;
  findByIdSelect(id: string, fields: string[]): Promise<Partial<DealRecord> | null>;
  create(data: DealCreateInput): Promise<DealListItem>;
  update(id: string, data: DealUpdateData): Promise<DealRecord>;
  getNodeIdsByUser(userId: string): Promise<string[]>;
}
