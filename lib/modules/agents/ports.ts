/**
 * @wcn/agents — Port Definitions
 */

export interface AgentRecord {
  id: string;
  type: string;
  status: string;
  ownerNodeId: string | null;
}

export interface AgentRunRecord {
  id: string;
  agentId: string;
  status: string;
  outputType: string;
  reviewStatus: string;
  inputs: Record<string, unknown> | null;
  outputs: Record<string, unknown> | null;
  triggeredBy: string;
}

export interface AgentPort {
  findAgentById(id: string): Promise<AgentRecord | null>;
  checkPermission(agentId: string, scope: string): Promise<boolean>;
  listPermissions(agentId: string): Promise<Array<{ scope: string }>>;
  createRun(data: { agentId: string; outputType: string; inputs: Record<string, unknown>; triggeredBy: string }): Promise<AgentRunRecord>;
  updateRun(id: string, data: Record<string, unknown>): Promise<void>;
  createLog(data: { agentId: string; ownerNodeId: string | null; actionType: string; modelVersion?: string; inputReference?: string; outputReference?: string; exceptionFlag?: boolean }): Promise<void>;
  findActiveAgentByType(type: string): Promise<{ id: string } | null>;
  findMatchesForProject(projectId: string, take: number): Promise<Array<{ id: string }>>;
}
