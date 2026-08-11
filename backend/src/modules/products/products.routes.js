import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { store } from '../../data/store.js';
import { HttpError, required, response } from '../../utils/http.js';

const router = Router();

router.get('/', (req, res) => {
  const search = String(req.query.search || '').toLowerCase();
  const data = store.products.filter((item) => `${item.name} ${item.barcode} ${item.category}`.toLowerCase().includes(search));
  response(res, data);
});

router.get('/barcode/:barcode', (req, res) => {
  const product = store.products.find((item) => item.barcode === req.params.barcode);
  if (!product) throw new HttpError(404, 'Producto no encontrado');
  response(res, product);
});

router.get('/:id', (req, res) => {
  const product = store.products.find((item) => item.id === req.params.id);
  if (!product) throw new HttpError(404, 'Producto no encontrado');
  response(res, product);
});

router.post('/', (req, res) => {
  required(req.body, ['barcode', 'name', 'category', 'purchasePrice', 'salePrice']);
  if (store.products.some((item) => item.barcode === req.body.barcode)) throw new HttpError(409, 'El código de barras ya está registrado');
  const product = { id: randomUUID(), barcode: String(req.body.barcode), name: req.body.name, category: req.body.category, purchasePrice: Number(req.body.purchasePrice), salePrice: Number(req.body.salePrice), stock: Number(req.body.stock || 0), minStock: Number(req.body.minStock || 0), unit: req.body.unit || 'unidad', active: req.body.active ?? true, createdAt: new Date().toISOString() };
  if (product.purchasePrice < 0 || product.salePrice < 0 || product.stock < 0) throw new HttpError(400, 'Precios y stock no pueden ser negativos');
  store.products.unshift(product);
  response(res, product, 'Producto creado', 201);
});

router.put('/:id', (req, res) => {
  const index = store.products.findIndex((item) => item.id === req.params.id);
  if (index === -1) throw new HttpError(404, 'Producto no encontrado');
  if (req.body.barcode && store.products.some((item, position) => item.barcode === req.body.barcode && position !== index)) throw new HttpError(409, 'El código de barras ya está registrado');
  store.products[index] = { ...store.products[index], ...req.body, purchasePrice: Number(req.body.purchasePrice ?? store.products[index].purchasePrice), salePrice: Number(req.body.salePrice ?? store.products[index].salePrice), stock: Number(req.body.stock ?? store.products[index].stock), minStock: Number(req.body.minStock ?? store.products[index].minStock), updatedAt: new Date().toISOString() };
  response(res, store.products[index], 'Producto actualizado');
});

router.delete('/:id', (req, res) => {
  const product = store.products.find((item) => item.id === req.params.id);
  if (!product) throw new HttpError(404, 'Producto no encontrado');
  product.active = false;
  response(res, product, 'Producto desactivado');
});

export default router;
