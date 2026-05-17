import { Router, Request } from "express";
import { requireAuth } from "../middleware/auth";
import { buildMenuItems } from "../lib/menu";

const router = Router();
router.use(requireAuth);

type SubUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "viewer";
  status: "active" | "inactive";
  createdAt: string;
};

// In-memory store (replace with a real datasource later)
let subUsers: SubUser[] = [
  { id: "1", name: "Mehmet Demir", email: "mehmet@avixa.com", role: "manager", status: "active", createdAt: "2026-03-15" },
  { id: "2", name: "Ayse Kaya", email: "ayse@avixa.com", role: "viewer", status: "active", createdAt: "2026-03-20" },
];

declare module "express-session" {
  interface SessionData {
    flash?: string;
  }
}

router.get("/", (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  const t = reqAny.t;

  const flashMessage = req.session?.flash || null;
  if (req.session) req.session.flash = undefined;

  res.render("pages/settings", {
    title: t("settings.title"),
    pageTitle: t("settings.title"),
    pageDescription: t("settings.description"),
    menuItems: buildMenuItems(req),
    flashMessage,
    subUsers,
    labels: {
      profile: t("settings.profile"),
      fullName: t("settings.fullName"),
      company: t("settings.company"),
      email: t("settings.email"),
      subUsersTitle: t("settings.subUsersTitle"),
      newUser: t("settings.newUser"),
      fullNamePlaceholder: t("settings.fullNamePlaceholder"),
      emailPlaceholder: t("settings.emailPlaceholder"),
      role: t("settings.role"),
      roleAdmin: t("settings.roleAdmin"),
      roleManager: t("settings.roleManager"),
      roleViewer: t("settings.roleViewer"),
      roleAdminShort: t("settings.roleAdminShort"),
      roleManagerShort: t("settings.roleManagerShort"),
      roleViewerShort: t("settings.roleViewerShort"),
      add: t("settings.add"),
      cancel: t("common.cancel"),
      notifications: t("settings.notifications"),
      orderUpdates: t("settings.orderUpdates"),
      orderUpdatesDesc: t("settings.orderUpdatesDesc"),
      stockAlerts: t("settings.stockAlerts"),
      stockAlertsDesc: t("settings.stockAlertsDesc"),
      emailNotifications: t("settings.emailNotifications"),
      emailNotificationsDesc: t("settings.emailNotificationsDesc"),
      system: t("settings.system"),
      language: t("settings.language"),
      languageTr: t("settings.languageTr"),
      languageEn: t("settings.languageEn"),
      languageDe: t("settings.languageDe"),
      languageRu: t("settings.languageRu"),
      languageAr: t("settings.languageAr"),
      languageEs: t("settings.languageEs"),
      timezone: t("settings.timezone"),
      timezoneIstanbul: t("settings.timezoneIstanbul"),
      timezoneUTC: t("settings.timezoneUTC"),
      security: t("settings.security"),
      currentPassword: t("settings.currentPassword"),
      currentPasswordPlaceholder: t("settings.currentPasswordPlaceholder"),
      newPassword: t("settings.newPassword"),
      newPasswordPlaceholder: t("settings.newPasswordPlaceholder"),
      confirmPassword: t("settings.confirmPassword"),
      confirmPasswordPlaceholder: t("settings.confirmPasswordPlaceholder"),
      changePassword: t("settings.changePassword"),
      saveChanges: t("settings.saveChanges"),
    },
  });
});

router.post("/users", (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  const { name, email, role } = req.body as { name?: string; email?: string; role?: string };
  if (!name || !email) {
    if (req.session) req.session.flash = reqAny.t("settings.fillAllFields");
    return res.redirect("/settings");
  }
  subUsers.push({
    id: Date.now().toString(),
    name,
    email,
    role: ["admin", "manager", "viewer"].includes(role || "") ? (role as SubUser["role"]) : "viewer",
    status: "active",
    createdAt: new Date().toISOString().split("T")[0],
  });
  if (req.session) req.session.flash = reqAny.t("settings.subUserAdded");
  res.redirect("/settings");
});

router.post("/users/:id/delete", (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  subUsers = subUsers.filter((u) => u.id !== req.params.id);
  if (req.session) req.session.flash = reqAny.t("settings.userDeleted");
  res.redirect("/settings");
});

router.post("/save", (req, res) => {
  const reqAny = req as Request & { t: (k: string) => string };
  if (req.session) req.session.flash = reqAny.t("settings.saved");
  res.redirect("/settings");
});

export default router;
