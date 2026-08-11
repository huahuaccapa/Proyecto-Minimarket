import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { store } from '../../data/store.js';
import { HttpError, required, response } from '../../utils/http.js';

const router = Router();

router.get('/', (req, res) => response(res, store.expenses));

router.post('/', (req, res) => {
  required(req.body, ['date', 'description', 'category', 'amount']);
  const amount = Number(req.body.amount);
  if (amount <= 0) throw new HttpError(400, 'El monto debe ser mayor que cero');
  const expense = { id: randomUUID(), date: req.body.date, description: req.body.description, category: req.body.category, amount, createdAt: new Date().toISOString() };
  store.expenses.unshift(expense);
  response(res, expense, 'Gasto registrado', 201);
});

router.delete('/:id', (req, res) => {
  const index = store.expenses.findIndex((item) => item.id === req.params.id);
  if (index === -1) throw new HttpError(404, 'Gasto no encontrado');
  const [deleted] = store.expenses.splice(index, 1);
  response(res, deleted, 'Gasto eliminado');
});

export default router;
