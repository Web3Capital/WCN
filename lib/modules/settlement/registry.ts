/**
 * @wcn/settlement — Settlement Method Registry
 *
 * Register new settlement calculation methods.
 */

import { createRegistry } from "@/lib/core/registry";

export type SettlementCalculator = (params: {
  pool: number;
  nodeScores: Map<string, number>;
  feeBps: number;
}) => Map<string, number>;

export interface SettlementMethodConfig {
  label: string;
  description: string;
  feeBps: number;
}

export const settlementMethodRegistry = createRegistry<
  SettlementMethodConfig,
  SettlementCalculator
>("SettlementMethod");

const proportionalCalculator: SettlementCalculator = ({
  pool,
  nodeScores,
  feeBps,
}) => {
  const fee = (pool * feeBps) / 10000;
  const distributable = pool - fee;
  const totalScore = [...nodeScores.values()].reduce((s, v) => s + v, 0);
  const allocations = new Map<string, number>();

  if (totalScore <= 0) return allocations;

  for (const [nodeId, score] of nodeScores) {
    allocations.set(
      nodeId,
      Math.round((distributable * (score / totalScore)) * 100) / 100,
    );
  }
  return allocations;
};

settlementMethodRegistry.register(
  "PROPORTIONAL",
  {
    label: "Proportional Distribution",
    description: "Distribute pool proportionally to PoB scores",
    feeBps: 500,
  },
  proportionalCalculator,
);

settlementMethodRegistry.register(
  "FIXED_FEE",
  {
    label: "Fixed Fee",
    description: "Fixed fee deducted, remainder to lead node",
    feeBps: 300,
  },
  ({ pool, nodeScores, feeBps }) => {
    const fee = (pool * feeBps) / 10000;
    const allocations = new Map<string, number>();
    const lead = [...nodeScores.keys()][0];
    if (lead) allocations.set(lead, pool - fee);
    return allocations;
  },
);

settlementMethodRegistry.register(
  "PERFORMANCE_BASED",
  {
    label: "Performance-Based",
    description:
      "Allocation based on performance metrics and PoB scores",
    feeBps: 400,
  },
  proportionalCalculator,
);
