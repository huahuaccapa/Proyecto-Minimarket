import { Router } from "express";

import { randomUUID } from "node:crypto";

import { persistStore, store } from "../../data/store.js";

import { requireRole } from "../../middlewares/auth.js";

import {
  addCashMovement,
  ensureCashAvailable,
  roundMoney,
} from "../../services/business.js";

import { HttpError, required, response } from "../../utils/http.js";

const router = Router();

router.get("/", requireRole("Administrador"), (req, res) =>
  response(res, store.expenses),
);

router.post("/", requireRole("Administrador"), (req, res) => {
  required(req.body, ["date", "description", "category", "amount"]);

  const amount = roundMoney(req.body.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, "El monto debe ser mayor que cero");
  }

  const expense = {
    id: randomUUID(),

    date: req.body.date,

    description: String(req.body.description).trim(),

    category: String(req.body.category).trim(),

    amount,

    paymentMethod: String(req.body.paymentMethod || "Efectivo"),

    status: "active",

    createdAt: new Date().toISOString(),

    createdBy: req.user.id,
  };

  if (expense.paymentMethod !== "Efectivo") {
    throw new HttpError(
      400,
      "Por ahora los gastos solo se registran como pagados en efectivo",
    );
  }

  ensureCashAvailable(amount);

  store.expenses.unshift(expense);

  addCashMovement({
    direction: "out",

    type: "expense",

    amount,

    reason: expense.description,

    referenceType: "expense",

    referenceId: expense.id,

    userId: req.user.id,
  });

  persistStore();

  response(res, expense, "Gasto registrado y descontado de caja", 201);
});

router.post("/:id/void", requireRole("Administrador"), (req, res) => {
  const expense = store.expenses.find((item) => item.id === req.params.id);

  if (!expense) {
    throw new HttpError(404, "Gasto no encontrado");
  }

  if (expense.status === "voided") {
    throw new HttpError(409, "El gasto ya está anulado");
  }

  expense.status = "voided";

  expense.voidedAt = new Date().toISOString();

  expense.voidReason = String(req.body.reason || "Anulación de gasto").trim();

  expense.voidedBy = req.user.id;

  addCashMovement({
    direction: "in",

    type: "expense_void",

    amount: expense.amount,

    reason: `Anulación: ${expense.description}`,

    referenceType: "expense",

    referenceId: expense.id,

    userId: req.user.id,
  });

  persistStore();

  response(res, expense, "Gasto anulado y efectivo reintegrado");
});

export default router;
