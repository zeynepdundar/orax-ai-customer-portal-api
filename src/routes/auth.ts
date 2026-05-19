import { Router } from "express";

const router = Router();

router.get("/login", (req, res) => {
  if (req.session?.isLoggedIn) {
    return res.redirect("/dashboard");
  }
  res.render("pages/login", { layout: "auth", title: "Sign in" });
});

router.post("/login", (req, res) => {
  // Demo behaviour: any email/password works. Mirrors the original Next page.
  req.session.isLoggedIn = true;
  req.session.user = {
    name: "Ahmet Yılmaz",
    email: req.body?.email || "ahmet@avixa.com",
  };
  res.redirect("/dashboard");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

export default router;
