/**
 * Optimistic Concurrency Control
 *
 * Prevents silent data overwrites on concurrent modifications.
 * Uses `updateMany` with `WHERE version = expected` to detect conflicts.
 *
 * Models that support versioning must have `version Int @default(1)` in the Prisma schema.
 * Currently: Deal, SettlementCycle, PoBRecord, CapitalProfile, Node, Project,
 *            Task, Evidence, Review, Agent, File.
 */

export class OptimisticLockError extends Error {
  public readonly code = "OPTIMISTIC_LOCK_CONFLICT" as const;
  public readonly statusCode = 409 as const;
  public readonly entityType: string;
  public readonly entityId: string;

  constructor(entityType: string, entityId: string) {
    super(
      `Concurrent modification detected on ${entityType} (${entityId}). ` +
        `Please refresh and retry.`,
    );
    this.name = "OptimisticLockError";
    this.entityType = entityType;
    this.entityId = entityId;
  }
}

/**
 * Execute an update with optimistic concurrency control.
 *
 * Uses `updateMany({ where: { id, version } })` which returns `{ count }`.
 * If count === 0, the row was modified concurrently and we throw.
 *
 * @param model       - Prisma model delegate (e.g., `prisma.deal` or `tx.deal`)
 * @param entityType  - Human-readable name for error messages (e.g., "Deal")
 * @param id          - The entity's primary key
 * @param expectedVersion - The version the caller read before updating
 * @param data        - The update payload (version increment is added automatically)
 * @returns The freshly-fetched entity after the update
 */
export async function updateWithVersion<T>(
  model: any,
  entityType: string,
  id: string,
  expectedVersion: number,
  data: Record<string, unknown>,
): Promise<T> {
  const result = await model.updateMany({
    where: { id, version: expectedVersion },
    data: { ...data, version: expectedVersion + 1 },
  });

  if (result.count === 0) {
    throw new OptimisticLockError(entityType, id);
  }

  // Return the updated record
  return model.findUniqueOrThrow({ where: { id } });
}

/**
 * Inline optimistic version guard for use inside `prisma.$transaction`.
 *
 * Instead of a full model delegate, this takes the transaction client
 * and model name to use `tx[modelName].updateMany(...)` directly.
 *
 * @returns The number of rows updated (should be 1).
 * @throws OptimisticLockError if 0 rows matched.
 */
export async function versionGuard(
  txModel: any,
  entityType: string,
  id: string,
  expectedVersion: number,
  data: Record<string, unknown> = {},
): Promise<void> {
  const result = await txModel.updateMany({
    where: { id, version: expectedVersion },
    data: { ...data, version: expectedVersion + 1 },
  });

  if (result.count === 0) {
    throw new OptimisticLockError(entityType, id);
  }
}
