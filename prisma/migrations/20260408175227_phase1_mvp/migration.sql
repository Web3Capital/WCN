-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('GLOBAL', 'REGION', 'CITY', 'INDUSTRY', 'FUNCTIONAL', 'AGENT');

-- CreateEnum
CREATE TYPE "NodeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('IDEA', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'GROWTH', 'PUBLIC', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('FUNDRAISING', 'GROWTH', 'RESOURCE', 'LIQUIDITY', 'RESEARCH', 'EXECUTION', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_REVIEW', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssignmentRole" AS ENUM ('LEAD', 'COLLABORATOR');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('CONTRACT', 'TRANSFER', 'REPORT', 'SCREENSHOT', 'LINK', 'ONCHAIN_TX', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewTargetType" AS ENUM ('NODE', 'PROJECT', 'TASK', 'POB');

-- CreateEnum
CREATE TYPE "ReviewDecision" AS ENUM ('APPROVE', 'REJECT', 'NEEDS_CHANGES');

-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL,
    "type" "NodeType" NOT NULL,
    "status" "NodeStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "region" TEXT,
    "city" TEXT,
    "jurisdiction" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "ownerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "stage" "ProjectStage" NOT NULL DEFAULT 'OTHER',
    "sector" TEXT,
    "website" TEXT,
    "pitchUrl" TEXT,
    "fundraisingNeed" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactTelegram" TEXT,
    "description" TEXT,
    "nodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT,
    "ownerNodeId" TEXT,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "role" "AssignmentRole" NOT NULL DEFAULT 'COLLABORATOR',
    "taskId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL DEFAULT 'OTHER',
    "title" TEXT,
    "summary" TEXT,
    "url" TEXT,
    "onchainTx" TEXT,
    "taskId" TEXT,
    "projectId" TEXT,
    "nodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoBRecord" (
    "id" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "baseValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "qualityMult" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "timeMult" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "riskDiscount" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taskId" TEXT,
    "projectId" TEXT,
    "nodeId" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoBRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "targetType" "ReviewTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "decision" "ReviewDecision" NOT NULL,
    "notes" TEXT,
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Node_type_status_createdAt_idx" ON "Node"("type", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Node_ownerUserId_idx" ON "Node"("ownerUserId");

-- CreateIndex
CREATE INDEX "Project_status_createdAt_idx" ON "Project"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Project_nodeId_idx" ON "Project"("nodeId");

-- CreateIndex
CREATE INDEX "Task_type_status_createdAt_idx" ON "Task"("type", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_ownerNodeId_idx" ON "Task"("ownerNodeId");

-- CreateIndex
CREATE INDEX "TaskAssignment_nodeId_idx" ON "TaskAssignment"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_taskId_nodeId_key" ON "TaskAssignment"("taskId", "nodeId");

-- CreateIndex
CREATE INDEX "Evidence_type_createdAt_idx" ON "Evidence"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Evidence_taskId_idx" ON "Evidence"("taskId");

-- CreateIndex
CREATE INDEX "Evidence_projectId_idx" ON "Evidence"("projectId");

-- CreateIndex
CREATE INDEX "Evidence_nodeId_idx" ON "Evidence"("nodeId");

-- CreateIndex
CREATE INDEX "PoBRecord_status_createdAt_idx" ON "PoBRecord"("status", "createdAt");

-- CreateIndex
CREATE INDEX "PoBRecord_taskId_idx" ON "PoBRecord"("taskId");

-- CreateIndex
CREATE INDEX "PoBRecord_projectId_idx" ON "PoBRecord"("projectId");

-- CreateIndex
CREATE INDEX "PoBRecord_nodeId_idx" ON "PoBRecord"("nodeId");

-- CreateIndex
CREATE INDEX "Review_targetType_targetId_createdAt_idx" ON "Review"("targetType", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_ownerNodeId_fkey" FOREIGN KEY ("ownerNodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoBRecord" ADD CONSTRAINT "PoBRecord_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoBRecord" ADD CONSTRAINT "PoBRecord_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoBRecord" ADD CONSTRAINT "PoBRecord_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
