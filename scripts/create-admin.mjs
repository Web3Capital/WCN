import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Missing POSTGRES_URL (recommended) or DATABASE_URL.");
  process.exit(1);
}
if (url.startsWith("prisma://") || url.startsWith("prisma+postgres://")) {
  console.error("POSTGRES_URL must be a direct postgres:// connection string (not prisma+postgres).");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "Admin";

if (!password || password.length < 8) {
  console.error("Missing/weak ADMIN_PASSWORD. Set ADMIN_PASSWORD (>= 8 chars) and rerun.");
  process.exit(1);
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: "ADMIN" },
    create: { email, name, passwordHash, role: "ADMIN" }
  });

  console.log(`Admin ready: ${user.email} (${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

