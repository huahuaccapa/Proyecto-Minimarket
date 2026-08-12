import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { store } from '../../data/store.js';
import { HttpError, required, response } from '../../utils/http.js';

const router = Router();

router.get('/movements', (req, res) => response(res, [...store.inventoryMovements].reverse()));
router.get('/low-stock', (req, res) => response(res, store.products.filter((item) => item.active && item.stock <= item.minStock)));

router.post('/adjust', (req, res) => {
  required(req.body, ['productId', 'type', 'quantity', 'reason']);
  if (!['entrada', 'salida'].includes(req.body.type)) throw new HttpError(400, 'El tipo debe ser entrada o salida');
  const quantity = Number(req.body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) throw new HttpError(400, 'La cantidad debe ser mayor que cero');
  const product = store.products.find((item) => item.id === req.body.productId);
  if (!product) throw new HttpError(404, 'Producto no encontrado');
  if (product.saleUnit === 'unidad' && !Number.isInteger(quantity)) throw new HttpError(400, 'Este producto requiere una cantidad entera');
  if (req.body.type === 'salida' && product.stock < quantity) throw new HttpError(409, 'Stock insuficiente');
  product.stock = Number((product.stock + (req.body.type === 'entrada' ? quantity : -quantity)).toFixed(3));
  const movement = { id: randomUUID(), productId: product.id, productName: product.name, type: req.body.type, quantity, reason: req.body.reason, stockAfter: product.stock, date: new Date().toISOString() };
  store.inventoryMovements.push(movement);
  response(res, { product, movement }, 'Inventario actualizado', 201);
});

export default router;