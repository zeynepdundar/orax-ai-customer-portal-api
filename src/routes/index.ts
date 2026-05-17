import { Router } from "express";

const router = Router();

/**
 * Root route — mirrors src/app/page.tsx, which redirected to /dashboard or
 * /login depending on session state.
 */
router.get("/", (req, res) => {
  if (req.session?.isLoggedIn) {
    return res.redirect("/dashboard");
  }
  res.redirect("/login");
});

export default router;
