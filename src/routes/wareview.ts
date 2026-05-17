import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { buildMenuItems } from "../lib/menu";

const router = Router();

router.use(requireAuth);

router.get("/", (req, res) => {
  res.render("pages/wareview", {
    title: "WareView",
    menuItems: buildMenuItems(req),
  });
});

export default router;
