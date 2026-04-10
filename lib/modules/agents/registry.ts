/**
 * @wcn/agents — Agent Type Registry
 *
 * Register new agent types without modifying the executor.
 * Each agent type defines its permission level, required context, and output schema.
 */

import { createRegistry } from "@/lib/core/registry";

export type AgentPermissionLevel = "READ" | "ANALYZE" | "SUGGEST" | "ACT";

export interface AgentTypeConfig {
  label: string;
  description: string;
  permissionLevel: AgentPermissionLevel;
  requiredContext: string[];
  outputType: string;
  chainTo?: string[];
}

export const agentTypeRegistry = createRegistry<AgentTypeConfig>("AgentType");

agentTypeRegistry.register("RESEARCH", {
  label: "Research Agent",
  description: "Project analysis, market research, competitor reports",
  permissionLevel: "ANALYZE",
  requiredContext: ["project"],
  outputType: "REPORT",
  chainTo: ["DEAL"],
});

agentTypeRegistry.register("DEAL", {
  label: "Deal Agent",
  description: "Match optimization, match memos, due diligence assists",
  permissionLevel: "ANALYZE",
  requiredContext: ["match"],
  outputType: "MATCH_MEMO",
});

agentTypeRegistry.register("EXECUTION", {
  label: "Execution Agent",
  description: "Meeting notes, action items, follow-up tracking",
  permissionLevel: "SUGGEST",
  requiredContext: ["deal", "transcript"],
  outputType: "MEETING_NOTES",
});

agentTypeRegistry.register("GROWTH", {
  label: "Growth Agent",
  description: "Content generation, distribution planning, attribution",
  permissionLevel: "SUGGEST",
  requiredContext: ["project"],
  outputType: "CONTENT_DRAFT",
});
