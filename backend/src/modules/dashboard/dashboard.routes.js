import {
  Router,
} from "express";

import {
  pool,
} from "../../config/database.js";

import {
  requireRole,
} from "../../middlewares/auth.js";

import {
  buildSummary,
} from "../reports/reports.routes.js";

import {
  cashSummary,
} from "../cash/cash.routes.js";

import {
  response,
} from "../../utils/http.js";

const router =
  Router();

/*
 * ==========================================
 * DASHBOARD
 * ==========================================
 */

router.get(
  "/",

  requireRole(
    "Administrador",
  ),

  async (
    req,
    res,
  ) => {
    /*
     * ======================================
     * REPORTE DEL MES
     * ======================================
     */

    const summary =
      await buildSummary({
        period:
          "monthly",
      });

    /*
     * ======================================
     * CAJA ACTUAL
     * ======================================
     */

    const cash =
      await cashSummary();

    /*
     * ======================================
     * ÚLTIMAS 5 VENTAS
     * ======================================
     */

    const [
      recentSaleRows,
    ] =
      await pool.execute(
        `
        SELECT
          id,
          number,
          date,
          status,
          total,
          cost,

          gross_profit
            AS grossProfit,

          payment_method
            AS paymentMethod,

          received,

          \`change\`
            AS changeAmount,

          items,

          created_by
            AS createdBy

        FROM sales

        WHERE status <> 'voided'

        ORDER BY date DESC

        LIMIT 5
        `,
      );

    const recentSales =
      recentSaleRows.map(
        (
          row,
        ) => ({
          id:
            row.id,

          number:
            row.number,

          date:
            row.date,

          status:
            row.status,

          total:
            Number(
              row.total ||
              0,
            ),

          cost:
            Number(
              row.cost ||
              0,
            ),

          grossProfit:
            Number(
              row.grossProfit ||
              0,
            ),

          paymentMethod:
            row.paymentMethod,

          received:
            Number(
              row.received ||
              0,
            ),

          change:
            Number(
              row.changeAmount ||
              0,
            ),

          items:
            Number(
              row.items ||
              0,
            ),

          createdBy:
            row.createdBy,
        }),
      );

    /*
     * ======================================
     * STOCK BAJO
     * ======================================
     */

    const [
      lowStockRows,
    ] =
      await pool.execute(
        `
        SELECT
          id,
          barcode,
          name,
          stock,

          min_stock
            AS minStock,

          sale_price
            AS salePrice,

          unit_cost
            AS unitCost,

          sale_unit
            AS saleUnit,

          active

        FROM products

        WHERE
          active = 1
          AND stock <= min_stock

        ORDER BY stock ASC

        LIMIT 5
        `,
      );

    const lowStock =
      lowStockRows.map(
        (
          row,
        ) => ({
          id:
            row.id,

          barcode:
            row.barcode,

          name:
            row.name,

          stock:
            Number(
              row.stock ||
              0,
            ),

          minStock:
            Number(
              row.minStock ||
              0,
            ),

          salePrice:
            Number(
              row.salePrice ||
              0,
            ),

          unitCost:
            Number(
              row.unitCost ||
              0,
            ),

          saleUnit:
            row.saleUnit,

          active:
            Boolean(
              row.active,
            ),
        }),
      );

    response(
      res,

      {
        summary,

        cash,

        recentSales,

        lowStock,
      },
    );
  },
);

export default router;