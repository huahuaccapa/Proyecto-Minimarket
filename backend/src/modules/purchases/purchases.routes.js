import { Router } from "express";

import { randomUUID } from "node:crypto";

import { nextNumber, persistStore, store } from "../../data/store.js";

import { requireRole } from "../../middlewares/auth.js";

import {
  addCashMovement,
  ensureCashAvailable,
  roundMoney,
} from "../../services/business.js";

import { HttpError, required, response } from "../../utils/http.js";

const router = Router();

const clean = (value = "") => String(value ?? "").trim();

router.get("/", requireRole("Administrador"), (req, res) =>
  response(res, store.purchases),
);

router.get("/suppliers", (req, res) => response(res, store.suppliers));

router.post("/suppliers", requireRole("Administrador"), (req, res) => {
  required(req.body, ["businessName"]);

  const ruc = clean(req.body.ruc);

  if (ruc && store.suppliers.some((item) => item.ruc === ruc)) {
    throw new HttpError(409, "Ya existe un proveedor con ese RUC");
  }

  const supplier = {
    id: randomUUID(),

    businessName: clean(req.body.businessName),

    ruc,

    phone: clean(req.body.phone),

    email: clean(req.body.email),

    address: clean(req.body.address),

    notes: clean(req.body.notes),

    active: true,

    representatives: Array.isArray(req.body.representatives)
      ? req.body.representatives.map((r) => ({
          ...r,

          id: r.id || randomUUID(),

          name: clean(r.name),

          position: clean(r.position),

          phone: clean(r.phone),

          email: clean(r.email),

          notes: clean(r.notes),
        }))
      : [],

    createdAt: new Date().toISOString(),
  };

  store.suppliers.unshift(supplier);

  persistStore();

  response(res, supplier, "Proveedor registrado", 201);
});

router.put("/suppliers/:id", requireRole("Administrador"), (req, res) => {
  const index = store.suppliers.findIndex((item) => item.id === req.params.id);

  if (index < 0) {
    throw new HttpError(404, "Proveedor no encontrado");
  }

  const current = store.suppliers[index];

  const ruc = clean(req.body.ruc ?? current.ruc);

  if (
    ruc &&
    store.suppliers.some((item, pos) => pos !== index && item.ruc === ruc)
  ) {
    throw new HttpError(409, "Ya existe un proveedor con ese RUC");
  }

  store.suppliers[index] = {
    ...current,

    ...req.body,

    businessName: clean(req.body.businessName ?? current.businessName),

    ruc,

    updatedAt: new Date().toISOString(),
  };

  persistStore();

  response(res, store.suppliers[index], "Proveedor actualizado");
});

router.get("/:id", requireRole("Administrador"), (req, res) => {
  const item = store.purchases.find((p) => p.id === req.params.id);

  if (!item) {
    throw new HttpError(404, "Compra no encontrada");
  }

  response(res, item);
});

router.post("/", requireRole("Administrador"), (req, res) => {
  required(req.body, [
    "supplierId",
    "documentType",
    "documentNumber",
    "date",
    "detail",
  ]);

  const supplier = store.suppliers.find(
    (item) => item.id === req.body.supplierId && item.active,
  );

  if (!supplier) {
    throw new HttpError(404, "Proveedor no encontrado");
  }

  const documentType = clean(req.body.documentType);

  const documentNumber = clean(req.body.documentNumber);

  if (
    store.purchases.some(
      (p) =>
        p.supplierId === supplier.id &&
        p.documentType.toLowerCase() === documentType.toLowerCase() &&
        p.documentNumber.toLowerCase() === documentNumber.toLowerCase() &&
        p.status !== "voided",
    )
  ) {
    throw new HttpError(
      409,
      "Ese comprobante ya fue registrado para este proveedor",
    );
  }

  if (!Array.isArray(req.body.detail) || !req.body.detail.length) {
    throw new HttpError(400, "La compra debe incluir productos");
  }

  const detail = req.body.detail.map((line) => {
    const product = store.products.find(
      (p) => p.id === line.productId && p.active,
    );

    if (!product) {
      throw new HttpError(404, `Producto no encontrado: ${line.productId}`);
    }

    const packages = Number(line.packages ?? line.quantity ?? 0);

    const contentQuantity = Number(
      line.contentQuantity ?? product.contentQuantity ?? 1,
    );

    const purchasePrice = Number(line.purchasePrice ?? 0);

    if (
      !Number.isFinite(packages) ||
      packages <= 0 ||
      !Number.isFinite(contentQuantity) ||
      contentQuantity <= 0 ||
      !Number.isFinite(purchasePrice) ||
      purchasePrice <= 0
    ) {
      throw new HttpError(400, `Revisa cantidades y costo de ${product.name}`);
    }

    const units = Number((packages * contentQuantity).toFixed(3));

    const unitCost = Number((purchasePrice / contentQuantity).toFixed(4));

    return {
      productId: product.id,

      productName: product.name,

      packages,

      contentQuantity,

      units,

      purchasePrice: roundMoney(purchasePrice),

      unitCost,

      subtotal: roundMoney(packages * purchasePrice),

      lot: clean(line.lot),

      expirationDate: clean(line.expirationDate),
    };
  });

  const total = roundMoney(
    detail.reduce((sum, line) => sum + line.subtotal, 0),
  );

  const paymentMethod = clean(req.body.paymentMethod || "Efectivo");

  const paymentStatus = clean(req.body.paymentStatus || "Pagado");

  if (!["Efectivo", "Crédito proveedor"].includes(paymentMethod)) {
    throw new HttpError(400, "Forma de pago de compra inválida");
  }

  if (!["Pagado", "Pendiente"].includes(paymentStatus)) {
    throw new HttpError(400, "Estado de pago inválido");
  }

  if (paymentMethod === "Efectivo" && paymentStatus !== "Pagado") {
    throw new HttpError(400, "Una compra en efectivo debe quedar pagada");
  }

  if (paymentMethod === "Efectivo" && paymentStatus === "Pagado") {
    ensureCashAvailable(total);
  }

  const purchase = {
    id: randomUUID(),

    number: nextNumber("purchase", "C"),

    supplierId: supplier.id,

    supplier: supplier.businessName,

    documentType,

    documentNumber,

    date: req.body.date,

    total,

    items: detail.reduce((sum, line) => sum + line.units, 0),

    currency: "PEN",

    paymentMethod,

    paymentStatus,

    status: "completed",

    notes: clean(req.body.notes),

    documentName: clean(req.body.documentName),

    documentMimeType: clean(req.body.documentMimeType),

    documentDataUrl: clean(req.body.documentDataUrl),

    detail,

    createdAt: new Date().toISOString(),

    createdBy: req.user.id,
  };

  if (purchase.documentDataUrl.length > 2_500_000) {
    throw new HttpError(413, "La imagen del documento es demasiado grande");
  }

  detail.forEach((line) => {
    const product = store.products.find((p) => p.id === line.productId);

    const oldStock = Number(product.stock || 0);

    const newStock = oldStock + line.units;

    const oldValue = oldStock * Number(product.unitCost || 0);

    const newValue = line.units * line.unitCost;

    product.stock = Number(newStock.toFixed(3));

    product.unitCost =
      newStock > 0
        ? Number(((oldValue + newValue) / newStock).toFixed(4))
        : line.unitCost;

    product.purchasePrice = line.purchasePrice;

    product.contentQuantity = line.contentQuantity;

    product.purchaseQuantity = line.packages;

    if (line.lot) {
      product.lot = line.lot;
    }

    if (line.expirationDate) {
      product.expirationDate = line.expirationDate;
    }

    store.inventoryMovements.push({
      id: randomUUID(),

      productId: product.id,

      productName: product.name,

      type: "entrada",

      reasonType: "compra",

      reason: `Compra ${purchase.number}`,

      referenceType: "purchase",

      referenceId: purchase.id,

      quantity: line.units,

      stockAfter: product.stock,

      date: new Date().toISOString(),

      createdBy: req.user.id,
    });
  });

  store.purchases.unshift(purchase);

  if (paymentMethod === "Efectivo" && paymentStatus === "Pagado") {
    addCashMovement({
      direction: "out",

      type: "purchase",

      amount: total,

      reason: `Compra ${purchase.number}`,

      referenceType: "purchase",

      referenceId: purchase.id,

      userId: req.user.id,
    });
  }

  persistStore();

  response(res, purchase, "Compra registrada e inventario actualizado", 201);
});

export default router;
