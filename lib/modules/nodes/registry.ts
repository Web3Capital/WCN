/**
 * @wcn/nodes — Node Type Registry (Phase 2 — not yet wired)
 *
 * Register new node types without modifying core code.
 * Each node type defines its required fields, capabilities, and review flow.
 */

import { createRegistry } from "@/lib/core/registry";

export interface NodeTypeConfig {
  label: string;
  description: string;
  requiredFields: string[];
  capabilities: string[];
  applicationReviewFlow: "STANDARD" | "EXPEDITED" | "COUNCIL_VOTE";
  maxSeats?: number;
  stakingRequired?: boolean;
}

export const nodeTypeRegistry = createRegistry<NodeTypeConfig>("NodeType");

nodeTypeRegistry.register("CAPITAL", {
  label: "Capital Node",
  description: "Investment firms, funds, and angel investors",
  requiredFields: ["investmentFocus", "ticketMin", "ticketMax"],
  capabilities: ["invest", "due_diligence"],
  applicationReviewFlow: "STANDARD",
});

nodeTypeRegistry.register("PROJECT", {
  label: "Project Node",
  description: "Web3 projects seeking funding or services",
  requiredFields: ["sector", "stage", "fundraisingNeed"],
  capabilities: ["fundraise", "list_project"],
  applicationReviewFlow: "STANDARD",
});

nodeTypeRegistry.register("SERVICE", {
  label: "Service Node",
  description: "Legal, accounting, marketing, and technical service providers",
  requiredFields: ["serviceType", "jurisdiction"],
  capabilities: ["provide_service", "task_execution"],
  applicationReviewFlow: "STANDARD",
});

nodeTypeRegistry.register("REGIONAL", {
  label: "Regional Node",
  description: "Geographic coordinators with local market knowledge",
  requiredFields: ["region", "jurisdiction"],
  capabilities: ["regional_coordination", "local_distribution"],
  applicationReviewFlow: "EXPEDITED",
});

nodeTypeRegistry.register("MEDIA_KOL", {
  label: "Media / KOL Node",
  description: "Media outlets and key opinion leaders for distribution",
  requiredFields: ["platform", "audience"],
  capabilities: ["content_creation", "distribution"],
  applicationReviewFlow: "STANDARD",
});
