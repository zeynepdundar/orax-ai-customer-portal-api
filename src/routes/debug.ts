import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * GET /debug/db
 *
 * Sanity-check endpoint: pings the database, then runs the smoke-test query
 * (`SELECT * FROM portal.tenants LIMIT 5`) and returns the result as JSON.
 * Uses `$queryRawUnsafe` so it works even before `prisma db pull` has been
 * run — i.e. regardless of the actual Tenant column shape.
 *
 * In production, gate this route behind real auth / a feature flag.
 */
router.get("/db", async (_req, res) => {
  try {
    const ping = (await prisma.$queryRawUnsafe("SELECT 1 AS ok")) as { ok: number }[];
    const tenants = (await prisma.$queryRawUnsafe(
      "SELECT * FROM portal.tenants LIMIT 5"
    )) as unknown[];

    res.json({
      ok: true,
      ping,
      tenantsCount: tenants.length,
      tenants,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      ok: false,
      error: message,
      hint:
        "Check DATABASE_URL in .env, make sure Postgres is reachable, and " +
        "that the schema `portal` + table `tenants` exist.",
    });
  }
});

export default router;
