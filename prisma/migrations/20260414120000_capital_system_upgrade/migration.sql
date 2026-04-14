-- Capital System Upgrade: add new fields to CapitalProfile
ALTER TABLE "CapitalProfile" ADD COLUMN "investorType" TEXT;
ALTER TABLE "CapitalProfile" ADD COLUMN "aum" TEXT;
ALTER TABLE "CapitalProfile" ADD COLUMN "instruments" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "CapitalProfile" ADD COLUMN "maxConcurrentDeals" INTEGER;
ALTER TABLE "CapitalProfile" ADD COLUMN "activeDealCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CapitalProfile" ADD COLUMN "decisionTimeline" TEXT;
ALTER TABLE "CapitalProfile" ADD COLUMN "totalDeployed" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "CapitalProfile" ADD COLUMN "totalDeals" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CapitalProfile" ADD COLUMN "avgTicketSize" DOUBLE PRECISION;

-- Index for investor type filtering
CREATE INDEX "CapitalProfile_investorType_idx" ON "CapitalProfile"("investorType");
