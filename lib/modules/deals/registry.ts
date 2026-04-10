/**
 * @wcn/deals — Deal Type Registry
 *
 * Register new deal types for different business workflows.
 */

import { createRegistry } from "@/lib/core/registry";

export interface DealTypeConfig {
  label: string;
  description: string;
  stages: string[];
  requiredRoles: string[];
  requiresEvidence: boolean;
  settlementMethod: string;
}

export const dealTypeRegistry = createRegistry<DealTypeConfig>("DealType");

dealTypeRegistry.register("FUNDRAISE", {
  label: "Fundraising Deal",
  description: "Project raising capital from investors",
  stages: [
    "DRAFT",
    "ACTIVE",
    "DUE_DILIGENCE",
    "NEGOTIATION",
    "CLOSING",
    "FUNDED",
    "PASSED",
    "CANCELLED",
  ],
  requiredRoles: ["LEAD", "INVESTOR"],
  requiresEvidence: true,
  settlementMethod: "PROPORTIONAL",
});

dealTypeRegistry.register("SERVICE", {
  label: "Service Engagement",
  description: "Project engaging a service provider",
  stages: [
    "DRAFT",
    "ACTIVE",
    "SCOPING",
    "EXECUTION",
    "COMPLETED",
    "CANCELLED",
  ],
  requiredRoles: ["LEAD", "SERVICE_PROVIDER"],
  requiresEvidence: true,
  settlementMethod: "FIXED_FEE",
});

dealTypeRegistry.register("DISTRIBUTION", {
  label: "Distribution Deal",
  description: "Market entry and distribution coordination",
  stages: [
    "DRAFT",
    "ACTIVE",
    "PLANNING",
    "EXECUTION",
    "COMPLETED",
    "CANCELLED",
  ],
  requiredRoles: ["LEAD", "DISTRIBUTOR"],
  requiresEvidence: true,
  settlementMethod: "PERFORMANCE_BASED",
});
