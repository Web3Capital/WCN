-- Schema reconciliation objects.
-- Complements 20260413000000_schema_reconciliation_enums after enum values are committed.

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "freezeLevel" "AgentOverrideLevel";
ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "executionTimeMs" INTEGER;
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "modelId" TEXT;
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "outputType" "AgentOutputType";
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "reviewNotes" TEXT;
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "reviewStatus" "AgentRunReviewStatus";
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "tokenCount" INTEGER;
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "triggeredBy" TEXT;
ALTER TABLE "AgentRun" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "AgentRun" ALTER COLUMN "status" SET DEFAULT 'RUNNING';

-- AlterTable
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "boundaryStatement" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "complianceDocs" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMP(3);
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "escalatedTo" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "pastCases" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "references" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "territory" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "actorId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "after" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "before" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "deviceInfo" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "requestId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "windowEndsAt" TIMESTAMP(3);
ALTER TABLE "Dispute" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "dealId" TEXT;
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "fileId" TEXT;
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "hash" TEXT;
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "reviewStatus" "EvidenceReviewStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "reviewerId" TEXT;
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "slaDeadlineAt" TIMESTAMP(3);
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "versionLock" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Evidence" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "allowedServices" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "billingStatus" TEXT;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "category" "NodeCategory" NOT NULL DEFAULT 'HUMAN';
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "contactName" TEXT;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "contractSentAt" TIMESTAMP(3);
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "depositStatus" TEXT;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "entityName" TEXT;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "entityType" TEXT;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "goLiveAt" TIMESTAMP(3);
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "offboardedAt" TIMESTAMP(3);
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "onboardingScore" INTEGER;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "pastCases" TEXT;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "probationEndAt" TIMESTAMP(3);
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "probationStartAt" TIMESTAMP(3);
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "recommendation" TEXT;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "resourcesOffered" TEXT;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "riskLevel" TEXT;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "scope" "NodeScope";
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "seatFeeStatus" TEXT;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "territoryJson" JSONB;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "vertical" TEXT;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "beneficiaryEntity" TEXT;
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "dealId" TEXT;
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "frozenAt" TIMESTAMP(3);
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "frozenReason" TEXT;
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "leadNodeId" TEXT;
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "loopType" TEXT;
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "outcomeImpact" DOUBLE PRECISION;
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "resultDate" TIMESTAMP(3);
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "scarcityFactor" DOUBLE PRECISION;
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "slaDeadlineAt" TIMESTAMP(3);
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "supportingNodeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "taskImportance" DOUBLE PRECISION;
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "v3Score" DOUBLE PRECISION;
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "validity" DOUBLE PRECISION;
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PoBRecord" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "confidentialityLevel" "ConfidentialityLevel" NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "internalScore" DOUBLE PRECISION;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "riskTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "decidedAt" TIMESTAMP(3);
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "slaDeadlineAt" TIMESTAMP(3);
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "deviceInfo" TEXT;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;

-- AlterTable
ALTER TABLE "SettlementCycle" ADD COLUMN IF NOT EXISTS "exportedAt" TIMESTAMP(3);
ALTER TABLE "SettlementCycle" ADD COLUMN IF NOT EXISTS "exportedById" TEXT;
ALTER TABLE "SettlementCycle" ADD COLUMN IF NOT EXISTS "lockApprovalId" TEXT;
ALTER TABLE "SettlementCycle" ADD COLUMN IF NOT EXISTS "lockedById" TEXT;
ALTER TABLE "SettlementCycle" ADD COLUMN IF NOT EXISTS "reconciledAt" TIMESTAMP(3);
ALTER TABLE "SettlementCycle" ADD COLUMN IF NOT EXISTS "reopenApprovalId" TEXT;
ALTER TABLE "SettlementCycle" ADD COLUMN IF NOT EXISTS "reopenReason" TEXT;
ALTER TABLE "SettlementCycle" ADD COLUMN IF NOT EXISTS "reopenedAt" TIMESTAMP(3);
ALTER TABLE "SettlementCycle" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "SettlementCycle" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "acceptanceOwner" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "acceptanceOwnerActorId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "acceptanceOwnerActorType" "ActorType";
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "assigneeActorId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "assigneeActorType" "ActorType";
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "assigneeUserId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "dealId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "evidenceRequired" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "activeRole" "Role";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "activeWorkspaceId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kycStatus" "KYCStatus" NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginDevice" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ndaAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "slackWebhookUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telegramChatId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenInvalidatedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WorkspaceMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "territory" TEXT,
    "region" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RoleAssignment" (
    "id" TEXT NOT NULL,
    "workspaceMembershipId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "grantedById" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "workspaceId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TermsAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "documentType" "TermsDocumentType" NOT NULL,
    "documentVer" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,

    CONSTRAINT "TermsAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "KYCRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "externalId" TEXT,
    "documents" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KYCRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AccessGrant" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "grantedToType" "ActorType" NOT NULL,
    "grantedToId" TEXT NOT NULL,
    "grantType" "GrantType" NOT NULL,
    "scope" "GrantScope" NOT NULL DEFAULT 'FULL',
    "expiresAt" TIMESTAMP(3),
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ApprovalAction" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actionType" "ApprovalActionType" NOT NULL,
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "rejectedById" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EntityFreeze" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "freezeLevel" "FreezeLevel" NOT NULL,
    "reason" TEXT NOT NULL,
    "frozenById" TEXT NOT NULL,
    "frozenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "liftedAt" TIMESTAMP(3),
    "liftedById" TEXT,

    CONSTRAINT "EntityFreeze_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SearchDocument" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "body" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CapitalProfile" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "status" "CapitalStatus" NOT NULL DEFAULT 'PROSPECT',
    "name" TEXT NOT NULL,
    "entity" TEXT,
    "investmentFocus" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ticketMin" DOUBLE PRECISION,
    "ticketMax" DOUBLE PRECISION,
    "jurisdictionLimit" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "structurePref" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blacklist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "restrictions" TEXT,
    "responseSpeed" INTEGER,
    "activityScore" DOUBLE PRECISION,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "nodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapitalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Deal" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "stage" "DealStage" NOT NULL DEFAULT 'SOURCED',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "riskTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nextAction" TEXT,
    "nextActionDueAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "confidentialityLevel" "ConfidentialityLevel" NOT NULL DEFAULT 'DEAL_ROOM',
    "projectId" TEXT,
    "capitalId" TEXT,
    "leadNodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DealParticipant" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "dealId" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL DEFAULT 'NODE',
    "actorId" TEXT,
    "nodeId" TEXT,
    "userId" TEXT,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DealMilestone" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "dealId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DealNote" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "dealId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AgentLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "agentId" TEXT NOT NULL,
    "ownerNodeId" TEXT NOT NULL,
    "taskId" TEXT,
    "caseId" TEXT,
    "modelVersion" TEXT,
    "actionType" TEXT NOT NULL,
    "inputReference" TEXT,
    "outputReference" TEXT,
    "humanApprovalId" TEXT,
    "exceptionFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "File" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT,
    "storagePath" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "hash" TEXT,
    "checksumAlgorithm" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "confidentiality" "ConfidentialityLevel" NOT NULL DEFAULT 'PUBLIC',
    "scanStatus" "ScanStatus" NOT NULL DEFAULT 'PENDING',
    "previewStatus" "PreviewStatus" NOT NULL DEFAULT 'PENDING',
    "retentionClass" TEXT,
    "uploadedVia" TEXT,
    "uploaderUserId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "parentFileId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FileAccessLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "fileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RiskFlag" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "raisedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Match" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "capitalProfileId" TEXT NOT NULL,
    "capitalNodeId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sectorScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ticketScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "jurisdictionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "MatchStatus" NOT NULL DEFAULT 'GENERATED',
    "interestAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "convertedDealId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReputationScore" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier" "ReputationTier" NOT NULL DEFAULT 'BRONZE',
    "components" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resource" DOUBLE PRECISION,
    "execution" DOUBLE PRECISION,
    "trust" DOUBLE PRECISION,
    "stability" DOUBLE PRECISION,
    "contribution" DOUBLE PRECISION,
    "v3Score" DOUBLE PRECISION,

    CONSTRAINT "ReputationScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReputationBadge" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ReputationHistory" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "tier" "ReputationTier" NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReputationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PaymentExecution" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "chain" TEXT NOT NULL,
    "txHash" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PaymentConfig" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'polygon',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "notifyOnNew" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "eventTypes" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RiskRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "action" TEXT NOT NULL DEFAULT 'CREATE_FLAG',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "targetType" TEXT,
    "budget" DOUBLE PRECISION,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CampaignChannel" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "deliverables" JSONB,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CampaignMetric" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Proposal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "options" JSONB NOT NULL,
    "quorum" INTEGER NOT NULL DEFAULT 1,
    "deadline" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Vote" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "option" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "castAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Council" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memberIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "termStart" TIMESTAMP(3),
    "termEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Council_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "userId" TEXT,
    "nodeId" TEXT,
    "scopes" TEXT[] DEFAULT ARRAY['read']::TEXT[],
    "rateLimit" INTEGER NOT NULL DEFAULT 60,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "IngestionSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "schedule" TEXT,
    "lastRunAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "IngestionRun" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'PENDING',
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "itemsNew" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "itemsSkipped" INTEGER NOT NULL DEFAULT 0,
    "errorMsg" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Outbox" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "actorId" TEXT,
    "requestId" TEXT,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "NodeScorecard" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "pipelineScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closureScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "collaborationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "action" "ScorecardAction" NOT NULL DEFAULT 'MAINTAIN',
    "notes" TEXT,
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NodeScorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Territory" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "exclusivity" TEXT NOT NULL DEFAULT 'NONE',
    "protectedAccounts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kpiRequired" BOOLEAN NOT NULL DEFAULT false,
    "kpiTarget" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Territory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Ledger" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "nodeId" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "action" "LedgerAction" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reference" TEXT,
    "referenceType" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Policy" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" "PolicyScope" NOT NULL,
    "scopeRef" TEXT,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "approvers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rollbackLogic" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "PolicyStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT,
    "activatedAt" TIMESTAMP(3),
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PolicyEvaluation" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "details" JSONB,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LearningSignal" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "signalType" TEXT NOT NULL,
    "sourceEvent" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WorkspaceMembership_workspaceId_idx" ON "WorkspaceMembership"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceMembership_userId_workspaceId_key" ON "WorkspaceMembership"("userId", "workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RoleAssignment_workspaceMembershipId_role_idx" ON "RoleAssignment"("workspaceMembershipId", "role");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Invite_tokenHash_key" ON "Invite"("tokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invite_email_idx" ON "Invite"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invite_tokenHash_idx" ON "Invite"("tokenHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TermsAcceptance_userId_documentType_documentVer_idx" ON "TermsAcceptance"("userId", "documentType", "documentVer");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KYCRecord_userId_status_idx" ON "KYCRecord"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KYCRecord_status_submittedAt_idx" ON "KYCRecord"("status", "submittedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AccessGrant_workspaceId_entityType_entityId_idx" ON "AccessGrant"("workspaceId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AccessGrant_grantedToType_grantedToId_idx" ON "AccessGrant"("grantedToType", "grantedToId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AccessGrant_grantedById_idx" ON "AccessGrant"("grantedById");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApprovalAction_workspaceId_entityType_entityId_status_idx" ON "ApprovalAction"("workspaceId", "entityType", "entityId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApprovalAction_status_createdAt_idx" ON "ApprovalAction"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApprovalAction_requestedById_idx" ON "ApprovalAction"("requestedById");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApprovalAction_approvedById_idx" ON "ApprovalAction"("approvedById");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EntityFreeze_workspaceId_entityType_entityId_idx" ON "EntityFreeze"("workspaceId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EntityFreeze_liftedAt_idx" ON "EntityFreeze"("liftedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "EntityFreeze_frozenById_idx" ON "EntityFreeze"("frozenById");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SearchDocument_workspaceId_entityType_idx" ON "SearchDocument"("workspaceId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SearchDocument_workspaceId_entityType_entityId_key" ON "SearchDocument"("workspaceId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CapitalProfile_status_idx" ON "CapitalProfile"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CapitalProfile_nodeId_idx" ON "CapitalProfile"("nodeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CapitalProfile_workspaceId_idx" ON "CapitalProfile"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CapitalProfile_status_createdAt_idx" ON "CapitalProfile"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_stage_idx" ON "Deal"("stage");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_projectId_idx" ON "Deal"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_capitalId_idx" ON "Deal"("capitalId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_leadNodeId_idx" ON "Deal"("leadNodeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_workspaceId_idx" ON "Deal"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deal_stage_updatedAt_idx" ON "Deal"("stage", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DealParticipant_dealId_idx" ON "DealParticipant"("dealId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DealParticipant_workspaceId_actorType_actorId_idx" ON "DealParticipant"("workspaceId", "actorType", "actorId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DealParticipant_dealId_nodeId_key" ON "DealParticipant"("dealId", "nodeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DealMilestone_dealId_idx" ON "DealMilestone"("dealId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DealMilestone_workspaceId_idx" ON "DealMilestone"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DealNote_dealId_createdAt_idx" ON "DealNote"("dealId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DealNote_authorId_idx" ON "DealNote"("authorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DealNote_workspaceId_idx" ON "DealNote"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentLog_agentId_createdAt_idx" ON "AgentLog"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentLog_ownerNodeId_idx" ON "AgentLog"("ownerNodeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentLog_taskId_idx" ON "AgentLog"("taskId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentLog_workspaceId_idx" ON "AgentLog"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "File_entityType_entityId_idx" ON "File"("entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "File_uploaderUserId_idx" ON "File"("uploaderUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "File_parentFileId_idx" ON "File"("parentFileId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "File_workspaceId_idx" ON "File"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FileAccessLog_fileId_createdAt_idx" ON "FileAccessLog"("fileId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FileAccessLog_userId_createdAt_idx" ON "FileAccessLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FileAccessLog_workspaceId_idx" ON "FileAccessLog"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_workspaceId_idx" ON "Notification"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RiskFlag_entityType_entityId_idx" ON "RiskFlag"("entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RiskFlag_severity_createdAt_idx" ON "RiskFlag"("severity", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RiskFlag_resolvedAt_idx" ON "RiskFlag"("resolvedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RiskFlag_workspaceId_idx" ON "RiskFlag"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Match_capitalNodeId_idx" ON "Match"("capitalNodeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Match_score_idx" ON "Match"("score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Match_projectId_capitalProfileId_key" ON "Match"("projectId", "capitalProfileId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReputationScore_nodeId_key" ON "ReputationScore"("nodeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReputationScore_tier_score_idx" ON "ReputationScore"("tier", "score" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReputationBadge_nodeId_idx" ON "ReputationBadge"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReputationBadge_nodeId_badgeType_key" ON "ReputationBadge"("nodeId", "badgeType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ReputationHistory_nodeId_snapshotAt_idx" ON "ReputationHistory"("nodeId", "snapshotAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PaymentExecution_cycleId_status_idx" ON "PaymentExecution"("cycleId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PaymentExecution_nodeId_idx" ON "PaymentExecution"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentConfig_nodeId_key" ON "PaymentConfig"("nodeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PaymentConfig_nodeId_idx" ON "PaymentConfig"("nodeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SavedSearch_userId_idx" ON "SavedSearch"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SavedSearch_createdAt_idx" ON "SavedSearch"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_userId_channel_key" ON "NotificationPreference"("userId", "channel");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RiskRule_entityType_enabled_idx" ON "RiskRule"("entityType", "enabled");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CampaignChannel_campaignId_idx" ON "CampaignChannel"("campaignId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CampaignChannel_nodeId_idx" ON "CampaignChannel"("nodeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CampaignMetric_campaignId_metricType_idx" ON "CampaignMetric"("campaignId", "metricType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Proposal_status_deadline_idx" ON "Proposal"("status", "deadline");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Vote_proposalId_idx" ON "Vote"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Vote_proposalId_voterId_key" ON "Vote"("proposalId", "voterId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApiKey_nodeId_idx" ON "ApiKey"("nodeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "IngestionSource_type_enabled_idx" ON "IngestionSource"("type", "enabled");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "IngestionRun_sourceId_status_idx" ON "IngestionRun"("sourceId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Outbox_delivered_createdAt_idx" ON "Outbox"("delivered", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Outbox_eventName_idx" ON "Outbox"("eventName");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NodeScorecard_nodeId_createdAt_idx" ON "NodeScorecard"("nodeId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NodeScorecard_action_idx" ON "NodeScorecard"("action");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "NodeScorecard_nodeId_period_key" ON "NodeScorecard"("nodeId", "period");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Territory_region_scope_idx" ON "Territory"("region", "scope");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Territory_nodeId_idx" ON "Territory"("nodeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Territory_status_idx" ON "Territory"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Territory_nodeId_region_scope_key" ON "Territory"("nodeId", "region", "scope");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Ledger_nodeId_type_createdAt_idx" ON "Ledger"("nodeId", "type", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Ledger_workspaceId_type_idx" ON "Ledger"("workspaceId", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Ledger_reference_referenceType_idx" ON "Ledger"("reference", "referenceType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Policy_scope_status_idx" ON "Policy"("scope", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Policy_workspaceId_status_idx" ON "Policy"("workspaceId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PolicyEvaluation_policyId_evaluatedAt_idx" ON "PolicyEvaluation"("policyId", "evaluatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PolicyEvaluation_entityType_entityId_idx" ON "PolicyEvaluation"("entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LearningSignal_signalType_processed_idx" ON "LearningSignal"("signalType", "processed");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LearningSignal_entityType_entityId_idx" ON "LearningSignal"("entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LearningSignal_workspaceId_createdAt_idx" ON "LearningSignal"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Agent_workspaceId_idx" ON "Agent"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AgentRun_reviewStatus_idx" ON "AgentRun"("reviewStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Application_workspaceId_idx" ON "Application"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_workspaceId_createdAt_idx" ON "AuditLog"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_requestId_idx" ON "AuditLog"("requestId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Dispute_workspaceId_idx" ON "Dispute"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Evidence_reviewStatus_slaDeadlineAt_idx" ON "Evidence"("reviewStatus", "slaDeadlineAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Evidence_dealId_idx" ON "Evidence"("dealId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Evidence_reviewerId_idx" ON "Evidence"("reviewerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Evidence_workspaceId_idx" ON "Evidence"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Node_category_status_idx" ON "Node"("category", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Node_workspaceId_idx" ON "Node"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Node_ownerUserId_createdAt_idx" ON "Node"("ownerUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PoBRecord_dealId_idx" ON "PoBRecord"("dealId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PoBRecord_workspaceId_idx" ON "PoBRecord"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Project_workspaceId_idx" ON "Project"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Review_workspaceId_idx" ON "Review"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SettlementCycle_workspaceId_idx" ON "SettlementCycle"("workspaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Task_dealId_idx" ON "Task"("dealId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Task_workspaceId_idx" ON "Task"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_accountStatus_idx" ON "User"("accountStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceMembership_userId_fkey') THEN
    ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT "WorkspaceMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'WorkspaceMembership_workspaceId_fkey') THEN
    ALTER TABLE "WorkspaceMembership" ADD CONSTRAINT "WorkspaceMembership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RoleAssignment_workspaceMembershipId_fkey') THEN
    ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_workspaceMembershipId_fkey" FOREIGN KEY ("workspaceMembershipId") REFERENCES "WorkspaceMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RoleAssignment_grantedById_fkey') THEN
    ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invite_workspaceId_fkey') THEN
    ALTER TABLE "Invite" ADD CONSTRAINT "Invite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invite_createdById_fkey') THEN
    ALTER TABLE "Invite" ADD CONSTRAINT "Invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TermsAcceptance_userId_fkey') THEN
    ALTER TABLE "TermsAcceptance" ADD CONSTRAINT "TermsAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'KYCRecord_userId_fkey') THEN
    ALTER TABLE "KYCRecord" ADD CONSTRAINT "KYCRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CapitalProfile_nodeId_fkey') THEN
    ALTER TABLE "CapitalProfile" ADD CONSTRAINT "CapitalProfile_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Deal_projectId_fkey') THEN
    ALTER TABLE "Deal" ADD CONSTRAINT "Deal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Deal_capitalId_fkey') THEN
    ALTER TABLE "Deal" ADD CONSTRAINT "Deal_capitalId_fkey" FOREIGN KEY ("capitalId") REFERENCES "CapitalProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Deal_leadNodeId_fkey') THEN
    ALTER TABLE "Deal" ADD CONSTRAINT "Deal_leadNodeId_fkey" FOREIGN KEY ("leadNodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DealParticipant_dealId_fkey') THEN
    ALTER TABLE "DealParticipant" ADD CONSTRAINT "DealParticipant_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DealParticipant_nodeId_fkey') THEN
    ALTER TABLE "DealParticipant" ADD CONSTRAINT "DealParticipant_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DealMilestone_dealId_fkey') THEN
    ALTER TABLE "DealMilestone" ADD CONSTRAINT "DealMilestone_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DealNote_dealId_fkey') THEN
    ALTER TABLE "DealNote" ADD CONSTRAINT "DealNote_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Task_dealId_fkey') THEN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Evidence_dealId_fkey') THEN
    ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PoBRecord_dealId_fkey') THEN
    ALTER TABLE "PoBRecord" ADD CONSTRAINT "PoBRecord_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentRun_reviewedById_fkey') THEN
    ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentLog_agentId_fkey') THEN
    ALTER TABLE "AgentLog" ADD CONSTRAINT "AgentLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'File_uploaderUserId_fkey') THEN
    ALTER TABLE "File" ADD CONSTRAINT "File_uploaderUserId_fkey" FOREIGN KEY ("uploaderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FileAccessLog_fileId_fkey') THEN
    ALTER TABLE "FileAccessLog" ADD CONSTRAINT "FileAccessLog_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey') THEN
    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Match_projectId_fkey') THEN
    ALTER TABLE "Match" ADD CONSTRAINT "Match_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Match_capitalProfileId_fkey') THEN
    ALTER TABLE "Match" ADD CONSTRAINT "Match_capitalProfileId_fkey" FOREIGN KEY ("capitalProfileId") REFERENCES "CapitalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReputationScore_nodeId_fkey') THEN
    ALTER TABLE "ReputationScore" ADD CONSTRAINT "ReputationScore_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CampaignChannel_campaignId_fkey') THEN
    ALTER TABLE "CampaignChannel" ADD CONSTRAINT "CampaignChannel_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CampaignMetric_campaignId_fkey') THEN
    ALTER TABLE "CampaignMetric" ADD CONSTRAINT "CampaignMetric_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Vote_proposalId_fkey') THEN
    ALTER TABLE "Vote" ADD CONSTRAINT "Vote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IngestionRun_sourceId_fkey') THEN
    ALTER TABLE "IngestionRun" ADD CONSTRAINT "IngestionRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "IngestionSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NodeScorecard_nodeId_fkey') THEN
    ALTER TABLE "NodeScorecard" ADD CONSTRAINT "NodeScorecard_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NodeScorecard_reviewerId_fkey') THEN
    ALTER TABLE "NodeScorecard" ADD CONSTRAINT "NodeScorecard_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Territory_nodeId_fkey') THEN
    ALTER TABLE "Territory" ADD CONSTRAINT "Territory_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Ledger_nodeId_fkey') THEN
    ALTER TABLE "Ledger" ADD CONSTRAINT "Ledger_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PolicyEvaluation_policyId_fkey') THEN
    ALTER TABLE "PolicyEvaluation" ADD CONSTRAINT "PolicyEvaluation_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
