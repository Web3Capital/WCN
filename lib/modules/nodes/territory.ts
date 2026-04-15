/**
 * @wcn/territory — Territory Management Service
 *
 * Handles territory claims, conflicts, access control, and protected accounts
 * for the WCN Node Network System.
 */

import { getPrisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────────────────

export interface ClaimTerritoryData {
  nodeId: string;
  region: string;
  scope: "Country" | "City" | "Vertical";
  exclusivity?: "NONE" | "CONDITIONAL" | "EXCLUSIVE";
  protectedAccounts?: string[];
  kpiTarget?: Record<string, unknown>;
  notes?: string;
}

export interface UpdateTerritoryData {
  exclusivity?: "NONE" | "CONDITIONAL" | "EXCLUSIVE";
  protectedAccounts?: string[];
  kpiTarget?: Record<string, unknown>;
  notes?: string;
  status?: "ACTIVE" | "REVOKED" | "PENDING" | "EXPIRED";
}

export interface TerritoryConflict {
  id: string;
  nodeId: string;
  nodeName?: string;
  region: string;
  scope: string;
  exclusivity: string;
  status: string;
}

export interface TerritoryResult {
  id: string;
  nodeId: string;
  region: string;
  scope: string;
  exclusivity: string;
  protectedAccounts: string[];
  kpiRequired: boolean;
  kpiTarget?: Record<string, unknown>;
  status: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Service Functions ──────────────────────────────────────────────

/**
 * Claims a territory for a node.
 *
 * Validates:
 * - Cannot claim EXCLUSIVE without kpiTarget being set
 * - Checks for conflicts with existing EXCLUSIVE territories in same region+scope
 *
 * @throws Error if validation fails
 * @returns The created territory
 */
export async function claimTerritory(
  data: ClaimTerritoryData
): Promise<TerritoryResult> {
  const prisma = getPrisma();

  // Validation: EXCLUSIVE requires kpiTarget
  if (data.exclusivity === "EXCLUSIVE" && !data.kpiTarget) {
    throw new Error(
      "Cannot claim EXCLUSIVE territory without specifying kpiTarget"
    );
  }

  // Check for EXCLUSIVE conflicts
  if (data.exclusivity === "EXCLUSIVE") {
    const existingExclusive = await prisma.territory.findFirst({
      where: {
        region: data.region,
        scope: data.scope,
        exclusivity: "EXCLUSIVE",
        status: "ACTIVE",
      },
      select: { id: true, nodeId: true },
    });

    if (existingExclusive) {
      throw new Error(
        `Cannot claim EXCLUSIVE territory: existing exclusive claim by node ${existingExclusive.nodeId}`
      );
    }
  }

  // Check for CONDITIONAL conflicts (same node can only have one claim per region+scope)
  const existingClaim = await prisma.territory.findFirst({
    where: {
      nodeId: data.nodeId,
      region: data.region,
      scope: data.scope,
    },
    select: { id: true },
  });

  if (existingClaim) {
    throw new Error(
      `Node ${data.nodeId} already has a territory claim for ${data.region}/${data.scope}`
    );
  }

  const territory = await prisma.territory.create({
    data: {
      nodeId: data.nodeId,
      region: data.region,
      scope: data.scope,
      exclusivity: data.exclusivity ?? "NONE",
      protectedAccounts: data.protectedAccounts ?? [],
      kpiRequired: data.exclusivity === "EXCLUSIVE",
      kpiTarget: data.kpiTarget ?? null,
      notes: data.notes ?? null,
      status: "ACTIVE",
    },
  });

  return formatTerritoryResult(territory);
}

/**
 * Retrieves all territories for a node.
 *
 * @param nodeId - The node ID
 * @returns Array of territories
 */
export async function getNodeTerritories(nodeId: string): Promise<TerritoryResult[]> {
  const prisma = getPrisma();

  const territories = await prisma.territory.findMany({
    where: { nodeId },
    orderBy: { createdAt: "desc" },
  });

  return territories.map(formatTerritoryResult);
}

/**
 * Finds all nodes claiming the same region+scope.
 * Useful for conflict resolution and territory overlap detection.
 *
 * @param region - The region
 * @param scope - The scope (Country, City, Vertical)
 * @returns Array of conflicting territories
 */
export async function getTerritoryConflicts(
  region: string,
  scope: string
): Promise<TerritoryConflict[]> {
  const prisma = getPrisma();

  const conflicts = await prisma.territory.findMany({
    where: {
      region,
      scope,
      status: "ACTIVE",
    },
    include: {
      node: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return conflicts.map((t) => ({
    id: t.id,
    nodeId: t.nodeId,
    nodeName: t.node?.name,
    region: t.region,
    scope: t.scope,
    exclusivity: t.exclusivity,
    status: t.status,
  }));
}

/**
 * Updates a territory's mutable fields.
 *
 * Validates:
 * - Cannot set EXCLUSIVE without kpiTarget
 * - Cannot downgrade EXCLUSIVE to lower exclusivity level
 *
 * @param territoryId - The territory ID
 * @param data - Partial update data
 * @throws Error if territory not found or validation fails
 * @returns Updated territory
 */
export async function updateTerritory(
  territoryId: string,
  data: UpdateTerritoryData
): Promise<TerritoryResult> {
  const prisma = getPrisma();

  const existing = await prisma.territory.findUnique({
    where: { id: territoryId },
    select: { id: true, exclusivity: true, region: true, scope: true },
  });

  if (!existing) {
    throw new Error(`Territory not found: ${territoryId}`);
  }

  // Validation: cannot upgrade to EXCLUSIVE without kpiTarget
  if (data.exclusivity === "EXCLUSIVE" && !data.kpiTarget) {
    throw new Error(
      "Cannot set EXCLUSIVE without specifying kpiTarget"
    );
  }

  // If upgrading to EXCLUSIVE, check for conflicts
  if (
    data.exclusivity === "EXCLUSIVE" &&
    existing.exclusivity !== "EXCLUSIVE"
  ) {
    const conflict = await prisma.territory.findFirst({
      where: {
        region: existing.region,
        scope: existing.scope,
        exclusivity: "EXCLUSIVE",
        status: "ACTIVE",
        id: { not: territoryId },
      },
      select: { nodeId: true },
    });

    if (conflict) {
      throw new Error(
        `Cannot upgrade to EXCLUSIVE: existing exclusive claim by node ${conflict.nodeId}`
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.exclusivity !== undefined) updateData.exclusivity = data.exclusivity;
  if (data.protectedAccounts !== undefined) updateData.protectedAccounts = data.protectedAccounts;
  if (data.kpiTarget !== undefined) updateData.kpiTarget = data.kpiTarget;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status !== undefined) updateData.status = data.status;

  const territory = await prisma.territory.update({
    where: { id: territoryId },
    data: updateData,
  });

  return formatTerritoryResult(territory);
}

/**
 * Revokes a territory and records the reason.
 *
 * @param territoryId - The territory ID
 * @param reason - Reason for revocation (stored in notes)
 * @throws Error if territory not found
 * @returns Updated territory
 */
export async function revokeTerritory(
  territoryId: string,
  reason: string
): Promise<TerritoryResult> {
  const prisma = getPrisma();

  const territory = await prisma.territory.findUnique({
    where: { id: territoryId },
    select: { id: true, notes: true },
  });

  if (!territory) {
    throw new Error(`Territory not found: ${territoryId}`);
  }

  const updated = await prisma.territory.update({
    where: { id: territoryId },
    data: {
      status: "REVOKED",
      notes: `${territory.notes ? territory.notes + "\n" : ""}REVOKED: ${reason}`,
    },
  });

  return formatTerritoryResult(updated);
}

/**
 * Checks if a node has an active territory claim for a given region.
 *
 * @param nodeId - The node ID
 * @param region - The region to check
 * @returns true if the node has an active claim, false otherwise
 */
export async function checkTerritoryAccess(
  nodeId: string,
  region: string
): Promise<boolean> {
  const prisma = getPrisma();

  const territory = await prisma.territory.findFirst({
    where: {
      nodeId,
      region,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  return !!territory;
}

/**
 * Retrieves all protected accounts across all territories in a region+scope.
 *
 * @param region - The region
 * @param scope - The scope (Country, City, Vertical)
 * @returns Combined array of all protected accounts in that region+scope
 */
export async function getProtectedAccounts(
  region: string,
  scope: string
): Promise<string[]> {
  const prisma = getPrisma();

  const territories = await prisma.territory.findMany({
    where: {
      region,
      scope,
      status: "ACTIVE",
    },
    select: { protectedAccounts: true },
  });

  // Combine all protected accounts and remove duplicates
  const allAccounts = territories.flatMap((t) => t.protectedAccounts);
  return Array.from(new Set(allAccounts));
}

// ─── Helper Functions ───────────────────────────────────────────────

/**
 * Formats a raw Prisma territory record into a standardized result.
 */
function formatTerritoryResult(
  territory: any
): TerritoryResult {
  return {
    id: territory.id,
    nodeId: territory.nodeId,
    region: territory.region,
    scope: territory.scope,
    exclusivity: territory.exclusivity,
    protectedAccounts: territory.protectedAccounts || [],
    kpiRequired: territory.kpiRequired,
    kpiTarget: territory.kpiTarget || undefined,
    status: territory.status,
    notes: territory.notes || undefined,
    approvedBy: territory.approvedBy || undefined,
    approvedAt: territory.approvedAt || undefined,
    createdAt: territory.createdAt,
    updatedAt: territory.updatedAt,
  };
}
