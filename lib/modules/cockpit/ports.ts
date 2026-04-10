/**
 * @wcn/cockpit — Port Definitions
 */

export interface CockpitPort {
  countEntities(): Promise<{
    nodes: number;
    projects: number;
    deals: number;
    tasks: number;
    pobRecords: number;
    users: number;
  }>;
  getRecentActivity(take: number): Promise<Array<{
    action: string;
    targetType: string;
    targetId: string;
    createdAt: Date;
  }>>;
}
