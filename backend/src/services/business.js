import { randomUUID } from "node:crypto";

import { store } from "../data/store.js";

import { HttpError } from "../utils/http.js";

export const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

export function isExpired(dateValue) {
  if (!dateValue) {
    return false;
  }

  const expiration = new Date(`${dateValue}T23:59:59-05:00`);

  return Number.isFinite(expiration.getTime()) && expiration < new Date();
}

export function getOpenCashSession() {
  return (
    [...store.cashSessions].reverse().find((item) => item.status === "open") ||
    null
  );
}

export function sessionMovements(sessionId) {
  return store.cashMovements.filter(
    (item) => item.sessionId === sessionId && item.status !== "voided",
  );
}

export function calculateSessionExpected(session) {
  const movements = sessionMovements(session.id);

  const inflow = roundMoney(
    movements
      .filter((item) => item.direction === "in")
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),

        0,
      ),
  );

  const outflow = roundMoney(
    movements
      .filter((item) => item.direction === "out")
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),

        0,
      ),
  );

  return {
    inflow,

    outflow,

    expected: roundMoney(Number(session.openingAmount || 0) + inflow - outflow),
  };
}

export function requireOpenCash() {
  const session = getOpenCashSession();

  if (!session) {
    throw new HttpError(
      409,

      "Primero debes abrir la caja",
    );
  }

  return session;
}

export function ensureCashAvailable(amount) {
  const session = requireOpenCash();

  const value = roundMoney(amount);

  const { expected } = calculateSessionExpected(session);

  if (value > expected) {
    throw new HttpError(
      409,

      "No hay suficiente efectivo en caja",
    );
  }

  return session;
}

export function addCashMovement({
  direction,
  type,
  amount,
  reason,
  referenceType = "",
  referenceId = "",
  userId = "",
  notes = "",
}) {
  const session = requireOpenCash();

  const value = roundMoney(amount);

  if (!Number.isFinite(value) || value <= 0) {
    throw new HttpError(
      400,

      "El monto debe ser mayor que cero",
    );
  }

  if (direction === "out") {
    const { expected } = calculateSessionExpected(session);

    if (value > expected) {
      throw new HttpError(
        409,

        "No hay suficiente efectivo en caja",
      );
    }
  }

  const movement = {
    id: randomUUID(),

    sessionId: session.id,

    direction,

    type,

    amount: value,

    reason: String(reason || "").trim(),

    notes: String(notes || "").trim(),

    referenceType,

    referenceId,

    userId,

    status: "active",

    date: new Date().toISOString(),
  };

  store.cashMovements.push(movement);

  return movement;
}

export function customerBalance(customerId) {
  const charges = roundMoney(
    store.customerCredits
      .filter(
        (item) => item.customerId === customerId && item.status !== "voided",
      )
      .reduce(
        (sum, item) => sum + Number(item.total || 0),

        0,
      ),
  );

  const payments = roundMoney(
    store.customerPayments
      .filter(
        (item) => item.customerId === customerId && item.status !== "voided",
      )
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),

        0,
      ),
  );

  return {
    charges,

    payments,

    balance: roundMoney(Math.max(0, charges - payments)),
  };
}
