import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * In dev, nodemon restarts the process when files change — we cache the client
 * on `globalThis` so we don't leak connections across reloads.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
