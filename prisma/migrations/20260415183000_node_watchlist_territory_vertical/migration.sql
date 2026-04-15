-- Node PRD v1.0: operational Watchlist + territory/vertical dimensions

ALTER TYPE "NodeStatus" ADD VALUE 'WATCHLIST';

ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "vertical" TEXT;
ALTER TABLE "Node" ADD COLUMN IF NOT EXISTS "territoryJson" JSONB;
