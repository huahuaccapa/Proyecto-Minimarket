import { Router } from "express";

import { pool } from "../../config/database.js";

import { requireRole } from "../../middlewares/auth.js";

import { roundMoney } from "../../services/business.js";

import { HttpError, response } from "../../utils/http.js";

const router = Router();

const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;

const PROMOTION_MIN_AGE_DAYS = 14;

/*
 * ==========================================
 * FECHAS LIMA
 * ==========================================
 */

function limaParts(date = new Date()) {
  const shifted = new Date(date.getTime() - LIMA_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),

    month: shifted.getUTCMonth(),

    day: shifted.getUTCDate(),

    weekDay: shifted.getUTCDay(),
  };
}

function limaBoundary(year, month, day, endOfDay = false) {
  const hh = endOfDay ? "23:59:59.999" : "00:00:00.000";

  const mm = String(month + 1).padStart(2, "0");

  const dd = String(day).padStart(2, "0");

  return new Date(`${year}-${mm}-${dd}T${hh}-05:00`);
}

function parseDateInput(value, endOfDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    throw new HttpError(400, "Formato de fecha inválido");
  }

  const date = new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}-05:00`,
  );

  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, "Fecha inválida");
  }

  return date;
}

function parsePeriod(query = {}) {
  const end = query.to ? parseDateInput(query.to, true) : new Date();

  let start;

  if (query.from) {
    start = parseDateInput(query.from, false);
  } else {
    const parts = limaParts(end);

    if (query.period === "monthly") {
      start = limaBoundary(parts.year, parts.month, 1);
    } else {
      const mondayOffset = (parts.weekDay + 6) % 7;

      const shifted = new Date(
        Date.UTC(parts.year, parts.month, parts.day - mondayOffset),
      );

      start = limaBoundary(
        shifted.getUTCFullYear(),
        shifted.getUTCMonth(),
        shifted.getUTCDate(),
      );
    }
  }

  if (start > end) {
    throw new HttpError(
      400,
      "La fecha inicial no puede ser posterior a la fecha final",
    );
  }

  return {
    start,
    end,
  };
}

function limaDateOnly(date) {
  const shifted = new Date(date.getTime() - LIMA_OFFSET_MS);

  return shifted.toISOString().slice(0, 10);
}

function ageInDays(value, now = new Date()) {
  const created = new Date(value || 0);

  if (!Number.isFinite(created.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((now.getTime() - created.getTime()) / 86400000);
}

/*
 * ==========================================
 * CONSTRUIR REPORTE
 * ==========================================
 */

export async function buildSummary(query = {}) {
  const { start, end } = parsePeriod(query);

  const startDate = limaDateOnly(start);

  const endDate = limaDateOnly(end);

  /*
   * ======================================
   * VENTAS EFECTIVO
   * ======================================
   */

  const [cashRows] = await pool.execute(
    `
      SELECT
        COUNT(*)
          AS salesCount,

        COALESCE(
          SUM(total),
          0
        ) AS revenue,

        COALESCE(
          SUM(cost),
          0
        ) AS cost,

        COALESCE(
          SUM(items),
          0
        ) AS units

      FROM sales

      WHERE
        status <> 'voided'
        AND date >= ?
        AND date <= ?
      `,

    [start, end],
  );

  const cashRevenue = roundMoney(cashRows[0]?.revenue || 0);

  const cashCost = roundMoney(cashRows[0]?.cost || 0);

  const cashSalesCount = Number(cashRows[0]?.salesCount || 0);

  const cashUnits = Number(cashRows[0]?.units || 0);

  /*
   * ======================================
   * VENTAS A CRÉDITO
   * ======================================
   */

  const [creditRows] = await pool.execute(
    `
      SELECT
        COUNT(*)
          AS salesCount,

        COALESCE(
          SUM(total),
          0
        ) AS revenue,

        COALESCE(
          SUM(
            unit_cost *
            quantity
          ),
          0
        ) AS cost,

        COALESCE(
          SUM(quantity),
          0
        ) AS units

      FROM customer_credits

      WHERE
        status <> 'voided'
        AND created_at >= ?
        AND created_at <= ?
      `,

    [start, end],
  );

  const creditRevenue = roundMoney(creditRows[0]?.revenue || 0);

  const creditCost = roundMoney(creditRows[0]?.cost || 0);

  const creditSalesCount = Number(creditRows[0]?.salesCount || 0);

  const creditUnits = Number(creditRows[0]?.units || 0);

  /*
   * ======================================
   * GASTOS
   * ======================================
   */

  const [expenseRows] = await pool.execute(
    `
      SELECT
        COALESCE(
          SUM(amount),
          0
        ) AS total

      FROM expenses

      WHERE
        status <> 'voided'
        AND expense_date >= ?
        AND expense_date <= ?
      `,

    [startDate, endDate],
  );

  const expenseTotal = roundMoney(expenseRows[0]?.total || 0);

  /*
   * ======================================
   * PRODUCTOS BASE
   * ======================================
   */

  const [productRows] = await pool.execute(
    `
      SELECT
        id,
        name,
        stock,

        sale_price
          AS salePrice,

        unit_cost
          AS unitCost,

        active,

        created_at
          AS createdAt

      FROM products

      ORDER BY created_at ASC
      `,
  );

  /*
   * VENTAS EFECTIVO POR PRODUCTO.
   */
  const [saleProductRows] = await pool.execute(
    `
      SELECT
        si.product_id
          AS productId,

        COALESCE(
          SUM(si.quantity),
          0
        ) AS quantity,

        COALESCE(
          SUM(si.subtotal),
          0
        ) AS revenue,

        COALESCE(
          SUM(
            si.unit_cost *
            si.quantity
          ),
          0
        ) AS cost

      FROM sale_items si

      INNER JOIN sales s
        ON s.id =
           si.sale_id

      WHERE
        s.status <> 'voided'
        AND s.date >= ?
        AND s.date <= ?

      GROUP BY
        si.product_id
      `,

    [start, end],
  );

  /*
   * FIADOS POR PRODUCTO.
   */
  const [creditProductRows] = await pool.execute(
    `
      SELECT
        product_id
          AS productId,

        COALESCE(
          SUM(quantity),
          0
        ) AS quantity,

        COALESCE(
          SUM(total),
          0
        ) AS revenue,

        COALESCE(
          SUM(
            unit_cost *
            quantity
          ),
          0
        ) AS cost

      FROM customer_credits

      WHERE
        status <> 'voided'
        AND created_at >= ?
        AND created_at <= ?

      GROUP BY
        product_id
      `,

    [start, end],
  );

  const byProduct = new Map();

  for (const product of productRows) {
    byProduct.set(
      product.id,

      {
        productId: product.id,

        name: product.name,

        stock: Number(product.stock || 0),

        salePrice: Number(product.salePrice || 0),

        unitCost: Number(product.unitCost || 0),

        active: Boolean(product.active),

        createdAt: product.createdAt,

        quantity: 0,

        revenue: 0,

        cost: 0,
      },
    );
  }

  /*
   * SUMAR VENTAS EFECTIVO.
   */
  for (const row of saleProductRows) {
    const product = byProduct.get(row.productId);

    if (!product) {
      continue;
    }

    product.quantity += Number(row.quantity || 0);

    product.revenue += Number(row.revenue || 0);

    product.cost += Number(row.cost || 0);
  }

  /*
   * SUMAR FIADOS.
   */
  for (const row of creditProductRows) {
    const product = byProduct.get(row.productId);

    if (!product) {
      continue;
    }

    product.quantity += Number(row.quantity || 0);

    product.revenue += Number(row.revenue || 0);

    product.cost += Number(row.cost || 0);
  }

  const products = [...byProduct.values()].map((row) => ({
    ...row,

    quantity: Number(row.quantity.toFixed(3)),

    revenue: roundMoney(row.revenue),

    cost: roundMoney(row.cost),

    profit: roundMoney(row.revenue - row.cost),
  }));

  /*
   * ======================================
   * TOP PRODUCTOS
   * ======================================
   */

  const sold = products
    .filter((item) => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);

  const average = sold.length
    ? sold.reduce(
        (sum, item) => sum + item.quantity,

        0,
      ) / sold.length
    : 0;

  const topProducts = sold.slice(0, 10);

  /*
   * ======================================
   * BAJA ROTACIÓN
   * ======================================
   */

  const slowProducts = sold
    .filter((item) => item.quantity <= Math.max(1, average * 0.4))
    .slice(0, 10);

  /*
   * ======================================
   * SIN VENTAS
   * ======================================
   */

  const noSalesProducts = products
    .filter((item) => item.active && item.quantity === 0)
    .slice(0, 10);

  /*
   * ======================================
   * PROMOCIONES SUGERIDAS
   * ======================================
   */

  const promotionCandidates = [...noSalesProducts, ...slowProducts];

  const promotions = promotionCandidates
    .filter(
      (item, index, list) =>
        list.findIndex(
          (candidate) => candidate.productId === item.productId,
        ) === index,
    )
    .filter(
      (item) =>
        item.active &&
        Number(item.stock || 0) > 0 &&
        ageInDays(item.createdAt) >= PROMOTION_MIN_AGE_DAYS,
    )
    .slice(0, 8)
    .map((item) => {
      const salePrice = Number(item.salePrice || 0);

      const unitCost = Number(item.unitCost || 0);

      const margin = salePrice - unitCost;

      const maxDiscount =
        salePrice > 0 && margin > 0
          ? Math.max(
              0,

              Math.min(
                15,

                Math.floor((margin / salePrice) * 100 * 0.6),
              ),
            )
          : 0;

      return {
        ...item,

        suggestedDiscountPercent: maxDiscount,

        suggestedPrice: roundMoney(salePrice * (1 - maxDiscount / 100)),

        reason:
          item.quantity === 0
            ? "Sin ventas por al menos 14 días"
            : "Baja rotación",
      };
    });

  /*
   * ======================================
   * CUENTAS POR COBRAR
   * ======================================
   */

  const [customerRows] = await pool.execute(
    `
      SELECT
        c.id,

        COALESCE(
          cc.charges,
          0
        ) AS charges,

        COALESCE(
          cp.payments,
          0
        ) AS payments

      FROM customers c

      LEFT JOIN
      (
        SELECT
          customer_id,

          SUM(total)
            AS charges

        FROM customer_credits

        WHERE status <> 'voided'

        GROUP BY customer_id
      ) cc
        ON cc.customer_id =
           c.id

      LEFT JOIN
      (
        SELECT
          customer_id,

          SUM(amount)
            AS payments

        FROM customer_payments

        WHERE status <> 'voided'

        GROUP BY customer_id
      ) cp
        ON cp.customer_id =
           c.id

      WHERE c.active = 1
      `,
  );

  let receivables = 0;

  let debtorsCount = 0;

  for (const row of customerRows) {
    const balance = roundMoney(
      Math.max(
        0,

        Number(row.charges || 0) - Number(row.payments || 0),
      ),
    );

    if (balance > 0) {
      debtorsCount += 1;

      receivables += balance;
    }
  }

  receivables = roundMoney(receivables);

  /*
   * ======================================
   * STOCK BAJO
   * ======================================
   */

  const lowStockCount = products.filter(
    (product) =>
      product.active &&
      Number(product.stock) <=
        Number(
          productRows.find((candidate) => candidate.id === product.productId)
            ?.minStock || 0,
        ),
  ).length;

  /*
   * La consulta anterior no seleccionó
   * min_stock para mantener el objeto limpio.
   * Calculamos el número directamente.
   */
  const [lowRows] = await pool.execute(
    `
      SELECT COUNT(*)
        AS total

      FROM products

      WHERE
        active = 1
        AND stock <= min_stock
      `,
  );

  const finalLowStockCount = Number(lowRows[0]?.total || lowStockCount || 0);

  /*
   * ======================================
   * TOTALES
   * ======================================
   */

  const revenue = roundMoney(cashRevenue + creditRevenue);

  const cost = roundMoney(cashCost + creditCost);

  const grossProfit = roundMoney(revenue - cost);

  const netProfit = roundMoney(grossProfit - expenseTotal);

  const unitsSold = Number((cashUnits + creditUnits).toFixed(3));

  return {
    period: {
      start: start.toISOString(),

      end: end.toISOString(),

      timezone: "America/Lima",
    },

    cashRevenue,

    creditRevenue,

    revenue,

    cost,

    grossProfit,

    expenses: expenseTotal,

    netProfit,

    margin: revenue ? Number(((netProfit / revenue) * 100).toFixed(1)) : 0,

    salesCount: cashSalesCount + creditSalesCount,

    cashSalesCount,

    creditSalesCount,

    unitsSold,

    lowStockCount: finalLowStockCount,

    receivables,

    debtorsCount,

    topProducts,

    slowProducts,

    noSalesProducts,

    promotions,
  };
}

/*
 * ==========================================
 * REPORTE COMPLETO
 * ==========================================
 */

router.get(
  "/summary",

  requireRole("Administrador"),

  async (req, res) => {
    response(
      res,

      await buildSummary(req.query),
    );
  },
);

/*
 * ==========================================
 * TOP PRODUCTOS
 * ==========================================
 */

router.get(
  "/top-products",

  requireRole("Administrador"),

  async (req, res) => {
    const summary = await buildSummary(req.query);

    response(res, summary.topProducts);
  },
);

export default router;
