/**
 * @wcn/augmented-node — Hexagonal Port Interfaces
 *
 * White Paper §09: Network Layer — Augmented Node concept.
 * "A human or org can bind a group of Agents to form an Augmented Node."
 * The real competitive unit is "identity + relations + capabilities + Agent stack".
 */

export interface AugmentedNodeView {
  nodeId: string;
  category: string;
  scope: string | null;
  name: string;
  status: string;
  /** Bound agent stack */
  agents: Array<{
    agentId: string;
    name: string;
    type: string;
    status: string;
    capabilities: string[];
    autonomyLevel: string;
  }>;
  /** Merged capabilities from node + agent tools */
  capabilities: string[];
  /** Node reputation score */
  reputationScore: number | null;
  reputationTier: string | null;
  /** Agent-augmented productivity metric */
  augmentedProductivity: number | null;
  /** Territory claims */
  territories: Array<{
    region: string;
    scope: string;
    exclusivity: string;
  }>;
}

export interface AugmentedNodePort {
  resolveAugmentedNode(nodeId: string): Promise<AugmentedNodeView | null>;
  getAugmentedCapabilities(nodeId: string): Promise<string[]>;
}
