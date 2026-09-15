import {
  Router,
} from "express";

import {
  randomUUID,
} from "node:crypto";

import {
  pool,
  withTransaction,
} from "../../config/database.js";

import {
  requireRole,
} from "../../middlewares/auth.js";

import {
  addCashMovement,
  calculateSessionExpected,
  getOpenCashSession,
  roundMoney,
  sessionMovements,
} from "../../services/business.js";

import {
  nextNumber,
} from "../../services/sequence.service.js";

import {
  HttpError,
  required,
  response,
} from "../../utils/http.js";

const router =
  Router();

/*
 * ==========================================
 * RESUMEN CAJA
 * ==========================================
 */

export async function cashSummary(
  connection = null,
) {
  const session =
    await getOpenCashSession(
      connection,
    );

  if (
    !session
  ) {
    return {
      isOpen:
        false,

      session:
        null,

      openingAmount:
        0,

      inflow:
        0,

      outflow:
        0,

      balance:
        0,

      movements:
        [],
    };
  }

  const totals =
    await calculateSessionExpected(
      session,
      connection,
    );

  const movements =
    await sessionMovements(
      session.id,
      connection,
    );

  return {
    isOpen:
      true,

    session,

    openingAmount:
      Number(
        session.openingAmount ||
        0,
      ),

    inflow:
      totals.inflow,

    outflow:
      totals.outflow,

    balance:
      totals.expected,

    movements:
      [...movements].reverse(),
  };
}

/*
 * ==========================================
 * ESTADO ACTUAL
 * ==========================================
 */

router.get(
  "/",

  async (
    req,
    res,
  ) => {
    response(
      res,
      await cashSummary(),
    );
  },
);

/*
 * ==========================================
 * ABRIR CAJA
 * ==========================================
 */

router.post(
  "/open",

  requireRole(
    "Administrador",
  ),

  async (
    req,
    res,
  ) => {
    const openingAmount =
      roundMoney(
        req.body.openingAmount ||
        0,
      );

    if (
      !Number.isFinite(
        openingAmount,
      ) ||
      openingAmount <
        0
    ) {
      throw new HttpError(
        400,
        "El fondo inicial no es válido",
      );
    }

    await withTransaction(
      async (
        connection,
      ) => {
        const [
          openRows,
        ] =
          await connection.execute(
            `
            SELECT id

            FROM cash_sessions

            WHERE status = 'open'

            LIMIT 1

            FOR UPDATE
            `,
          );

        if (
          openRows.length
        ) {
          throw new HttpError(
            409,
            "Ya existe una caja abierta",
          );
        }

        const number =
          await nextNumber(
            "cashSession",
            "CAJ",
            connection,
          );

        const now =
          new Date();

        await connection.execute(
          `
          INSERT INTO cash_sessions
          (
            id,
            number,
            status,
            opening_amount,
            opened_at,
            opened_by,
            closing_amount,
            expected_amount,
            difference,
            closed_at,
            closed_by
          )
          VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,

          [
            randomUUID(),
            number,
            "open",
            openingAmount,
            now,
            req.user.id,
            null,
            null,
            null,
            null,
            null,
          ],
        );
      },
    );

    response(
      res,
      await cashSummary(),
      "Caja abierta",
      201,
    );
  },
);

/*
 * ==========================================
 * CERRAR CAJA
 * ==========================================
 */

router.post(
  "/close",

  requireRole(
    "Administrador",
  ),

  async (
    req,
    res,
  ) => {
    required(
      req.body,
      [
        "closingAmount",
      ],
    );

    const closingAmount =
      roundMoney(
        req.body.closingAmount,
      );

    if (
      !Number.isFinite(
        closingAmount,
      ) ||
      closingAmount <
        0
    ) {
      throw new HttpError(
        400,
        "El efectivo contado no es válido",
      );
    }

    const closed =
      await withTransaction(
        async (
          connection,
        ) => {
          const session =
            await getOpenCashSession(
              connection,
            );

          if (
            !session
          ) {
            throw new HttpError(
              409,
              "No hay una caja abierta",
            );
          }

          const {
            expected,
          } =
            await calculateSessionExpected(
              session,
              connection,
            );

          const difference =
            roundMoney(
              closingAmount -
              expected,
            );

          const now =
            new Date();

          await connection.execute(
            `
            UPDATE cash_sessions

            SET
              status = 'closed',
              closing_amount = ?,
              expected_amount = ?,
              difference = ?,
              closed_at = ?,
              closed_by = ?

            WHERE
              id = ?
              AND status = 'open'
            `,

            [
              closingAmount,
              expected,
              difference,
              now,
              req.user.id,
              session.id,
            ],
          );

          return {
            ...session,

            status:
              "closed",

            closingAmount,

            expectedAmount:
              expected,

            difference,

            closedAt:
              now,

            closedBy:
              req.user.id,
          };
        },
      );

    response(
      res,
      closed,
      "Caja cerrada",
    );
  },
);

/*
 * ==========================================
 * MOVIMIENTO MANUAL
 * ==========================================
 */

router.post(
  "/movements",

  requireRole(
    "Administrador",
  ),

  async (
    req,
    res,
  ) => {
    required(
      req.body,
      [
        "type",
        "amount",
        "reason",
      ],
    );

    const type =
      String(
        req.body.type,
      );

    if (
      ![
        "entrada",
        "retiro",
      ].includes(
        type,
      )
    ) {
      throw new HttpError(
        400,
        "Tipo de movimiento de caja inválido",
      );
    }

    const movement =
      await addCashMovement({
        direction:
          type ===
          "entrada"
            ? "in"
            : "out",

        type:
          type ===
          "entrada"
            ? "manual_income"
            : "withdrawal",

        amount:
          req.body.amount,

        reason:
          req.body.reason,

        notes:
          req.body.notes,

        userId:
          req.user.id,
      });

    response(
      res,

      movement,

      type ===
      "entrada"
        ? "Efectivo añadido a caja"
        : "Retiro registrado",

      201,
    );
  },
);

/*
 * ==========================================
 * HISTORIAL
 * ==========================================
 */

router.get(
  "/history",

  requireRole(
    "Administrador",
  ),

  async (
    req,
    res,
  ) => {
    const [
      rows,
    ] =
      await pool.execute(
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

        ORDER BY opened_at DESC
        `,
      );

    response(
      res,

      rows.map(
        (
          row,
        ) => ({
          ...row,

          openingAmount:
            Number(
              row.openingAmount ||
              0,
            ),

          closingAmount:
            row.closingAmount ===
            null
              ? null
              : Number(
                  row.closingAmount,
                ),

          expectedAmount:
            row.expectedAmount ===
            null
              ? null
              : Number(
                  row.expectedAmount,
                ),

          difference:
            row.difference ===
            null
              ? null
              : Number(
                  row.difference,
                ),
        }),
      ),
    );
  },
);

export default router;