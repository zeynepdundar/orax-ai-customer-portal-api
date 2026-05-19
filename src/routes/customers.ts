import { Router, Request } from "express";
import { requireAuth } from "../middleware/auth";
import { buildMenuItems } from "../lib/menu";
import { safeSelectAll } from "../lib/db";
import { iconSvg } from "../views/icons";

const router = Router();
router.use(requireAuth);

/**
 * Pick the first key from `row` matching any of the given candidate names.
 * Used to map DB column names (which may be snake_case, prefixed, etc.) onto
 * the three UI fields we render: id, code, name.
 *
 * Tweak these lists if your `portal.customers` uses different names.
 */
const ID_FIELDS = ["id", "customer_id", "customerId", "uuid"];
const CODE_FIELDS = [
  "customer_code",
  "code",
  "customer_no",
  "customerCode",
  "customer_number",
];
const NAME_FIELDS = [
  "customer_name",
  "name",
  "customerName",
  "company_name",
  "title",
  "display_name",
];

function pickField(row: Record<string, unknown>, candidates: string[]): string | null {
  for (const c of candidates) {
    if (c in row) return c;
  }
  return null;
}

/**
 * GET /customers
 *
 * Reads `portal.customers` via `safeSelectAll` (handles tsvector et al.),
 * then renders three columns: Customer Code (font-mono), Customer Name,
 * Actions (View / Edit / WareView). Column-name mapping is heuristic — if
 * detection fails, the page shows a helpful debug card listing the actual
 * column names so you can update CODE_FIELDS/NAME_FIELDS above.
 */
router.get("/", async (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  const t = reqAny.t;

  const search = ((req.query.search as string | undefined) || "").trim().toLowerCase();

  let rows: Record<string, unknown>[] = [];
  let errorMessage: string | null = null;

  try {
    rows = await safeSelectAll("portal", "customers", 200);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  // In-memory search across every column. Cheap because we limit to 200 rows.
  if (search && rows.length > 0) {
    rows = rows.filter((row) =>
      Object.values(row).some(
        (v) => v != null && String(v).toLowerCase().includes(search)
      )
    );
  }

  // Detect which DB column maps to each UI field, using the first row as a sample.
  const sample = rows[0];
  const idKey = sample ? pickField(sample, ID_FIELDS) : null;
  const codeKey = sample ? pickField(sample, CODE_FIELDS) : null;
  const nameKey = sample ? pickField(sample, NAME_FIELDS) : null;

  // If we couldn't detect the key fields, fall through to a debug-friendly
  // message so the user can see which columns are actually available.
  const detected = Boolean(codeKey && nameKey);
  const availableColumns = sample ? Object.keys(sample) : [];

  // Static three-column header — matches the original mock design.
  const columns = [
    { key: "customerCode", header: t("customers.customerCode") },
    { key: "customerName", header: t("customers.customerName") },
    { key: "actions", header: t("common.actions"), className: "text-right" },
  ];

  let rowsHtml = "";
  if (detected) {
    rowsHtml = rows
      .map((row) => {
        const code = codeKey ? row[codeKey] : null;
        const name = nameKey ? row[nameKey] : null;
        const id = idKey ? row[idKey] : null;

        const codeCell =
          code === null || code === undefined
            ? `<span class="text-gray-300">—</span>`
            : `<span class="font-mono">${escapeHtml(String(code))}</span>`;
        const nameCell =
          name === null || name === undefined
            ? `<span class="text-gray-300">—</span>`
            : escapeHtml(String(name));

        const wareviewHref =
          id != null ? `/customers/${encodeURIComponent(String(id))}` : "#";
        const viewHref =
          id != null ? `/customers/${encodeURIComponent(String(id))}/view` : "#";
        const editHref =
          id != null ? `/customers/${encodeURIComponent(String(id))}/edit` : "#";

        return `
          <tr class="hover:bg-gray-50/70 transition-colors">
            <td class="px-5 py-4 text-sm text-gray-700">${codeCell}</td>
            <td class="px-5 py-4 text-sm text-gray-700">${nameCell}</td>
            <td class="px-5 py-4 text-sm text-right">
              <div class="relative inline-block" x-data="{ open: false }" @click.outside="open = false" @keydown.escape.window="open = false">
                <button
                  type="button"
                  @click="open = !open"
                  aria-haspopup="menu"
                  :aria-expanded="open"
                  aria-label="${escapeHtml(t("common.actions"))}"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100">
                  ${iconSvg("more-vertical", "w-4 h-4")}
                </button>
                <div
                  x-show="open"
                  x-cloak
                  x-transition.opacity.duration.150ms
                  role="menu"
                  class="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden z-30">
                  <a href="${viewHref}" role="menuitem" class="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    ${iconSvg("eye", "w-4 h-4")}
                    ${escapeHtml(t("common.view"))}
                  </a>
                  <a href="${editHref}" role="menuitem" class="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    ${iconSvg("edit-2", "w-4 h-4")}
                    ${escapeHtml(t("common.edit"))}
                  </a>
                  <div class="border-t border-gray-100"></div>
                  <a href="${wareviewHref}" role="menuitem" class="flex items-center gap-2 w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50">
                    ${iconSvg("eye", "w-4 h-4")}
                    ${escapeHtml(t("customers.wareview"))}
                  </a>
                </div>
              </div>
            </td>
          </tr>`;
      })
      .join("");
  }

  const noRowsHtml = `<tr><td colspan="3" class="px-5 py-12 text-center text-sm text-gray-500">${t(
    "customers.noResults"
  )}</td></tr>`;

  res.render("pages/customers", {
    title: t("customers.title"),
    pageTitle: t("customers.title"),
    pageDescription: t("customers.description"),
    menuItems: buildMenuItems(req),
    search,
    searchLabel: t("common.search"),
    searchPlaceholder: t("customers.searchPlaceholder"),
    exportLabel: t("common.export"),
    newCustomerLabel: t("customers.newCustomer"),
    columns,
    rowsHtml: rowsHtml || noRowsHtml,
    errorMessage,
    count: rows.length,
    detected,
    detectedKeys: { id: idKey, code: codeKey, name: nameKey },
    availableColumns,
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
