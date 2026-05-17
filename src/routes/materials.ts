import { Router, Request } from "express";
import { requireAuth } from "../middleware/auth";
import { buildMenuItems } from "../lib/menu";
import { mockSimpleMaterials } from "../data/mockData";

const router = Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  const t = reqAny.t;

  const search = (req.query.search as string | undefined)?.toLowerCase() || "";
  const tracking = (req.query.tracking as string | undefined) || "all";

  const filtered = mockSimpleMaterials.filter((m) => {
    const matchSearch =
      !search ||
      m.sku.toLowerCase().includes(search) ||
      m.materialName.toLowerCase().includes(search);
    const matchTracking =
      tracking === "all" ||
      (tracking === "yes" && m.itsTracking) ||
      (tracking === "no" && !m.itsTracking);
    return matchSearch && matchTracking;
  });

  const rowsHtml = filtered
    .map((row) => {
      const tone = row.itsTracking ? "green" : "gray";
      const label = row.itsTracking ? t("materials.yes") : t("materials.no");
      return `
        <tr class="hover:bg-gray-50/70 transition-colors">
          <td class="px-5 py-4 text-sm text-gray-700"><span class="font-mono">${row.sku}</span></td>
          <td class="px-5 py-4 text-sm text-gray-700">${row.materialName}</td>
          <td class="px-5 py-4 text-sm text-gray-700">
            <span class="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-transparent text-${tone}-700 border border-${tone}-200">${label}</span>
          </td>
          <td class="px-5 py-4 text-sm text-gray-700">
            <div class="flex items-center gap-2">
              <button class="inline-flex h-8 px-3 items-center text-sm rounded-lg text-gray-600 hover:bg-gray-100">${t("common.view")}</button>
              <button class="inline-flex h-8 px-3 items-center text-sm rounded-lg bg-white border border-gray-200 text-gray-900 hover:bg-gray-50">${t("common.edit")}</button>
              <button class="inline-flex h-8 px-3 items-center text-sm rounded-lg text-red-600 hover:bg-gray-100">${t("common.delete")}</button>
            </div>
          </td>
        </tr>`;
    })
    .join("");

  res.render("pages/materials", {
    title: t("materials.title"),
    pageTitle: t("materials.title"),
    pageDescription: t("materials.reportName"),
    menuItems: buildMenuItems(req),
    search,
    tracking,
    resultsCount: filtered.length,
    labels: {
      newMaterial: t("materials.newMaterial"),
      filterSearch: t("materials.filterSearch"),
      filterSearchPlaceholder: t("materials.filterSearchPlaceholder"),
      filterStatus: t("materials.filterStatus"),
      filter: t("common.filter"),
      resultsFound: t("materials.resultsFound"),
    },
    trackingOptions: [
      { value: "all", label: t("materials.filterStatusAll") },
      { value: "yes", label: t("materials.filterItsTrackingYes") },
      { value: "no", label: t("materials.filterItsTrackingNo") },
    ],
    columns: [
      { key: "sku", header: t("materials.sku") },
      { key: "materialName", header: t("materials.materialName") },
      { key: "itsTracking", header: t("materials.itsTrackingQuestion") },
      { key: "actions", header: t("common.actions") },
    ],
    rowsHtml: rowsHtml || `<tr><td colspan="4" class="px-5 py-12 text-center text-sm text-gray-500">${t("materials.noResults")}</td></tr>`,
  });
});

export default router;
