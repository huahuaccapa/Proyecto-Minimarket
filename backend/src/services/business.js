import { randomUUID } from "node:crypto";

import { pool } from "../config/database.js";

import { HttpError } from "../utils/http.js";

/*
 * ==========================================
 * DINERO
 * ==========================================
 */

export const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

/*
 * ==========================================
 * FECHA DE VENCIMIENTO
 * ==========================================
 */

export function isExpired(dateValue) {
  if (!dateValue) {
    return false;
  }

  const value =
    dateValue instanceof Date
      ? dateValue.toISOString().slice(0, 10)
      : String(dateValue).slice(0, 10);

  const expiration = new Date(`${value}T23:59:59-05:00`);

  return Number.isFinite(expiration.getTime()) && expiration < new Date();
}

/*
 * ==========================================
 * MAPEAR SESIÓN DE CAJA
 * ==========================================
 */

function mapCashSession(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,

    number: row.number,

    status: row.status,

    openingAmount: Number(row.openingAmount || 0),

    openedAt: row.openedAt,

    openedBy: row.openedBy,

    closingAmount:
      row.closingAmount === null ? null : Number(row.closingAmount),

    expectedAmount:
      row.expectedAmount === null ? null : Number(row.expectedAmount),

    difference: row.difference === null ? null : Number(row.difference),

    closedAt: row.closedAt,

    closedBy: row.closedBy,
  };
}

/*
 * ==========================================
 * MAPEAR MOVIMIENTO DE CAJA
 * ==========================================
 */

function mapCashMovement(row) {
  return {
    id: row.id,

    sessionId: row.sessionId,

    direction: row.direction,

    type: row.type,

    amount: Number(row.amount || 0),

    reason: row.reason,

    notes: row.notes || "",

    referenceType: row.referenceType || "",

    referenceId: row.referenceId || "",

    userId: row.userId || "",

    status: row.status,

    date: row.date,
  };
}

/*
 * ==========================================
 * CAJA ABIERTA
 * ==========================================
 */

export async function getOpenCashSession(connection = null) {
  const db = connection || pool;

  const [rows] = await db.execute(
    `
      SELECT
        id,
        number,
        status,

        opening_amount
          AS openingAmount,

        opened_at
          AS openedAt,

        opened_by
          AS openedBy,

        closing_amount
          AS closingAmount,

        expected_amount
          AS expectedAmount,

        difference,

        closed_at
          AS closedAt,

        closed_by
          AS closedBy

      FROM cash_sessions

      WHERE status = 'open'

      ORDER BY opened_at DESC

      LIMIT 1
      `,
  );

  return mapCashSession(rows[0]);
}

/*
 * ==========================================
 * MOVIMIENTOS DE UNA CAJA
 * ==========================================
 */

export async function sessionMovements(sessionId, connection = null) {
  const db = connection || pool;

  const [rows] = await db.execute(
    `
      SELECT
        id,

        session_id
          AS sessionId,

        direction,

        movement_type
          AS type,

        amount,
        reason,
        notes,

        reference_type
          AS referenceType,

        reference_id
          AS referenceId,

        user_id
          AS userId,

        status,

        movement_date
          AS date

      FROM cash_movements

      WHERE
        session_id = ?
        AND status <> 'voided'

      ORDER BY movement_date ASC
      `,

    [sessionId],
  );

  return rows.map(mapCashMovement);
}

/*
 * ==========================================
 * CALCULAR CAJA
 * ==========================================
 */

export async function calculateSessionExpected(session, connection = null) {
  const db = connection || pool;

  const [rows] = await db.execute(
    `
      SELECT

        COALESCE(
          SUM(
            CASE
              WHEN direction = 'in'
              THEN amount
              ELSE 0
            END
          ),
          0
        ) AS inflow,

        COALESCE(
          SUM(
            CASE
              WHEN direction = 'out'
              THEN amount
              ELSE 0
            END
          ),
          0
        ) AS outflow

      FROM cash_movements

      WHERE
        session_id = ?
        AND status <> 'voided'
      `,

    [session.id],
  );

  const inflow = roundMoney(rows[0]?.inflow || 0);

  const outflow = roundMoney(rows[0]?.outflow || 0);

  return {
    inflow,

    outflow,

    expected: roundMoney(Number(session.openingAmount || 0) + inflow - outflow),
  };
}

/*
 * ==========================================
 * EXIGIR CAJA ABIERTA
 * ==========================================
 */

export async function requireOpenCash(connection = null) {
  const session = await getOpenCashSession(connection);

  if (!session) {
    throw new HttpError(409, "Primero debes abrir la caja");
  }

  return session;
}

/*
 * ==========================================
 * VALIDAR EFECTIVO DISPONIBLE
 * ==========================================
 */

export async function ensureCashAvailable(amount, connection = null) {
  const session = await requireOpenCash(connection);

  const value = roundMoney(amount);

  const { expected } = await calculateSessionExpected(session, connection);

  if (value > expected) {
    throw new HttpError(409, "No hay suficiente efectivo en caja");
  }

  return session;
}

/*
 * ==========================================
 * AGREGAR MOVIMIENTO DE CAJA
 * ==========================================
 */

export async function addCashMovement(
  {
    direction,
    type,
    amount,
    reason,
    referenceType = "",
    referenceId = "",
    userId = "",
    notes = "",
  },

  connection = null,
) {
  const db = connection || pool;

  const session = await requireOpenCash(connection);

  const value = roundMoney(amount);

  if (!Number.isFinite(value) || value <= 0) {
    throw new HttpError(400, "El monto debe ser mayor que cero");
  }

  if (!["in", "out"].includes(direction)) {
    throw new HttpError(400, "Dirección de movimiento de caja inválida");
  }

  if (direction === "out") {
    const { expected } = await calculateSessionExpected(session, connection);

    if (value > expected) {
      throw new HttpError(409, "No hay suficiente efectivo en caja");
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

    referenceType: String(referenceType || ""),

    referenceId: String(referenceId || ""),

    userId: userId || null,

    status: "active",

    date: new Date(),
  };

  await db.execute(
    `
    INSERT INTO cash_movements
    (
      id,
      session_id,
      direction,
      movement_type,
      amount,
      reason,
      notes,
      reference_type,
      reference_id,
      user_id,
      status,
      movement_date
    )
    VALUES
    (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
    `,

    [
      movement.id,
      movement.sessionId,
      movement.direction,
      movement.type,
      movement.amount,
      movement.reason,
      movement.notes,
      movement.referenceType,
      movement.referenceId,
      movement.userId,
      movement.status,
      movement.date,
    ],
  );

  return movement;
}

/*
 * ==========================================
 * SALDO DEL CLIENTE
 * ==========================================
 */

export async function customerBalance(customerId, connection = null) {
  const db = connection || pool;

  const [chargeRows] = await db.execute(
    `
      SELECT
        COALESCE(
          SUM(total),
          0
        ) AS charges

      FROM customer_credits

      WHERE
        customer_id = ?
        AND status <> 'voided'
      `,

    [customerId],
  );

  const [paymentRows] = await db.execute(
    `
      SELECT
        COALESCE(
          SUM(amount),
          0
        ) AS payments

      FROM customer_payments

      WHERE
        customer_id = ?
        AND status <> 'voided'
      `,

    [customerId],
  );

  const charges = roundMoney(chargeRows[0]?.charges || 0);

  const payments = roundMoney(paymentRows[0]?.payments || 0);

  return {
    charges,

    payments,

    balance: roundMoney(Math.max(0, charges - payments)),
  };
}
