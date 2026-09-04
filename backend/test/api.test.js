import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

test('GET /api/health confirma que la API funciona', async () => {
  const result = await request(app)
    .get('/api/health')
    .expect(200);

  assert.equal(result.body.success, true);
  assert.equal(result.body.data.storage, 'memory');
});

test('POST /api/auth/login autentica al administrador', async () => {
  const result = await request(app)
    .post('/api/auth/login')
    .send({
      username: 'admin',
      password: '123',
    })
    .expect(200);

  assert.equal(
    result.body.data.user.role,
    'Administrador'
  );

  assert.equal(
    result.body.data.user.password,
    undefined
  );
});

test('POST /api/auth/login autentica a la vendedora', async () => {
  const result = await request(app)
    .post('/api/auth/login')
    .send({
      username: 'aydee',
      password: '123',
    })
    .expect(200);

  assert.equal(
    result.body.data.user.name,
    'Aydee'
  );

  assert.equal(
    result.body.data.user.role,
    'Vendedora'
  );
});

test('POST /api/auth/login rechaza credenciales incorrectas', async () => {
  await request(app)
    .post('/api/auth/login')
    .send({
      username: 'aydee',
      password: 'incorrecta',
    })
    .expect(401);
});

test('GET /api/products/barcode/:barcode encuentra un producto', async () => {
  const result = await request(app)
    .get('/api/products/barcode/7750243051205')
    .expect(200);

  assert.equal(
    result.body.data.name,
    'Leche Gloria Entera'
  );
});

test('GET /api/catalogs/categories y brands devuelve los catálogos', async () => {
  const categories = await request(app)
    .get('/api/catalogs/categories')
    .expect(200);

  const brands = await request(app)
    .get('/api/catalogs/brands')
    .expect(200);

  assert.ok(
    categories.body.data.some(
      (item) => item.name === 'Bebidas'
    )
  );

  assert.ok(
    brands.body.data.some(
      (item) => item.name === 'Gloria'
    )
  );
});

test('POST /api/catalogs/categories crea una categoría', async () => {
  const result = await request(app)
    .post('/api/catalogs/categories')
    .send({
      name: 'Congelados',
      description: 'Productos refrigerados',
    })
    .expect(201);

  assert.equal(
    result.body.data.name,
    'Congelados'
  );
});

test('POST /api/products convierte un paquete a stock y costo unitario', async () => {
  const result = await request(app)
    .post('/api/products')
    .send({
      barcode: '9000000000001',
      name: 'Gaseosa de prueba',
      description: 'Paquete por 12',
      categoryId: 'cat2',
      brandId: 'brand2',
      purchasePresentation: 'paquete',
      purchasePrice: 24,
      contentQuantity: 12,
      purchaseQuantity: 2,
      saleUnit: 'unidad',
      salePrice: 2.6,
      minStock: 6,
    })
    .expect(201);

  assert.equal(
    result.body.data.unitCost,
    2
  );

  assert.equal(
    result.body.data.stock,
    24
  );
});

test('POST /api/sales permite vender alimento por fracción de kilogramo', async () => {
  const before = await request(app)
    .get('/api/products/p7');

  const sale = await request(app)
    .post('/api/sales')
    .send({
      items: [
        {
          productId: 'p7',
          quantity: 0.5,
        },
      ],
      paymentMethod: 'Efectivo',
      received: 5,
    })
    .expect(201);

  const after = await request(app)
    .get('/api/products/p7');

  assert.equal(
    sale.body.data.total,
    2.6
  );

  assert.equal(
    after.body.data.stock,
    before.body.data.stock - 0.5
  );
});

test('POST /api/sales registra una venta y descuenta stock', async () => {
  const before = await request(app)
    .get('/api/products/p1');

  const sale = await request(app)
    .post('/api/sales')
    .send({
      items: [
        {
          productId: 'p1',
          quantity: 1,
        },
      ],
      paymentMethod: 'Efectivo',
      received: 10,
    })
    .expect(201);

  const after = await request(app)
    .get('/api/products/p1');

  assert.equal(
    sale.body.data.total,
    4.5
  );

  assert.equal(
    after.body.data.stock,
    before.body.data.stock - 1
  );
});

test('POST /api/inventory/adjust rechaza una salida sin stock', async () => {
  await request(app)
    .post('/api/inventory/adjust')
    .send({
      productId: 'p4',
      type: 'salida',
      quantity: 999,
      reason: 'Prueba',
    })
    .expect(409);
});

test(
  'POST /api/sales suma S/ 1 por unidad cuando una bebida se vende helada',
  async () => {
    const product =
      await request(app)
        .get(
          '/api/products/p2'
        )
        .expect(200);

    const sale =
      await request(app)
        .post('/api/sales')
        .send({
          items: [
            {
              productId:
                'p2',

              quantity: 2,

              isChilled:
                true,
            },
          ],

          paymentMethod:
            'Efectivo',

          received: 10,
        })
        .expect(201);

    assert.equal(
      sale.body.data.total,

      (
        product.body.data
          .salePrice + 1
      ) * 2
    );

    assert.equal(
      sale.body.data
        .detail[0]
        .isChilled,
      true
    );

    assert.equal(
      sale.body.data
        .detail[0]
        .chilledSurcharge,
      1
    );

    assert.equal(
      sale.body.data
        .detail[0]
        .unitPrice,

      product.body.data
        .salePrice + 1
    );
  }
);

test(
  'POST /api/sales mantiene el precio normal de una bebida si no se marca helada',
  async () => {
    const product =
      await request(app)
        .get(
          '/api/products/p2'
        )
        .expect(200);

    const sale =
      await request(app)
        .post('/api/sales')
        .send({
          items: [
            {
              productId:
                'p2',

              quantity: 1,

              isChilled:
                false,
            },
          ],

          paymentMethod:
            'Yape',
        })
        .expect(201);

    assert.equal(
      sale.body.data.total,

      product.body.data
        .salePrice
    );

    assert.equal(
      sale.body.data
        .detail[0]
        .chilledSurcharge,
      0
    );
  }
);

test(
  'POST /api/sales rechaza el recargo helado para un producto que no es bebida',
  async () => {
    await request(app)
      .post('/api/sales')
      .send({
        items: [
          {
            productId:
              'p1',

            quantity: 1,

            isChilled:
              true,
          },
        ],

        paymentMethod:
          'Yape',
      })
      .expect(400);
  }
);