/**
 * @wcn/matching — Matching Engine Service
 *
 * Multi-dimension scoring algorithm that pairs Projects with CapitalProfiles.
 * Each dimension (sector, stage, ticket, jurisdiction) produces a 0–1 score;
 * the final composite score is a weighted sum normalized to 0–100.
 *
 * Scoring weights are configurable per-workspace via MATCH_WEIGHTS;
 * default weights reflect typical VC matching priorities.
 */

import { getPrisma } from "@/lib/prisma";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { MatchGeneratedEvent, MatchDeclinedEvent, MatchConvertedEvent } from "@/lib/core/event-types";
import type { MatchStatus, Project, CapitalProfile } from "@prisma/client";
import { checkSelfDealing } from "@/lib/modules/risk";

// ─── Scoring Weights ─────────────────────────────────────────────

export interface MatchWeights {
  sector: number;
  stage: number;
  ticket: number;
  jurisdiction: number;
}

export const DEFAULT_WEIGHTS: MatchWeights = {
  sector: 0.35,
  stage: 0.25,
  ticket: 0.25,
  jurisdiction: 0.15,
};

// ─── Stage Mapping (ordinal distance scoring) ────────────────────

const STAGE_ORDER: Record<string, number> = {
  IDEA: 0,
  SEED: 1,
  SERIES_A: 2,
  SERIES_B: 3,
  SERIES_C: 4,
  GROWTH: 5,
  PUBLIC: 6,
  OTHER: 3, // treat as mid-range
};

// ─── Scoring Functions ───────────────────────────────────────────

function scoreSector(projectSector: string | null, investmentFocus: string[]): number {
  if (!projectSector || investmentFocus.length === 0) return 0.5; // neutral
  const normalizedSector = projectSector.toLowerCase().trim();
  const match = investmentFocus.some(
    (f) => normalizedSector.includes(f.toLowerCase().trim()) || f.toLowerCase().trim().includes(normalizedSector),
  );
  return match ? 1.0 : 0.0;
}

function scoreStage(projectStage: string, investmentFocus: string[]): number {
  const pOrd = STAGE_ORDER[projectStage] ?? 3;
  const focusStages = investmentFocus
    .map((f) => f.toUpperCase().replace(/\s+/g, "_"))
    .filter((f) => f in STAGE_ORDER);
  if (focusStages.length === 0) return 0.5;
  const minDist = Math.min(...focusStages.map((f) => Math.abs(pOrd - (STAGE_ORDER[f] ?? 3))));
  return Math.max(0, 1 - minDist / 6);
}

export interface FundraisingRange {
  min: number;
  max: number;
}

function parseFundraisingNeed(raw: string | null): FundraisingRange | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\s]/g, "").toUpperCase();
  const multiplier = cleaned.includes("M") ? 1_000_000 : cleaned.includes("K") ? 1_000 : 1;
  const nums = cleaned.replace(/[^0-9.\-–]/g, " ").trim().split(/[\s\-–]+/).map(Number).filter((n) => !isNaN(n));
  if (nums.length === 0) return null;
  if (nums.length === 1) return { min: nums[0] * multiplier * 0.7, max: nums[0] * multiplier * 1.3 };
  return { min: Math.min(...nums) * multiplier, max: Math.max(...nums) * multiplier };
}

function scoreTicket(fundraisingNeed: string | null, ticketMin: number | null, ticketMax: number | null): number {
  const range = parseFundraisingNeed(fundraisingNeed);
  if (!range || (ticketMin == null && ticketMax == null)) return 0.5;
  const capMin = ticketMin ?? 0;
  const capMax = ticketMax ?? Infinity;
  const overlap = Math.min(range.max, capMax) - Math.max(range.min, capMin);
  if (overlap <= 0) return 0.0;
  const rangeSpan = range.max - range.min || 1;
  return Math.min(1, overlap / rangeSpan);
}

function scoreJurisdiction(projectWorkspaceId: string | null, jurisdictionLimit: string[]): number {
  if (jurisdictionLimit.length === 0) return 1.0; // no restrictions = global
  if (!projectWorkspaceId) return 0.5;
  return 0.5; // workspace ≠ jurisdiction; real impl would use project.country
}

// ─── Composite Scoring ───────────────────────────────────────────

export interface ScoredMatch {
  capitalProfileId: string;
  capitalNodeId: string;
  score: number;
  sectorScore: number;
  stageScore: number;
  ticketScore: number;
  jurisdictionScore: number;
}

export function scoreProjectCapital(
  project: Pick<Project, "sector" | "stage" | "fundraisingNeed" | "workspaceId">,
  capital: Pick<CapitalProfile, "id" | "nodeId" | "investmentFocus" | "ticketMin" | "ticketMax" | "jurisdictionLimit" | "blacklist">,
  weights: MatchWeights = DEFAULT_WEIGHTS,
): ScoredMatch | null {
  if (!capital.nodeId) return null;

  // Blacklist check
  if (capital.blacklist.length > 0 && project.sector) {
    const blocked = capital.blacklist.some(
      (b) => project.sector!.toLowerCase().includes(b.toLowerCase()),
    );
    if (blocked) return null;
  }

  const sectorScore = scoreSector(project.sector, capital.investmentFocus);
  const stageScore = scoreStage(project.stage, capital.investmentFocus);
  const ticketScore = scoreTicket(project.fundraisingNeed, capital.ticketMin, capital.ticketMax);
  const jurisdictionScore = scoreJurisdiction(project.workspaceId, capital.jurisdictionLimit);

  const raw =
    sectorScore * weights.sector +
    stageScore * weights.stage +
    ticketScore * weights.ticket +
    jurisdictionScore * weights.jurisdiction;
  const score = Math.round(raw * 100 * 100) / 100; // 0–100, 2 decimal places

  return {
    capitalProfileId: capital.id,
    capitalNodeId: capital.nodeId,
    score,
    sectorScore: Math.round(sectorScore * 100) / 100,
    stageScore: Math.round(stageScore * 100) / 100,
    ticketScore: Math.round(ticketScore * 100) / 100,
    jurisdictionScore: Math.round(jurisdictionScore * 100) / 100,
  };
}

// ─── Match Generation ────────────────────────────────────────────

const MATCH_THRESHOLD = 25; // minimum score to create a match
const MAX_MATCHES_PER_PROJECT = 50;

/**
 * Generate matches for a single project against all active capital profiles.
 * Upserts results to avoid duplicates.
 */
export async function generateMatchesForProject(
  projectId: string,
  actorId?: string,
  weights?: MatchWeights,
): Promise<ScoredMatch[]> {
  const prisma = getPrisma();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, sector: true, stage: true, fundraisingNeed: true, workspaceId: true, status: true, nodeId: true },
  });
  if (!project || !["SUBMITTED", "SCREENED", "CURATED", "IN_DEAL_ROOM", "ACTIVE"].includes(project.status)) {
    return [];
  }

  const capitals = await prisma.capitalProfile.findMany({
    where: { status: { in: ["ACTIVE", "WARM", "QUALIFIED"] } },
  });

  const scored = capitals
    .map((c) => scoreProjectCapital(project, c, weights))
    .filter((m): m is ScoredMatch => m !== null && m.score >= MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCHES_PER_PROJECT);

  const created: ScoredMatch[] = [];

  for (const match of scored) {
    const selfDeal = await checkSelfDealing(project.nodeId, match.capitalNodeId);
    if (selfDeal) continue;
    const upserted = await prisma.match.upsert({
      where: {
        projectId_capitalProfileId: {
          projectId,
          capitalProfileId: match.capitalProfileId,
        },
      },
      create: {
        projectId,
        capitalProfileId: match.capitalProfileId,
        capitalNodeId: match.capitalNodeId,
        score: match.score,
        sectorScore: match.sectorScore,
        stageScore: match.stageScore,
        ticketScore: match.ticketScore,
        jurisdictionScore: match.jurisdictionScore,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      update: {
        score: match.score,
        sectorScore: match.sectorScore,
        stageScore: match.stageScore,
        ticketScore: match.ticketScore,
        jurisdictionScore: match.jurisdictionScore,
      },
    });

    await eventBus.emit<MatchGeneratedEvent>(Events.MATCH_GENERATED, {
      matchId: upserted.id,
      projectId,
      capitalNodeId: match.capitalNodeId,
      score: match.score,
    }, { actorId });

    created.push(match);
  }

  // Move project to IN_DEAL_ROOM if it was CURATED and has matches
  if (created.length > 0 && project.status === "CURATED") {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "IN_DEAL_ROOM" },
    }).catch(() => {});
  }

  return created;
}

/**
 * Regenerate matches for a specific capital profile (e.g. after profile update).
 */
export async function regenerateMatchesForCapital(
  capitalProfileId: string,
  actorId?: string,
  weights?: MatchWeights,
): Promise<number> {
  const prisma = getPrisma();

  const capital = await prisma.capitalProfile.findUnique({
    where: { id: capitalProfileId },
  });
  if (!capital || !["ACTIVE", "WARM", "QUALIFIED"].includes(capital.status)) return 0;

  const projects = await prisma.project.findMany({
    where: { status: { in: ["SUBMITTED", "SCREENED", "CURATED", "IN_DEAL_ROOM", "ACTIVE"] } },
    select: { id: true, sector: true, stage: true, fundraisingNeed: true, workspaceId: true, nodeId: true },
  });

  let matchCount = 0;

  for (const project of projects) {
    const scored = scoreProjectCapital(project, capital, weights);
    if (!scored || scored.score < MATCH_THRESHOLD) {
      await prisma.match.deleteMany({
        where: { projectId: project.id, capitalProfileId },
      });
      continue;
    }

    const selfDeal = await checkSelfDealing(project.nodeId, scored.capitalNodeId);
    if (selfDeal) {
      await prisma.match.deleteMany({
        where: { projectId: project.id, capitalProfileId },
      });
      continue;
    }

    await prisma.match.upsert({
      where: {
        projectId_capitalProfileId: {
          projectId: project.id,
          capitalProfileId,
        },
      },
      create: {
        projectId: project.id,
        capitalProfileId,
        capitalNodeId: scored.capitalNodeId,
        score: scored.score,
        sectorScore: scored.sectorScore,
        stageScore: scored.stageScore,
        ticketScore: scored.ticketScore,
        jurisdictionScore: scored.jurisdictionScore,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        score: scored.score,
        sectorScore: scored.sectorScore,
        stageScore: scored.stageScore,
        ticketScore: scored.ticketScore,
        jurisdictionScore: scored.jurisdictionScore,
      },
    });

    matchCount++;
  }

  return matchCount;
}

// ─── Match State Transitions ─────────────────────────────────────

const MATCH_TRANSITIONS: Record<string, string[]> = {
  GENERATED: ["INTEREST_EXPRESSED", "DECLINED", "EXPIRED"],
  INTEREST_EXPRESSED: ["CONVERTED_TO_DEAL", "DECLINED", "EXPIRED"],
  DECLINED: [],
  CONVERTED_TO_DEAL: [],
  EXPIRED: [],
};

export function canTransitionMatch(from: string, to: string): boolean {
  return (MATCH_TRANSITIONS[from] ?? []).includes(to);
}

export async function expressInterest(matchId: string, actorId: string) {
  const prisma = getPrisma();
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return null;
  if (!canTransitionMatch(match.status, "INTEREST_EXPRESSED")) return null;

  return prisma.match.update({
    where: { id: matchId },
    data: { status: "INTEREST_EXPRESSED", interestAt: new Date() },
  });
}

export async function declineMatch(matchId: string, actorId: string) {
  const prisma = getPrisma();
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return null;
  if (!canTransitionMatch(match.status, "DECLINED")) return null;

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { status: "DECLINED", declinedAt: new Date() },
  });

  await eventBus.emit<MatchDeclinedEvent>(Events.MATCH_DECLINED, {
    matchId,
    projectId: match.projectId,
    capitalProfileId: match.capitalProfileId,
    declinedBy: actorId,
  }, { actorId });

  return updated;
}

export async function convertMatchToDeal(matchId: string, dealId: string, actorId: string) {
  const prisma = getPrisma();
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return null;
  if (!canTransitionMatch(match.status, "CONVERTED_TO_DEAL")) return null;

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { status: "CONVERTED_TO_DEAL", convertedDealId: dealId },
  });

  await eventBus.emit<MatchConvertedEvent>(Events.MATCH_CONVERTED, {
    matchId,
    projectId: match.projectId,
    capitalProfileId: match.capitalProfileId,
    dealId,
  }, { actorId });

  return updated;
}

// ─── Match Queries ───────────────────────────────────────────────

export interface ListMatchesParams {
  projectId?: string;
  capitalProfileId?: string;
  capitalNodeId?: string;
  status?: MatchStatus;
  minScore?: number;
  page?: number;
  pageSize?: number;
}

export async function listMatches(params: ListMatchesParams) {
  const prisma = getPrisma();
  const page = params.page ?? 1;
  const pageSize = Math.min(params.pageSize ?? 50, 100);
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (params.projectId) where.projectId = params.projectId;
  if (params.capitalProfileId) where.capitalProfileId = params.capitalProfileId;
  if (params.capitalNodeId) where.capitalNodeId = params.capitalNodeId;
  if (params.status) where.status = params.status;
  if (params.minScore != null) where.score = { gte: params.minScore };

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where,
      orderBy: { score: "desc" },
      skip,
      take: pageSize,
      include: {
        project: { select: { id: true, name: true, sector: true, stage: true, status: true } },
        capitalProfile: { select: { id: true, name: true, status: true, investmentFocus: true } },
      },
    }),
    prisma.match.count({ where }),
  ]);

  return { matches, total, page, pageSize, hasMore: skip + matches.length < total };
}

export async function getMatch(id: string) {
  const prisma = getPrisma();
  return prisma.match.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, sector: true, stage: true, status: true, fundraisingNeed: true } },
      capitalProfile: {
        select: {
          id: true, name: true, status: true, investmentFocus: true,
          ticketMin: true, ticketMax: true, jurisdictionLimit: true,
        },
      },
    },
  });
}
