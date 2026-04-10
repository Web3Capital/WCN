/**
 * @wcn/agents — Context Builder
 *
 * Reads domain data from Prisma and assembles structured context
 * that gets injected into LLM prompts.
 */

import { getPrisma } from "@/lib/prisma";
import type { ProjectContext, CapitalContext, DealContext, MatchContext } from "./types";

export async function buildProjectContext(projectId: string): Promise<ProjectContext | null> {
  const prisma = getPrisma();
  const p = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      node: { select: { name: true } },
      deals: {
        select: { milestones: { select: { title: true } } },
        take: 3,
      },
      _count: { select: { evidence: true } },
    },
  });
  if (!p) return null;

  return {
    id: p.id,
    name: p.name,
    sector: p.sector,
    stage: p.stage,
    description: p.description,
    fundraisingNeed: p.fundraisingNeed ? Number(p.fundraisingNeed) : null,
    location: null,
    nodeName: p.node?.name ?? null,
    milestones: p.deals.flatMap((d) => d.milestones.map((m) => m.title)),
    evidenceCount: p._count.evidence,
  };
}

export async function buildCapitalContext(capitalProfileId: string): Promise<CapitalContext | null> {
  const prisma = getPrisma();
  const c = await prisma.capitalProfile.findUnique({
    where: { id: capitalProfileId },
    include: {
      node: { select: { name: true } },
    },
  });
  if (!c) return null;

  return {
    id: c.id,
    nodeName: c.node?.name ?? null,
    sectors: c.investmentFocus ?? [],
    stages: c.structurePref ?? [],
    ticketMin: c.ticketMin ? Number(c.ticketMin) : null,
    ticketMax: c.ticketMax ? Number(c.ticketMax) : null,
    regions: c.jurisdictionLimit ?? [],
    investorType: c.entity,
  };
}

export async function buildDealContext(dealId: string): Promise<DealContext | null> {
  const prisma = getPrisma();
  const d = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      title: true,
      stage: true,
      project: { select: { name: true } },
      participants: {
        select: { node: { select: { name: true } }, role: true },
      },
      milestones: {
        select: { title: true, doneAt: true },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { notes: true } },
    },
  });
  if (!d) return null;

  return {
    id: d.id,
    title: d.title,
    stage: d.stage,
    projectName: d.project?.name ?? null,
    participants: d.participants.map((p) => ({
      nodeName: p.node?.name ?? "Unknown",
      role: p.role ?? "PARTICIPANT",
    })),
    milestones: d.milestones.map((m) => ({
      title: m.title,
      done: !!m.doneAt,
    })),
    noteCount: d._count.notes,
  };
}

export async function buildMatchContext(matchId: string): Promise<MatchContext | null> {
  const prisma = getPrisma();
  const m = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      score: true,
      sectorScore: true,
      stageScore: true,
      ticketScore: true,
      projectId: true,
      capitalProfileId: true,
    },
  });
  if (!m) return null;

  const [project, capital] = await Promise.all([
    buildProjectContext(m.projectId),
    buildCapitalContext(m.capitalProfileId),
  ]);
  if (!project || !capital) return null;

  return {
    matchId: m.id,
    score: m.score,
    sectorScore: m.sectorScore,
    stageScore: m.stageScore,
    ticketScore: m.ticketScore,
    project,
    capital,
  };
}
