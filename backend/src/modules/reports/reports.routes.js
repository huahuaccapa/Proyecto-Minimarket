import { Router } from 'express';
import { store } from '../../data/store.js';
import { response } from '../../utils/http.js';

const router = Router();

const summary = () => {
  const revenue = Number(store.sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2));
  const cost = Number(store.sales.reduce((sum, sale) => sum + (sale.cost || 0), 0).toFixed(2));
  const expenses = Number(store.expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2));
  return { revenue, cost, expenses, profit: Number((revenue - cost - expenses).toFixed(2)), salesCount: store.sales.length, unitsSold: store.sales.reduce((sum, sale) => sum + sale.items, 0), lowStockCount: store.products.filter((product) => product.stock <= product.minStock).length };
};

router.get('/summary', (req, res) => response(res, summary()));

router.get('/top-products', (req, res) => {
  const quantities = new Map();
  store.sales.flatMap((sale) => sale.detail || []).forEach((item) => quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity));
  const data = [...quantities.entries()].map(([productId, quantity]) => ({ product: store.products.find((item) => item.id === productId)?.name || 'Producto', quantity })).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
  response(res, data);
});

export { summary };
export default router;
