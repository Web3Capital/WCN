/**
 * @wcn/ingestion — Port Definitions
 */

export interface IngestionPort {
  findSourceById(id: string): Promise<{ id: string; type: string; config: Record<string, unknown>; status: string } | null>;
  createRun(sourceId: string, status: string): Promise<{ id: string }>;
  updateRun(id: string, data: Record<string, unknown>): Promise<void>;
  upsertEntity(entityType: string, externalId: string, data: Record<string, unknown>): Promise<void>;
}
