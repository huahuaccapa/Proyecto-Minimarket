import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { store } from '../../data/store.js';
import { HttpError, required, response } from '../../utils/http.js';

const router = Router();

const normalizeProduct = (body, previous = null) => {
  required(body, ['barcode', 'name', 'categoryId', 'purchasePresentation', 'purchasePrice', 'contentQuantity', 'purchaseQuantity', 'saleUnit', 'salePrice', 'minStock']);
  const purchasePrice = Number(body.purchasePrice);
  const contentQuantity = Number(body.contentQuantity);
  const purchaseQuantity = Number(body.purchaseQuantity);
  const salePrice = Number(body.salePrice);
  const minStock = Number(body.minStock);
  const stock = previous ? Number(body.stock ?? previous.stock) : Number((purchaseQuantity * contentQuantity).toFixed(3));
  if (![purchasePrice, contentQuantity, purchaseQuantity, salePrice, minStock, stock].every(Number.isFinite)) throw new HttpError(400, 'Precios y cantidades deben ser números válidos');
  if (purchasePrice <= 0 || contentQuantity <= 0 || purchaseQuantity <= 0 || salePrice <= 0 || minStock < 0 || stock < 0) throw new HttpError(400, 'Revisa los precios y cantidades ingresados');
  if (!['unidad', 'paquete', 'saco'].includes(body.purchasePresentation)) throw new HttpError(400, 'Presentación de compra inválida');
  if (!['unidad', 'kg'].includes(body.saleUnit)) throw new HttpError(400, 'Unidad de venta inválida');
  if (body.saleUnit === 'unidad' && ![contentQuantity, purchaseQuantity, stock, minStock].every(Number.isInteger)) throw new HttpError(400, 'Los productos vendidos por unidad requieren cantidades enteras');
  if (!store.categories.some((item) => item.id === body.categoryId && item.active)) throw new HttpError(400, 'Selecciona una categoría válida');
  if (body.brandId && !store.brands.some((item) => item.id === body.brandId && item.active)) throw new HttpError(400, 'Selecciona una marca válida');
  return {
    ...previous, ...body, barcode: String(body.barcode).trim(), name: String(body.name).trim(),
    description: String(body.description || '').trim(), brandId: body.brandId || '', purchasePrice,
    contentQuantity, purchaseQuantity, unitCost: Number((purchasePrice / contentQuantity).toFixed(4)),
    salePrice, stock, minStock, image: String(body.image || ''), active: body.active ?? true,
  };
};

router.get('/', (req, res) => {
  const search = String(req.query.search || '').toLowerCase();
  const data = store.products.filter((item) => {
    const category = store.categories.find((candidate) => candidate.id === item.categoryId)?.name || '';
    const brand = store.brands.find((candidate) => candidate.id === item.brandId)?.name || '';
    return `${item.name} ${item.barcode} ${category} ${brand}`.toLowerCase().includes(search);
  });
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
  if (store.products.some((item) => item.barcode === String(req.body.barcode).trim())) throw new HttpError(409, 'El código de barras ya está registrado');
  const product = { ...normalizeProduct(req.body), id: randomUUID(), createdAt: new Date().toISOString() };
  store.products.unshift(product);
  response(res, product, 'Producto creado', 201);
});

router.put('/:id', (req, res) => {
  const index = store.products.findIndex((item) => item.id === req.params.id);
  if (index === -1) throw new HttpError(404, 'Producto no encontrado');
  if (req.body.barcode && store.products.some((item, position) => item.barcode === String(req.body.barcode).trim() && position !== index)) throw new HttpError(409, 'El código de barras ya está registrado');
  store.products[index] = { ...normalizeProduct(req.body, store.products[index]), updatedAt: new Date().toISOString() };
  response(res, store.products[index], 'Producto actualizado');
});

router.delete('/:id', (req, res) => {
  const product = store.products.find((item) => item.id === req.params.id);
  if (!product) throw new HttpError(404, 'Producto no encontrado');
  product.active = false;
  response(res, product, 'Producto desactivado');
});

export default router;