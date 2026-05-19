/**
 * Standalone DB smoke test.
 *
 *   npm run db:test
 *
 * Runs `SELECT * FROM portal.tenants LIMIT 5` and prints the rows to stdout —
 * handy for verifying DATABASE_URL without booting the full server.
 */
import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const rows = (await prisma.$queryRawUnsafe(
      "SELECT * FROM portal.tenants LIMIT 5"
    )) as unknown[];
    console.log(`✓ Connected. portal.tenants returned ${rows.length} row(s).`);
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("✗ Database test failed:");
  console.error(err);
  process.exit(1);
});
