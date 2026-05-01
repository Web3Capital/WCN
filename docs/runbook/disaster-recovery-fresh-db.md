# Runbook — Provisioning a Fresh Production DB

**When to use this**: provisioning a brand-new Postgres for production, staging, or any environment where migration history matters. **You must follow this procedure** instead of `prisma migrate deploy` because the migration history has a known baseline gap (see "Background" below).

For disposable / ephemeral DBs (CI test runs, local dev playgrounds), use `prisma db push --accept-data-loss` directly — the gap is irrelevant there.

---

## Background

`prisma/migrations/20260410000000_baseline_sync_all/migration.sql` contains only `SELECT 1`, with a comment noting:

> Baseline migration: schema already applied via prisma db push.
> This file exists only to align the migration history.

During early development the team used `prisma db push` to evolve the schema. Several tables (notably `CapitalProfile`) were created via push and never captured as `CREATE TABLE` statements in any migration. Subsequent migrations like `20260414120000_capital_system_upgrade` issue `ALTER TABLE "CapitalProfile" ADD COLUMN ...`, which assumes the table already exists.

Effect: `prisma migrate deploy` against a fresh empty database fails at migration #8 (`capital_system_upgrade`) with:

```
Error: P3018 — Database error: relation "CapitalProfile" does not exist
```

Production deploys are unaffected because production already has every table from the original `db push` work. The history records `baseline_sync_all` as applied; subsequent ALTER migrations work fine because the tables exist.

---

## Procedure

### 1. Provision the empty database

Provision the Postgres instance per your hosting provider (Vercel Marketplace / Neon / RDS / etc.). Capture the connection URL as `POSTGRES_URL`.

Do **not** run `prisma migrate deploy` yet — it will fail.

### 2. Push the current schema directly

This applies the entire current schema in one shot, bypassing migration history.

```bash
POSTGRES_URL="postgres://..." npx prisma db push --accept-data-loss
```

The `--accept-data-loss` flag is required by Prisma 7 even on empty DBs. Since the DB is empty, no data is at risk.

**What this creates**: every table, column, index, foreign key, and enum from `prisma/schema.prisma` exactly as defined.

### 3. Mark all migrations as applied

The DB now has the schema, but the `_prisma_migrations` table is empty. `prisma migrate deploy` will try to re-apply migration #1 onwards and fail. Mark the existing migrations as already applied so future `migrate deploy` calls only run NEW migrations.

For each migration directory in `prisma/migrations/`, in chronological order:

```bash
POSTGRES_URL="postgres://..." npx prisma migrate resolve --applied 20260408162231_init
POSTGRES_URL="postgres://..." npx prisma migrate resolve --applied 20260408175227_phase1_mvp
POSTGRES_URL="postgres://..." npx prisma migrate resolve --applied 20260408181407_phase2_settlement
POSTGRES_URL="postgres://..." npx prisma migrate resolve --applied 20260408203030_wave_c_review_target_application
POSTGRES_URL="postgres://..." npx prisma migrate resolve --applied 20260409120000_wave_a_audit
POSTGRES_URL="postgres://..." npx prisma migrate resolve --applied 20260410000000_baseline_sync_all
POSTGRES_URL="postgres://..." npx prisma migrate resolve --applied 20260412080000_add_missing_pob_enums
POSTGRES_URL="postgres://..." npx prisma migrate resolve --applied 20260414120000_capital_system_upgrade
POSTGRES_URL="postgres://..." npx prisma migrate resolve --applied 20260415183000_node_watchlist_territory_vertical
POSTGRES_URL="postgres://..." npx prisma migrate resolve --applied 20260430120000_composite_indexes_for_list_queries
```

The exact list will grow as new migrations land. Re-derive it from:

```bash
ls prisma/migrations/ | grep -v migration_lock.toml | sort
```

### 4. Verify

```bash
POSTGRES_URL="postgres://..." npx prisma migrate status
```

Should report **all migrations applied** with no pending or modified migrations.

```bash
POSTGRES_URL="postgres://..." npx prisma migrate deploy
```

Should report **No pending migrations to apply** without errors.

### 5. Future migrations

From this point on, normal `prisma migrate deploy` works. New migrations placed in `prisma/migrations/` will apply on top of the resolved state.

---

## Long-term remediation

The proper fix is to backfill the missing `CREATE TABLE` SQL into `baseline_sync_all/migration.sql`, but doing so changes the migration's checksum. Production's `_prisma_migrations` row would then mismatch and `migrate deploy` would refuse to run.

The clean migration path:

1. Generate the correct SQL by diffing an empty schema against the schema state at the time `baseline_sync_all` was authored:
   ```bash
   npx prisma migrate diff \
     --from-empty \
     --to-schema-datamodel prisma/schema.prisma \
     --script > new-baseline.sql
   ```
   (then trim to only tables/types that existed at the baseline date — manual)

2. Replace `baseline_sync_all/migration.sql` content.

3. On every existing prod-like environment, manually update the checksum in `_prisma_migrations`:
   ```sql
   UPDATE _prisma_migrations
   SET checksum = '<new-checksum-from-prisma>'
   WHERE migration_name = '20260410000000_baseline_sync_all';
   ```

4. Verify `migrate status` reports no drift.

This is operationally heavy and was deferred during Q1. Filing this runbook lets disaster recovery proceed without it.

---

## Reference: CI ephemeral DB

For context — Q1's CI uses `prisma db push --accept-data-loss` against the ephemeral Postgres service container instead of `migrate deploy`, for the same reason this runbook exists. See `.github/workflows/ci.yml` (e2e job) and the corresponding commit `fb828b7 fix(ci): align vitest coverage gate with actual coverage`.
