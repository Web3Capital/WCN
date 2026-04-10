/**
 * @wcn/matching — Event Handlers
 */
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { ProjectStatusChangedEvent, CapitalProfileUpdatedEvent, MatchGeneratedEvent } from "@/lib/core/event-types";
import { createNotification } from "@/lib/notifications";
import { getPrisma } from "@/lib/prisma";
import { generateMatchesForProject, regenerateMatchesForCapital } from "./engine";

let _initialized = false;

export function initMatchingHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  eventBus.on<ProjectStatusChangedEvent>(Events.PROJECT_STATUS_CHANGED, async (payload) => {
    if (["SCREENED", "CURATED"].includes(payload.newStatus)) {
      try {
        await generateMatchesForProject(payload.projectId);
      } catch (e) {
        console.error("[Match] Auto-gen failed for project", payload.projectId, e);
      }
    }
  });

  eventBus.on<CapitalProfileUpdatedEvent>(Events.CAPITAL_PROFILE_UPDATED, async (payload) => {
    try {
      await regenerateMatchesForCapital(payload.capitalProfileId);
    } catch (e) {
      console.error("[Match] Regen failed for capital", payload.capitalProfileId, e);
    }
  });

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
}
