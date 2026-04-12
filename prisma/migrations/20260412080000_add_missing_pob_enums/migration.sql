-- Create missing enum types and alter columns that reference them.
-- Uses DO blocks with IF NOT EXISTS for idempotency.

-- PoBRecordStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PoBRecordStatus') THEN
    CREATE TYPE "PoBRecordStatus" AS ENUM ('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED');
  END IF;
END $$;

-- PoBEventStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PoBEventStatus') THEN
    CREATE TYPE "PoBEventStatus" AS ENUM ('CREATED', 'PENDING_REVIEW', 'EFFECTIVE', 'REJECTED', 'FROZEN');
  END IF;
END $$;

-- EvidenceReviewStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EvidenceReviewStatus') THEN
    CREATE TYPE "EvidenceReviewStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISPUTED');
  END IF;
END $$;

-- AccountStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AccountStatus') THEN
    CREATE TYPE "AccountStatus" AS ENUM ('INVITED', 'ACTIVE', 'PENDING_2FA', 'SUSPENDED', 'LOCKED', 'OFFBOARDED');
  END IF;
END $$;

-- CapitalStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CapitalStatus') THEN
    CREATE TYPE "CapitalStatus" AS ENUM ('PROSPECT', 'QUALIFIED', 'ACTIVE', 'WARM', 'IN_DD', 'CLOSED', 'PASSED', 'DORMANT');
  END IF;
END $$;

-- DealStage
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DealStage') THEN
    CREATE TYPE "DealStage" AS ENUM ('SOURCED', 'MATCHED', 'INTRO_SENT', 'MEETING_DONE', 'DD', 'TERM_SHEET', 'SIGNED', 'FUNDED', 'PASSED', 'PAUSED');
  END IF;
END $$;

-- MatchStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MatchStatus') THEN
    CREATE TYPE "MatchStatus" AS ENUM ('GENERATED', 'INTEREST_EXPRESSED', 'DECLINED', 'CONVERTED_TO_DEAL', 'EXPIRED');
  END IF;
END $$;

-- ReputationTier
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReputationTier') THEN
    CREATE TYPE "ReputationTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');
  END IF;
END $$;

-- PaymentStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUBMITTED', 'CONFIRMED', 'FAILED');
  END IF;
END $$;

-- NotificationChannel
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationChannel') THEN
    CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'TELEGRAM', 'SLACK', 'IN_APP');
  END IF;
END $$;

-- CampaignStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CampaignStatus') THEN
    CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
  END IF;
END $$;

-- ProposalStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProposalStatus') THEN
    CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PASSED', 'REJECTED', 'EXECUTED', 'CANCELLED');
  END IF;
END $$;

-- IngestionStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IngestionStatus') THEN
    CREATE TYPE "IngestionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
  END IF;
END $$;

-- NotificationType
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
    CREATE TYPE "NotificationType" AS ENUM ('TASK_ASSIGNED', 'EVIDENCE_SUBMITTED', 'EVIDENCE_NEEDED', 'REVIEW_REJECTED', 'DISPUTE_OPENED', 'SETTLEMENT_CLOSING', 'SLA_WARNING', 'APPROVAL_PENDING', 'FREEZE_APPLIED', 'INVITE_SENT', 'NODE_STATUS_CHANGE', 'DEAL_STAGE_CHANGE', 'GENERAL');
  END IF;
END $$;

-- GrantType
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GrantType') THEN
    CREATE TYPE "GrantType" AS ENUM ('VIEW', 'DOWNLOAD', 'COMMENT', 'REVIEW', 'MANAGE', 'EXPORT');
  END IF;
END $$;

-- GrantScope
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GrantScope') THEN
    CREATE TYPE "GrantScope" AS ENUM ('FULL', 'MATERIALS_ONLY', 'DEAL_ROOM_ONLY', 'REVIEW_ONLY', 'SETTLEMENT_PREVIEW_ONLY');
  END IF;
END $$;

-- ApprovalStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApprovalStatus') THEN
    CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
  END IF;
END $$;

-- ApprovalActionType
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApprovalActionType') THEN
    CREATE TYPE "ApprovalActionType" AS ENUM ('LOCK', 'REOPEN', 'FREEZE', 'UNFREEZE', 'OVERRIDE');
  END IF;
END $$;

-- FreezeLevel
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FreezeLevel') THEN
    CREATE TYPE "FreezeLevel" AS ENUM ('SOFT', 'HARD');
  END IF;
END $$;

-- ScanStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ScanStatus') THEN
    CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');
  END IF;
END $$;

-- PreviewStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PreviewStatus') THEN
    CREATE TYPE "PreviewStatus" AS ENUM ('PENDING', 'READY', 'FAILED');
  END IF;
END $$;

-- TermsDocumentType
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TermsDocumentType') THEN
    CREATE TYPE "TermsDocumentType" AS ENUM ('NDA', 'TERMS', 'PRIVACY', 'CODE_OF_CONDUCT');
  END IF;
END $$;

-- KYCStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KYCStatus') THEN
    CREATE TYPE "KYCStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
  END IF;
END $$;

-- AgentRunReviewStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AgentRunReviewStatus') THEN
    CREATE TYPE "AgentRunReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'MODIFIED', 'REJECTED');
  END IF;
END $$;

-- AgentOutputType
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AgentOutputType') THEN
    CREATE TYPE "AgentOutputType" AS ENUM ('REPORT', 'MATCH_MEMO', 'MEETING_NOTES', 'CONTENT_DRAFT', 'TASK_SUGGESTIONS', 'ALERT');
  END IF;
END $$;

-- AgentOverrideLevel
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AgentOverrideLevel') THEN
    CREATE TYPE "AgentOverrideLevel" AS ENUM ('L1_PAUSE_TASK', 'L2_PAUSE_INSTANCE', 'L3_PAUSE_CLASS');
  END IF;
END $$;

-- ConfidentialityLevel
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConfidentialityLevel') THEN
    CREATE TYPE "ConfidentialityLevel" AS ENUM ('PUBLIC', 'CERTIFIED_NODE', 'DEAL_ROOM', 'RESTRICTED');
  END IF;
END $$;

-- Alter PoBRecord.status column from ApplicationStatus to PoBRecordStatus
-- Must drop default first, change type, then re-add default
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PoBRecord' AND column_name = 'status'
      AND udt_name = 'ApplicationStatus'
  ) THEN
    ALTER TABLE "PoBRecord" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "PoBRecord" ALTER COLUMN "status" TYPE "PoBRecordStatus" USING "status"::text::"PoBRecordStatus";
    ALTER TABLE "PoBRecord" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"PoBRecordStatus";
  END IF;
END $$;

-- Add pobEventStatus column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'PoBRecord' AND column_name = 'pobEventStatus'
  ) THEN
    ALTER TABLE "PoBRecord" ADD COLUMN "pobEventStatus" "PoBEventStatus" NOT NULL DEFAULT 'CREATED';
  END IF;
END $$;

-- Add index on pobEventStatus if it doesn't exist
CREATE INDEX IF NOT EXISTS "PoBRecord_pobEventStatus_createdAt_idx" ON "PoBRecord"("pobEventStatus", "createdAt");
