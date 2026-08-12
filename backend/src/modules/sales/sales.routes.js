import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { nextNumber, store } from '../../data/store.js';
import { HttpError, required, response } from '../../utils/http.js';

const router = Router();

router.get('/', (req, res) => response(res, store.sales));

router.get('/:id', (req, res) => {
  const sale = store.sales.find((item) => item.id === req.params.id);
  if (!sale) throw new HttpError(404, 'Venta no encontrada');
  response(res, sale);
});

router.post('/', (req, res) => {
  required(req.body, ['items', 'paymentMethod']);
  if (!Array.isArray(req.body.items) || !req.body.items.length) throw new HttpError(400, 'La venta debe contener productos');

  const detail = req.body.items.map((item) => {
    const product = store.products.find((candidate) => candidate.id === item.productId && candidate.active);
    const quantity = Number(item.quantity);
    if (!product) throw new HttpError(404, `Producto no encontrado: ${item.productId}`);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new HttpError(400, `Cantidad inválida para ${product.name}`);
    if (product.saleUnit === 'unidad' && !Number.isInteger(quantity)) throw new HttpError(400, `${product.name} solo se vende en unidades completas`);
    if (product.stock < quantity) throw new HttpError(409, `Stock insuficiente para ${product.name}`);
    return { productId: product.id, barcode: product.barcode, name: product.name, saleUnit: product.saleUnit, quantity, unitPrice: product.salePrice, unitCost: product.unitCost ?? product.purchasePrice, subtotal: Number((product.salePrice * quantity).toFixed(2)) };
  });

  const total = Number(detail.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  const cost = Number(detail.reduce((sum, item) => sum + item.unitCost * item.quantity, 0).toFixed(2));
  const received = Number(req.body.received ?? total);
  if (req.body.paymentMethod === 'Efectivo' && received < total) throw new HttpError(400, 'El efectivo recibido es menor al total');

  detail.forEach((item) => {
    const product = store.products.find((candidate) => candidate.id === item.productId);
    product.stock = Number((product.stock - item.quantity).toFixed(3));
    store.inventoryMovements.push({ id: randomUUID(), productId: product.id, productName: product.name, type: 'salida', quantity: item.quantity, reason: 'Venta', stockAfter: product.stock, date: new Date().toISOString() });
  });

  const sale = { id: randomUUID(), number: nextNumber('V', store.sales), date: new Date().toISOString(), total, cost, paymentMethod: req.body.paymentMethod, received, change: Number(Math.max(received - total, 0).toFixed(2)), items: detail.reduce((sum, item) => sum + item.quantity, 0), detail };
  store.sales.push(sale);
  response(res, sale, 'Venta registrada', 201);
});

export default router;