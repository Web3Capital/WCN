import type { PrismaClient } from "@prisma/client";

export type CreateProposalInput = {
  title: string;
  description?: string;
  type: string;
  options: string[];
  quorum?: number;
  deadline?: string;
};

export async function createProposal(
  prisma: PrismaClient,
  input: CreateProposalInput,
  createdById: string,
) {
  return prisma.proposal.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      options: input.options,
      quorum: input.quorum ?? 1,
      deadline: input.deadline ? new Date(input.deadline) : undefined,
      createdById,
    },
  });
}

export async function castVote(
  prisma: PrismaClient,
  proposalId: string,
  voterId: string,
  option: string,
  weight = 1,
) {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new Error("Proposal not found");
  if (proposal.status !== "ACTIVE") throw new Error("Proposal is not active");
  if (proposal.deadline && new Date() > proposal.deadline) throw new Error("Voting period has ended");

  const options = proposal.options as string[];
  if (!options.includes(option)) throw new Error(`Invalid option: ${option}`);

  return prisma.vote.upsert({
    where: { proposalId_voterId: { proposalId, voterId } },
    create: { proposalId, voterId, option, weight },
    update: { option, weight, castAt: new Date() },
  });
}

export async function tallyVotes(
  prisma: PrismaClient,
  proposalId: string,
): Promise<{
  results: Record<string, { count: number; weight: number }>;
  totalVotes: number;
  quorumMet: boolean;
  winner: string | null;
}> {
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new Error("Proposal not found");

  const votes = await prisma.vote.findMany({ where: { proposalId } });
  const results: Record<string, { count: number; weight: number }> = {};

  for (const option of (proposal.options as string[])) {
    results[option] = { count: 0, weight: 0 };
  }

  for (const vote of votes) {
    if (!results[vote.option]) results[vote.option] = { count: 0, weight: 0 };
    results[vote.option].count++;
    results[vote.option].weight += vote.weight;
  }

  const quorumMet = votes.length >= proposal.quorum;
  let winner: string | null = null;

  if (quorumMet) {
    const sorted = Object.entries(results).sort((a, b) => b[1].weight - a[1].weight);
    if (sorted.length > 0 && (sorted.length === 1 || sorted[0][1].weight > sorted[1][1].weight)) {
      winner = sorted[0][0];
    }
  }

  return { results, totalVotes: votes.length, quorumMet, winner };
}

export async function activateProposal(prisma: PrismaClient, proposalId: string) {
  return prisma.proposal.update({
    where: { id: proposalId },
    data: { status: "ACTIVE" },
  });
}

export async function finalizeProposal(prisma: PrismaClient, proposalId: string) {
  const tally = await tallyVotes(prisma, proposalId);
  const status = tally.quorumMet && tally.winner ? "PASSED" : "REJECTED";

  return prisma.proposal.update({
    where: { id: proposalId },
    data: { status: status as any },
  });
}
