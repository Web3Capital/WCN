import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn, requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiValidationError, apiNotFound } from "@/lib/core/api-response";
import { z } from "zod";
import { createProposal, castVote, tallyVotes, activateProposal, finalizeProposal } from "@/lib/modules/governance/proposal";

const proposalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.string().min(1),
  options: z.array(z.string()).min(2),
  quorum: z.number().int().min(1).optional(),
  deadline: z.string().optional(),
});

const voteSchema = z.object({
  proposalId: z.string().min(1),
  option: z.string().min(1),
});

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const proposals = await prisma.proposal.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { createdAt: "desc" },
    include: { votes: { select: { voterId: true, option: true, weight: true } } },
    take: 50,
  });

  return apiOk(proposals);
}

export async function POST(req: Request) {
  const auth = await requirePermission("manage", "node");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));

  if (body?.action === "vote") {
    const parsed = voteSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
    }
    try {
      const prisma = getPrisma();
      const vote = await castVote(prisma, parsed.data.proposalId, auth.session.user!.id, parsed.data.option);
      return apiOk(vote);
    } catch (err) {
      return apiValidationError([{ path: "vote", message: (err as Error).message }]);
    }
  }

  if (body?.action === "activate" || body?.action === "ACTIVE") {
    const prisma = getPrisma();
    const proposal = await activateProposal(prisma, body.proposalId);
    return apiOk(proposal);
  }

  if (body?.action === "finalize") {
    const prisma = getPrisma();
    const proposal = await finalizeProposal(prisma, body.proposalId);
    return apiOk(proposal);
  }

  if (body?.action === "tally") {
    const prisma = getPrisma();
    const tally = await tallyVotes(prisma, body.proposalId);
    return apiOk(tally);
  }

  const parsed = proposalSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const prisma = getPrisma();
  const proposal = await createProposal(prisma, parsed.data, auth.session.user!.id);
  return apiOk(proposal);
}
