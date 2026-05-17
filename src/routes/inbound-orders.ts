import { Router, Request } from "express";
import { requireAuth } from "../middleware/auth";
import { buildMenuItems } from "../lib/menu";
import { buildOrderRows } from "../lib/orders";
import { mockOutboundOrders } from "../data/mockData";

const router = Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  const t = reqAny.t;

  // The Next.js inbound page also rendered the same mock data shape (it shared
  // `mockOutboundOrders`). We keep parity until real inbound data lands.
  const rowsHtml = buildOrderRows(mockOutboundOrders, t);

  res.render("pages/orders", {
    title: t("inboundOrders.title"),
    pageTitle: t("inboundOrders.title"),
    pageDescription: t("inboundOrders.description"),
    newOrderLabel: t("inboundOrders.newOrder"),
    newOrderHref: "/inbound-orders/new",
    exportLabel: t("common.export"),
    filtersLabel: t("inboundOrders.filters"),
    orderNoLabel: t("inboundOrders.orderNo"),
    aviLabel: t("inboundOrders.avi"),
    menuItems: buildMenuItems(req),
    columns: [
      { key: "orderDate", header: t("inboundOrders.columns.orderDate") },
      { key: "completionDate", header: t("inboundOrders.columns.completionDate") },
      { key: "customer", header: t("inboundOrders.columns.customer") },
      { key: "orderNo", header: t("inboundOrders.columns.orderNo") },
      { key: "avi", header: t("inboundOrders.columns.avi") },
      { key: "warehouse", header: t("inboundOrders.columns.warehouse") },
      { key: "sku", header: t("inboundOrders.columns.sku") },
      { key: "productName", header: t("inboundOrders.columns.product") },
      { key: "lot", header: t("inboundOrders.columns.lot") },
      { key: "quantity", header: t("inboundOrders.columns.quantity"), className: "text-right" },
      { key: "totalBoxes", header: t("inboundOrders.columns.boxes"), className: "text-right" },
      { key: "itsTransferId", header: t("inboundOrders.columns.itsTransfer") },
      { key: "status", header: t("inboundOrders.columns.status") },
    ],
    rowsHtml,
  });
});

export default router;
