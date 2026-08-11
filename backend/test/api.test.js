import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('GET /api/health confirma que la API funciona', async () => {
  const result = await request(app).get('/api/health').expect(200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.data.storage, 'memory');
});

test('POST /api/auth/login autentica al administrador', async () => {
  const result = await request(app).post('/api/auth/login').send({ username: 'admin', password: '123' }).expect(200);
  assert.equal(result.body.data.user.role, 'Administrador');
  assert.equal(result.body.data.user.password, undefined);
});

test('POST /api/auth/login autentica a la vendedora', async () => {
  const result = await request(app).post('/api/auth/login').send({ username: 'aydee', password: '123' }).expect(200);
  assert.equal(result.body.data.user.name, 'Aydee');
  assert.equal(result.body.data.user.role, 'Vendedora');
});

test('POST /api/auth/login rechaza credenciales incorrectas', async () => {
  await request(app).post('/api/auth/login').send({ username: 'aydee', password: 'incorrecta' }).expect(401);
});

test('GET /api/products/barcode/:barcode encuentra un producto', async () => {
  const result = await request(app).get('/api/products/barcode/7750243051205').expect(200);
  assert.equal(result.body.data.name, 'Leche Gloria Entera');
});

test('POST /api/sales registra una venta y descuenta stock', async () => {
  const before = await request(app).get('/api/products/p1');
  const sale = await request(app).post('/api/sales').send({ items: [{ productId: 'p1', quantity: 1 }], paymentMethod: 'Efectivo', received: 10 }).expect(201);
  const after = await request(app).get('/api/products/p1');
  assert.equal(sale.body.data.total, 4.5);
  assert.equal(after.body.data.stock, before.body.data.stock - 1);
});

test('POST /api/inventory/adjust rechaza una salida sin stock', async () => {
  await request(app).post('/api/inventory/adjust').send({ productId: 'p4', type: 'salida', quantity: 999, reason: 'Prueba' }).expect(409);
});