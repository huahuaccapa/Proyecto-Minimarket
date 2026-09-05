import { Router } from "express";

import { store } from "../../data/store.js";

import { requireRole } from "../../middlewares/auth.js";

import { buildSummary } from "../reports/reports.routes.js";

import { cashSummary } from "../cash/cash.routes.js";

import { response } from "../../utils/http.js";

const router = Router();

router.get("/", requireRole("Administrador"), (req, res) => {
  response(res, {
    summary: buildSummary({
      period: "monthly",
    }),

    cash: cashSummary(),

    recentSales: [...store.sales]
      .filter((item) => item.status !== "voided")
      .reverse()
      .slice(0, 5),

    lowStock: store.products
      .filter((item) => item.active && item.stock <= item.minStock)
      .slice(0, 5),
  });
});

export default router;
