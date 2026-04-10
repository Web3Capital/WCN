/**
 * Central Event Handler Registration
 *
 * This file wires up cross-module event reactions.
 * Import this once at app startup (e.g., in lib/core/init.ts).
 *
 * Each handler is idempotent — safe to receive the same event twice.
 */

import { eventBus } from "./event-bus";
import { Events } from "./event-types";
import type {
  DealCreatedEvent,
  DealStageChangedEvent,
  DealClosedEvent,
  ProjectCreatedEvent,
  ProjectStatusChangedEvent,
  CapitalProfileUpdatedEvent,
  MatchGeneratedEvent,
  TaskCompletedEvent,
  EvidenceApprovedEvent,
  PoBCreatedEvent,
  PoBDisputeRaisedEvent,
  SettlementDistributedEvent,
  NodeStatusChangedEvent,
  ApplicationSubmittedEvent,
  UserLoginFailedEvent,
  RiskAlertCreatedEvent,
  EntityFrozenEvent,
  ApprovalRequestedEvent,
  ApprovalGrantedEvent,
  AgentOutputGeneratedEvent,
} from "./event-types";
import { writeAudit } from "@/lib/audit";
import { createNotification, notifyMany } from "@/lib/notifications";
import { getPrisma } from "@/lib/prisma";
import { generateMatchesForProject, regenerateMatchesForCapital } from "@/lib/modules/matching/engine";
import { assembleEvidencePacket } from "@/lib/modules/evidence/assembly";
import { calculateAttribution } from "@/lib/modules/pob/attribution";
import { calculateSettlementForCycle } from "@/lib/modules/settlement/calculator";
import { assessPoBRisk } from "@/lib/modules/risk/anti-gaming";

let _initialized = false;

/**
 * Register all cross-module event handlers.
 * Call once at startup. Subsequent calls are no-ops.
 */
export function initEventHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  // ─── Universal Audit Listener ───────────────────────────────
  eventBus.onAny(async (payload, meta) => {
    try {
      await writeAudit({
        actorUserId: meta.actorId ?? null,
        action: meta.eventName,
        targetType: (payload as Record<string, unknown>).entityType as string ?? "SYSTEM",
        targetId: (payload as Record<string, unknown>).entityId as string
          ?? (payload as Record<string, unknown>).dealId as string
          ?? (payload as Record<string, unknown>).nodeId as string
          ?? (payload as Record<string, unknown>).projectId as string
          ?? (payload as Record<string, unknown>).taskId as string
          ?? (payload as Record<string, unknown>).pobId as string
          ?? "unknown",
        metadata: { ...payload as Record<string, unknown>, _eventId: meta.eventId },
        requestId: meta.requestId,
      });
    } catch {
      console.error(`[Audit] Failed to log event ${meta.eventName}`);
    }
  });

  // ─── Deal Created → Notify lead node ────────────────────────
  eventBus.on<DealCreatedEvent>(Events.DEAL_CREATED, async (payload) => {
    const prisma = getPrisma();
    const node = await prisma.node.findUnique({
      where: { id: payload.leadNodeId },
      select: { ownerUserId: true },
    });
    if (node?.ownerUserId) {
      await createNotification({
        userId: node.ownerUserId,
        type: "DEAL_STAGE_CHANGE",
        title: `New deal created: ${payload.title}`,
        entityType: "Deal",
        entityId: payload.dealId,
      });
    }
  });

  // ─── Deal Stage Changed → Notify participants ──────────────
  eventBus.on<DealStageChangedEvent>(Events.DEAL_STAGE_CHANGED, async (payload) => {
    const prisma = getPrisma();
    const participants = await prisma.dealParticipant.findMany({
      where: { dealId: payload.dealId },
      select: { node: { select: { ownerUserId: true } } },
    });
    const userIds = participants
      .map((p) => p.node?.ownerUserId)
      .filter((id): id is string => !!id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "DEAL_STAGE_CHANGE",
        title: `Deal moved to ${payload.newStage}`,
        entityType: "Deal",
        entityId: payload.dealId,
      });
    }
  });

  // ─── Deal Closed → Create evidence packet stub ─────────────
  eventBus.on<DealClosedEvent>(Events.DEAL_CLOSED, async (payload) => {
    if (payload.outcome !== "FUNDED") return;
    const prisma = getPrisma();
    const existing = await prisma.evidence.findFirst({
      where: { dealId: payload.dealId, title: "Deal Close Evidence" },
    });
    if (!existing) {
      await prisma.evidence.create({
        data: {
          type: "OTHER",
          title: "Deal Close Evidence",
          summary: `Auto-created evidence packet for deal ${payload.dealId}`,
          dealId: payload.dealId,
          projectId: payload.projectId ?? null,
          reviewStatus: "DRAFT",
        },
      });
    }
  });

  // ─── Deal Closed → Update project status ───────────────────
  eventBus.on<DealClosedEvent>(Events.DEAL_CLOSED, async (payload) => {
    if (!payload.projectId || payload.outcome !== "FUNDED") return;
    const prisma = getPrisma();
    await prisma.project.update({
      where: { id: payload.projectId },
      data: { status: "ARCHIVED" },
    }).catch(() => {});
  });

  // ─── Task Completed → Notification ─────────────────────────
  eventBus.on<TaskCompletedEvent>(Events.TASK_COMPLETED, async (payload) => {
    if (!payload.dealId) return;
    const prisma = getPrisma();
    const deal = await prisma.deal.findUnique({
      where: { id: payload.dealId },
      select: { leadNode: { select: { ownerUserId: true } } },
    });
    if (deal?.leadNode?.ownerUserId) {
      await createNotification({
        userId: deal.leadNode.ownerUserId,
        type: "TASK_ASSIGNED",
        title: "Task completed in your deal",
        entityType: "Task",
        entityId: payload.taskId,
      });
    }
  });

  // ─── Evidence Approved → Notification ──────────────────────
  eventBus.on<EvidenceApprovedEvent>(Events.EVIDENCE_APPROVED, async (payload) => {
    if (!payload.dealId) return;
    const prisma = getPrisma();
    const deal = await prisma.deal.findUnique({
      where: { id: payload.dealId },
      select: { leadNode: { select: { ownerUserId: true } } },
    });
    if (deal?.leadNode?.ownerUserId) {
      await createNotification({
        userId: deal.leadNode.ownerUserId,
        type: "EVIDENCE_SUBMITTED",
        title: "Evidence approved — PoB pending",
        entityType: "Evidence",
        entityId: payload.evidenceId,
      });
    }
  });

  // ─── PoB Created → Anti-gaming scan ─────────────────────
  eventBus.on<PoBCreatedEvent>(Events.POB_CREATED, async (payload) => {
    if (!payload.dealId || !payload.nodeId) return;
    try {
      const risk = await assessPoBRisk(payload.dealId, payload.nodeId);
      if (risk.flags.length > 0) {
        const prisma = getPrisma();
        await prisma.riskFlag.create({
          data: {
            entityType: "PoB",
            entityId: payload.pobId,
            severity: risk.level,
            reason: risk.flags.map((f) => `[${f.rule}] ${f.message}`).join("; "),
          },
        }).catch(() => {});
      }
    } catch (e) {
      console.error("[AntiGaming] PoB scan failed", payload.pobId, e);
    }
  });

  // ─── PoB Created → Notify attributed nodes ────────────────
  eventBus.on<PoBCreatedEvent>(Events.POB_CREATED, async (payload) => {
    const prisma = getPrisma();
    const nodeIds = payload.attributions.map((a) => a.nodeId);
    if (!nodeIds.length) return;
    const nodes = await prisma.node.findMany({
      where: { id: { in: nodeIds } },
      select: { ownerUserId: true },
    });
    const userIds = nodes
      .map((n) => n.ownerUserId)
      .filter((id): id is string => !!id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "GENERAL",
        title: "New PoB record — you have attribution",
        entityType: "PoB",
        entityId: payload.pobId,
      });
    }
  });

  // ─── Settlement Distributed → Notify all nodes ────────────
  eventBus.on<SettlementDistributedEvent>(Events.SETTLEMENT_DISTRIBUTED, async (payload) => {
    const prisma = getPrisma();
    const lines = await prisma.settlementLine.findMany({
      where: { cycleId: payload.cycleId },
      select: { nodeId: true },
      distinct: ["nodeId"],
    });
    const nodeIds = lines.map((l) => l.nodeId);
    if (!nodeIds.length) return;
    const nodes = await prisma.node.findMany({
      where: { id: { in: nodeIds } },
      select: { ownerUserId: true },
    });
    const userIds = nodes
      .map((n) => n.ownerUserId)
      .filter((id): id is string => !!id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "SETTLEMENT_CLOSING",
        title: "Settlement distributed — check your balance",
        entityType: "Settlement",
        entityId: payload.cycleId,
      });
    }
  });

  // ─── Application Submitted → Notify admins ────────────────
  eventBus.on<ApplicationSubmittedEvent>(Events.APPLICATION_SUBMITTED, async (payload) => {
    const prisma = getPrisma();
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "FOUNDER"] } },
      select: { id: true },
    });
    const userIds = admins.map((a) => a.id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "GENERAL",
        title: `New node application: ${payload.applicantName}`,
        entityType: "Application",
        entityId: payload.applicationId,
      });
    }
  });

  // ─── Login Failed → Risk flag if excessive ────────────────
  eventBus.on<UserLoginFailedEvent>(Events.USER_LOGIN_FAILED, async (payload) => {
    if (payload.attemptCount >= 5) {
      const prisma = getPrisma();
      await prisma.riskFlag.create({
        data: {
          entityType: "User",
          entityId: payload.email,
          severity: payload.attemptCount >= 10 ? "HIGH" : "MEDIUM",
          reason: `Excessive login failures: ${payload.attemptCount} attempts (IP: ${payload.ip ?? "unknown"})`,
        },
      }).catch(() => {});
    }
  });

  // ─── Node Status Changed → Update search index ────────────
  eventBus.on<NodeStatusChangedEvent>(Events.NODE_STATUS_CHANGED, async (payload) => {
    if (payload.newStatus === "OFFBOARDED") {
      const prisma = getPrisma();
      await prisma.searchDocument.deleteMany({
        where: { entityType: "Node", entityId: payload.nodeId },
      }).catch(() => {});
    }
  });

  // ─── Project Created → Index for search ────────────────────
  eventBus.on<ProjectCreatedEvent>(Events.PROJECT_CREATED, async (payload) => {
    const prisma = getPrisma();
    const defaultWs = await prisma.workspace.findFirst({ select: { id: true } });
    if (!defaultWs) return;
    await prisma.searchDocument.upsert({
      where: {
        workspaceId_entityType_entityId: {
          workspaceId: defaultWs.id,
          entityType: "Project",
          entityId: payload.projectId,
        },
      },
      create: {
        workspaceId: defaultWs.id,
        entityType: "Project",
        entityId: payload.projectId,
        title: payload.name,
        body: `${payload.sector ?? ""} ${payload.stage ?? ""}`.trim(),
      },
      update: {
        title: payload.name,
        body: `${payload.sector ?? ""} ${payload.stage ?? ""}`.trim(),
      },
    }).catch(() => {});
  });

  // ─── Project Status Changed → Auto-generate matches ─────
  eventBus.on<ProjectStatusChangedEvent>(Events.PROJECT_STATUS_CHANGED, async (payload) => {
    if (["SCREENED", "CURATED"].includes(payload.newStatus)) {
      try {
        await generateMatchesForProject(payload.projectId);
      } catch (e) {
        console.error("[Match] Auto-gen failed for project", payload.projectId, e);
      }
    }
  });

  // ─── Capital Profile Updated → Regenerate matches ──────
  eventBus.on<CapitalProfileUpdatedEvent>(Events.CAPITAL_PROFILE_UPDATED, async (payload) => {
    try {
      await regenerateMatchesForCapital(payload.capitalProfileId);
    } catch (e) {
      console.error("[Match] Regen failed for capital", payload.capitalProfileId, e);
    }
  });

  // ─── Match Generated → Notify capital node ─────────────
  eventBus.on<MatchGeneratedEvent>(Events.MATCH_GENERATED, async (payload) => {
    const prisma = getPrisma();
    const node = await prisma.node.findUnique({
      where: { id: payload.capitalNodeId },
      select: { ownerUserId: true },
    });
    if (node?.ownerUserId) {
      await createNotification({
        userId: node.ownerUserId,
        type: "GENERAL",
        title: `New match found (score: ${payload.score})`,
        entityType: "Match",
        entityId: payload.matchId,
      });
    }
  });

  // ─── Deal Closed → Assemble evidence packet ────────────
  eventBus.on<DealClosedEvent>(Events.DEAL_CLOSED, async (payload) => {
    if (payload.outcome !== "FUNDED") return;
    try {
      await assembleEvidencePacket(payload.dealId, payload.projectId ?? undefined);
    } catch (e) {
      console.error("[Evidence] Assembly failed for deal", payload.dealId, e);
    }
  });

  // ─── Evidence Approved → Auto-calculate PoB attribution ─
  eventBus.on<EvidenceApprovedEvent>(Events.EVIDENCE_APPROVED, async (payload) => {
    if (!payload.dealId) return;
    try {
      await calculateAttribution(payload.dealId);
    } catch (e) {
      console.error("[PoB] Attribution calc failed for deal", payload.dealId, e);
    }
  });

  // ─── Settlement Distributed → Compute line items ───────
  eventBus.on<SettlementDistributedEvent>(Events.SETTLEMENT_DISTRIBUTED, async (payload) => {
    try {
      await calculateSettlementForCycle(payload.cycleId);
    } catch (e) {
      console.error("[Settlement] Calc failed for cycle", payload.cycleId, e);
    }
  });

  // ─── Risk Alert Created → Notify admins ──────────────────
  eventBus.on<RiskAlertCreatedEvent>(Events.RISK_ALERT_CREATED, async (payload) => {
    const prisma = getPrisma();
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "FOUNDER"] } },
      select: { id: true },
    });
    const userIds = admins.map((a) => a.id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "GENERAL",
        title: `Risk alert [${payload.severity}]: ${payload.entityType}/${payload.entityId}`,
        entityType: "RiskFlag",
        entityId: payload.alertId,
      });
    }
  });

  // ─── Entity Frozen → Notify entity owner ──────────────────
  eventBus.on<EntityFrozenEvent>(Events.ENTITY_FROZEN, async (payload) => {
    const prisma = getPrisma();
    if (payload.entityType === "Node") {
      const node = await prisma.node.findUnique({
        where: { id: payload.entityId },
        select: { ownerUserId: true },
      });
      if (node?.ownerUserId) {
        await createNotification({
          userId: node.ownerUserId,
          type: "GENERAL",
          title: `Your node has been frozen: ${payload.reason}`,
          entityType: "Node",
          entityId: payload.entityId,
        });
      }
    }
  });

  // ─── Approval Requested → Notify admin approvers ──────────
  eventBus.on<ApprovalRequestedEvent>(Events.APPROVAL_REQUESTED, async (payload) => {
    const prisma = getPrisma();
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "FOUNDER"] }, id: { not: payload.requestedBy } },
      select: { id: true },
    });
    const userIds = admins.map((a) => a.id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "GENERAL",
        title: `Approval needed: ${payload.action} on ${payload.entityType}`,
        entityType: "Approval",
        entityId: payload.approvalId,
      });
    }
  });

  // ─── Approval Granted → Execute pending action ────────────
  eventBus.on<ApprovalGrantedEvent>(Events.APPROVAL_GRANTED, async (payload) => {
    const prisma = getPrisma();
    const approval = await prisma.approvalAction.findUnique({ where: { id: payload.approvalId } });
    if (!approval) return;

    if (approval.entityType === "SETTLEMENT_CYCLE" && approval.actionType === "LOCK") {
      await prisma.settlementCycle.update({
        where: { id: approval.entityId },
        data: { status: "LOCKED", lockedById: payload.grantedBy },
      }).catch(() => {});
    }

    if (approval.entityType === "SETTLEMENT_CYCLE" && approval.actionType === "REOPEN") {
      await prisma.settlementCycle.update({
        where: { id: approval.entityId },
        data: { status: "REOPENED", reopenedAt: new Date() },
      }).catch(() => {});
    }
  });

  // ─── PoB Dispute Raised → Notify PoB participants + freeze PoB ─
  eventBus.on<PoBDisputeRaisedEvent>(Events.POB_DISPUTE_RAISED, async (payload) => {
    const prisma = getPrisma();
    await prisma.poBRecord.update({
      where: { id: payload.pobId },
      data: { pobEventStatus: "FROZEN", frozenAt: new Date(), frozenReason: `Dispute #${payload.disputeId}` },
    }).catch(() => {});

    const pob = await prisma.poBRecord.findUnique({
      where: { id: payload.pobId },
      select: { nodeId: true, attributions: { select: { nodeId: true } } },
    });
    if (!pob) return;
    const nodeIds = [pob.nodeId, ...pob.attributions.map((a) => a.nodeId)].filter((id): id is string => !!id);
    const uniqueNodeIds = [...new Set(nodeIds)];
    const nodes = await prisma.node.findMany({
      where: { id: { in: uniqueNodeIds } },
      select: { ownerUserId: true },
    });
    const userIds = nodes.map((n) => n.ownerUserId).filter((id): id is string => !!id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "GENERAL",
        title: "PoB dispute raised — record frozen",
        entityType: "Dispute",
        entityId: payload.disputeId,
      });
    }
  });

  // ─── Project Created → Auto-trigger Research Agent ──────────
  eventBus.on<ProjectCreatedEvent>(Events.PROJECT_CREATED, async (payload) => {
    try {
      const prisma = getPrisma();
      const researchAgent = await prisma.agent.findFirst({
        where: { type: "RESEARCH", status: "ACTIVE" },
        select: { id: true },
      });
      if (!researchAgent) return;

      const { runResearchAgent } = await import("@/lib/modules/agents/executor");
      await runResearchAgent(researchAgent.id, payload.projectId, "system:event");
      console.log(`[Agent] Research Agent auto-triggered for project ${payload.projectId}`);
    } catch (e) {
      console.error("[Agent] Research Agent auto-trigger failed:", e);
    }
  });

  // ─── Match Generated → Auto-trigger Deal Agent memo ────────
  eventBus.on<MatchGeneratedEvent>(Events.MATCH_GENERATED, async (payload) => {
    try {
      const prisma = getPrisma();
      const dealAgent = await prisma.agent.findFirst({
        where: { type: "DEAL", status: "ACTIVE" },
        select: { id: true },
      });
      if (!dealAgent) return;

      const { runDealAgent } = await import("@/lib/modules/agents/executor");
      await runDealAgent(dealAgent.id, payload.matchId, "system:event");
      console.log(`[Agent] Deal Agent auto-triggered for match ${payload.matchId}`);
    } catch (e) {
      console.error("[Agent] Deal Agent auto-trigger failed:", e);
    }
  });

  // ─── Agent Output Generated → Notify reviewers ────────────
  eventBus.on<AgentOutputGeneratedEvent>(Events.AGENT_OUTPUT_GENERATED, async (payload) => {
    try {
      const prisma = getPrisma();
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", accountStatus: "ACTIVE" },
        select: { id: true },
        take: 10,
      });
      if (admins.length === 0) return;
      await notifyMany(
        admins.map((a) => a.id),
        {
          type: "GENERAL",
          title: `Agent output ready for review (${payload.outputType})`,
          entityType: "AgentRun",
          entityId: payload.runId,
        },
      );
    } catch (e) {
      console.error("[Agent] Output notification failed:", e);
    }
  });

  console.log("[WCN] Event handlers initialized — " + eventBus.listEvents().length + " event types registered");
}
