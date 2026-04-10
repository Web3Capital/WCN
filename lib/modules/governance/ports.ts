/**
 * @wcn/governance — Port Definitions
 */

export interface ProposalRecord {
  id: string;
  title: string;
  description: string;
  proposerNodeId: string;
  proposerUserId: string;
  status: string;
  options: unknown;
  votingStartsAt: Date;
  votingEndsAt: Date;
  quorum: number;
  createdAt: Date;
}

export interface GovernancePort {
  createProposal(data: Omit<ProposalRecord, 'id' | 'createdAt'>): Promise<ProposalRecord>;
  findProposalById(id: string): Promise<ProposalRecord | null>;
  updateProposal(id: string, data: Partial<ProposalRecord>): Promise<void>;
  castVote(proposalId: string, nodeId: string, userId: string, optionId: string, weight: number): Promise<void>;
  countVotes(proposalId: string): Promise<number>;
}
