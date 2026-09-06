import { Router } from "express";

import { randomUUID } from "node:crypto";

import { persistStore, store } from "../../data/store.js";

import { requireRole } from "../../middlewares/auth.js";

import { HttpError, required, response } from "../../utils/http.js";

const router = Router();

const money4 = (value) => Number(Number(value).toFixed(4));

const categoryExists = (id) =>
  store.categories.some((item) => item.id === id && item.active);

const brandExists = (id) =>
  !id || store.brands.some((item) => item.id === id && item.active);

function validateCommon(body, current = {}) {
  const purchasePrice = Number(
    body.purchasePrice ?? current.purchasePrice ?? 0,
  );

  const contentQuantity = Number(
    body.contentQuantity ?? current.contentQuantity ?? 1,
  );

  const purchaseQuantity = Number(
    body.purchaseQuantity ?? current.purchaseQuantity ?? 1,
  );

  const salePrice = Number(body.salePrice ?? current.salePrice ?? 0);

  const minStock = Number(body.minStock ?? current.minStock ?? 0);

  const categoryId = String(body.categoryId ?? current.categoryId ?? "");

  const brandId = String(body.brandId ?? current.brandId ?? "");

  const values = [
    purchasePrice,
    contentQuantity,
    purchaseQuantity,
    salePrice,
    minStock,
  ];

  if (
    !values.every(Number.isFinite) ||
    purchasePrice <= 0 ||
    contentQuantity <= 0 ||
    purchaseQuantity <= 0 ||
    salePrice <= 0 ||
    minStock < 0
  ) {
    throw new HttpError(
      400,

      "Revisa los precios y cantidades ingresados",
    );
  }

  if (!categoryExists(categoryId)) {
    throw new HttpError(
      400,

      "Selecciona una categoría válida",
    );
  }

  if (!brandExists(brandId)) {
    throw new HttpError(
      400,

      "Selecciona una marca válida",
    );
  }

  return {
    purchasePrice,
    contentQuantity,
    purchaseQuantity,
    salePrice,
    minStock,
    categoryId,
    brandId,
  };
}

function buildNewProduct(body) {
  const data = validateCommon(body);

  const stock = data.purchaseQuantity * data.contentQuantity;

  const unitCost = data.purchasePrice / data.contentQuantity;

  return {
    barcode: String(body.barcode || "").trim(),

    name: String(body.name || "").trim(),

    description: String(body.description || "").trim(),

    categoryId: data.categoryId,

    brandId: data.brandId,

    purchasePresentation: body.purchasePresentation || "unidad",

    purchasePrice: money4(data.purchasePrice),

    contentQuantity: data.contentQuantity,

    purchaseQuantity: data.purchaseQuantity,

    unitCost: money4(unitCost),

    salePrice: Number(data.salePrice.toFixed(2)),

    stock: Number(stock.toFixed(3)),

    minStock: data.minStock,

    saleUnit: body.saleUnit || body.unit || "unidad",

    unit: body.unit || body.saleUnit || "unidad",

    image: String(body.image || ""),

    expirationDate: String(body.expirationDate || ""),

    sanitaryRegistration: String(body.sanitaryRegistration || "").trim(),

    lot: String(body.lot || "").trim(),

    active: body.active ?? true,
  };
}

function buildUpdatedProduct(body, current) {
  const data = validateCommon(body, current);

  return {
    ...current,

    barcode: String(body.barcode ?? current.barcode ?? "").trim(),

    name: String(body.name ?? current.name ?? "").trim(),

    description: String(body.description ?? current.description ?? "").trim(),

    categoryId: data.categoryId,

    brandId: data.brandId,

    purchasePresentation:
      body.purchasePresentation ?? current.purchasePresentation ?? "unidad",

    purchasePrice: money4(data.purchasePrice),

    contentQuantity: data.contentQuantity,

    purchaseQuantity: data.purchaseQuantity,

    // Protegido.
    unitCost: Number(current.unitCost || 0),

    // Protegido.
    stock: Number(current.stock || 0),

    salePrice: Number(data.salePrice.toFixed(2)),

    minStock: data.minStock,

    saleUnit: body.saleUnit ?? body.unit ?? current.saleUnit ?? "unidad",

    unit: body.unit ?? body.saleUnit ?? current.unit ?? "unidad",

    image: String(body.image ?? current.image ?? ""),

    expirationDate: String(body.expirationDate ?? current.expirationDate ?? ""),

    sanitaryRegistration: String(
      body.sanitaryRegistration ?? current.sanitaryRegistration ?? "",
    ).trim(),

    lot: String(body.lot ?? current.lot ?? "").trim(),

    active: body.active ?? current.active ?? true,
  };
}

router.get(
  "/",

  (req, res) => {
    const search = String(req.query.search || "").toLowerCase();

    response(
      res,

      store.products.filter((item) =>
        `${item.name} ${item.barcode} ${item.lot || ""}`
          .toLowerCase()
          .includes(search),
      ),
    );
  },
);

router.get(
  "/barcode/:barcode",

  (req, res) => {
    const product = store.products.find(
      (item) => item.barcode === req.params.barcode,
    );

    if (!product) {
      throw new HttpError(
        404,

        "Producto no encontrado",
      );
    }

    response(res, product);
  },
);

router.get(
  "/:id",

  (req, res) => {
    const product = store.products.find((item) => item.id === req.params.id);

    if (!product) {
      throw new HttpError(
        404,

        "Producto no encontrado",
      );
    }

    response(res, product);
  },
);

router.post(
  "/",

  requireRole("Administrador"),

  (req, res) => {
    required(req.body, [
      "barcode",
      "name",
      "categoryId",
      "purchasePrice",
      "salePrice",
    ]);

    const barcode = String(req.body.barcode).trim();

    if (!barcode) {
      throw new HttpError(
        400,

        "Ingresa un código de barras",
      );
    }

    if (store.products.some((item) => item.barcode === barcode)) {
      throw new HttpError(
        409,

        "El código de barras ya está registrado",
      );
    }

    const product = {
      id: randomUUID(),

      ...buildNewProduct({
        ...req.body,
        barcode,
      }),

      createdAt: new Date().toISOString(),
    };

    store.products.unshift(product);

    if (product.stock > 0) {
      store.inventoryMovements.push({
        id: randomUUID(),

        productId: product.id,

        productName: product.name,

        type: "entrada",

        reasonType: "inventario_inicial",

        reason: "Inventario inicial",

        quantity: product.stock,

        stockAfter: product.stock,

        date: new Date().toISOString(),

        createdBy: req.user.id,
      });
    }

    persistStore();

    response(res, product, "Producto creado", 201);
  },
);

router.put(
  "/:id",

  requireRole("Administrador"),

  (req, res) => {
    const index = store.products.findIndex((item) => item.id === req.params.id);

    if (index === -1) {
      throw new HttpError(
        404,

        "Producto no encontrado",
      );
    }

    const current = store.products[index];

    const barcode = String(req.body.barcode ?? current.barcode).trim();

    if (
      store.products.some(
        (item, position) => position !== index && item.barcode === barcode,
      )
    ) {
      throw new HttpError(
        409,

        "El código de barras ya está registrado",
      );
    }

    const updated = {
      ...buildUpdatedProduct(
        {
          ...req.body,
          barcode,
        },
        current,
      ),

      updatedAt: new Date().toISOString(),
    };

    store.products[index] = updated;

    persistStore();

    response(res, updated, "Producto actualizado");
  },
);

export default router;
