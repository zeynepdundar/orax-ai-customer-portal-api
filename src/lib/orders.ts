import { OutboundOrderItem, OutboundOrderStatus } from "../data/mockData";

export function statusTone(status: OutboundOrderStatus): "green" | "blue" | "orange" | "red" | "gray" {
  switch (status) {
    case "packing_completed":
      return "green";
    case "packing_started":
      return "blue";
    case "picking_started":
      return "orange";
    case "not_started":
      return "red";
    case "picking_completed":
      return "gray";
    default:
      return "gray";
  }
}

export function buildOrderRows(
  orders: OutboundOrderItem[],
  t: (k: string) => string
): string {
  const labels: Record<OutboundOrderStatus, string> = {
    not_started: t("outboundOrders.status.notStarted"),
    picking_started: t("outboundOrders.status.picking"),
    picking_completed: t("outboundOrders.status.picked"),
    packing_started: t("outboundOrders.status.packing"),
    packing_completed: t("outboundOrders.status.completed"),
  };

  return orders
    .map((row) => {
      const tone = statusTone(row.status);
      return `
        <tr class="hover:bg-gray-50/70 transition-colors">
          <td class="px-5 py-4 text-sm text-gray-700">${row.orderDate}</td>
          <td class="px-5 py-4 text-sm text-gray-700">${row.completionDate || "-"}</td>
          <td class="px-5 py-4 text-sm text-gray-700">${row.customer}</td>
          <td class="px-5 py-4 text-sm text-gray-700 font-mono">${row.orderNo}</td>
          <td class="px-5 py-4 text-sm text-gray-700 font-mono text-gray-600">${row.avi}</td>
          <td class="px-5 py-4 text-sm text-gray-700">${row.warehouse}</td>
          <td class="px-5 py-4 text-sm text-gray-700 font-mono text-gray-600">${row.sku}</td>
          <td class="px-5 py-4 text-sm text-gray-700">${row.productName}</td>
          <td class="px-5 py-4 text-sm text-gray-700 font-mono text-gray-600">${row.lot}</td>
          <td class="px-5 py-4 text-sm text-right text-gray-600">${row.quantity.toLocaleString("en-US")}</td>
          <td class="px-5 py-4 text-sm text-right font-semibold">${row.totalBoxes.toLocaleString("en-US")}</td>
          <td class="px-5 py-4 text-sm text-gray-700 font-mono text-gray-600">${row.itsTransferId}</td>
          <td class="px-5 py-4 text-sm text-gray-700">
            <span class="inline-flex rounded-full px-2 py-1 text-xs font-medium bg-transparent text-${tone}-700 border border-${tone}-200">${labels[row.status]}</span>
          </td>
        </tr>`;
    })
    .join("");
}
