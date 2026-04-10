/**
 * @wcn/matching — Port Definitions
 */

export interface ProjectForMatching {
  id: string;
  sector: string | null;
  stage: string;
  fundraisingNeed: string | null;
  workspaceId: string | null;
  status: string;
  nodeId: string | null;
}

export interface CapitalForMatching {
  id: string;
  nodeId: string | null;
  investmentFocus: string[];
  ticketMin: number | null;
  ticketMax: number | null;
  jurisdictionLimit: string[];
  blacklist: string[];
  status: string;
}

export interface MatchRecord {
  id: string;
  projectId: string;
  capitalProfileId: string;
  capitalNodeId: string;
  score: number;
  sectorScore: number;
  stageScore: number;
  ticketScore: number;
  jurisdictionScore: number;
  status: string;
  interestAt: Date | null;
  declinedAt: Date | null;
  convertedDealId: string | null;
  expiresAt: Date | null;
}

export interface MatchListItem extends MatchRecord {
  project?: { id: string; name: string; sector: string | null; stage: string; status: string };
  capitalProfile?: { id: string; name: string; status: string; investmentFocus: string[] };
}

export interface MatchPort {
  findProjectById(id: string): Promise<ProjectForMatching | null>;
  findActiveCapitalProfiles(): Promise<CapitalForMatching[]>;
  findActiveProjects(): Promise<Array<ProjectForMatching & { nodeId: string | null }>>;
  findCapitalById(id: string): Promise<CapitalForMatching | null>;
  upsertMatch(projectId: string, data: Omit<MatchRecord, 'id' | 'status' | 'interestAt' | 'declinedAt' | 'convertedDealId'>): Promise<MatchRecord>;
  deleteMatchesByProjectAndCapital(projectId: string, capitalProfileId: string): Promise<void>;
  updateProjectStatus(projectId: string, status: string): Promise<void>;
  findMatchById(id: string): Promise<MatchRecord | null>;
  updateMatch(id: string, data: Partial<MatchRecord>): Promise<MatchRecord>;
  findMatches(params: { where: Record<string, unknown>; skip: number; take: number }): Promise<{ matches: MatchListItem[]; total: number }>;
  findMatchDetail(id: string): Promise<MatchListItem | null>;
}
