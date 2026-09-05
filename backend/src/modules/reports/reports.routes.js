import { Router } from "express";

import { store } from "../../data/store.js";

import { requireRole } from "../../middlewares/auth.js";

import { roundMoney } from "../../services/business.js";

import { response } from "../../utils/http.js";

const router = Router();

const validSale = (sale) => sale.status !== "voided";

const validExpense = (expense) => expense.status !== "voided";

function parsePeriod(query = {}) {
  const now = new Date();

  let end = query.to ? new Date(`${query.to}T23:59:59`) : now;

  let start;

  if (query.from) {
    start = new Date(`${query.from}T00:00:00`);
  } else if (query.period === "monthly") {
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  } else {
    start = new Date(end);

    const day = (start.getDay() + 6) % 7;

    start.setDate(start.getDate() - day);

    start.setHours(0, 0, 0, 0);
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

export function buildSummary(query = {}) {
  const { start, end } = parsePeriod(query);

  const sales = store.sales.filter(
    (sale) => validSale(sale) && within(sale.date, start, end),
  );

  const expenses = store.expenses.filter(
    (expense) => validExpense(expense) && within(expense.date, start, end),
  );

  const revenue = roundMoney(
    sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
  );

  const cost = roundMoney(
    sales.reduce((sum, sale) => sum + Number(sale.cost || 0), 0),
  );

  const expenseTotal = roundMoney(
    expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
  );

  const grossProfit = roundMoney(revenue - cost);

  const netProfit = roundMoney(grossProfit - expenseTotal);

  const unitsSold = roundMoney(
    sales.reduce((sum, sale) => sum + Number(sale.items || 0), 0),
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
    ? sold.reduce((sum, item) => sum + item.quantity, 0) / sold.length
    : 0;

  const topProducts = sold.slice(0, 10);

  const slowProducts = sold
    .filter((item) => item.quantity <= Math.max(1, average * 0.4))
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
    .slice(0, 8)
    .map((item) => {
      const product = store.products.find((p) => p.id === item.productId);

      const margin =
        Number(product.salePrice || 0) - Number(product.unitCost || 0);

      const maxDiscount =
        product.salePrice > 0
          ? Math.max(
              0,
              Math.min(
                15,
                Math.floor((margin / product.salePrice) * 100 * 0.6),
              ),
            )
          : 0;

      return {
        ...item,

        suggestedDiscountPercent: maxDiscount,

        suggestedPrice: roundMoney(product.salePrice * (1 - maxDiscount / 100)),

        reason:
          item.quantity === 0 ? "Sin ventas en el periodo" : "Baja rotación",
      };
    });

  return {
    period: {
      start: start.toISOString(),

      end: end.toISOString(),
    },

    revenue,

    cost,

    grossProfit,

    expenses: expenseTotal,

    netProfit,

    margin: revenue ? Number(((netProfit / revenue) * 100).toFixed(1)) : 0,

    salesCount: sales.length,

    unitsSold,

    lowStockCount: store.products.filter(
      (p) => p.active && p.stock <= p.minStock,
    ).length,

    topProducts,

    slowProducts,

    noSalesProducts,

    promotions,
  };
}

router.get("/summary", requireRole("Administrador"), (req, res) =>
  response(res, buildSummary(req.query)),
);

router.get("/top-products", requireRole("Administrador"), (req, res) =>
  response(res, buildSummary(req.query).topProducts),
);

export default router;
