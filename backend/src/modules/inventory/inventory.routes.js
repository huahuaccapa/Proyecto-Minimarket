import { Router } from "express";

import { randomUUID } from "node:crypto";

import { persistStore, store } from "../../data/store.js";

import { requireRole } from "../../middlewares/auth.js";

import { HttpError, required, response } from "../../utils/http.js";

const router = Router();

const FRACTIONAL_UNITS = new Set(["kg", "kilogramo", "litro", "l"]);

const normalize = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const allowsFraction = (product) =>
  FRACTIONAL_UNITS.has(normalize(product.saleUnit));

router.get(
  "/movements",

  (req, res) => {
    response(
      res,

      [...store.inventoryMovements].reverse(),
    );
  },
);

router.get(
  "/low-stock",

  (req, res) => {
    response(
      res,

      store.products.filter(
        (item) => item.active && item.stock <= item.minStock,
      ),
    );
  },
);

router.get(
  "/expiring",

  (req, res) => {
    const days = Math.max(
      1,

      Number(req.query.days) || 60,
    );

    const now = new Date();

    const limit = new Date(now.getTime() + days * 86400000);

    const data = store.products
      .filter((item) => item.active && item.expirationDate)
      .map((item) => {
        const expiry = new Date(`${item.expirationDate}T23:59:59-05:00`);

        return {
          ...item,

          expiryStatus: expiry < now ? "expired" : "expiring",

          daysRemaining: Math.ceil((expiry - now) / 86400000),

          _expiry: expiry,
        };
      })
      .filter((item) => item._expiry <= limit)
      .sort((a, b) => a._expiry - b._expiry)
      .map(({ _expiry, ...item }) => item);

    response(res, data);
  },
);

router.post(
  "/adjust",

  requireRole("Administrador"),

  (req, res) => {
    required(req.body, ["productId", "type", "quantity", "reason"]);

    if (!["entrada", "salida"].includes(req.body.type)) {
      throw new HttpError(
        400,

        "El tipo debe ser entrada o salida",
      );
    }

    const quantity = Number(req.body.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new HttpError(
        400,

        "La cantidad debe ser mayor que cero",
      );
    }

    const product = store.products.find(
      (item) => item.id === req.body.productId,
    );

    if (!product) {
      throw new HttpError(
        404,

        "Producto no encontrado",
      );
    }

    if (!allowsFraction(product) && !Number.isInteger(quantity)) {
      throw new HttpError(
        400,

        `${product.name} solo admite cantidades enteras`,
      );
    }

    if (req.body.type === "salida" && Number(product.stock) < quantity) {
      throw new HttpError(
        409,

        "Stock insuficiente",
      );
    }

    product.stock = Number(
      (
        Number(product.stock || 0) +
        (req.body.type === "entrada" ? quantity : -quantity)
      ).toFixed(3),
    );

    const movement = {
      id: randomUUID(),

      productId: product.id,

      productName: product.name,

      type: req.body.type,

      reasonType: String(req.body.reasonType || "ajuste_manual"),

      reason: String(req.body.reason).trim(),

      quantity,

      stockAfter: product.stock,

      date: new Date().toISOString(),

      createdBy: req.user.id,
    };

    store.inventoryMovements.push(movement);

    persistStore();

    response(
      res,

      {
        product,
        movement,
      },

      "Inventario actualizado",

      201,
    );
  },
);

export default router;
