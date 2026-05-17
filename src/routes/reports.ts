import { Router, Request } from "express";
import { requireAuth } from "../middleware/auth";
import { buildMenuItems } from "../lib/menu";
import { mockChartData, mockMaterials } from "../data/mockData";

const router = Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  const t = reqAny.t;

  const lineData = {
    labels: mockChartData.stockTrend.map((d) => d.name),
    datasets: [
      {
        label: t("reports.stockLevel"),
        data: mockChartData.stockTrend.map((d) => d.stock),
        fill: false,
        borderColor: "#3b82f6",
        tension: 0.1,
      },
    ],
  };

  const barData = {
    labels: mockChartData.orderVolume.map((d) => d.name),
    datasets: [
      {
        label: t("reports.inbound"),
        data: mockChartData.orderVolume.map((d) => d.inbound),
        backgroundColor: "#10b981",
        borderRadius: 4,
      },
      {
        label: t("reports.outbound"),
        data: mockChartData.orderVolume.map((d) => d.outbound),
        backgroundColor: "#f59e0b",
        borderRadius: 4,
      },
    ],
  };

  const summaryData = [
    { label: t("reports.totalOrders"), value: 156, icon: "shopping-bag", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: t("reports.inboundOrders"), value: 89, icon: "arrow-down-to-line", iconBg: "bg-green-50", iconColor: "text-green-600" },
    { label: t("reports.outboundOrders"), value: 67, icon: "arrow-up-from-line", iconBg: "bg-orange-50", iconColor: "text-orange-600" },
    { label: t("reports.totalItems"), value: "2,450", icon: "boxes", iconBg: "bg-purple-50", iconColor: "text-purple-600" },
  ];

  const productOptions = [
    { value: "all", label: t("reports.allProducts") },
    ...mockMaterials.map((m) => ({ value: m.productCode, label: m.productName })),
  ];

  const localeOptions = [
    { value: "en", label: t("reports.english") },
    { value: "tr", label: t("reports.turkish") },
  ];

  const orderTypeOptions = [
    { value: "all", label: t("reports.allTypes") },
    { value: "inbound", label: t("reports.inbound") },
    { value: "outbound", label: t("reports.outbound") },
  ];

  res.render("pages/reports", {
    title: t("reports.title"),
    pageTitle: t("reports.title"),
    pageSubtitle: t("reports.subtitle"),
    menuItems: buildMenuItems(req),
    labels: {
      language: t("reports.language"),
      askAssistant: t("reports.askAssistant"),
      askPlaceholder: t("reports.askPlaceholder"),
      ask: t("reports.ask"),
      assistantResponse: t("reports.assistantResponse"),
      demoHint: t("reports.demoHint"),
      newQuestion: t("reports.newQuestion"),
      filters: t("reports.filters"),
      dateFrom: t("reports.dateFrom"),
      dateTo: t("reports.dateTo"),
      product: t("reports.product"),
      orderType: t("reports.orderType"),
      exportExcel: t("reports.exportExcel"),
      exportPDF: t("reports.exportPDF"),
      stockTrend: t("reports.stockTrend"),
      orderVolume: t("reports.orderVolume"),
    },
    localeOptions,
    productOptions,
    orderTypeOptions,
    summaryData,
    chartData: { line: lineData, bar: barData },
    pageScripts: ["https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"],
  });
});

export default router;
