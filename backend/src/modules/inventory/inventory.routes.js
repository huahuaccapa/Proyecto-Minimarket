import { Router } from 'express';
import { randomUUID } from 'node:crypto';

import { store } from '../../data/store.js';

import {
  HttpError,
  required,
  response,
} from '../../utils/http.js';

const router = Router();

router.get(
  '/movements',
  (req, res) => {
    response(
      res,
      [...store.inventoryMovements]
        .reverse()
    );
  }
);

router.get(
  '/low-stock',
  (req, res) => {
    response(
      res,
      store.products.filter(
        (item) =>
          item.active &&
          item.stock <= item.minStock
      )
    );
  }
);

router.get(
  '/expiring',
  (req, res) => {
    const months = Math.max(
      1,
      Number(req.query.months) || 2
    );

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const limit = new Date(today);

    limit.setMonth(
      limit.getMonth() + months
    );

    const data = store.products
      .filter(
        (item) =>
          item.active &&
          item.expirationDate
      )
      .map((item) => {
        const [
          year,
          month,
          day,
        ] = item.expirationDate
          .split('-')
          .map(Number);

        const expiration =
          new Date(
            year,
            month - 1,
            day
          );

        return {
          ...item,

          expiryStatus:
            expiration < today
              ? 'expired'
              : 'expiring',

          daysRemaining:
            Math.ceil(
              (expiration - today) /
                (24 * 60 * 60 * 1000)
            ),

          internalExpirationDate:
            expiration,
        };
      })
      .filter(
        (item) =>
          item.internalExpirationDate <=
          limit
      )
      .sort(
        (first, second) =>
          first.internalExpirationDate -
          second.internalExpirationDate
      )
      .map(
        ({
          internalExpirationDate,
          ...item
        }) => item
      );

    response(res, data);
  }
);

router.post(
  '/adjust',
  (req, res) => {
    required(req.body, [
      'productId',
      'type',
      'quantity',
      'reason',
    ]);

    if (
      ![
        'entrada',
        'salida',
      ].includes(req.body.type)
    ) {
      throw new HttpError(
        400,
        'El tipo debe ser entrada o salida'
      );
    }

    const quantity = Number(
      req.body.quantity
    );

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      throw new HttpError(
        400,
        'La cantidad debe ser mayor que cero'
      );
    }

    const product =
      store.products.find(
        (item) =>
          item.id ===
          req.body.productId
      );

    if (!product) {
      throw new HttpError(
        404,
        'Producto no encontrado'
      );
    }

    if (
      req.body.type === 'salida' &&
      product.stock < quantity
    ) {
      throw new HttpError(
        409,
        'Stock insuficiente'
      );
    }

    product.stock +=
      req.body.type === 'entrada'
        ? quantity
        : -quantity;

    const movement = {
      id: randomUUID(),

      productId: product.id,

      productName:
        product.name,

      type: req.body.type,

      quantity,

      reason:
        req.body.reason,

      stockAfter:
        product.stock,

      date:
        new Date().toISOString(),
    };

    store.inventoryMovements.push(
      movement
    );

    response(
      res,
      {
        product,
        movement,
      },
      'Inventario actualizado',
      201
    );
  }
);

export default router;