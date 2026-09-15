import { Router } from "express";

import { randomUUID } from "node:crypto";

import { pool, withTransaction } from "../../config/database.js";

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

function dateOnly(value) {
  if (!value) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

/*
 * ==========================================
 * MAPEO CLIENTE
 * ==========================================
 */

function mapCustomer(row) {
  return {
    id: row.id,

    name: row.name,

    dni: row.dni || "",

    phone: row.phone || "",

    address: row.address || "",

    notes: row.notes || "",

    active: Boolean(row.active),

    createdBy: row.createdBy || null,

    createdAt: row.createdAt,

    updatedBy: row.updatedBy || null,

    updatedAt: row.updatedAt,

    deletedBy: row.deletedBy || null,

    deletedAt: row.deletedAt || null,
  };
}

/*
 * ==========================================
 * MAPEO CRÉDITO
 * ==========================================
 */

function mapCredit(row) {
  return {
    id: row.id,

    customerId: row.customerId,

    productId: row.productId,

    productName: row.productName,

    barcode: row.barcode || "",

    saleUnit: row.saleUnit || "unidad",

    quantity: Number(row.quantity || 0),

    unitPrice: Number(row.unitPrice || 0),

    unitCost: Number(row.unitCost || 0),

    total: Number(row.total || 0),

    status: row.status,

    notes: row.notes || "",

    createdAt: row.createdAt,

    createdBy: row.createdBy || null,

    updatedAt: row.updatedAt || null,

    updatedBy: row.updatedBy || null,

    voidedAt: row.voidedAt || null,

    voidedBy: row.voidedBy || null,

    voidReason: row.voidReason || "",
  };
}

/*
 * ==========================================
 * MAPEO PAGO
 * ==========================================
 */

function mapPayment(row) {
  return {
    id: row.id,

    customerId: row.customerId,

    amount: Number(row.amount || 0),

    status: row.status,

    notes: row.notes || "",

    createdAt: row.createdAt,

    createdBy: row.createdBy || null,

    voidedAt: row.voidedAt || null,

    voidedBy: row.voidedBy || null,

    voidReason: row.voidReason || "",
  };
}

/*
 * ==========================================
 * BUSCAR CLIENTE
 * ==========================================
 */

async function findCustomer(id, connection = null, lock = false) {
  const db = connection || pool;

  const [rows] = await db.execute(
    `
      SELECT
        id,
        name,
        dni,
        phone,
        address,
        notes,
        active,

        created_by
          AS createdBy,

        created_at
          AS createdAt,

        updated_by
          AS updatedBy,

        updated_at
          AS updatedAt,

        deleted_by
          AS deletedBy,

        deleted_at
          AS deletedAt

      FROM customers

      WHERE
        id = ?
        AND active = 1

      LIMIT 1

      ${lock ? "FOR UPDATE" : ""}
      `,

    [id],
  );

  if (!rows[0]) {
    throw new HttpError(404, "Cliente no encontrado");
  }

  return mapCustomer(rows[0]);
}

/*
 * ==========================================
 * CRÉDITOS DE CLIENTE
 * ==========================================
 */

async function customerCredits(customerId, connection = null) {
  const db = connection || pool;

  const [rows] = await db.execute(
    `
      SELECT
        id,

        customer_id
          AS customerId,

        product_id
          AS productId,

        product_name
          AS productName,

        barcode,

        sale_unit
          AS saleUnit,

        quantity,

        unit_price
          AS unitPrice,

        unit_cost
          AS unitCost,

        total,
        status,
        notes,

        created_at
          AS createdAt,

        created_by
          AS createdBy,

        updated_at
          AS updatedAt,

        updated_by
          AS updatedBy,

        voided_at
          AS voidedAt,

        voided_by
          AS voidedBy,

        void_reason
          AS voidReason

      FROM customer_credits

      WHERE customer_id = ?

      ORDER BY created_at DESC
      `,

    [customerId],
  );

  return rows.map(mapCredit);
}

/*
 * ==========================================
 * PAGOS DEL CLIENTE
 * ==========================================
 */

async function customerPayments(customerId, connection = null) {
  const db = connection || pool;

  const [rows] = await db.execute(
    `
      SELECT
        id,

        customer_id
          AS customerId,

        amount,
        status,
        notes,

        created_at
          AS createdAt,

        created_by
          AS createdBy,

        voided_at
          AS voidedAt,

        voided_by
          AS voidedBy,

        void_reason
          AS voidReason

      FROM customer_payments

      WHERE customer_id = ?

      ORDER BY created_at DESC
      `,

    [customerId],
  );

  return rows.map(mapPayment);
}

/*
 * ==========================================
 * CUENTA COMPLETA
 * ==========================================
 */

async function accountFor(customer, connection = null) {
  const [account, credits, payments] = await Promise.all([
    customerBalance(customer.id, connection),

    customerCredits(customer.id, connection),

    customerPayments(customer.id, connection),
  ]);

  return {
    ...customer,

    account,

    credits,

    payments,
  };
}

/*
 * ==========================================
 * PRODUCTO PARA FIADO
 * ==========================================
 */

async function getCreditProduct(productId, connection, lock = true) {
  const [rows] = await connection.execute(
    `
      SELECT
        id,
        barcode,
        name,

        sale_unit
          AS saleUnit,

        sale_price
          AS salePrice,

        unit_cost
          AS unitCost,

        stock,

        expiration_date
          AS expirationDate,

        active

      FROM products

      WHERE id = ?

      LIMIT 1

      ${lock ? "FOR UPDATE" : ""}
      `,

    [productId],
  );

  return rows[0] || null;
}

/*
 * ==========================================
 * VALIDAR PRODUCTO
 * ==========================================
 */

function validateCreditProduct(product, quantity, extraAvailable = 0) {
  if (!product || !product.active) {
    throw new HttpError(404, "Producto no encontrado");
  }

  const qty = Number(quantity);

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new HttpError(400, "La cantidad debe ser mayor que cero");
  }

  if (!allowsFraction(product) && !Number.isInteger(qty)) {
    throw new HttpError(400, `${product.name} solo admite cantidades enteras`);
  }

  if (isExpired(product.expirationDate)) {
    throw new HttpError(
      409,
      `${product.name} está vencido y no puede entregarse`,
    );
  }

  const available = Number(product.stock || 0) + Number(extraAvailable || 0);

  if (available < qty) {
    throw new HttpError(409, `Stock insuficiente para ${product.name}`);
  }

  return Number(qty.toFixed(3));
}

router.use(allowed);

/*
 * ==========================================
 * LISTAR CLIENTES
 * ==========================================
 */

router.get(
  "/",

  async (req, res) => {
    const search = `%${normalize(req.query.search || "")}%`;

    const [rows] = await pool.execute(
      `
        SELECT
          c.id,
          c.name,
          c.dni,
          c.phone,
          c.address,
          c.notes,
          c.active,

          c.created_by
            AS createdBy,

          c.created_at
            AS createdAt,

          c.updated_by
            AS updatedBy,

          c.updated_at
            AS updatedAt,

          c.deleted_by
            AS deletedBy,

          c.deleted_at
            AS deletedAt,

          COALESCE(
            cc.charges,
            0
          ) AS charges,

          COALESCE(
            cp.payments,
            0
          ) AS payments

        FROM customers c

        LEFT JOIN
        (
          SELECT
            customer_id,

            SUM(total)
              AS charges

          FROM customer_credits

          WHERE status <> 'voided'

          GROUP BY customer_id
        ) cc
          ON cc.customer_id = c.id

        LEFT JOIN
        (
          SELECT
            customer_id,

            SUM(amount)
              AS payments

          FROM customer_payments

          WHERE status <> 'voided'

          GROUP BY customer_id
        ) cp
          ON cp.customer_id = c.id

        WHERE
          c.active = 1

          AND
          (
            LOWER(c.name)
              LIKE ?

            OR LOWER(
              COALESCE(
                c.dni,
                ''
              )
            ) LIKE ?

            OR LOWER(
              COALESCE(
                c.phone,
                ''
              )
            ) LIKE ?
          )

        ORDER BY c.name ASC
        `,

      [search, search, search],
    );

    const data = rows.map((row) => {
      const customer = mapCustomer(row);

      const charges = roundMoney(row.charges || 0);

      const payments = roundMoney(row.payments || 0);

      return {
        ...customer,

        account: {
          charges,

          payments,

          balance: roundMoney(Math.max(0, charges - payments)),
        },
      };
    });

    response(res, data);
  },
);

/*
 * ==========================================
 * CLIENTE POR ID
 * ==========================================
 */

router.get(
  "/:id",

  async (req, res) => {
    const customer = await findCustomer(req.params.id);

    response(res, await accountFor(customer));
  },
);

/*
 * ==========================================
 * CREAR CLIENTE
 * ==========================================
 */

router.post(
  "/",

  async (req, res) => {
    required(req.body, ["name"]);

    const name = clean(req.body.name);

    const dni = clean(req.body.dni);

    if (!name) {
      throw new HttpError(400, "Ingresa el nombre del cliente");
    }

    if (dni) {
      const [duplicated] = await pool.execute(
        `
          SELECT id

          FROM customers

          WHERE
            active = 1
            AND dni = ?

          LIMIT 1
          `,

        [dni],
      );

      if (duplicated.length) {
        throw new HttpError(409, "Ya existe un cliente con ese DNI");
      }
    }

    const customer = {
      id: randomUUID(),

      name,

      dni,

      phone: clean(req.body.phone),

      address: clean(req.body.address),

      notes: clean(req.body.notes),

      active: true,

      createdAt: new Date(),

      createdBy: req.user.id,
    };

    await pool.execute(
      `
      INSERT INTO customers
      (
        id,
        name,
        dni,
        phone,
        address,
        notes,
        active,
        created_by,
        created_at,
        updated_by,
        updated_at,
        deleted_by,
        deleted_at
      )
      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,

      [
        customer.id,
        customer.name,
        customer.dni,
        customer.phone,
        customer.address,
        customer.notes,
        true,
        customer.createdBy,
        customer.createdAt,
        null,
        customer.createdAt,
        null,
        null,
      ],
    );

    response(
      res,

      await accountFor(customer),

      "Cliente creado",

      201,
    );
  },
);

/*
 * ==========================================
 * ACTUALIZAR CLIENTE
 * ==========================================
 */

router.put(
  "/:id",

  async (req, res) => {
    const current = await findCustomer(req.params.id);

    const name = clean(req.body.name ?? current.name);

    const dni = clean(req.body.dni ?? current.dni);

    if (!name) {
      throw new HttpError(400, "Ingresa el nombre del cliente");
    }

    if (dni) {
      const [duplicated] = await pool.execute(
        `
          SELECT id

          FROM customers

          WHERE
            active = 1
            AND dni = ?
            AND id <> ?

          LIMIT 1
          `,

        [dni, current.id],
      );

      if (duplicated.length) {
        throw new HttpError(409, "Ya existe otro cliente con ese DNI");
      }
    }

    const updated = {
      ...current,

      name,

      dni,

      phone: clean(req.body.phone ?? current.phone),

      address: clean(req.body.address ?? current.address),

      notes: clean(req.body.notes ?? current.notes),

      updatedAt: new Date(),

      updatedBy: req.user.id,
    };

    await pool.execute(
      `
      UPDATE customers

      SET
        name = ?,
        dni = ?,
        phone = ?,
        address = ?,
        notes = ?,
        updated_by = ?,
        updated_at = ?

      WHERE id = ?
      `,

      [
        updated.name,
        updated.dni,
        updated.phone,
        updated.address,
        updated.notes,
        updated.updatedBy,
        updated.updatedAt,
        updated.id,
      ],
    );

    response(
      res,

      await accountFor(updated),

      "Cliente actualizado",
    );
  },
);

/*
 * ==========================================
 * ELIMINAR CLIENTE
 * ==========================================
 */

router.delete(
  "/:id",

  async (req, res) => {
    const customer = await findCustomer(req.params.id);

    const account = await customerBalance(customer.id);

    if (account.balance > 0) {
      throw new HttpError(
        409,
        "No puedes eliminar un cliente que todavía tiene una deuda pendiente",
      );
    }

    const now = new Date();

    await pool.execute(
      `
      UPDATE customers

      SET
        active = 0,
        deleted_at = ?,
        deleted_by = ?,
        updated_at = ?

      WHERE id = ?
      `,

      [now, req.user.id, now, customer.id],
    );

    response(
      res,

      {
        ...customer,

        active: false,

        deletedAt: now,

        deletedBy: req.user.id,
      },

      "Cliente eliminado",
    );
  },
);

/*
 * ==========================================
 * AGREGAR PRODUCTO FIADO
 * ==========================================
 */

router.post(
  "/:id/credits",

  async (req, res) => {
    required(req.body, ["productId", "quantity"]);

    await withTransaction(async (connection) => {
      const customer = await findCustomer(req.params.id, connection, true);

      const product = await getCreditProduct(
        req.body.productId,
        connection,
        true,
      );

      const quantity = validateCreditProduct(product, req.body.quantity);

      const unitPrice = roundMoney(product.salePrice);

      const now = new Date();

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

        createdAt: now,

        createdBy: req.user.id,
      };

      const newStock = Number(
        (Number(product.stock || 0) - quantity).toFixed(3),
      );

      /*
       * Producto sale del inventario.
       */
      await connection.execute(
        `
          UPDATE products

          SET
            stock = ?,
            updated_at = ?

          WHERE id = ?
          `,

        [newStock, now, product.id],
      );

      /*
       * Cargo del cliente.
       */
      await connection.execute(
        `
          INSERT INTO customer_credits
          (
            id,
            customer_id,
            product_id,
            product_name,
            barcode,
            sale_unit,
            quantity,
            unit_price,
            unit_cost,
            total,
            status,
            notes,
            created_at,
            created_by,
            updated_at,
            updated_by,
            voided_at,
            voided_by,
            void_reason
          )
          VALUES
          (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
          )
          `,

        [
          entry.id,
          entry.customerId,
          entry.productId,
          entry.productName,
          entry.barcode,
          entry.saleUnit,
          entry.quantity,
          entry.unitPrice,
          entry.unitCost,
          entry.total,
          entry.status,
          entry.notes,
          entry.createdAt,
          entry.createdBy,
          null,
          null,
          null,
          null,
          "",
        ],
      );

      /*
       * Auditoría de inventario.
       */
      await connection.execute(
        `
          INSERT INTO inventory_movements
          (
            id,
            product_id,
            product_name,
            movement_type,
            reason_type,
            reason,
            reference_type,
            reference_id,
            quantity,
            stock_after,
            movement_date,
            created_by
          )
          VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,

        [
          randomUUID(),
          product.id,
          product.name,
          "salida",
          "credito_cliente",
          `Crédito a cliente: ${customer.name}`,
          "customer_credit",
          entry.id,
          quantity,
          newStock,
          now,
          req.user.id,
        ],
      );
    });

    const customer = await findCustomer(req.params.id);

    response(
      res,

      await accountFor(customer),

      "Producto agregado a la cuenta",

      201,
    );
  },
);

/*
 * ==========================================
 * EDITAR PRODUCTO FIADO
 * ==========================================
 */

router.put(
  "/:id/credits/:creditId",

  async (req, res) => {
    await withTransaction(async (connection) => {
      const customer = await findCustomer(req.params.id, connection, true);

      const [creditRows] = await connection.execute(
        `
            SELECT
              id,

              customer_id
                AS customerId,

              product_id
                AS productId,

              product_name
                AS productName,

              barcode,

              sale_unit
                AS saleUnit,

              quantity,

              unit_price
                AS unitPrice,

              unit_cost
                AS unitCost,

              total,
              status,
              notes,

              created_at
                AS createdAt,

              created_by
                AS createdBy

            FROM customer_credits

            WHERE
              id = ?
              AND customer_id = ?
              AND status <> 'voided'

            LIMIT 1

            FOR UPDATE
            `,

        [req.params.creditId, customer.id],
      );

      if (!creditRows[0]) {
        throw new HttpError(404, "Registro de crédito no encontrado");
      }

      const credit = mapCredit(creditRows[0]);

      const targetProductId = req.body.productId ?? credit.productId;

      const targetQuantity = req.body.quantity ?? credit.quantity;

      const sameProduct = targetProductId === credit.productId;

      /*
       * Bloqueamos el producto original.
       */
      const oldProduct = await getCreditProduct(
        credit.productId,
        connection,
        true,
      );

      if (!oldProduct) {
        throw new HttpError(409, "El producto original ya no existe");
      }

      /*
       * Si se cambió el producto buscamos
       * también el nuevo.
       */
      const targetProduct = sameProduct
        ? oldProduct
        : await getCreditProduct(targetProductId, connection, true);

      const quantity = validateCreditProduct(
        targetProduct,
        targetQuantity,
        sameProduct ? credit.quantity : 0,
      );

      const unitPrice = roundMoney(targetProduct.salePrice);

      const newTotal = roundMoney(unitPrice * quantity);

      /*
       * No se puede reducir la deuda por
       * debajo de lo que ya se pagó.
       */
      const account = await customerBalance(customer.id, connection);

      const otherCharges = roundMoney(
        account.charges - Number(credit.total || 0),
      );

      if (roundMoney(otherCharges + newTotal) < account.payments) {
        throw new HttpError(
          409,
          "No puedes reducir este cargo por debajo del monto que el cliente ya pagó",
        );
      }

      const now = new Date();

      /*
       * ======================================
       * RECONCILIAR STOCK
       * ======================================
       */

      if (sameProduct) {
        const restoredStock = Number(
          (
            Number(oldProduct.stock || 0) + Number(credit.quantity || 0)
          ).toFixed(3),
        );

        const finalStock = Number((restoredStock - quantity).toFixed(3));

        await connection.execute(
          `
            UPDATE products

            SET
              stock = ?,
              updated_at = ?

            WHERE id = ?
            `,

          [finalStock, now, oldProduct.id],
        );

        /*
         * Entrada de corrección.
         */
        await connection.execute(
          `
            INSERT INTO inventory_movements
            (
              id,
              product_id,
              product_name,
              movement_type,
              reason_type,
              reason,
              reference_type,
              reference_id,
              quantity,
              stock_after,
              movement_date,
              created_by
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,

          [
            randomUUID(),
            oldProduct.id,
            oldProduct.name,
            "entrada",
            "edicion_credito_cliente",
            `Corrección de crédito de ${customer.name}`,
            "customer_credit",
            credit.id,
            credit.quantity,
            restoredStock,
            now,
            req.user.id,
          ],
        );

        /*
         * Nueva salida.
         */
        await connection.execute(
          `
            INSERT INTO inventory_movements
            (
              id,
              product_id,
              product_name,
              movement_type,
              reason_type,
              reason,
              reference_type,
              reference_id,
              quantity,
              stock_after,
              movement_date,
              created_by
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,

          [
            randomUUID(),
            oldProduct.id,
            oldProduct.name,
            "salida",
            "edicion_credito_cliente",
            `Crédito corregido de ${customer.name}`,
            "customer_credit",
            credit.id,
            quantity,
            finalStock,
            now,
            req.user.id,
          ],
        );
      } else {
        /*
         * DEVOLVER PRODUCTO ORIGINAL.
         */
        const restoredOldStock = Number(
          (
            Number(oldProduct.stock || 0) + Number(credit.quantity || 0)
          ).toFixed(3),
        );

        await connection.execute(
          `
            UPDATE products

            SET
              stock = ?,
              updated_at = ?

            WHERE id = ?
            `,

          [restoredOldStock, now, oldProduct.id],
        );

        /*
         * DESCONTAR PRODUCTO NUEVO.
         */
        const targetStock = Number(
          (Number(targetProduct.stock || 0) - quantity).toFixed(3),
        );

        await connection.execute(
          `
            UPDATE products

            SET
              stock = ?,
              updated_at = ?

            WHERE id = ?
            `,

          [targetStock, now, targetProduct.id],
        );

        await connection.execute(
          `
            INSERT INTO inventory_movements
            (
              id,
              product_id,
              product_name,
              movement_type,
              reason_type,
              reason,
              reference_type,
              reference_id,
              quantity,
              stock_after,
              movement_date,
              created_by
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,

          [
            randomUUID(),
            oldProduct.id,
            oldProduct.name,
            "entrada",
            "edicion_credito_cliente",
            `Corrección de crédito de ${customer.name}`,
            "customer_credit",
            credit.id,
            credit.quantity,
            restoredOldStock,
            now,
            req.user.id,
          ],
        );

        await connection.execute(
          `
            INSERT INTO inventory_movements
            (
              id,
              product_id,
              product_name,
              movement_type,
              reason_type,
              reason,
              reference_type,
              reference_id,
              quantity,
              stock_after,
              movement_date,
              created_by
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,

          [
            randomUUID(),
            targetProduct.id,
            targetProduct.name,
            "salida",
            "edicion_credito_cliente",
            `Crédito corregido de ${customer.name}`,
            "customer_credit",
            credit.id,
            quantity,
            targetStock,
            now,
            req.user.id,
          ],
        );
      }

      /*
       * ACTUALIZAR CARGO.
       */
      await connection.execute(
        `
          UPDATE customer_credits

          SET
            product_id = ?,
            product_name = ?,
            barcode = ?,
            sale_unit = ?,
            quantity = ?,
            unit_price = ?,
            unit_cost = ?,
            total = ?,
            notes = ?,
            updated_at = ?,
            updated_by = ?

          WHERE id = ?
          `,

        [
          targetProduct.id,
          targetProduct.name,
          targetProduct.barcode,
          targetProduct.saleUnit,
          quantity,
          unitPrice,
          Number(targetProduct.unitCost || 0),
          newTotal,
          clean(req.body.notes ?? credit.notes),
          now,
          req.user.id,
          credit.id,
        ],
      );
    });

    const customer = await findCustomer(req.params.id);

    response(
      res,

      await accountFor(customer),

      "Registro de crédito actualizado",
    );
  },
);

/*
 * ==========================================
 * ANULAR PRODUCTO FIADO
 * ==========================================
 */

router.delete(
  "/:id/credits/:creditId",

  async (req, res) => {
    await withTransaction(async (connection) => {
      const customer = await findCustomer(req.params.id, connection, true);

      const [rows] = await connection.execute(
        `
            SELECT
              id,

              customer_id
                AS customerId,

              product_id
                AS productId,

              product_name
                AS productName,

              quantity,
              total,
              status

            FROM customer_credits

            WHERE
              id = ?
              AND customer_id = ?
              AND status <> 'voided'

            LIMIT 1

            FOR UPDATE
            `,

        [req.params.creditId, customer.id],
      );

      if (!rows[0]) {
        throw new HttpError(404, "Registro de crédito no encontrado");
      }

      const credit = {
        ...rows[0],

        quantity: Number(rows[0].quantity || 0),

        total: Number(rows[0].total || 0),
      };

      const account = await customerBalance(customer.id, connection);

      const chargesAfter = roundMoney(account.charges - credit.total);

      if (chargesAfter < account.payments) {
        throw new HttpError(
          409,
          "Este registro ya está cubierto total o parcialmente por pagos y no puede eliminarse",
        );
      }

      const product = await getCreditProduct(
        credit.productId,
        connection,
        true,
      );

      const now = new Date();

      if (product) {
        const newStock = Number(
          (Number(product.stock || 0) + credit.quantity).toFixed(3),
        );

        await connection.execute(
          `
            UPDATE products

            SET
              stock = ?,
              updated_at = ?

            WHERE id = ?
            `,

          [newStock, now, product.id],
        );

        await connection.execute(
          `
            INSERT INTO inventory_movements
            (
              id,
              product_id,
              product_name,
              movement_type,
              reason_type,
              reason,
              reference_type,
              reference_id,
              quantity,
              stock_after,
              movement_date,
              created_by
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,

          [
            randomUUID(),
            product.id,
            product.name,
            "entrada",
            "anulacion_credito_cliente",
            `Anulación de crédito de ${customer.name}`,
            "customer_credit",
            credit.id,
            credit.quantity,
            newStock,
            now,
            req.user.id,
          ],
        );
      }

      await connection.execute(
        `
          UPDATE customer_credits

          SET
            status = 'voided',
            voided_at = ?,
            voided_by = ?,
            void_reason = ?

          WHERE id = ?
          `,

        [
          now,
          req.user.id,
          clean(req.body?.reason || "Registro eliminado"),
          credit.id,
        ],
      );
    });

    const customer = await findCustomer(req.params.id);

    response(
      res,

      await accountFor(customer),

      "Registro eliminado y stock restaurado",
    );
  },
);

/*
 * ==========================================
 * REGISTRAR PAGO
 * ==========================================
 */

router.post(
  "/:id/payments",

  async (req, res) => {
    required(req.body, ["amount"]);

    await withTransaction(async (connection) => {
      const customer = await findCustomer(req.params.id, connection, true);

      const amount = roundMoney(req.body.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new HttpError(400, "El pago debe ser mayor que cero");
      }

      const account = await customerBalance(customer.id, connection);

      if (account.balance <= 0) {
        throw new HttpError(409, "El cliente no tiene deuda pendiente");
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

        createdAt: new Date(),

        createdBy: req.user.id,
      };

      /*
       * Guardar pago.
       */
      await connection.execute(
        `
          INSERT INTO customer_payments
          (
            id,
            customer_id,
            amount,
            status,
            notes,
            created_at,
            created_by,
            voided_at,
            voided_by,
            void_reason
          )
          VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,

        [
          payment.id,
          payment.customerId,
          payment.amount,
          payment.status,
          payment.notes,
          payment.createdAt,
          payment.createdBy,
          null,
          null,
          "",
        ],
      );

      /*
       * El pago entra en caja.
       *
       * Si no existe caja abierta,
       * toda la transacción se revierte.
       */
      await addCashMovement(
        {
          direction: "in",

          type: "customer_payment",

          amount,

          reason: `Pago de cuenta - ${customer.name}`,

          referenceType: "customer_payment",

          referenceId: payment.id,

          userId: req.user.id,

          notes: payment.notes,
        },

        connection,
      );
    });

    const customer = await findCustomer(req.params.id);

    response(
      res,

      await accountFor(customer),

      "Pago registrado en caja",

      201,
    );
  },
);

export default router;
