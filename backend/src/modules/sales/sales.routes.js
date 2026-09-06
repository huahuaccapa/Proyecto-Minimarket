import { Router } from "express";

import { randomUUID } from "node:crypto";

import { nextNumber, persistStore, store } from "../../data/store.js";

import { requireRole } from "../../middlewares/auth.js";

import {
  addCashMovement,
  ensureCashAvailable,
  isExpired,
  requireOpenCash,
  roundMoney,
} from "../../services/business.js";

import { HttpError, required, response } from "../../utils/http.js";

const router = Router();

const CHILLED_SURCHARGE = 1;

const FRACTIONAL_UNITS = new Set(["kg", "kilogramo", "litro", "l"]);

const normalize = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const isBeverage = (product) =>
  normalize(
    store.categories.find((item) => item.id === product.categoryId)?.name,
  ) === "bebidas";

const allowsFraction = (product) =>
  FRACTIONAL_UNITS.has(normalize(product.saleUnit));

router.get(
  "/",

  (req, res) => response(res, store.sales),
);

router.get(
  "/:id",

  (req, res) => {
    const sale = store.sales.find((item) => item.id === req.params.id);

    if (!sale) {
      throw new HttpError(
        404,

        "Venta no encontrada",
      );
    }

    response(res, sale);
  },
);

router.post(
  "/",

  (req, res) => {
    required(req.body, ["items", "paymentMethod"]);

    if (req.body.paymentMethod !== "Efectivo") {
      throw new HttpError(
        400,

        "Por el momento solo se aceptan pagos en efectivo",
      );
    }

    requireOpenCash();

    if (!Array.isArray(req.body.items) || !req.body.items.length) {
      throw new HttpError(
        400,

        "La venta debe contener productos",
      );
    }

    const consolidated = new Map();

    for (const raw of req.body.items) {
      const quantity = Number(raw.quantity);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new HttpError(
          400,

          "Cantidad de venta inválida",
        );
      }

      const current = consolidated.get(raw.productId) || {
        productId: raw.productId,

        quantity: 0,

        isChilled: false,
      };

      current.quantity += quantity;

      current.isChilled = current.isChilled || raw.isChilled === true;

      consolidated.set(raw.productId, current);
    }

    const detail = [...consolidated.values()].map((item) => {
      const product = store.products.find(
        (candidate) => candidate.id === item.productId && candidate.active,
      );

      if (!product) {
        throw new HttpError(
          404,

          `Producto no encontrado: ${item.productId}`,
        );
      }

      if (!allowsFraction(product) && !Number.isInteger(item.quantity)) {
        throw new HttpError(
          400,

          `${product.name} solo se vende en cantidades enteras`,
        );
      }

      if (isExpired(product.expirationDate)) {
        throw new HttpError(
          409,

          `${product.name} está vencido y no puede venderse`,
        );
      }

      if (Number(product.stock) < item.quantity) {
        throw new HttpError(
          409,

          `Stock insuficiente para ${product.name}`,
        );
      }

      if (item.isChilled && !isBeverage(product)) {
        throw new HttpError(
          400,

          "El recargo por bebida helada solo aplica a Bebidas",
        );
      }

      const surcharge = item.isChilled ? CHILLED_SURCHARGE : 0;

      const unitPrice = roundMoney(Number(product.salePrice) + surcharge);

      const unitCost = Number(product.unitCost || 0);

      return {
        productId: product.id,

        barcode: product.barcode,

        name: product.name,

        saleUnit: product.saleUnit,

        quantity: Number(item.quantity.toFixed(3)),

        baseUnitPrice: Number(product.salePrice),

        isChilled: item.isChilled,

        chilledSurcharge: surcharge,

        unitPrice,

        unitCost,

        subtotal: roundMoney(unitPrice * item.quantity),
      };
    });

    const total = roundMoney(
      detail.reduce(
        (sum, item) => sum + item.subtotal,

        0,
      ),
    );

    const cost = roundMoney(
      detail.reduce(
        (sum, item) => sum + item.unitCost * item.quantity,

        0,
      ),
    );

    const received = Number(req.body.received);

    if (!Number.isFinite(received) || received < total) {
      throw new HttpError(
        400,

        "El efectivo recibido es menor al total",
      );
    }

    const sale = {
      id: randomUUID(),

      number: nextNumber("sale", "V"),

      date: new Date().toISOString(),

      status: "completed",

      total,

      cost,

      grossProfit: roundMoney(total - cost),

      paymentMethod: "Efectivo",

      received: roundMoney(received),

      change: roundMoney(received - total),

      items: Number(
        detail
          .reduce(
            (sum, item) => sum + item.quantity,

            0,
          )
          .toFixed(3),
      ),

      detail,

      createdBy: req.user.id,
    };

    detail.forEach((item) => {
      const product = store.products.find(
        (candidate) => candidate.id === item.productId,
      );

      product.stock = Number(
        (Number(product.stock) - item.quantity).toFixed(3),
      );

      store.inventoryMovements.push({
        id: randomUUID(),

        productId: product.id,

        productName: product.name,

        type: "salida",

        reasonType: "venta",

        reason: `Venta ${sale.number}`,

        referenceType: "sale",

        referenceId: sale.id,

        quantity: item.quantity,

        stockAfter: product.stock,

        date: sale.date,

        createdBy: req.user.id,
      });
    });

    store.sales.push(sale);

    addCashMovement({
      direction: "in",

      type: "sale",

      amount: total,

      reason: `Venta ${sale.number}`,

      referenceType: "sale",

      referenceId: sale.id,

      userId: req.user.id,
    });

    persistStore();

    response(res, sale, "Venta registrada", 201);
  },
);

router.post(
  "/:id/void",

  requireRole("Administrador"),

  (req, res) => {
    const sale = store.sales.find((item) => item.id === req.params.id);

    if (!sale) {
      throw new HttpError(
        404,

        "Venta no encontrada",
      );
    }

    if (sale.status === "voided") {
      throw new HttpError(
        409,

        "La venta ya está anulada",
      );
    }

    ensureCashAvailable(sale.total);

    const now = new Date().toISOString();

    for (const item of sale.detail || []) {
      const product = store.products.find(
        (candidate) => candidate.id === item.productId,
      );

      if (!product) {
        continue;
      }

      product.stock = Number(
        (Number(product.stock || 0) + Number(item.quantity || 0)).toFixed(3),
      );

      store.inventoryMovements.push({
        id: randomUUID(),

        productId: product.id,

        productName: product.name,

        type: "entrada",

        reasonType: "anulacion_venta",

        reason: `Anulación ${sale.number}`,

        referenceType: "sale",

        referenceId: sale.id,

        quantity: Number(item.quantity),

        stockAfter: product.stock,

        date: now,

        createdBy: req.user.id,
      });
    }

    addCashMovement({
      direction: "out",

      type: "sale_void",

      amount: sale.total,

      reason: `Anulación ${sale.number}`,

      referenceType: "sale",

      referenceId: sale.id,

      userId: req.user.id,
    });

    sale.status = "voided";

    sale.voidedAt = now;

    sale.voidedBy = req.user.id;

    sale.voidReason = String(req.body.reason || "Anulación de venta").trim();

    persistStore();

    response(
      res,

      sale,

      "Venta anulada correctamente",
    );
  },
);

export default router;
