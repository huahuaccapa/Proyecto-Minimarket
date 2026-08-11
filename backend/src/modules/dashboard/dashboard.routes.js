import { Router } from 'express';
import { store } from '../../data/store.js';
import { summary } from '../reports/reports.routes.js';
import { response } from '../../utils/http.js';

const router = Router();

router.get('/', (req, res) => response(res, {
  summary: summary(),
  recentSales: [...store.sales].reverse().slice(0, 5),
  lowStock: store.products.filter((item) => item.stock <= item.minStock).slice(0, 5),
}));

export default router;
