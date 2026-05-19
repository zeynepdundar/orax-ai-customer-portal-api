import { Router, Request } from "express";
import { requireAuth } from "../middleware/auth";
import { buildMenuItems } from "../lib/menu";
import { safeSelectAll } from "../lib/db";

const router = Router();
router.use(requireAuth);

/**
 * GET /tenants
 *
 * Lists tenants from the real database. Uses `$queryRawUnsafe` so the page
 * keeps working whether or not the Prisma `Tenant` model matches your
 * actual schema — once `prisma db pull` is run you can swap this for a
 * typed `prisma.tenant.findMany()` call.
 */
router.get("/", async (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  const t = reqAny.t;

  let rows: Record<string, unknown>[] = [];
  let errorMessage: string | null = null;

  try {
    rows = await safeSelectAll("portal", "tenants", 50);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  // Derive columns from the first row so the table adapts to whatever shape
  // your `portal.tenants` actually has.
  const columnKeys = rows[0] ? Object.keys(rows[0]) : [];
  const columns = columnKeys.map((key) => ({
    key,
    header: key,
  }));

  const rowsHtml = rows
    .map((row) => {
      const cells = columnKeys
        .map((key) => {
          const value = row[key];
          const display =
            value === null || value === undefined
              ? `<span class="text-gray-300">—</span>`
              : typeof value === "object"
              ? `<code class="text-xs">${escapeHtml(JSON.stringify(value))}</code>`
              : escapeHtml(String(value));
          return `<td class="px-5 py-4 text-sm text-gray-700">${display}</td>`;
        })
        .join("");
      return `<tr class="hover:bg-gray-50/70 transition-colors">${cells}</tr>`;
    })
    .join("");

  res.render("pages/tenants", {
    title: "Tenants",
    pageTitle: "Tenants",
    pageDescription: "Live data from `portal.tenants` (first 50 rows)",
    menuItems: buildMenuItems(req),
    rows,
    columns,
    rowsHtml:
      rowsHtml ||
      `<tr><td colspan="${Math.max(columns.length, 1)}" class="px-5 py-12 text-center text-sm text-gray-500">${t(
        "common.search"
      ) && "No tenants found."}</td></tr>`,
    errorMessage,
    count: rows.length,
  });
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default router;
