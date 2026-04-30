-- Composite indexes for dashboard list queries.
--
-- Each index targets a specific filter+orderBy pattern observed in
-- app/[locale]/dashboard/{deals,capital,nodes}/page.tsx. Without these
-- composites, Postgres falls back to a filter scan + filesort which gets
-- expensive once tables hold tens of thousands of rows.
--
-- Note on CONCURRENTLY: Prisma migrate wraps each migration in a single
-- transaction, but CREATE INDEX CONCURRENTLY cannot run inside one. For
-- the table sizes WCN currently has, regular CREATE INDEX (which holds a
-- ShareLock blocking writes for a few seconds) is acceptable. If a table
-- grows past ~1M rows, this migration should be re-issued out-of-band as:
--   psql $POSTGRES_URL -c 'CREATE INDEX CONCURRENTLY ...'
-- and the corresponding statement here removed.

-- Deal: where stage = ? order by updatedAt desc
CREATE INDEX IF NOT EXISTS "Deal_stage_updatedAt_idx"
  ON "Deal" ("stage", "updatedAt" DESC);

-- CapitalProfile: where status = ? order by createdAt desc
CREATE INDEX IF NOT EXISTS "CapitalProfile_status_createdAt_idx"
  ON "CapitalProfile" ("status", "createdAt" DESC);

-- Node: member view (where ownerUserId = ? order by createdAt desc).
-- Single [ownerUserId] index left in place — it covers point lookups.
CREATE INDEX IF NOT EXISTS "Node_ownerUserId_createdAt_idx"
  ON "Node" ("ownerUserId", "createdAt" DESC);
