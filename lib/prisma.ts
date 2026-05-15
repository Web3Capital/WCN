import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getDatasourceUrl() {
  // Prisma 7 + driver adapters require a direct Postgres URL.
  // In Vercel Postgres, POSTGRES_URL is the direct connection string.
  return process.env.POSTGRES_URL || process.env.DATABASE_URL;
}

export function getPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const url = getDatasourceUrl();
  if (!url) {
    throw new Error("Missing database URL. Set POSTGRES_URL or DATABASE_URL.");
  }
  if (url.startsWith("prisma://") || url.startsWith("prisma+postgres://")) {
    throw new Error("POSTGRES_URL must be a direct postgres:// connection string (not prisma+postgres).");
  }

  // SSL precedence:
  //   1. `sslmode=disable` in the URL forces SSL off (CI / local plain pg).
  //   2. `sslmode=require` in the URL forces SSL on.
  //   3. Otherwise default to NODE_ENV: production = SSL, dev = no SSL.
  // This lets `next start` against a plain-text CI postgres opt out without
  // having to override NODE_ENV (which breaks other production behaviour).
  const sslEnabled =
    !url.includes("sslmode=disable") &&
    (url.includes("sslmode=require") || process.env.NODE_ENV === "production");
  // Default max=2 per instance. On Vercel Fluid Compute the runtime keeps many
  // function instances warm; with max=10 we'd exhaust Postgres `max_connections=100`
  // at ~10 concurrent instances. A connection pooler (PgBouncer / Neon pooler /
  // Prisma Accelerate) should sit in front for production. Override with DB_POOL_MAX.
  const pool = new Pool({
    connectionString: url,
    max: Number(process.env.DB_POOL_MAX) || 2,
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: Number(process.env.DB_POOL_CONNECT_TIMEOUT) || 5000,
    ...(sslEnabled && {
      ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === "true" },
    }),
  });
  const adapter = new PrismaPg(pool);

  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

  return globalForPrisma.prisma;
}

