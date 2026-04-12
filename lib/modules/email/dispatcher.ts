/**
 * @wcn/email — Event-Driven Email Dispatcher
 *
 * Listens to domain events and dispatches templated emails.
 * Called once during event handler init.
 */

import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type {
  DealStageChangedEvent,
  MatchGeneratedEvent,
  SettlementDistributedEvent,
  ApplicationSubmittedEvent,
  EvidenceApprovedEvent,
  PoBCreatedEvent,
  RiskAlertCreatedEvent,
} from "@/lib/core/event-types";
import { getPrisma } from "@/lib/prisma";
import { sendEmail } from "./client";
import * as templates from "./templates";

export function initEmailHandlers(): void {
  // ─── Match Generated → Email capital node owner ──────────
  eventBus.on<MatchGeneratedEvent>(Events.MATCH_GENERATED, async (payload) => {
    const prisma = getPrisma();
    const node = await prisma.node.findUnique({
      where: { id: payload.capitalNodeId },
      include: { owner: { select: { email: true, name: true } } },
    });
    if (!node?.owner?.email) return;

    const project = await prisma.project.findUnique({
      where: { id: payload.projectId },
      select: { name: true },
    });

    const email = templates.newMatchEmail(
      node.owner.name ?? "Node Operator",
      project?.name ?? "Unknown Project",
      payload.score,
      payload.matchId,
    );
    await sendEmail({ to: node.owner.email, ...email });
  });

  // ─── Deal Stage Changed → Email participants ─────────────
  eventBus.on<DealStageChangedEvent>(Events.DEAL_STAGE_CHANGED, async (payload) => {
    const prisma = getPrisma();
    const deal = await prisma.deal.findUnique({
      where: { id: payload.dealId },
      select: {
        title: true,
        participants: {
          select: { node: { select: { owner: { select: { email: true, name: true } } } } },
        },
      },
    });
    if (!deal) return;

    const recipients = deal.participants
      .map((p) => p.node?.owner)
      .filter((u): u is { email: string | null; name: string | null } => !!u?.email);

    for (const user of recipients) {
      if (!user.email) continue;
      const email = templates.dealStageEmail(
        user.name ?? "Participant",
        deal.title,
        payload.newStage,
        payload.dealId,
      );
      await sendEmail({ to: user.email, ...email });
    }
  });

  // ─── Settlement Distributed → Email node owners ──────────
  eventBus.on<SettlementDistributedEvent>(Events.SETTLEMENT_DISTRIBUTED, async (payload) => {
    const prisma = getPrisma();
    const lines = await prisma.settlementLine.findMany({
      where: { cycleId: payload.cycleId },
      include: { node: { select: { owner: { select: { email: true, name: true } } } } },
    });

    for (const line of lines) {
      const user = line.node?.owner;
      if (!user?.email) continue;
      const email = templates.settlementEmail(
        user.name ?? "Node Operator",
        line.allocation,
        payload.cycleId,
      );
      await sendEmail({ to: user.email, ...email });
    }
  });

  // ─── Application Submitted → Email admins ────────────────
  eventBus.on<ApplicationSubmittedEvent>(Events.APPLICATION_SUBMITTED, async (payload) => {
    const prisma = getPrisma();
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "FOUNDER"] } },
      select: { email: true },
    });

    const emails = admins.map((a) => a.email).filter((e): e is string => !!e);
    if (emails.length === 0) return;

    const template = templates.applicationSubmittedEmail(
      payload.applicantName,
      payload.applicationId,
    );
    await sendEmail({ to: emails, ...template });
  });

  // ─── Evidence Approved → Email deal lead ─────────────────
  eventBus.on<EvidenceApprovedEvent>(Events.EVIDENCE_APPROVED, async (payload) => {
    if (!payload.dealId) return;
    const prisma = getPrisma();
    const deal = await prisma.deal.findUnique({
      where: { id: payload.dealId },
      select: { leadNode: { select: { owner: { select: { email: true, name: true } } } } },
    });
    if (!deal?.leadNode?.owner?.email) return;

    const template = templates.evidenceApprovedEmail(
      deal.leadNode.owner.name ?? "Node Operator",
      payload.evidenceId,
      payload.dealId,
    );
    await sendEmail({ to: deal.leadNode.owner.email, ...template });
  });

  // ─── PoB Created → Email attributed nodes ────────────────
  eventBus.on<PoBCreatedEvent>(Events.POB_CREATED, async (payload) => {
    const prisma = getPrisma();
    for (const attr of payload.attributions) {
      const node = await prisma.node.findUnique({
        where: { id: attr.nodeId },
        include: { owner: { select: { email: true, name: true } } },
      });
      if (!node?.owner?.email) continue;

      const template = templates.pobCreatedEmail(
        node.owner.name ?? "Node Operator",
        payload.pobId,
        attr.percentage,
      );
      await sendEmail({ to: node.owner.email, ...template });
    }
  });

  // ─── Risk Alert → Email admins ───────────────────────────
  eventBus.on<RiskAlertCreatedEvent>(Events.RISK_ALERT_CREATED, async (payload) => {
    const prisma = getPrisma();
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "FOUNDER"] } },
      select: { email: true },
    });

    const emails = admins.map((a) => a.email).filter((e): e is string => !!e);
    if (emails.length === 0) return;

    const template = templates.riskAlertEmail(
      payload.severity,
      payload.entityType,
      payload.entityId,
      payload.reason ?? "No reason provided",
    );
    await sendEmail({ to: emails, ...template });
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[WCN] Email handlers initialized");
  }
}
