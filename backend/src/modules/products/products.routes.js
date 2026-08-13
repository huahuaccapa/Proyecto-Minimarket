import { Router } from 'express';
import { randomUUID } from 'node:crypto';

import { store } from '../../data/store.js';

import {
  HttpError,
  required,
  response,
} from '../../utils/http.js';

const router = Router();

const findCategoryName = (
  categoryId
) =>
  store.categories?.find(
    (item) =>
      item.id === categoryId
  )?.name || '';

const findBrandName = (
  brandId
) =>
  store.brands?.find(
    (item) =>
      item.id === brandId
  )?.name || '';

const validateNumbers = (
  product
) => {
  const values = [
    product.purchasePrice,
    product.contentQuantity,
    product.purchaseQuantity,
    product.unitCost,
    product.salePrice,
    product.stock,
    product.minStock,
  ];

  if (
    !values.every(
      Number.isFinite
    )
  ) {
    throw new HttpError(
      400,
      'Precios y cantidades deben ser números válidos'
    );
  }

  if (
    product.purchasePrice <= 0 ||
    product.contentQuantity <= 0 ||
    product.purchaseQuantity <= 0 ||
    product.salePrice <= 0 ||
    product.stock < 0 ||
    product.minStock < 0
  ) {
    throw new HttpError(
      400,
      'Revisa los precios y cantidades ingresados'
    );
  }
};

router.get('/', (req, res) => {
  const search = String(
    req.query.search || ''
  ).toLowerCase();

  const data =
    store.products.filter(
      (item) =>
        `
          ${item.name || ''}
          ${item.barcode || ''}
          ${item.category || ''}
          ${item.brand || ''}
          ${item.lot || ''}
          ${
            item.sanitaryRegistration ||
            ''
          }
        `
          .toLowerCase()
          .includes(search)
    );

  response(res, data);
});

router.get(
  '/barcode/:barcode',
  (req, res) => {
    const product =
      store.products.find(
        (item) =>
          item.barcode ===
          req.params.barcode
      );

    if (!product) {
      throw new HttpError(
        404,
        'Producto no encontrado'
      );
    }

    response(res, product);
  }
);

router.get('/:id', (req, res) => {
  const product =
    store.products.find(
      (item) =>
        item.id === req.params.id
    );

  if (!product) {
    throw new HttpError(
      404,
      'Producto no encontrado'
    );
  }

  response(res, product);
});

router.post('/', (req, res) => {
  required(req.body, [
    'barcode',
    'name',
    'purchasePrice',
    'salePrice',
  ]);

  const barcode = String(
    req.body.barcode
  ).trim();

  const duplicated =
    store.products.some(
      (item) =>
        item.barcode === barcode
    );

  if (duplicated) {
    throw new HttpError(
      409,
      'El código de barras ya está registrado'
    );
  }

  const category =
    req.body.category ||
    findCategoryName(
      req.body.categoryId
    );

  const brand =
    req.body.brand ||
    findBrandName(
      req.body.brandId
    );

  if (!category) {
    throw new HttpError(
      400,
      'Selecciona una categoría válida'
    );
  }

  const purchasePrice = Number(
    req.body.purchasePrice
  );

  const contentQuantity = Number(
    req.body.contentQuantity || 1
  );

  const purchaseQuantity = Number(
    req.body.purchaseQuantity || 1
  );

  const salePrice = Number(
    req.body.salePrice
  );

  const stock = Number(
    req.body.stock || 0
  );

  const minStock = Number(
    req.body.minStock || 0
  );

  const unitCost =
    purchasePrice /
    Math.max(
      contentQuantity,
      1
    );

  const product = {
    id: randomUUID(),

    barcode,

    name: String(
      req.body.name
    ).trim(),

    description: String(
      req.body.description || ''
    ).trim(),

    category,

    categoryId:
      req.body.categoryId || '',

    brand,

    brandId:
      req.body.brandId || '',

    purchasePresentation:
      req.body.purchasePresentation ||
      'unidad',

    purchasePrice,

    contentQuantity,

    purchaseQuantity,

    unitCost: Number(
      unitCost.toFixed(4)
    ),

    salePrice,

    stock,

    minStock,

    saleUnit:
      req.body.saleUnit ||
      req.body.unit ||
      'unidad',

    unit:
      req.body.unit ||
      req.body.saleUnit ||
      'unidad',

    image: String(
      req.body.image || ''
    ),

    expirationDate:
      req.body.expirationDate || '',

    sanitaryRegistration: String(
      req.body.sanitaryRegistration ||
        ''
    ).trim(),

    lot: String(
      req.body.lot || ''
    ).trim(),

    active:
      req.body.active ?? true,

    createdAt:
      new Date().toISOString(),
  };

  validateNumbers(product);

  store.products.unshift(product);

  response(
    res,
    product,
    'Producto creado',
    201
  );
});

router.put('/:id', (req, res) => {
  const index =
    store.products.findIndex(
      (item) =>
        item.id === req.params.id
    );

  if (index === -1) {
    throw new HttpError(
      404,
      'Producto no encontrado'
    );
  }

  const current =
    store.products[index];

  const barcode = String(
    req.body.barcode ??
      current.barcode
  ).trim();

  const duplicated =
    store.products.some(
      (item, position) =>
        item.barcode === barcode &&
        position !== index
    );

  if (duplicated) {
    throw new HttpError(
      409,
      'El código de barras ya está registrado'
    );
  }

  const category =
    req.body.category ||
    findCategoryName(
      req.body.categoryId
    ) ||
    current.category;

  const brand =
    req.body.brand ||
    findBrandName(
      req.body.brandId
    ) ||
    current.brand ||
    '';

  if (!category) {
    throw new HttpError(
      400,
      'Selecciona una categoría válida'
    );
  }

  const purchasePrice = Number(
    req.body.purchasePrice ??
      current.purchasePrice
  );

  const contentQuantity = Number(
    req.body.contentQuantity ??
      current.contentQuantity ??
      1
  );

  const purchaseQuantity = Number(
    req.body.purchaseQuantity ??
      current.purchaseQuantity ??
      1
  );

  const salePrice = Number(
    req.body.salePrice ??
      current.salePrice
  );

  const stock = Number(
    req.body.stock ??
      current.stock
  );

  const minStock = Number(
    req.body.minStock ??
      current.minStock
  );

  const unitCost =
    purchasePrice /
    Math.max(
      contentQuantity,
      1
    );

  const product = {
    ...current,
    ...req.body,

    barcode,

    name: String(
      req.body.name ??
        current.name
    ).trim(),

    description: String(
      req.body.description ??
        current.description ??
        ''
    ).trim(),

    category,

    categoryId:
      req.body.categoryId ??
      current.categoryId ??
      '',

    brand,

    brandId:
      req.body.brandId ??
      current.brandId ??
      '',

    purchasePrice,

    contentQuantity,

    purchaseQuantity,

    unitCost: Number(
      unitCost.toFixed(4)
    ),

    salePrice,

    stock,

    minStock,

    saleUnit:
      req.body.saleUnit ??
      current.saleUnit ??
      current.unit ??
      'unidad',

    unit:
      req.body.unit ??
      req.body.saleUnit ??
      current.unit ??
      current.saleUnit ??
      'unidad',

    image: String(
      req.body.image ??
        current.image ??
        ''
    ),

    expirationDate:
      req.body.expirationDate ??
      current.expirationDate ??
      '',

    sanitaryRegistration: String(
      req.body.sanitaryRegistration ??
        current.sanitaryRegistration ??
        ''
    ).trim(),

    lot: String(
      req.body.lot ??
        current.lot ??
        ''
    ).trim(),

    updatedAt:
      new Date().toISOString(),
  };

  validateNumbers(product);

  store.products[index] =
    product;

  response(
    res,
    product,
    'Producto actualizado'
  );
});

router.delete('/:id', (req, res) => {
  const product =
    store.products.find(
      (item) =>
        item.id === req.params.id
    );

  if (!product) {
    throw new HttpError(
      404,
      'Producto no encontrado'
    );
  }

  product.active = false;

  response(
    res,
    product,
    'Producto desactivado'
  );
});

export default router;