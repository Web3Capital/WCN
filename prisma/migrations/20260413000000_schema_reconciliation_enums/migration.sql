-- Schema reconciliation migration.
-- Generated from a local PostgreSQL migration dry-run after 20260412080000_add_missing_pob_enums.
-- The prior baseline migration was a no-op despite schema changes already being db-pushed.
-- Statements are intentionally guarded so existing databases that already contain the db-pushed objects can apply this safely.

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NodeCategory') THEN
    CREATE TYPE "NodeCategory" AS ENUM ('HUMAN', 'ORG', 'AGENT', 'OPERATOR');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NodeScope') THEN
    CREATE TYPE "NodeScope" AS ENUM ('GLOBAL', 'REGION', 'CITY', 'INDUSTRY', 'VERTICAL', 'FUNCTIONAL');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LedgerType') THEN
    CREATE TYPE "LedgerType" AS ENUM ('CASH', 'RIGHTS', 'INCENTIVE');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LedgerAction') THEN
    CREATE TYPE "LedgerAction" AS ENUM ('CREDIT', 'DEBIT', 'FREEZE', 'UNFREEZE', 'SLASH', 'RELEASE', 'ESCROW');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PolicyScope') THEN
    CREATE TYPE "PolicyScope" AS ENUM ('GLOBAL', 'WORKSPACE', 'NODE_TYPE', 'DEAL_TYPE', 'SETTLEMENT', 'AGENT_POLICY');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PolicyStatus') THEN
    CREATE TYPE "PolicyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'RETIRED');
  END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ScorecardAction') THEN
    CREATE TYPE "ScorecardAction" AS ENUM ('UPGRADE', 'MAINTAIN', 'WATCHLIST', 'DOWNGRADE', 'REMOVE');
  END IF;
END $$;

-- AlterEnum
ALTER TYPE "AgentRunStatus" ADD VALUE IF NOT EXISTS 'RUNNING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AgentStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';
ALTER TYPE "AgentStatus" ADD VALUE IF NOT EXISTS 'FROZEN';

-- AlterEnum
ALTER TYPE "ConfirmationTargetType" ADD VALUE IF NOT EXISTS 'DEAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DisputeStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "DisputeStatus" ADD VALUE IF NOT EXISTS 'DISMISSED';
ALTER TYPE "DisputeStatus" ADD VALUE IF NOT EXISTS 'ESCALATED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NodeStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "NodeStatus" ADD VALUE IF NOT EXISTS 'NEED_MORE_INFO';
ALTER TYPE "NodeStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "NodeStatus" ADD VALUE IF NOT EXISTS 'CONTRACTING';
ALTER TYPE "NodeStatus" ADD VALUE IF NOT EXISTS 'LIVE';
ALTER TYPE "NodeStatus" ADD VALUE IF NOT EXISTS 'PROBATION';
ALTER TYPE "NodeStatus" ADD VALUE IF NOT EXISTS 'OFFBOARDED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'SCREENED';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'CURATED';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'IN_DEAL_ROOM';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'ACTIVE';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReviewTargetType" ADD VALUE IF NOT EXISTS 'DEAL';
ALTER TYPE "ReviewTargetType" ADD VALUE IF NOT EXISTS 'CAPITAL';
ALTER TYPE "ReviewTargetType" ADD VALUE IF NOT EXISTS 'EVIDENCE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'FOUNDER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'FINANCE_ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'NODE_OWNER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PROJECT_OWNER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CAPITAL_NODE';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SERVICE_NODE';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'REVIEWER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'RISK_DESK';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'AGENT_OWNER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OBSERVER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SYSTEM';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SettlementCycleStatus" ADD VALUE IF NOT EXISTS 'RECONCILED';
ALTER TYPE "SettlementCycleStatus" ADD VALUE IF NOT EXISTS 'LOCK_PENDING_APPROVAL';
ALTER TYPE "SettlementCycleStatus" ADD VALUE IF NOT EXISTS 'EXPORTED';
ALTER TYPE "SettlementCycleStatus" ADD VALUE IF NOT EXISTS 'REOPEN_PENDING_APPROVAL';
ALTER TYPE "SettlementCycleStatus" ADD VALUE IF NOT EXISTS 'REOPENED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'REWORK';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'CLOSED';
