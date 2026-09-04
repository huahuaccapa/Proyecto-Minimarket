import { Router } from 'express';
import { randomUUID } from 'node:crypto';

import { store } from '../../data/store.js';

import {
  HttpError,
  required,
  response,
} from '../../utils/http.js';

const router = Router();

const getCashSummary = () => {
  const cashSales = Number(
    store.sales
      .filter(
        (sale) =>
          sale.paymentMethod === 'Efectivo'
      )
      .reduce(
        (sum, sale) =>
          sum + Number(sale.total || 0),
        0
      )
      .toFixed(2)
  );

  const manualIncome = Number(
    store.cashMovements
      .filter(
        (movement) =>
          movement.type === 'entrada'
      )
      .reduce(
        (sum, movement) =>
          sum + Number(movement.amount || 0),
        0
      )
      .toFixed(2)
  );

  const withdrawals = Number(
    store.cashMovements
      .filter(
        (movement) =>
          movement.type === 'retiro'
      )
      .reduce(
        (sum, movement) =>
          sum + Number(movement.amount || 0),
        0
      )
      .toFixed(2)
  );

  const balance = Number(
    (
      cashSales +
      manualIncome -
      withdrawals
    ).toFixed(2)
  );

  return {
    cashSales,
    manualIncome,
    withdrawals,
    balance,
    movements: store.cashMovements,
  };
};

router.get('/', (req, res) => {
  response(
    res,
    getCashSummary()
  );
});

router.post('/movements', (req, res) => {
  required(
    req.body,
    [
      'type',
      'amount',
      'reason',
    ]
  );

  if (
    ![
      'entrada',
      'retiro',
    ].includes(req.body.type)
  ) {
    throw new HttpError(
      400,
      'Tipo de movimiento de caja inválido'
    );
  }

  const amount = Number(req.body.amount);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new HttpError(
      400,
      'El monto debe ser mayor que cero'
    );
  }

  if (
    req.body.type === 'retiro'
  ) {
    const current = getCashSummary();

    if (
      amount > current.balance
    ) {
      throw new HttpError(
        409,
        'No hay suficiente efectivo en caja para realizar este retiro'
      );
    }
  }

  const movement = {
    id: randomUUID(),

    type: req.body.type,

    amount: Number(
      amount.toFixed(2)
    ),

    reason: String(
      req.body.reason || ''
    ).trim(),

    notes: String(
      req.body.notes || ''
    ).trim(),

    date: new Date().toISOString(),
  };

  store.cashMovements.push(
    movement
  );

  response(
    res,
    movement,
    req.body.type === 'entrada'
      ? 'Efectivo añadido a caja'
      : 'Retiro de caja registrado',
    201
  );
});

export {
  getCashSummary,
};

export default router;