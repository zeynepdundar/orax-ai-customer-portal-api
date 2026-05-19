import { Request, Response, NextFunction } from "express";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "../config/i18n";

/**
 * Exposes commonly-used values to every Handlebars template via res.locals.
 * Mirrors the role of the Next.js root layout: locale-aware messages, the
 * current pathname (used by AppSidebar for active-state styling), and the
 * session-based login state.
 */
export function attachLocals(req: Request, res: Response, next: NextFunction) {
  const reqAny = req as Request & {
    i18n?: { language: string };
    t?: (key: string, opts?: Record<string, unknown>) => string;
  };
  const detected = reqAny.i18n?.language?.split("-")[0] || DEFAULT_LOCALE;
  const locale = (SUPPORTED_LOCALES as readonly string[]).includes(detected)
    ? detected
    : DEFAULT_LOCALE;

  res.locals.t = reqAny.t?.bind(reqAny) || ((key: string) => key);
  res.locals.locale = locale;
  res.locals.locales = SUPPORTED_LOCALES;
  res.locals.currentPath = req.path;
  res.locals.fullPath = req.originalUrl;
  res.locals.isLoggedIn = !!req.session?.isLoggedIn;
  const tenantName = req.session?.tenantName;
  res.locals.user = {
    ...(req.session?.user || { name: "Ahmet Yılmaz", email: "" }),
    company: tenantName || "Avixa",
  };
  res.locals.tenantId = req.session?.tenantId;
  res.locals.tenantName = tenantName;
  res.locals.sidebarOpen = req.session?.sidebarOpen !== false;

  next();
}
