/**
 * @wcn/augmented-node — Augmented Node Resolver
 *
 * White Paper §09: Network Layer
 * "A human or org can bind a group of Agents to form an Augmented Node."
 * The competitive unit is: identity + relations + capabilities + Agent stack.
 */

import { getPrisma } from "@/lib/prisma";
import type { AugmentedNodeView } from "./ports";

// ─── Agent Autonomy Level Labels ───────────────────────────────

const AUTONOMY_LABELS: Record<string, string> = {
  ACTIVE: "L1",
  DISABLED: "L0",
  SUSPENDED: "L0",
  FROZEN: "L0",
};

// ─── Core Resolver ─────────────────────────────────────────────

export async function resolveAugmentedNode(nodeId: string): Promise<AugmentedNodeView | null> {
  const prisma = getPrisma();

  const node = await prisma.node.findUnique({
    where: { id: nodeId },
    select: {
      id: true,
      name: true,
      category: true,
      scope: true,
      type: true,
      status: true,
      allowedServices: true,
      reputationScore: {
        select: { score: true, tier: true },
      },
      ownedAgents: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          permissions: {
            select: { scope: true, canWrite: true },
          },
        },
      },
      territories: {
        where: { status: "ACTIVE" },
        select: { region: true, scope: true, exclusivity: true },
      },
    },
  });

  if (!node) return null;

  // Build agent stack with capabilities
  const agents = node.ownedAgents.map((agent) => ({
    agentId: agent.id,
    name: agent.name,
    type: agent.type,
    status: agent.status,
    capabilities: agent.permissions.map((p) =>
      `${p.scope}:${p.canWrite ? "write" : "read"}`,
    ),
    autonomyLevel: AUTONOMY_LABELS[agent.status] ?? "L0",
  }));

  // Merge node services + agent capabilities
  const nodeCapabilities = new Set<string>(node.allowedServices);
  for (const agent of agents) {
    if (agent.status === "ACTIVE") {
      for (const cap of agent.capabilities) {
        nodeCapabilities.add(`agent:${cap}`);
      }
    }
  }

  // Agent-augmented productivity: count of active agents with write permissions
  const activeWriteAgents = agents.filter(
    (a) => a.status === "ACTIVE" && a.capabilities.some((c) => c.endsWith(":write")),
  ).length;

  return {
    nodeId: node.id,
    category: node.category,
    scope: node.scope ?? node.type,
    name: node.name,
    status: node.status,
    agents,
    capabilities: Array.from(nodeCapabilities),
    reputationScore: node.reputationScore?.score ?? null,
    reputationTier: node.reputationScore?.tier ?? null,
    augmentedProductivity: activeWriteAgents > 0 ? activeWriteAgents : null,
    territories: node.territories.map((t) => ({
      region: t.region,
      scope: t.scope,
      exclusivity: t.exclusivity,
    })),
  };
}

export async function getAugmentedCapabilities(nodeId: string): Promise<string[]> {
  const view = await resolveAugmentedNode(nodeId);
  return view?.capabilities ?? [];
}
