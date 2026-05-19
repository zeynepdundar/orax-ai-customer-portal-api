import { Request } from "express";

export type MenuItem = { path: string; label: string; icon: string };

/**
 * Builds the sidebar menu items for the currently authenticated user, using
 * the i18n labels from the request's translator.
 */
export function buildMenuItems(req: Request): MenuItem[] {
  const reqAny = req as Request & {
    t?: (key: string) => string;
  };
  const t = reqAny.t || ((k: string) => k);
  return [
    { path: "/dashboard", label: t("navigation.dashboard"), icon: "layout-dashboard" },
    { path: "/inventory", label: t("navigation.inventory"), icon: "boxes" },
    { path: "/wareview", label: t("navigation.wareview"), icon: "eye" },
    { path: "/inbound-orders", label: t("navigation.inboundOrders"), icon: "arrow-down-to-line" },
    { path: "/outbound-orders", label: t("navigation.outboundOrders"), icon: "arrow-up-from-line" },
    { path: "/reports", label: t("navigation.reports"), icon: "bar-chart-3" },
    { path: "/materials", label: t("navigation.materials"), icon: "package" },
    { path: "/customers", label: t("navigation.customers"), icon: "users" },
    { path: "/tenants", label: "Tenants", icon: "users" },
    // Settings is hidden from the sidebar (matches the Next.js comment-out)
    // { path: "/settings", label: t("navigation.settings"), icon: "settings" },
  ];
}
