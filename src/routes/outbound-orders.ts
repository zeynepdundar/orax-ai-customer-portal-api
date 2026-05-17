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

  const rowsHtml = buildOrderRows(mockOutboundOrders, t);

  res.render("pages/orders", {
    title: t("outboundOrders.title"),
    pageTitle: t("outboundOrders.title"),
    pageDescription: t("outboundOrders.description"),
    newOrderLabel: t("outboundOrders.newOrder"),
    newOrderHref: "/outbound-orders/new",
    exportLabel: t("common.export"),
    filtersLabel: t("outboundOrders.filters"),
    orderNoLabel: t("outboundOrders.orderNo"),
    aviLabel: t("outboundOrders.avi"),
    menuItems: buildMenuItems(req),
    columns: [
      { key: "orderDate", header: t("outboundOrders.columns.orderDate") },
      { key: "completionDate", header: t("outboundOrders.columns.completionDate") },
      { key: "customer", header: t("outboundOrders.columns.customer") },
      { key: "orderNo", header: t("outboundOrders.columns.orderNo") },
      { key: "avi", header: t("outboundOrders.columns.avi") },
      { key: "warehouse", header: t("outboundOrders.columns.warehouse") },
      { key: "sku", header: t("outboundOrders.columns.sku") },
      { key: "productName", header: t("outboundOrders.columns.product") },
      { key: "lot", header: t("outboundOrders.columns.lot") },
      { key: "quantity", header: t("outboundOrders.columns.quantity"), className: "text-right" },
      { key: "totalBoxes", header: t("outboundOrders.columns.boxes"), className: "text-right" },
      { key: "itsTransferId", header: t("outboundOrders.columns.itsTransfer") },
      { key: "status", header: t("outboundOrders.columns.status") },
    ],
    rowsHtml,
  });
});

export default router;
