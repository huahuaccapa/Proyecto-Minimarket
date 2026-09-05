import { Router } from "express";

import { randomUUID } from "node:crypto";

import { nextNumber, persistStore, store } from "../../data/store.js";

import { requireRole } from "../../middlewares/auth.js";

import {
  addCashMovement,
  calculateSessionExpected,
  getOpenCashSession,
  roundMoney,
  sessionMovements,
} from "../../services/business.js";

import { HttpError, required, response } from "../../utils/http.js";

const router = Router();

function cashSummary() {
  const session = getOpenCashSession();

  if (!session) {
    return {
      isOpen: false,

      session: null,

      openingAmount: 0,

      inflow: 0,

      outflow: 0,

      balance: 0,

      movements: [],
    };
  }

  const totals = calculateSessionExpected(session);

  return {
    isOpen: true,

    session,

    openingAmount: session.openingAmount,

    inflow: totals.inflow,

    outflow: totals.outflow,

    balance: totals.expected,

    movements: [...sessionMovements(session.id)].reverse(),
  };
}

router.get("/", (req, res) => response(res, cashSummary()));

router.post("/open", requireRole("Administrador"), (req, res) => {
  if (getOpenCashSession()) {
    throw new HttpError(409, "Ya existe una caja abierta");
  }

  const openingAmount = roundMoney(req.body.openingAmount || 0);

  if (!Number.isFinite(openingAmount) || openingAmount < 0) {
    throw new HttpError(400, "El fondo inicial no es válido");
  }

  const session = {
    id: randomUUID(),

    number: nextNumber("cashSession", "CAJ"),

    status: "open",

    openingAmount,

    openedAt: new Date().toISOString(),

    openedBy: req.user.id,

    closingAmount: null,

    expectedAmount: null,

    difference: null,

    closedAt: null,

    closedBy: null,
  };

  store.cashSessions.push(session);

  persistStore();

  response(res, cashSummary(), "Caja abierta", 201);
});

router.post("/close", requireRole("Administrador"), (req, res) => {
  required(req.body, ["closingAmount"]);

  const session = getOpenCashSession();

  if (!session) {
    throw new HttpError(409, "No hay una caja abierta");
  }

  const closingAmount = roundMoney(req.body.closingAmount);

  if (!Number.isFinite(closingAmount) || closingAmount < 0) {
    throw new HttpError(400, "El efectivo contado no es válido");
  }

  const { expected } = calculateSessionExpected(session);

  Object.assign(session, {
    status: "closed",

    closingAmount,

    expectedAmount: expected,

    difference: roundMoney(closingAmount - expected),

    closedAt: new Date().toISOString(),

    closedBy: req.user.id,
  });

  persistStore();

  response(res, session, "Caja cerrada");
});

router.post("/movements", requireRole("Administrador"), (req, res) => {
  required(req.body, ["type", "amount", "reason"]);

  const type = String(req.body.type);

  if (!["entrada", "retiro"].includes(type)) {
    throw new HttpError(400, "Tipo de movimiento de caja inválido");
  }

  const movement = addCashMovement({
    direction: type === "entrada" ? "in" : "out",

    type: type === "entrada" ? "manual_income" : "withdrawal",

    amount: req.body.amount,

    reason: req.body.reason,

    notes: req.body.notes,

    userId: req.user.id,
  });

  persistStore();

  response(
    res,
    movement,
    type === "entrada" ? "Efectivo añadido a caja" : "Retiro registrado",
    201,
  );
});

router.get("/history", requireRole("Administrador"), (req, res) =>
  response(res, [...store.cashSessions].reverse()),
);

export { cashSummary };

export default router;
