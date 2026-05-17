import { Router, Request } from "express";
import { requireAuth } from "../middleware/auth";
import { buildMenuItems } from "../lib/menu";
import { mockKPIs, recentTransactions } from "../data/mockData";

const router = Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  const t = reqAny.t;

  const kpiCards = [
    { title: t("dashboard.totalStock"), value: mockKPIs.totalStock, icon: "package", variant: "blue" },
    { title: t("dashboard.inboundToday"), value: mockKPIs.inboundToday, icon: "arrow-down-to-line", variant: "green" },
    { title: t("dashboard.outboundToday"), value: mockKPIs.outboundToday, icon: "arrow-up-from-line", variant: "orange" },
    { title: t("dashboard.pendingOrders"), value: mockKPIs.pendingOrders, icon: "trending-up", variant: "purple" },
  ];

  // Build the rows of the recent-transactions table in the controller so the
  // template stays declarative (matches React's per-row `render` callbacks).
  const rowsHtml = recentTransactions
    .map((row) => {
      const typeLabel = row.type === "Inbound" ? t("dashboard.types.inbound") : t("dashboard.types.outbound");
      const typeTone = row.type === "Inbound" ? "green" : "orange";

      let statusLabel = row.status;
      let statusTone: "green" | "orange" | "blue" = "blue";
      if (row.status === "Completed") {
        statusLabel = t("dashboard.statuses.completed");
        statusTone = "green";
      } else if (row.status === "In Transit") {
        statusLabel = t("dashboard.statuses.inTransit");
        statusTone = "orange";
      }

      return `
        <tr class="hover:bg-gray-50/70 transition-colors">
          <td class="px-5 py-4 text-sm text-gray-700">${row.date}</td>
          <td class="px-5 py-4 text-sm text-gray-700">
            <span class="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-transparent text-${typeTone}-700 border border-${typeTone}-200">${typeLabel}</span>
          </td>
          <td class="px-5 py-4 text-sm text-gray-700">${row.customer}</td>
          <td class="px-5 py-4 text-sm text-gray-600">${row.quantity}</td>
          <td class="px-5 py-4 text-sm text-gray-700">
            <span class="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-${statusTone}-100 text-${statusTone}-700">${statusLabel}</span>
          </td>
          <td class="px-5 py-4 text-sm text-right">
            <button class="text-sm text-gray-500 hover:text-gray-900 transition-colors">${t("common.view")}</button>
          </td>
        </tr>`;
    })
    .join("");

  res.render("pages/dashboard", {
    title: t("dashboard.title"),
    pageTitle: t("dashboard.title"),
    pageDescription: t("dashboard.description"),
    menuItems: buildMenuItems(req),
    kpiCards,
    columns: [
      { key: "date", header: t("dashboard.columns.date") },
      { key: "type", header: t("dashboard.columns.type") },
      { key: "customer", header: t("dashboard.columns.customer") },
      { key: "quantity", header: t("dashboard.columns.quantity") },
      { key: "status", header: t("dashboard.columns.status") },
      { key: "actions", header: t("common.actions"), className: "text-right" },
    ],
    rowsHtml,
  });
});

export default router;
