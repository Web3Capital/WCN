/**
 * @wcn/nodes — Scorecard Calculation Engine
 *
 * Computes node performance across 5 dimensions (pipeline, closure, evidence,
 * collaboration, risk) and assigns ScorecardAction (UPGRADE/MAINTAIN/WATCHLIST/DOWNGRADE/REMOVE).
 * Integrates with ReputationScore for system-wide reputation tracking.
 */

import { getPrisma } from "@/lib/prisma";
import type { ScorecardAction, ReputationTier } from "@prisma/client";

/**
 * Represents a calculated scorecard snapshot
 */
export interface NodeScorecardResult {
  nodeId: string;
  period: string;
  pipelineScore: number;
  closureScore: number;
  evidenceScore: number;
  collaborationScore: number;
  riskScore: number;
  totalScore: number;
  action: ScorecardAction;
  notes?: string;
}

/**
 * Intermediate calculation result for a dimension
 */
export interface DimensionMetrics {
  score: number;
  total: number;
  approved: number;
  rate: number;
  details?: Record<string, unknown>;
}

// ─── PIPELINE SCORE ─────────────────────────────────────────────────────

/**
 * Calculate pipeline score (0-100) based on count and quality of projects.
 * Weighting: ACTIVE/APPROVED projects score higher than others.
 */
async function calculatePipelineScore(nodeId: string): Promise<DimensionMetrics> {
  const prisma = getPrisma();

  const projects = await prisma.project.findMany({
    where: { nodeId },
    select: { id: true, status: true },
  });

  if (projects.length === 0) {
    return { score: 0, total: 0, approved: 0, rate: 0 };
  }

  const statusWeights: Record<string, number> = {
    ACTIVE: 1.0,
    APPROVED: 0.9,
    IN_DEAL_ROOM: 0.8,
    CURATED: 0.7,
    SCREENED: 0.6,
    SUBMITTED: 0.5,
    DRAFT: 0.3,
    ON_HOLD: 0.2,
    REJECTED: 0.0,
    ARCHIVED: 0.0,
  };

  const totalScore = projects.reduce((sum, p) => {
    const weight = statusWeights[p.status] ?? 0.5;
    return sum + (weight * 100);
  }, 0);

  const averageScore = Math.round(totalScore / projects.length);
  const approved = projects.filter((p) => p.status === "ACTIVE" || p.status === "APPROVED").length;

  return {
    score: Math.min(averageScore, 100),
    total: projects.length,
    approved,
    rate: approved / projects.length,
  };
}

// ─── CLOSURE SCORE ──────────────────────────────────────────────────────

/**
 * Calculate closure score (0-100) based on deals reaching FUNDED/SIGNED stage.
 * Higher closure rate = higher score.
 */
async function calculateClosureScore(nodeId: string): Promise<DimensionMetrics> {
  const prisma = getPrisma();

  // Get deals led by this node
  const allDeals = await prisma.deal.findMany({
    where: { leadNodeId: nodeId },
    select: { id: true, stage: true },
  });

  if (allDeals.length === 0) {
    return { score: 50, total: 0, approved: 0, rate: 0 };
  }

  const closedStages = ["FUNDED", "SIGNED"];
  const closed = allDeals.filter((d) => closedStages.includes(d.stage)).length;
  const closureRate = closed / allDeals.length;
  const score = Math.round(closureRate * 100);

  return {
    score: Math.min(score, 100),
    total: allDeals.length,
    approved: closed,
    rate: closureRate,
  };
}

// ─── EVIDENCE SCORE ─────────────────────────────────────────────────────

/**
 * Calculate evidence score (0-100) based on PoB records with APPROVED status.
 * More approved PoB records = higher score.
 */
async function calculateEvidenceScore(nodeId: string): Promise<DimensionMetrics> {
  const prisma = getPrisma();

  const pobRecords = await prisma.poBRecord.findMany({
    where: { nodeId },
    select: { id: true, status: true },
  });

  if (pobRecords.length === 0) {
    return { score: 0, total: 0, approved: 0, rate: 0 };
  }

  const approved = pobRecords.filter((r) => r.status === "APPROVED").length;
  const approvalRate = approved / pobRecords.length;
  const score = Math.round(approvalRate * 100);

  return {
    score: Math.min(score, 100),
    total: pobRecords.length,
    approved,
    rate: approvalRate,
  };
}

// ─── COLLABORATION SCORE ────────────────────────────────────────────────

/**
 * Calculate collaboration score (0-100) based on task completion rate.
 * Tasks assigned to this node: ACCEPTED/CLOSED count as completed.
 */
async function calculateCollaborationScore(nodeId: string): Promise<DimensionMetrics> {
  const prisma = getPrisma();

  const assignments = await prisma.taskAssignment.findMany({
    where: { nodeId },
    include: { task: { select: { id: true, status: true } } },
  });

  if (assignments.length === 0) {
    return { score: 50, total: 0, approved: 0, rate: 0 };
  }

  const completedStatuses = ["ACCEPTED", "CLOSED"];
  const completed = assignments.filter((a) => completedStatuses.includes(a.task.status)).length;
  const completionRate = completed / assignments.length;
  const score = Math.round(completionRate * 100);

  return {
    score: Math.min(score, 100),
    total: assignments.length,
    approved: completed,
    rate: completionRate,
  };
}

// ─── RISK SCORE ─────────────────────────────────────────────────────────

/**
 * Calculate risk score (0-100).
 * Starts at 100, deducted for each penalty:
 * - FREEZE: -20
 * - SLASH: -30
 * - DOWNGRADE: -15
 */
async function calculateRiskScore(nodeId: string): Promise<DimensionMetrics> {
  const prisma = getPrisma();

  const penalties = await prisma.penalty.findMany({
    where: { nodeId },
    select: { id: true, type: true },
  });

  let score = 100;

  for (const penalty of penalties) {
    const deductions: Record<string, number> = {
      FREEZE: -20,
      SLASH: -30,
      DOWNGRADE: -15,
    };
    score += deductions[penalty.type] ?? 0;
  }

  score = Math.max(score, 0);

  return {
    score: Math.min(score, 100),
    total: penalties.length,
    approved: 0,
    rate: 0,
  };
}

// ─── TOTAL SCORE ────────────────────────────────────────────────────────

/**
 * Calculate weighted total score.
 * Weights: pipeline 20%, closure 25%, evidence 25%, collaboration 15%, risk 15%
 */
function calculateTotalScore(
  pipelineScore: number,
  closureScore: number,
  evidenceScore: number,
  collaborationScore: number,
  riskScore: number,
): number {
  const weights = {
    pipeline: 0.2,
    closure: 0.25,
    evidence: 0.25,
    collaboration: 0.15,
    risk: 0.15,
  };

  const totalScore = Math.round(
    pipelineScore * weights.pipeline +
      closureScore * weights.closure +
      evidenceScore * weights.evidence +
      collaborationScore * weights.collaboration +
      riskScore * weights.risk,
  );

  return Math.min(Math.max(totalScore, 0), 100);
}

// ─── ACTION DETERMINATION ───────────────────────────────────────────────

/**
 * Determine scorecard action based on total score.
 * >= 80: UPGRADE
 * >= 60: MAINTAIN
 * >= 40: WATCHLIST
 * >= 20: DOWNGRADE
 * < 20: REMOVE
 */
export function determineAction(totalScore: number, _previousAction?: string): ScorecardAction {
  if (totalScore >= 80) return "UPGRADE";
  if (totalScore >= 60) return "MAINTAIN";
  if (totalScore >= 40) return "WATCHLIST";
  if (totalScore >= 20) return "DOWNGRADE";
  return "REMOVE";
}

// ─── REPUTATION TIER DETERMINATION ──────────────────────────────────────

/**
 * Map total score to reputation tier.
 */
function determineReputationTier(totalScore: number): ReputationTier {
  if (totalScore >= 90) return "DIAMOND";
  if (totalScore >= 75) return "PLATINUM";
  if (totalScore >= 60) return "GOLD";
  if (totalScore >= 45) return "SILVER";
  return "BRONZE";
}

// ─── MAIN CALCULATION ───────────────────────────────────────────────────

/**
 * Calculate node scorecard across all 5 dimensions.
 * Does not persist; use upsertScorecard() to save.
 */
export async function calculateNodeScorecard(
  nodeId: string,
  period: string,
): Promise<NodeScorecardResult> {
  const [pipelineMetrics, closureMetrics, evidenceMetrics, collaborationMetrics, riskMetrics] =
    await Promise.all([
      calculatePipelineScore(nodeId),
      calculateClosureScore(nodeId),
      calculateEvidenceScore(nodeId),
      calculateCollaborationScore(nodeId),
      calculateRiskScore(nodeId),
    ]);

  const totalScore = calculateTotalScore(
    pipelineMetrics.score,
    closureMetrics.score,
    evidenceMetrics.score,
    collaborationMetrics.score,
    riskMetrics.score,
  );

  const action = determineAction(totalScore);

  return {
    nodeId,
    period,
    pipelineScore: pipelineMetrics.score,
    closureScore: closureMetrics.score,
    evidenceScore: evidenceMetrics.score,
    collaborationScore: collaborationMetrics.score,
    riskScore: riskMetrics.score,
    totalScore,
    action,
  };
}

// ─── PERSISTENCE ────────────────────────────────────────────────────────

/**
 * Calculate and upsert (create or update) the scorecard for a node in a given period.
 * Also updates the ReputationScore aggregate for the node.
 */
export async function upsertScorecard(
  nodeId: string,
  period: string,
  reviewerId?: string,
  notes?: string,
): Promise<NodeScorecardResult> {
  const prisma = getPrisma();

  // Calculate the scorecard
  const scorecard = await calculateNodeScorecard(nodeId, period);

  // Upsert the scorecard record
  await prisma.nodeScorecard.upsert({
    where: { nodeId_period: { nodeId, period } },
    update: {
      pipelineScore: scorecard.pipelineScore,
      closureScore: scorecard.closureScore,
      evidenceScore: scorecard.evidenceScore,
      collaborationScore: scorecard.collaborationScore,
      riskScore: scorecard.riskScore,
      totalScore: scorecard.totalScore,
      action: scorecard.action,
      notes: notes ?? null,
      reviewerId: reviewerId ?? null,
    },
    create: {
      nodeId,
      period,
      pipelineScore: scorecard.pipelineScore,
      closureScore: scorecard.closureScore,
      evidenceScore: scorecard.evidenceScore,
      collaborationScore: scorecard.collaborationScore,
      riskScore: scorecard.riskScore,
      totalScore: scorecard.totalScore,
      action: scorecard.action,
      notes: notes ?? null,
      reviewerId: reviewerId ?? null,
    },
  });

  // Update or create ReputationScore
  const tier = determineReputationTier(scorecard.totalScore);
  await prisma.reputationScore.upsert({
    where: { nodeId },
    update: {
      score: scorecard.totalScore,
      tier,
      components: {
        pipeline: scorecard.pipelineScore,
        closure: scorecard.closureScore,
        evidence: scorecard.evidenceScore,
        collaboration: scorecard.collaborationScore,
        risk: scorecard.riskScore,
      },
      calculatedAt: new Date(),
    },
    create: {
      nodeId,
      score: scorecard.totalScore,
      tier,
      components: {
        pipeline: scorecard.pipelineScore,
        closure: scorecard.closureScore,
        evidence: scorecard.evidenceScore,
        collaboration: scorecard.collaborationScore,
        risk: scorecard.riskScore,
      },
    },
  });

  return scorecard;
}

// ─── RETRIEVAL ───────────────────────────────────────────────────────────

/**
 * Get the most recent scorecard for a node.
 */
export async function getLatestScorecard(nodeId: string) {
  const prisma = getPrisma();

  return prisma.nodeScorecard.findFirst({
    where: { nodeId },
    orderBy: { createdAt: "desc" },
    include: {
      node: { select: { id: true, name: true, status: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Get scorecard history for a node, optionally limited.
 */
export async function getScorecardHistory(nodeId: string, limit: number = 12) {
  const prisma = getPrisma();

  return prisma.nodeScorecard.findMany({
    where: { nodeId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      node: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Get all scorecards for a given action status.
 */
export async function getScorecardsByAction(action: ScorecardAction, limit: number = 100) {
  const prisma = getPrisma();

  return prisma.nodeScorecard.findMany({
    where: { action },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      node: { select: { id: true, name: true, status: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });
}
