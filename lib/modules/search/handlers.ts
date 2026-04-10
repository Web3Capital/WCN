/**
 * @wcn/search — Event Handlers
 */
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { ProjectCreatedEvent, NodeStatusChangedEvent } from "@/lib/core/event-types";
import { getPrisma } from "@/lib/prisma";

let _initialized = false;

export function initSearchHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  eventBus.on<NodeStatusChangedEvent>(Events.NODE_STATUS_CHANGED, async (payload) => {
    if (payload.newStatus === "OFFBOARDED") {
      const prisma = getPrisma();
      await prisma.searchDocument.deleteMany({
        where: { entityType: "Node", entityId: payload.nodeId },
      }).catch(() => {});
    }
  });

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
}
