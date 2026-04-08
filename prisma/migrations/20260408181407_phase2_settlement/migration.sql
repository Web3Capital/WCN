-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'NODE', 'AGENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ConfirmationTargetType" AS ENUM ('POB', 'TASK', 'PROJECT');

-- CreateEnum
CREATE TYPE "ConfirmationPartyType" AS ENUM ('USER', 'NODE');

-- CreateEnum
CREATE TYPE "ConfirmationDecision" AS ENUM ('CONFIRM', 'REJECT');

-- CreateEnum
CREATE TYPE "AttributionRole" AS ENUM ('LEAD', 'COLLAB');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('DEAL', 'RESEARCH', 'GROWTH', 'EXECUTION', 'LIQUIDITY');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SettlementCycleKind" AS ENUM ('WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "SettlementCycleStatus" AS ENUM ('DRAFT', 'LOCKED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "StakeAction" AS ENUM ('DEPOSIT', 'WITHDRAW', 'FREEZE', 'UNFREEZE', 'SLASH');

-- CreateEnum
CREATE TYPE "PenaltyType" AS ENUM ('FREEZE', 'SLASH', 'DOWNGRADE');

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "actorType" "ActorType" NOT NULL DEFAULT 'USER',
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "status" "ReviewStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Confirmation" (
    "id" TEXT NOT NULL,
    "targetType" "ConfirmationTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "decision" "ConfirmationDecision" NOT NULL,
    "notes" TEXT,
    "partyType" "ConfirmationPartyType" NOT NULL,
    "partyUserId" TEXT,
    "partyNodeId" TEXT,
    "pobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Confirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attribution" (
    "id" TEXT NOT NULL,
    "pobId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "role" "AttributionRole" NOT NULL DEFAULT 'COLLAB',
    "shareBps" INTEGER NOT NULL,
    "evidenceRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "pobId" TEXT,
    "targetType" "ReviewTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AgentType" NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "endpoint" TEXT,
    "ownerNodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentPermission" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "auditLevel" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "taskId" TEXT,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'SUCCESS',
    "inputs" JSONB,
    "outputs" JSONB,
    "cost" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementCycle" (
    "id" TEXT NOT NULL,
    "kind" "SettlementCycleKind" NOT NULL,
    "status" "SettlementCycleStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "pool" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "policyVersion" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettlementCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementLine" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "scoreTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allocation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pobCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeSeat" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NodeSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StakeLedger" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "action" "StakeAction" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StakeLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penalty" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "type" "PenaltyType" NOT NULL,
    "amount" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Penalty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Confirmation_targetType_targetId_createdAt_idx" ON "Confirmation"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "Confirmation_partyType_createdAt_idx" ON "Confirmation"("partyType", "createdAt");

-- CreateIndex
CREATE INDEX "Confirmation_pobId_idx" ON "Confirmation"("pobId");

-- CreateIndex
CREATE INDEX "Attribution_nodeId_idx" ON "Attribution"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Attribution_pobId_nodeId_key" ON "Attribution"("pobId", "nodeId");

-- CreateIndex
CREATE INDEX "Dispute_targetType_targetId_status_createdAt_idx" ON "Dispute"("targetType", "targetId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Dispute_pobId_idx" ON "Dispute"("pobId");

-- CreateIndex
CREATE INDEX "Agent_ownerNodeId_type_status_idx" ON "Agent"("ownerNodeId", "type", "status");

-- CreateIndex
CREATE INDEX "AgentPermission_agentId_scope_idx" ON "AgentPermission"("agentId", "scope");

-- CreateIndex
CREATE INDEX "AgentRun_agentId_startedAt_idx" ON "AgentRun"("agentId", "startedAt");

-- CreateIndex
CREATE INDEX "AgentRun_taskId_idx" ON "AgentRun"("taskId");

-- CreateIndex
CREATE INDEX "SettlementCycle_status_startAt_idx" ON "SettlementCycle"("status", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementCycle_kind_startAt_endAt_key" ON "SettlementCycle"("kind", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "SettlementLine_nodeId_idx" ON "SettlementLine"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementLine_cycleId_nodeId_key" ON "SettlementLine"("cycleId", "nodeId");

-- CreateIndex
CREATE INDEX "NodeSeat_nodeId_level_idx" ON "NodeSeat"("nodeId", "level");

-- CreateIndex
CREATE INDEX "StakeLedger_nodeId_createdAt_idx" ON "StakeLedger"("nodeId", "createdAt");

-- CreateIndex
CREATE INDEX "Penalty_nodeId_createdAt_idx" ON "Penalty"("nodeId", "createdAt");

-- AddForeignKey
ALTER TABLE "Confirmation" ADD CONSTRAINT "Confirmation_partyUserId_fkey" FOREIGN KEY ("partyUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Confirmation" ADD CONSTRAINT "Confirmation_partyNodeId_fkey" FOREIGN KEY ("partyNodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Confirmation" ADD CONSTRAINT "Confirmation_pobId_fkey" FOREIGN KEY ("pobId") REFERENCES "PoBRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attribution" ADD CONSTRAINT "Attribution_pobId_fkey" FOREIGN KEY ("pobId") REFERENCES "PoBRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attribution" ADD CONSTRAINT "Attribution_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_pobId_fkey" FOREIGN KEY ("pobId") REFERENCES "PoBRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_ownerNodeId_fkey" FOREIGN KEY ("ownerNodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentPermission" ADD CONSTRAINT "AgentPermission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementLine" ADD CONSTRAINT "SettlementLine_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "SettlementCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementLine" ADD CONSTRAINT "SettlementLine_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeSeat" ADD CONSTRAINT "NodeSeat_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StakeLedger" ADD CONSTRAINT "StakeLedger_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;
