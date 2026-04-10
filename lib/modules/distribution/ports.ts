/**
 * @wcn/distribution — Port Definitions
 */

export interface CampaignRecord {
  id: string;
  name: string;
  projectId: string;
  status: string;
  budget: number;
  startDate: Date;
  endDate: Date | null;
  channels: Array<{ id: string; name: string; type: string; nodeId: string | null }>;
}

export interface DistributionPort {
  createCampaign(data: Omit<CampaignRecord, 'id' | 'channels'>): Promise<CampaignRecord>;
  findCampaignById(id: string): Promise<CampaignRecord | null>;
  updateCampaign(id: string, data: Partial<CampaignRecord>): Promise<void>;
}
