/**
 * @wcn/deals — Domain Service
 *
 * All deal business logic lives here. API routes call these functions;
 * they never contain business logic themselves.
 */

import { getPrisma } from "@/lib/prisma";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { DealMachine, TransitionError } from "@/lib/core/state-machine";
import type { DealStage } from "@prisma/client";
import type { DealCreatedEvent, DealStageChangedEvent, DealClosedEvent } from "@/lib/core/event-types";

const DEAL_INCLUDE = {
  project: { select: { id: true, name: true } },
  capital: { select: { id: true, name: true } },
  leadNode: { select: { id: true, name: true } },
  _count: { select: { participants: true, milestones: true, notes: true, tasks: true } },
} as const;

const DEAL_DETAIL_INCLUDE = {
  project: { select: { id: true, name: true, status: true, sector: true } },
  capital: { select: { id: true, name: true, status: true } },
  leadNode: { select: { id: true, name: true } },
  participants: { include: { node: { select: { id: true, name: true } } }, orderBy: { joinedAt: "asc" as const } },
  milestones: { orderBy: { createdAt: "asc" as const } },
  notes: { orderBy: { createdAt: "desc" as const }, take: 50 },
  tasks: { select: { id: true, title: true, status: true, type: true }, orderBy: { createdAt: "desc" as const }, take: 30 },
  evidence: { select: { id: true, title: true, type: true, reviewStatus: true }, take: 20 },
  pobRecords: { select: { id: true, businessType: true, status: true, score: true }, take: 10 },
  _count: { select: { participants: true, milestones: true, notes: true, tasks: true, evidence: true } },
} as const;

// ─── List Deals ─────────────────────────────────────────────────

export interface ListDealsParams {
  stage?: string;
  isAdmin: boolean;
  userId: string;
}

export async function listDeals(params: ListDealsParams) {
  const prisma = getPrisma();
  const where: Record<string, unknown> = {};

  if (params.stage) where.stage = params.stage;

  if (!params.isAdmin) {
    const ownedNodes = await prisma.node.findMany({
      where: { ownerUserId: params.userId },
      select: { id: true },
    });
    const nodeIds = ownedNodes.map((n) => n.id);
    where.OR = [
      { leadNodeId: { in: nodeIds } },
      { participants: { some: { nodeId: { in: nodeIds } } } },
    ];
  }

  return prisma.deal.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: DEAL_INCLUDE,
  });
}

// ─── Get Deal ───────────────────────────────────────────────────

export async function getDeal(id: string) {
  const prisma = getPrisma();
  return prisma.deal.findUnique({
    where: { id },
    include: DEAL_DETAIL_INCLUDE,
  });
}

// ─── Create Deal ────────────────────────────────────────────────

export interface CreateDealInput {
  title: string;
  leadNodeId: string;
  description?: string | null;
  projectId?: string | null;
  capitalId?: string | null;
  nextAction?: string | null;
  confidentialityLevel?: string;
}

export async function createDeal(input: CreateDealInput, actorId: string) {
  const prisma = getPrisma();

  const deal = await prisma.deal.create({
    data: {
      title: input.title,
      leadNodeId: input.leadNodeId,
      description: input.description ?? null,
      projectId: input.projectId ?? null,
      capitalId: input.capitalId ?? null,
      nextAction: input.nextAction ?? null,
      confidentialityLevel: (input.confidentialityLevel as "DEAL_ROOM") ?? "DEAL_ROOM",
    },
    include: {
      project: { select: { id: true, name: true } },
      leadNode: { select: { id: true, name: true } },
    },
  });

  await eventBus.emit<DealCreatedEvent>(Events.DEAL_CREATED, {
    dealId: deal.id,
    projectId: deal.projectId ?? undefined,
    leadNodeId: deal.leadNodeId,
    title: deal.title,
  }, { actorId });

  return deal;
}

// ─── Update Deal (including stage transitions) ──────────────────

export interface UpdateDealInput {
  title?: string;
  description?: string | null;
  stage?: string;
  nextAction?: string | null;
  nextActionDueAt?: string | null;
  riskTags?: string[];
  confidentialityLevel?: string;
}

export async function updateDeal(id: string, input: UpdateDealInput, actorId: string) {
  const prisma = getPrisma();

  const existing = await prisma.deal.findUnique({ where: { id }, select: { id: true, stage: true, projectId: true } });
  if (!existing) return null;

  const data: Record<string, unknown> = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.nextAction !== undefined) data.nextAction = input.nextAction;
  if (input.nextActionDueAt !== undefined) {
    data.nextActionDueAt = input.nextActionDueAt ? new Date(input.nextActionDueAt) : null;
  }
  if (input.riskTags !== undefined) data.riskTags = input.riskTags;
  if (input.confidentialityLevel !== undefined) data.confidentialityLevel = input.confidentialityLevel;

  if (input.stage !== undefined) {
    const newStage = input.stage as DealStage;
    if (!DealMachine.canTransition(existing.stage, newStage)) {
      throw new TransitionError("Deal", existing.stage, newStage, DealMachine.validNext(existing.stage));
    }
    data.stage = newStage;
    if (newStage === "FUNDED" || newStage === "PASSED") {
      data.closedAt = new Date();
    }
  }

  const deal = await prisma.deal.update({ where: { id }, data });

  if (input.stage && input.stage !== existing.stage) {
    await eventBus.emit<DealStageChangedEvent>(Events.DEAL_STAGE_CHANGED, {
      dealId: id,
      oldStage: existing.stage,
      newStage: input.stage,
      changedBy: actorId,
    }, { actorId });

    if (input.stage === "FUNDED" || input.stage === "PASSED") {
      await eventBus.emit<DealClosedEvent>(Events.DEAL_CLOSED, {
        dealId: id,
        outcome: input.stage === "FUNDED" ? "FUNDED" : "PASSED",
        projectId: existing.projectId ?? undefined,
      }, { actorId });
    }
  }

  return deal;
}
