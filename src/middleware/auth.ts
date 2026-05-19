import { Request, Response, NextFunction } from "express";

/**
 * Mirrors the Next.js sessionStorage check used in (app)/layout.tsx: if the
 * visitor is not logged in, redirect them to /login.
 *
 * We deliberately do NOT pass a `?next=` query param — earlier the URL ended
 * up as `/login?next=%2Finventory` whenever a session expired mid-session,
 * which surprised users. Login simply lands on /dashboard.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session?.isLoggedIn) {
    return next();
  }
  res.redirect("/login");
}
