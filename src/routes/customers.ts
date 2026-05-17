import { Router, Request } from "express";
import { requireAuth } from "../middleware/auth";
import { buildMenuItems } from "../lib/menu";
import { mockCustomers } from "../data/mockData";

const router = Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  const t = reqAny.t;

  const search = (req.query.search as string | undefined)?.toLowerCase() || "";
  const data = mockCustomers.filter((c) =>
    !search ||
    c.customerCode.toLowerCase().includes(search) ||
    c.customerName.toLowerCase().includes(search)
  );

  const rowsHtml = data
    .map(
      (row) => `
      <tr class="hover:bg-gray-50/70 transition-colors">
        <td class="px-5 py-4 text-sm text-gray-700"><span class="font-mono">${row.customerCode}</span></td>
        <td class="px-5 py-4 text-sm text-gray-700">${row.customerName}</td>
        <td class="px-5 py-4 text-sm text-right">
          <div class="flex justify-end gap-2">
            <button class="inline-flex items-center justify-center h-8 px-3 text-sm rounded-lg text-gray-600 hover:bg-gray-100">${t("common.view")}</button>
            <button class="inline-flex items-center justify-center h-8 px-3 text-sm rounded-lg bg-white border border-gray-200 text-gray-900 hover:bg-gray-50">${t("common.edit")}</button>
            <a href="/customers/${row.id}" class="inline-flex items-center justify-center h-8 px-3 text-sm rounded-lg text-blue-600 hover:bg-gray-100">${t("customers.wareview")}</a>
          </div>
        </td>
      </tr>`
    )
    .join("");

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
    columns: [
      { key: "customerCode", header: t("customers.customerCode") },
      { key: "customerName", header: t("customers.customerName") },
      { key: "actions", header: t("common.actions"), className: "text-right" },
    ],
    rowsHtml: rowsHtml || `<tr><td colspan="3" class="px-5 py-12 text-center text-sm text-gray-500">${t("customers.noResults")}</td></tr>`,
  });
});

export default router;
