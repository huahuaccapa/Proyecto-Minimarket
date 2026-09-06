import { Router } from "express";

import { store } from "../../data/store.js";

import { requireRole } from "../../middlewares/auth.js";

import { customerBalance, roundMoney } from "../../services/business.js";

import { response } from "../../utils/http.js";

const router = Router();

const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;

const PROMOTION_MIN_AGE_DAYS = 14;

const validSale = (sale) => sale.status !== "voided";

const validExpense = (expense) => expense.status !== "voided";

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
  return new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}-05:00`,
  );
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

  return {
    start,
    end,
  };
}

const within = (value, start, end) => {
  const date = new Date(value);

  return date >= start && date <= end;
};

function ageInDays(value, now = new Date()) {
  const created = new Date(value || 0);

  if (!Number.isFinite(created.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((now.getTime() - created.getTime()) / 86400000);
}

export function buildSummary(query = {}) {
  const { start, end } = parsePeriod(query);

  const sales = store.sales.filter(
    (sale) => validSale(sale) && within(sale.date, start, end),
  );

  const creditSales = store.customerCredits.filter(
    (item) => item.status !== "voided" && within(item.createdAt, start, end),
  );

  const expenses = store.expenses.filter(
    (expense) => validExpense(expense) && within(expense.date, start, end),
  );

  const cashRevenue = roundMoney(
    sales.reduce(
      (sum, sale) => sum + Number(sale.total || 0),

      0,
    ),
  );

  const creditRevenue = roundMoney(
    creditSales.reduce(
      (sum, item) => sum + Number(item.total || 0),

      0,
    ),
  );

  const revenue = roundMoney(cashRevenue + creditRevenue);

  const cashCost = roundMoney(
    sales.reduce(
      (sum, sale) => sum + Number(sale.cost || 0),

      0,
    ),
  );

  const creditCost = roundMoney(
    creditSales.reduce(
      (sum, item) =>
        sum + Number(item.unitCost || 0) * Number(item.quantity || 0),

      0,
    ),
  );

  const cost = roundMoney(cashCost + creditCost);

  const expenseTotal = roundMoney(
    expenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),

      0,
    ),
  );

  const grossProfit = roundMoney(revenue - cost);

  const netProfit = roundMoney(grossProfit - expenseTotal);

  const unitsSold = Number(
    (
      sales.reduce(
        (sum, sale) => sum + Number(sale.items || 0),

        0,
      ) +
      creditSales.reduce(
        (sum, item) => sum + Number(item.quantity || 0),

        0,
      )
    ).toFixed(3),
  );

  const byProduct = new Map(
    store.products.map((product) => [
      product.id,

      {
        productId: product.id,

        name: product.name,

        stock: product.stock,

        salePrice: product.salePrice,

        unitCost: product.unitCost,

        quantity: 0,

        revenue: 0,

        cost: 0,
      },
    ]),
  );

  sales.forEach((sale) =>
    (sale.detail || []).forEach((line) => {
      const row = byProduct.get(line.productId);

      if (!row) {
        return;
      }

      row.quantity += Number(line.quantity || 0);

      row.revenue += Number(line.subtotal || 0);

      row.cost += Number(line.unitCost || 0) * Number(line.quantity || 0);
    }),
  );

  creditSales.forEach((line) => {
    const row = byProduct.get(line.productId);

    if (!row) {
      return;
    }

    row.quantity += Number(line.quantity || 0);

    row.revenue += Number(line.total || 0);

    row.cost += Number(line.unitCost || 0) * Number(line.quantity || 0);
  });

  const products = [...byProduct.values()].map((row) => ({
    ...row,

    quantity: Number(row.quantity.toFixed(3)),

    revenue: roundMoney(row.revenue),

    cost: roundMoney(row.cost),

    profit: roundMoney(row.revenue - row.cost),
  }));

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

  const slowProducts = sold
    .filter(
      (item) =>
        item.quantity <=
        Math.max(
          1,

          average * 0.4,
        ),
    )
    .slice(0, 10);

  const noSalesProducts = products
    .filter(
      (item) =>
        item.quantity === 0 &&
        store.products.find((p) => p.id === item.productId)?.active,
    )
    .slice(0, 10);

  const promotions = [...noSalesProducts, ...slowProducts]
    .filter(
      (item, index, list) =>
        list.findIndex(
          (candidate) => candidate.productId === item.productId,
        ) === index,
    )
    .filter((item) => {
      const product = store.products.find((p) => p.id === item.productId);

      return (
        product?.active &&
        Number(product.stock || 0) > 0 &&
        ageInDays(product.createdAt) >= PROMOTION_MIN_AGE_DAYS
      );
    })
    .slice(0, 8)
    .map((item) => {
      const product = store.products.find((p) => p.id === item.productId);

      const salePrice = Number(product.salePrice || 0);

      const unitCost = Number(product.unitCost || 0);

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

  const receivables = roundMoney(
    store.customers
      .filter((customer) => customer.active)
      .reduce(
        (sum, customer) => sum + customerBalance(customer.id).balance,

        0,
      ),
  );

  const debtorsCount = store.customers.filter(
    (customer) => customer.active && customerBalance(customer.id).balance > 0,
  ).length;

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

    salesCount: sales.length + creditSales.length,

    cashSalesCount: sales.length,

    creditSalesCount: creditSales.length,

    unitsSold,

    lowStockCount: store.products.filter(
      (p) => p.active && Number(p.stock) <= Number(p.minStock),
    ).length,

    receivables,

    debtorsCount,

    topProducts,

    slowProducts,

    noSalesProducts,

    promotions,
  };
}

router.get(
  "/summary",

  requireRole("Administrador"),

  (req, res) =>
    response(
      res,

      buildSummary(req.query),
    ),
);

router.get(
  "/top-products",

  requireRole("Administrador"),

  (req, res) =>
    response(
      res,

      buildSummary(req.query).topProducts,
    ),
);

export default router;
