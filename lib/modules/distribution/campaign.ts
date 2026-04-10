import type { PrismaClient } from "@prisma/client";

export type CreateCampaignInput = {
  title: string;
  description?: string;
  targetType?: string;
  budget?: number;
  startAt?: string;
  endAt?: string;
};

export async function createCampaign(
  prisma: PrismaClient,
  input: CreateCampaignInput,
  createdById: string,
) {
  return prisma.campaign.create({
    data: {
      title: input.title,
      description: input.description,
      targetType: input.targetType,
      budget: input.budget,
      startAt: input.startAt ? new Date(input.startAt) : undefined,
      endAt: input.endAt ? new Date(input.endAt) : undefined,
      createdById,
    },
    include: { channels: true, metrics: true },
  });
}

export async function assignChannel(
  prisma: PrismaClient,
  campaignId: string,
  nodeId: string,
  channel: string,
  deliverables?: Record<string, unknown>,
) {
  return prisma.campaignChannel.create({
    data: { campaignId, nodeId, channel, deliverables: (deliverables ?? {}) as any },
  });
}

export async function recordMetric(
  prisma: PrismaClient,
  campaignId: string,
  metricType: string,
  value: number,
) {
  return prisma.campaignMetric.create({
    data: { campaignId, metricType, value },
  });
}

export async function transitionCampaignStatus(
  prisma: PrismaClient,
  campaignId: string,
  newStatus: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED",
) {
  return prisma.campaign.update({
    where: { id: campaignId },
    data: { status: newStatus },
  });
}
