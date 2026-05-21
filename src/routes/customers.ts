import { Router, Request } from "express";
import { requireAuth } from "../middleware/auth";
import { buildMenuItems } from "../lib/menu";
import { safeSelectAllWhere } from "../lib/db";
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

  // One-shot flash message (e.g. "Customer created successfully") set by
  // POST /customers/new — read it then immediately clear so it doesn't stick.
  const sessionAny = req.session as unknown as { flash?: string };
  const flashMessage = sessionAny?.flash || null;
  if (sessionAny) sessionAny.flash = undefined;

  const tenantId = req.session?.tenantId;
  let rows: Record<string, unknown>[] = [];
  let errorMessage: string | null = null;

  if (!tenantId) {
    errorMessage =
      "No tenant in session. Sign out and sign in again so the portal can resolve which firm to query.";
  } else {
    try {
      // Multi-tenant filter — only return customers belonging to the logged-in firm.
      rows = await safeSelectAllWhere(
        "portal",
        "customers",
        { tenant_id: tenantId },
        200
      );
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
    }
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
    flashMessage,
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

/**
 * Mock dataset that mirrors the React component's hardcoded values:
 * 3 search results for the "Fetch from OraxAI" mode, and 2 existing
 * customers used by the duplicate-GLN check. Once a real backend exists,
 * replace these with actual lookups.
 */
const MOCK_SEARCH_RESULTS = [
  { id: "1", name: "Selcuk Ecza Deposu", gln: "5412345678900" },
  { id: "2", name: "Avixa A.Ş.", gln: "5498765432109" },
  { id: "3", name: "Hedef Alliance", gln: "5401234567890" },
];

const MOCK_EXISTING_CUSTOMERS = [
  {
    gln: "5412345678900",
    customerName: "Selcuk Ecza Deposu",
    contactPerson: "Ahmet Yılmaz",
    phone: "+90 212 555 0001",
  },
  {
    gln: "5498765432109",
    customerName: "Avixa A.Ş.",
    contactPerson: "Mehmet Demir",
    phone: "+90 216 555 0002",
  },
];

/**
 * GET /customers/new
 *
 * Renders the 3-mode create-customer form. All interactivity (mode tabs,
 * GLN validation, drag-and-drop file uploader, duplicate modal) is handled
 * client-side by Alpine.js using the data we embed in the script tag below.
 */
router.get("/new", (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  const t = reqAny.t;

  res.render("pages/customers-new", {
    title: t("customers.create.title"),
    pageTitle: t("customers.create.title"),
    pageSubtitle: t("customers.create.subtitle"),
    menuItems: buildMenuItems(req),
    mockSearchResults: MOCK_SEARCH_RESULTS,
    mockExistingCustomers: MOCK_EXISTING_CUSTOMERS,
    labels: {
      fetchMode: t("customers.create.fetchMode"),
      uploadMode: t("customers.create.uploadMode"),
      manualMode: t("customers.create.manualMode"),
      fetchDescription: t("customers.create.fetchDescription"),
      searchPlaceholder: t("customers.create.searchPlaceholder"),
      fetching: t("customers.create.fetching"),
      fetchButton: t("customers.create.fetchButton"),
      fetchSuccess: t("customers.create.fetchSuccess"),
      selectCustomer: t("customers.create.selectCustomer"),
      autoFetchedInfo: t("customers.create.autoFetchedInfo"),
      contactInfo: t("customers.create.contactInfo"),
      customerName: t("customers.create.customerName"),
      customerNamePlaceholder: t("customers.create.customerNamePlaceholder"),
      customerCode: t("customers.create.customerCode"),
      customerCodePlaceholder: t("customers.create.customerCodePlaceholder"),
      customerShortName: t("customers.create.customerShortName"),
      customerShortNamePlaceholder: t("customers.create.customerShortNamePlaceholder"),
      address: t("customers.create.address"),
      addressPlaceholder: t("customers.create.addressPlaceholder"),
      taxOffice: t("customers.create.taxOffice"),
      taxOfficePlaceholder: t("customers.create.taxOfficePlaceholder"),
      taxNumber: t("customers.create.taxNumber"),
      taxNumberPlaceholder: t("customers.create.taxNumberPlaceholder"),
      masterGln: t("customers.create.masterGln"),
      masterGlnPlaceholder: t("customers.create.masterGlnPlaceholder"),
      shipToGln: t("customers.create.shipToGln"),
      shipToGlnPlaceholder: t("customers.create.shipToGlnPlaceholder"),
      gln: t("customers.create.gln"),
      contactPerson: t("customers.create.contactPerson"),
      contactPersonPlaceholder: t("customers.create.contactPersonPlaceholder"),
      phone: t("customers.create.phone"),
      phonePlaceholder: t("customers.create.phonePlaceholder"),
      email: t("customers.create.email"),
      emailPlaceholder: t("customers.create.emailPlaceholder"),
      basicInfo: t("customers.create.basicInfo"),
      downloadTemplate: t("customers.create.downloadTemplate"),
      uploadArea: t("customers.create.uploadArea"),
      uploadAreaOr: t("customers.create.uploadAreaOr"),
      uploadButton: t("customers.create.uploadButton"),
      uploadResult: t("customers.create.uploadResult"),
      successCount: t("customers.create.successCount"),
      errorCount: t("customers.create.errorCount"),
      uploadSuccess: t("customers.create.uploadSuccess"),
      uploadError: t("customers.create.uploadError"),
      validationRequired: t("customers.create.validationRequired"),
      glnValidation: t("customers.create.glnValidation"),
      glnValid: t("customers.create.glnValid"),
      glnInvalid: t("customers.create.glnInvalid"),
      glnDuplicate: t("customers.create.glnDuplicate"),
      customerCreated: t("customers.create.customerCreated"),
      saveCustomer: t("customers.create.saveCustomer"),
      cancel: t("customers.create.cancel"),
      back: t("customers.create.back"),
      duplicateTitle: t("customers.create.duplicateTitle"),
      duplicateBody: t("customers.create.duplicateBody"),
      useExisting: t("customers.create.useExisting"),
      createAnyway: t("customers.create.createAnyway"),
    },
  });
});

/**
 * POST /customers/new
 *
 * Placeholder: we don't yet know the `portal.customers` insert shape, so for
 * the demo this just flashes a success message and bounces back to the list.
 * Real persistence comes after `prisma db pull` and a typed `customer` model.
 */
router.post("/new", (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  if (req.session) {
    (req.session as unknown as { flash?: string }).flash = reqAny.t(
      "customers.create.customerCreated"
    );
  }
  res.redirect("/customers");
});

export default router;
