import { Router, Request } from "express";
import { requireAuth } from "../middleware/auth";
import { buildMenuItems } from "../lib/menu";
import {
  mockInventory,
  mockKPIInventory,
  InventoryItem,
  InventoryStatus,
} from "../data/mockData";

const router = Router();
router.use(requireAuth);

function statusTone(status: InventoryStatus): string {
  if (status === "salable") return "green";
  if (status === "reserved") return "blue";
  if (status === "quarantine") return "orange";
  return "red";
}

router.get("/", (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  const t = reqAny.t;

  const search = (req.query.search as string | undefined)?.toLowerCase() || "";
  const statusFilter = (req.query.status as string | undefined) || "all";

  // Enrich the mock data the same way the Next page did (synthetic pallet/location/expiry)
  const enriched: InventoryItem[] = mockInventory.map((material, i) => ({
    ...material,
    palletNo: `P${String(i + 740).padStart(8, "0")}`,
    location: `10R03${String(i + 203).padStart(3, "0")}`,
    expiryDate: material.expiryDate ? "2027-12-31" : "2035-12-31",
    customer: "Selcuk Ecza Deposu",
  }));

  const data = enriched
    .filter((row) => {
      const matchSearch =
        row.materialName.toLowerCase().includes(search) ||
        row.lot.toLowerCase().includes(search);
      const matchStatus = statusFilter === "all" || row.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => a.materialName.localeCompare(b.materialName));

  const kpiCards = [
    { title: t("inventory.totalStock"), value: mockKPIInventory.totalStock, icon: "package", variant: "blue" },
    { title: t("inventory.totalPallets"), value: mockKPIInventory.salableStock, icon: "box", variant: "purple" },
    { title: t("inventory.salableStock"), value: mockKPIInventory.reservedStock, icon: "trending-up", variant: "green" },
    { title: t("inventory.reservedStock"), value: mockKPIInventory.reservedStock, icon: "trending-down", variant: "blue" },
    { title: t("inventory.expiringSoonStock"), value: mockKPIInventory.quarantineStock, icon: "alert-triangle", variant: "yellow" },
  ];

  const rowsHtml = data
    .map((row) => {
      const tone = statusTone(row.status);
      return `
        <tr class="hover:bg-gray-50/70 transition-colors">
          <td class="px-5 py-4 text-sm text-gray-700"><span class="font-mono">${row.palletNo}</span></td>
          <td class="px-5 py-4 text-sm text-gray-700">
            <span class="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-${tone}-100 text-${tone}-700 capitalize">${t("inventory.status." + row.status)}</span>
          </td>
          <td class="px-5 py-4 text-sm text-gray-700"><span class="capitalize">${row.sku}</span></td>
          <td class="px-5 py-4 text-sm text-gray-700">${row.materialName}</td>
          <td class="px-5 py-4 text-sm text-gray-700">${row.lot}</td>
          <td class="px-5 py-4 text-sm text-gray-700">${row.originalQuantity}</td>
          <td class="px-5 py-4 text-sm text-right"><span class="font-semibold">${row.currentQuantity}</span></td>
          <td class="px-5 py-4 text-sm text-right">
            <div class="flex justify-end gap-2">
              <button class="px-2 py-1 text-xs border rounded hover:bg-gray-100">${t("common.view")}</button>
              <a href="/wareview" class="px-2 py-1 text-xs border rounded hover:bg-blue-100 text-blue-600">${t("inventory.wareview")}</a>
            </div>
          </td>
        </tr>`;
    })
    .join("");

  res.render("pages/inventory", {
    title: t("inventory.title"),
    pageTitle: t("inventory.title"),
    pageDescription: t("inventory.description"),
    menuItems: buildMenuItems(req),
    kpiCards,
    columns: [
      { key: "palletNo", header: t("inventory.columns.pallet") },
      { key: "status", header: t("inventory.columns.status") },
      { key: "sku", header: t("inventory.columns.sku") },
      { key: "materialName", header: t("inventory.columns.material") },
      { key: "lot", header: t("inventory.columns.lot") },
      { key: "originalQuantity", header: t("inventory.columns.original") },
      { key: "currentQuantity", header: t("inventory.columns.quantity"), className: "text-right" },
      { key: "actions", header: t("common.actions"), className: "text-right" },
    ],
    rowsHtml: rowsHtml || `<tr><td colspan="8" class="px-5 py-12 text-center text-sm text-gray-500">${t("inventory.noResults")}</td></tr>`,
    search,
    statusFilter,
    exportLabel: t("common.export"),
    filterLabel: t("common.filter"),
    searchLabel: t("common.search"),
    statusOptions: [
      { value: "all", label: t("inventory.allStatus") },
      { value: "salable", label: t("inventory.salable") },
      { value: "reserved", label: t("inventory.reserved") },
      { value: "quarantine", label: t("inventory.quarantine") },
      { value: "damaged", label: t("inventory.damaged") },
    ],
    labels: {
      searchPlaceholder: t("inventory.search"),
      filterPalletNo: t("inventory.filterPalletNo"),
      enterPalletNo: t("inventory.enterPalletNo"),
      filterSku: t("inventory.filterSku"),
      enterSku: t("inventory.enterSku"),
      filterLot: t("inventory.filterLot"),
      enterLot: t("inventory.enterLot"),
      filterStatus: t("inventory.filterStatus"),
    },
  });
});

export default router;
