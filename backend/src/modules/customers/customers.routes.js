import { Router } from "express";

import { randomUUID } from "node:crypto";

import { persistStore, store } from "../../data/store.js";

import { requireRole } from "../../middlewares/auth.js";

import {
  addCashMovement,
  customerBalance,
  isExpired,
  roundMoney,
} from "../../services/business.js";

import { HttpError, required, response } from "../../utils/http.js";

const router = Router();

const allowed = requireRole("Administrador", "Vendedora");

const FRACTIONAL_UNITS = new Set(["kg", "kilogramo", "litro", "l"]);

const clean = (value = "") => String(value ?? "").trim();

const normalize = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const allowsFraction = (product) =>
  FRACTIONAL_UNITS.has(normalize(product.saleUnit));

function findCustomer(id) {
  const customer = store.customers.find(
    (item) => item.id === id && item.active,
  );

  if (!customer) {
    throw new HttpError(
      404,

      "Cliente no encontrado",
    );
  }

  return customer;
}

function accountFor(customer) {
  const credits = store.customerCredits
    .filter((item) => item.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const payments = store.customerPayments
    .filter((item) => item.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    ...customer,

    account: customerBalance(customer.id),

    credits,

    payments,
  };
}

function validateCreditProduct(productId, quantity, extraAvailable = 0) {
  const product = store.products.find(
    (item) => item.id === productId && item.active,
  );

  if (!product) {
    throw new HttpError(
      404,

      "Producto no encontrado",
    );
  }

  const qty = Number(quantity);

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new HttpError(
      400,

      "La cantidad debe ser mayor que cero",
    );
  }

  if (!allowsFraction(product) && !Number.isInteger(qty)) {
    throw new HttpError(
      400,

      `${product.name} solo admite cantidades enteras`,
    );
  }

  if (isExpired(product.expirationDate)) {
    throw new HttpError(
      409,

      `${product.name} está vencido y no puede entregarse`,
    );
  }

  if (Number(product.stock || 0) + Number(extraAvailable || 0) < qty) {
    throw new HttpError(
      409,

      `Stock insuficiente para ${product.name}`,
    );
  }

  return {
    product,

    quantity: Number(qty.toFixed(3)),
  };
}

router.use(allowed);

router.get(
  "/",

  (req, res) => {
    const search = normalize(req.query.search || "");

    const data = store.customers
      .filter((item) => item.active)
      .filter((item) =>
        normalize(
          `${item.name} ${item.dni || ""} ${item.phone || ""}`,
        ).includes(search),
      )
      .map((item) => ({
        ...item,

        account: customerBalance(item.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    response(res, data);
  },
);

router.get(
  "/:id",

  (req, res) => {
    response(
      res,

      accountFor(findCustomer(req.params.id)),
    );
  },
);

router.post(
  "/",

  (req, res) => {
    required(req.body, ["name"]);

    const name = clean(req.body.name);

    const dni = clean(req.body.dni);

    if (!name) {
      throw new HttpError(
        400,

        "Ingresa el nombre del cliente",
      );
    }

    if (
      dni &&
      store.customers.some(
        (item) => item.active && item.dni && item.dni === dni,
      )
    ) {
      throw new HttpError(
        409,

        "Ya existe un cliente con ese DNI",
      );
    }

    const customer = {
      id: randomUUID(),

      name,

      dni,

      phone: clean(req.body.phone),

      address: clean(req.body.address),

      notes: clean(req.body.notes),

      active: true,

      createdAt: new Date().toISOString(),

      createdBy: req.user.id,
    };

    store.customers.push(customer);

    persistStore();

    response(
      res,

      accountFor(customer),

      "Cliente creado",

      201,
    );
  },
);

router.put(
  "/:id",

  (req, res) => {
    const customer = findCustomer(req.params.id);

    const name = clean(req.body.name ?? customer.name);

    const dni = clean(req.body.dni ?? customer.dni);

    if (!name) {
      throw new HttpError(
        400,

        "Ingresa el nombre del cliente",
      );
    }

    if (
      dni &&
      store.customers.some(
        (item) => item.active && item.id !== customer.id && item.dni === dni,
      )
    ) {
      throw new HttpError(
        409,

        "Ya existe otro cliente con ese DNI",
      );
    }

    Object.assign(customer, {
      name,

      dni,

      phone: clean(req.body.phone ?? customer.phone),

      address: clean(req.body.address ?? customer.address),

      notes: clean(req.body.notes ?? customer.notes),

      updatedAt: new Date().toISOString(),

      updatedBy: req.user.id,
    });

    persistStore();

    response(
      res,

      accountFor(customer),

      "Cliente actualizado",
    );
  },
);

router.delete(
  "/:id",

  (req, res) => {
    const customer = findCustomer(req.params.id);

    const { balance } = customerBalance(customer.id);

    if (balance > 0) {
      throw new HttpError(
        409,

        "No puedes eliminar un cliente que todavía tiene una deuda pendiente",
      );
    }

    customer.active = false;

    customer.deletedAt = new Date().toISOString();

    customer.deletedBy = req.user.id;

    persistStore();

    response(
      res,

      customer,

      "Cliente eliminado",
    );
  },
);

/*
 * AGREGAR PRODUCTO
 * A LA CUENTA.
 */
router.post(
  "/:id/credits",

  (req, res) => {
    const customer = findCustomer(req.params.id);

    required(req.body, ["productId", "quantity"]);

    const { product, quantity } = validateCreditProduct(
      req.body.productId,

      req.body.quantity,
    );

    /*
     * El frontend NO
     * decide el precio.
     */
    const unitPrice = roundMoney(product.salePrice);

    const entry = {
      id: randomUUID(),

      customerId: customer.id,

      productId: product.id,

      productName: product.name,

      barcode: product.barcode,

      saleUnit: product.saleUnit,

      quantity,

      unitPrice,

      unitCost: Number(product.unitCost || 0),

      total: roundMoney(unitPrice * quantity),

      status: "active",

      notes: clean(req.body.notes),

      createdAt: new Date().toISOString(),

      createdBy: req.user.id,
    };

    /*
     * Fiado:
     * producto sale.
     *
     * Caja NO cambia.
     */
    product.stock = Number((Number(product.stock || 0) - quantity).toFixed(3));

    store.inventoryMovements.push({
      id: randomUUID(),

      productId: product.id,

      productName: product.name,

      type: "salida",

      reasonType: "credito_cliente",

      reason: `Crédito a cliente: ${customer.name}`,

      referenceType: "customer_credit",

      referenceId: entry.id,

      quantity,

      stockAfter: product.stock,

      date: entry.createdAt,

      createdBy: req.user.id,
    });

    store.customerCredits.push(entry);

    persistStore();

    response(
      res,

      accountFor(customer),

      "Producto agregado a la cuenta",

      201,
    );
  },
);

/*
 * EDITAR REGISTRO
 * DEL CLIENTE.
 */
router.put(
  "/:id/credits/:creditId",

  (req, res) => {
    const customer = findCustomer(req.params.id);

    const credit = store.customerCredits.find(
      (item) =>
        item.id === req.params.creditId &&
        item.customerId === customer.id &&
        item.status !== "voided",
    );

    if (!credit) {
      throw new HttpError(
        404,

        "Registro de crédito no encontrado",
      );
    }

    const targetProductId = req.body.productId ?? credit.productId;

    const targetQuantity = req.body.quantity ?? credit.quantity;

    const sameProduct = targetProductId === credit.productId;

    const { product: targetProduct, quantity } = validateCreditProduct(
      targetProductId,

      targetQuantity,

      sameProduct ? credit.quantity : 0,
    );

    const oldProduct = store.products.find(
      (item) => item.id === credit.productId,
    );

    if (!oldProduct) {
      throw new HttpError(
        409,

        "El producto original ya no existe",
      );
    }

    /*
     * Reconciliar stock:
     * devuelve anterior,
     * aplica nuevo.
     */
    oldProduct.stock = Number(
      (Number(oldProduct.stock || 0) + Number(credit.quantity || 0)).toFixed(3),
    );

    targetProduct.stock = Number(
      (Number(targetProduct.stock || 0) - quantity).toFixed(3),
    );

    const now = new Date().toISOString();

    const unitPrice = roundMoney(targetProduct.salePrice);

    const newTotal = roundMoney(unitPrice * quantity);

    const otherCharges = roundMoney(
      store.customerCredits
        .filter(
          (item) =>
            item.customerId === customer.id &&
            item.status !== "voided" &&
            item.id !== credit.id,
        )
        .reduce(
          (sum, item) => sum + Number(item.total || 0),

          0,
        ),
    );

    const paid = customerBalance(customer.id).payments;

    if (roundMoney(otherCharges + newTotal) < paid) {
      /*
       * Deshacer
       * cambio temporal.
       */
      targetProduct.stock = Number(
        (Number(targetProduct.stock || 0) + quantity).toFixed(3),
      );

      oldProduct.stock = Number(
        (Number(oldProduct.stock || 0) - Number(credit.quantity || 0)).toFixed(
          3,
        ),
      );

      throw new HttpError(
        409,

        "No puedes reducir este cargo por debajo del monto que el cliente ya pagó",
      );
    }

    store.inventoryMovements.push({
      id: randomUUID(),

      productId: oldProduct.id,

      productName: oldProduct.name,

      type: "entrada",

      reasonType: "edicion_credito_cliente",

      reason: `Corrección de crédito de ${customer.name}`,

      referenceType: "customer_credit",

      referenceId: credit.id,

      quantity: Number(credit.quantity || 0),

      stockAfter: oldProduct.stock,

      date: now,

      createdBy: req.user.id,
    });

    store.inventoryMovements.push({
      id: randomUUID(),

      productId: targetProduct.id,

      productName: targetProduct.name,

      type: "salida",

      reasonType: "edicion_credito_cliente",

      reason: `Crédito corregido de ${customer.name}`,

      referenceType: "customer_credit",

      referenceId: credit.id,

      quantity,

      stockAfter: targetProduct.stock,

      date: now,

      createdBy: req.user.id,
    });

    Object.assign(credit, {
      productId: targetProduct.id,

      productName: targetProduct.name,

      barcode: targetProduct.barcode,

      saleUnit: targetProduct.saleUnit,

      quantity,

      unitPrice,

      unitCost: Number(targetProduct.unitCost || 0),

      total: newTotal,

      notes: clean(req.body.notes ?? credit.notes),

      updatedAt: now,

      updatedBy: req.user.id,
    });

    persistStore();

    response(
      res,

      accountFor(customer),

      "Registro de crédito actualizado",
    );
  },
);

/*
 * ELIMINAR / ANULAR
 * UN PRODUCTO FIADO.
 */
router.delete(
  "/:id/credits/:creditId",

  (req, res) => {
    const customer = findCustomer(req.params.id);

    const credit = store.customerCredits.find(
      (item) =>
        item.id === req.params.creditId &&
        item.customerId === customer.id &&
        item.status !== "voided",
    );

    if (!credit) {
      throw new HttpError(
        404,

        "Registro de crédito no encontrado",
      );
    }

    const accountBefore = customerBalance(customer.id);

    const chargesAfter = roundMoney(
      accountBefore.charges - Number(credit.total || 0),
    );

    if (chargesAfter < accountBefore.payments) {
      throw new HttpError(
        409,

        "Este registro ya está cubierto total o parcialmente por pagos y no puede eliminarse",
      );
    }

    const product = store.products.find((item) => item.id === credit.productId);

    if (product) {
      product.stock = Number(
        (Number(product.stock || 0) + Number(credit.quantity || 0)).toFixed(3),
      );

      store.inventoryMovements.push({
        id: randomUUID(),

        productId: product.id,

        productName: product.name,

        type: "entrada",

        reasonType: "anulacion_credito_cliente",

        reason: `Anulación de crédito de ${customer.name}`,

        referenceType: "customer_credit",

        referenceId: credit.id,

        quantity: Number(credit.quantity || 0),

        stockAfter: product.stock,

        date: new Date().toISOString(),

        createdBy: req.user.id,
      });
    }

    credit.status = "voided";

    credit.voidedAt = new Date().toISOString();

    credit.voidedBy = req.user.id;

    credit.voidReason = clean(req.body?.reason || "Registro eliminado");

    persistStore();

    response(
      res,

      accountFor(customer),

      "Registro eliminado y stock restaurado",
    );
  },
);

/*
 * CLIENTE PAGA
 * PARTE O TODA
 * SU CUENTA.
 */
router.post(
  "/:id/payments",

  (req, res) => {
    const customer = findCustomer(req.params.id);

    required(req.body, ["amount"]);

    const amount = roundMoney(req.body.amount);

    const account = customerBalance(customer.id);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new HttpError(
        400,

        "El pago debe ser mayor que cero",
      );
    }

    if (amount > account.balance) {
      throw new HttpError(
        409,

        "El pago no puede ser mayor que la deuda pendiente",
      );
    }

    const payment = {
      id: randomUUID(),

      customerId: customer.id,

      amount,

      status: "active",

      notes: clean(req.body.notes),

      createdAt: new Date().toISOString(),

      createdBy: req.user.id,
    };

    /*
     * Aquí sí entra
     * dinero a caja.
     */
    addCashMovement({
      direction: "in",

      type: "customer_payment",

      amount,

      reason: `Pago de cuenta - ${customer.name}`,

      referenceType: "customer_payment",

      referenceId: payment.id,

      userId: req.user.id,

      notes: payment.notes,
    });

    store.customerPayments.push(payment);

    persistStore();

    response(
      res,

      accountFor(customer),

      "Pago registrado en caja",

      201,
    );
  },
);

export default router;
