/**
 * @wcn/evidence — Evidence Packet Assembly
 *
 * When a deal closes with outcome FUNDED, this module auto-creates
 * an evidence packet that aggregates all deal artefacts:
 * - Deal milestones
 * - Task evidence
 * - File attachments
 * - On-chain transaction references
 *
 * A completeness checker flags missing required evidence types.
 */

import { getPrisma } from "@/lib/prisma";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

// ─── Required Evidence Types for a Complete Packet ──────────────

const REQUIRED_EVIDENCE_TYPES = ["CONTRACT", "TRANSFER"] as const;

export interface CompletenessResult {
  complete: boolean;
  present: string[];
  missing: string[];
  score: number;
}

/**
 * Check whether a deal's evidence packet is complete.
 */
export async function checkCompleteness(dealId: string): Promise<CompletenessResult> {
  const prisma = getPrisma();
  const evidences = await prisma.evidence.findMany({
    where: { dealId, reviewStatus: { not: "REJECTED" } },
    select: { type: true },
  });

  const presentTypes = [...new Set(evidences.map((e) => e.type))];
  const missing = REQUIRED_EVIDENCE_TYPES.filter((t) => !presentTypes.includes(t));

  return {
    complete: missing.length === 0,
    present: presentTypes,
    missing: [...missing],
    score: Math.round((presentTypes.length / Math.max(REQUIRED_EVIDENCE_TYPES.length, 1)) * 100),
  };
}

/**
 * Auto-assemble an evidence packet for a closed deal.
 * Creates a summary Evidence record and links all related artefacts.
 */
export async function assembleEvidencePacket(
  dealId: string,
  projectId?: string,
): Promise<{ packetId: string; itemCount: number; completeness: CompletenessResult }> {
  const prisma = getPrisma();

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      title: true,
      projectId: true,
      leadNodeId: true,
      evidence: { select: { id: true, type: true, title: true } },
      tasks: {
        select: {
          id: true,
          evidences: { select: { id: true, type: true } },
        },
      },
      milestones: { select: { id: true, title: true, doneAt: true } },
    },
  });
  if (!deal) throw new Error(`Deal ${dealId} not found`);

  const pId = projectId ?? deal.projectId ?? undefined;

  const existingPacket = await prisma.evidence.findFirst({
    where: { dealId, title: { startsWith: "[Packet]" } },
  });

  const taskEvidenceIds = deal.tasks.flatMap((t) => t.evidences.map((e) => e.id));
  const allEvidenceIds = [...deal.evidence.map((e) => e.id), ...taskEvidenceIds];
  const completedMilestones = deal.milestones.filter((m) => m.doneAt);

  const summary = [
    `Evidence packet for "${deal.title}"`,
    `Total evidence items: ${allEvidenceIds.length}`,
    `Completed milestones: ${completedMilestones.length}/${deal.milestones.length}`,
    `Evidence IDs: ${allEvidenceIds.join(", ")}`,
  ].join("\n");

  let packetId: string;

  if (existingPacket) {
    await prisma.evidence.update({
      where: { id: existingPacket.id },
      data: { summary, version: { increment: 1 } },
    });
    packetId = existingPacket.id;
  } else {
    const packet = await prisma.evidence.create({
      data: {
        type: "OTHER",
        title: `[Packet] ${deal.title}`,
        summary,
        dealId,
        projectId: pId ?? null,
        nodeId: deal.leadNodeId ?? null,
        reviewStatus: "SUBMITTED",
      },
    });
    packetId = packet.id;
  }

  const completeness = await checkCompleteness(dealId);

  return { packetId, itemCount: allEvidenceIds.length, completeness };
}
