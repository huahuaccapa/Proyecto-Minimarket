import { Router } from "express";

import { randomUUID } from "node:crypto";

import { pool, withTransaction } from "../../config/database.js";

import { requireRole } from "../../middlewares/auth.js";

import {
  addCashMovement,
  ensureCashAvailable,
  roundMoney,
} from "../../services/business.js";

import { HttpError, required, response } from "../../utils/http.js";

const router = Router();

function cleanDate(value) {
  if (!value) {
    return null;
  }

  return String(value).slice(0, 10);
}

function mapExpense(row) {
  return {
    id: row.id,

    date: row.date,

    description: row.description,

    category: row.category,

    amount: Number(row.amount || 0),

    paymentMethod: row.paymentMethod,

    status: row.status,

    createdAt: row.createdAt,

    createdBy: row.createdBy,

    voidedAt: row.voidedAt,

    voidedBy: row.voidedBy,

    voidReason: row.voidReason || "",
  };
}

/*
 * ==========================================
 * LISTAR
 * ==========================================
 */

router.get(
  "/",

  requireRole("Administrador"),

  async (req, res) => {
    const [rows] = await pool.execute(
      `
        SELECT
          id,

          expense_date
            AS date,

          description,
          category,
          amount,

          payment_method
            AS paymentMethod,

          status,

          created_at
            AS createdAt,

          created_by
            AS createdBy,

          voided_at
            AS voidedAt,

          voided_by
            AS voidedBy,

          void_reason
            AS voidReason

        FROM expenses

        ORDER BY expense_date DESC,
                 created_at DESC
        `,
    );

    response(res, rows.map(mapExpense));
  },
);

/*
 * ==========================================
 * CREAR
 * ==========================================
 */

router.post(
  "/",

  requireRole("Administrador"),

  async (req, res) => {
    required(req.body, ["date", "description", "category", "amount"]);

    const amount = roundMoney(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new HttpError(400, "El monto debe ser mayor que cero");
    }

    const description = String(req.body.description).trim();

    const category = String(req.body.category).trim();

    if (!description || !category) {
      throw new HttpError(400, "Completa la descripción y categoría");
    }

    const paymentMethod = String(req.body.paymentMethod || "Efectivo");

    if (paymentMethod !== "Efectivo") {
      throw new HttpError(
        400,
        "Por ahora los gastos solo se registran como pagados en efectivo",
      );
    }

    const expense = await withTransaction(async (connection) => {
      /*
       * Verificar efectivo antes
       * de registrar gasto.
       */
      await ensureCashAvailable(amount, connection);

      const item = {
        id: randomUUID(),

        date: cleanDate(req.body.date),

        description,

        category,

        amount,

        paymentMethod: "Efectivo",

        status: "active",

        createdAt: new Date(),

        createdBy: req.user.id,

        voidedAt: null,

        voidedBy: null,

        voidReason: "",
      };

      await connection.execute(
        `
            INSERT INTO expenses
            (
              id,
              expense_date,
              description,
              category,
              amount,
              payment_method,
              status,
              created_at,
              created_by,
              voided_at,
              voided_by,
              void_reason
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,

        [
          item.id,
          item.date,
          item.description,
          item.category,
          item.amount,
          item.paymentMethod,
          item.status,
          item.createdAt,
          item.createdBy,
          null,
          null,
          "",
        ],
      );

      await addCashMovement(
        {
          direction: "out",

          type: "expense",

          amount,

          reason: item.description,

          referenceType: "expense",

          referenceId: item.id,

          userId: req.user.id,
        },

        connection,
      );

      return item;
    });

    response(res, expense, "Gasto registrado y descontado de caja", 201);
  },
);

/*
 * ==========================================
 * ANULAR
 * ==========================================
 */

router.post(
  "/:id/void",

  requireRole("Administrador"),

  async (req, res) => {
    const expense = await withTransaction(async (connection) => {
      const [rows] = await connection.execute(
        `
              SELECT
                id,

                expense_date
                  AS date,

                description,
                category,
                amount,

                payment_method
                  AS paymentMethod,

                status,

                created_at
                  AS createdAt,

                created_by
                  AS createdBy,

                voided_at
                  AS voidedAt,

                voided_by
                  AS voidedBy,

                void_reason
                  AS voidReason

              FROM expenses

              WHERE id = ?

              LIMIT 1

              FOR UPDATE
              `,

        [req.params.id],
      );

      if (!rows[0]) {
        throw new HttpError(404, "Gasto no encontrado");
      }

      const current = mapExpense(rows[0]);

      if (current.status === "voided") {
        throw new HttpError(409, "El gasto ya está anulado");
      }

      const now = new Date();

      const reason = String(req.body.reason || "Anulación de gasto").trim();

      /*
       * Reintegrar dinero a caja.
       */
      await addCashMovement(
        {
          direction: "in",

          type: "expense_void",

          amount: current.amount,

          reason: `Anulación: ${current.description}`,

          referenceType: "expense",

          referenceId: current.id,

          userId: req.user.id,
        },

        connection,
      );

      await connection.execute(
        `
            UPDATE expenses

            SET
              status = 'voided',
              voided_at = ?,
              voided_by = ?,
              void_reason = ?

            WHERE id = ?
            `,

        [now, req.user.id, reason, current.id],
      );

      return {
        ...current,

        status: "voided",

        voidedAt: now,

        voidedBy: req.user.id,

        voidReason: reason,
      };
    });

    response(res, expense, "Gasto anulado y efectivo reintegrado");
  },
);

export default router;
