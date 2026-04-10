/**
 * @wcn/notification — Port Definitions
 */

export interface NotificationPort {
  findNodeOwner(nodeId: string): Promise<string | null>;
  findAdminUserIds(): Promise<string[]>;
  findDealParticipantUserIds(dealId: string): Promise<string[]>;
  findDealLeadUserId(dealId: string): Promise<string | null>;
  findPoBAttributionNodeIds(pobId: string): Promise<string[]>;
  findNodeOwnersByIds(nodeIds: string[]): Promise<string[]>;
  findSettlementNodeIds(cycleId: string): Promise<string[]>;
}
