import { Request, Response, NextFunction } from "express";

/**
 * Mirrors the Next.js sessionStorage check used in (app)/layout.tsx: if the
 * visitor is not logged in, redirect them to /login (keeping the original
 * URL as a redirect hint for after they sign in).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session?.isLoggedIn) {
    return next();
  }
  const next_ = req.originalUrl !== "/" ? `?next=${encodeURIComponent(req.originalUrl)}` : "";
  res.redirect(`/login${next_}`);
}
