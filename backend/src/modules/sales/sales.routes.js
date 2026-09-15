import { Router } from "express";

import { randomUUID } from "node:crypto";

import { pool, withTransaction } from "../../config/database.js";

import { requireRole } from "../../middlewares/auth.js";

import {
  addCashMovement,
  ensureCashAvailable,
  isExpired,
  requireOpenCash,
  roundMoney,
} from "../../services/business.js";

import { nextNumber } from "../../services/sequence.service.js";

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

const allowsFraction = (product) =>
  FRACTIONAL_UNITS.has(normalize(product.saleUnit));

function mapSale(row) {
  return {
    id: row.id,

    number: row.number,

    date: row.date,

    status: row.status,

    total: Number(row.total || 0),

    cost: Number(row.cost || 0),

    grossProfit: Number(row.grossProfit || 0),

    paymentMethod: row.paymentMethod,

    received: Number(row.received || 0),

    change: Number(row.changeAmount || 0),

    items: Number(row.items || 0),

    createdBy: row.createdBy,

    voidedAt: row.voidedAt,

    voidedBy: row.voidedBy,

    voidReason: row.voidReason || "",
  };
}

function mapSaleItem(row) {
  return {
    productId: row.productId,

    barcode: row.barcode,

    name: row.name,

    saleUnit: row.saleUnit,

    quantity: Number(row.quantity || 0),

    baseUnitPrice: Number(row.baseUnitPrice || 0),

    isChilled: Boolean(row.isChilled),

    chilledSurcharge: Number(row.chilledSurcharge || 0),

    unitPrice: Number(row.unitPrice || 0),

    unitCost: Number(row.unitCost || 0),

    subtotal: Number(row.subtotal || 0),
  };
}

async function getSaleDetail(saleId, connection = null) {
  const db = connection || pool;

  const [rows] = await db.execute(
    `
      SELECT
        product_id
          AS productId,

        barcode,

        product_name
          AS name,

        sale_unit
          AS saleUnit,

        quantity,

        base_unit_price
          AS baseUnitPrice,

        is_chilled
          AS isChilled,

        chilled_surcharge
          AS chilledSurcharge,

        unit_price
          AS unitPrice,

        unit_cost
          AS unitCost,

        subtotal

      FROM sale_items

      WHERE sale_id = ?

      ORDER BY id ASC
      `,

    [saleId],
  );

  return rows.map(mapSaleItem);
}

async function getSaleById(id, connection = null) {
  const db = connection || pool;

  const [rows] = await db.execute(
    `
      SELECT
        id,
        number,
        date,
        status,
        total,
        cost,

        gross_profit
          AS grossProfit,

        payment_method
          AS paymentMethod,

        received,

        \`change\`
          AS changeAmount,

        items,

        created_by
          AS createdBy,

        voided_at
          AS voidedAt,

        voided_by
          AS voidedBy,

        void_reason
          AS voidReason

      FROM sales

      WHERE id = ?

      LIMIT 1
      `,

    [id],
  );

  if (!rows[0]) {
    return null;
  }

  const sale = mapSale(rows[0]);

  sale.detail = await getSaleDetail(sale.id, connection);

  return sale;
}

/*
 * ==========================================
 * LISTAR VENTAS
 * ==========================================
 */

router.get(
  "/",

  async (req, res) => {
    const [rows] = await pool.execute(
      `
        SELECT
          id,
          number,
          date,
          status,
          total,
          cost,

          gross_profit
            AS grossProfit,

          payment_method
            AS paymentMethod,

          received,

          \`change\`
            AS changeAmount,

          items,

          created_by
            AS createdBy,

          voided_at
            AS voidedAt,

          voided_by
            AS voidedBy,

          void_reason
            AS voidReason

        FROM sales

        ORDER BY date DESC
        `,
    );

    const sales = [];

    for (const row of rows) {
      const sale = mapSale(row);

      sale.detail = await getSaleDetail(sale.id);

      sales.push(sale);
    }

    response(res, sales);
  },
);

/*
 * ==========================================
 * VENTA POR ID
 * ==========================================
 */

router.get(
  "/:id",

  async (req, res) => {
    const sale = await getSaleById(req.params.id);

    if (!sale) {
      throw new HttpError(404, "Venta no encontrada");
    }

    response(res, sale);
  },
);

/*
 * ==========================================
 * REGISTRAR VENTA
 * ==========================================
 */

router.post(
  "/",

  async (req, res) => {
    required(req.body, ["items", "paymentMethod"]);

    if (req.body.paymentMethod !== "Efectivo") {
      throw new HttpError(
        400,
        "Por el momento solo se aceptan pagos en efectivo",
      );
    }

    if (!Array.isArray(req.body.items) || !req.body.items.length) {
      throw new HttpError(400, "La venta debe contener productos");
    }

    const consolidated = new Map();

    for (const raw of req.body.items) {
      const quantity = Number(raw.quantity);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new HttpError(400, "Cantidad de venta inválida");
      }

      const current = consolidated.get(raw.productId) || {
        productId: raw.productId,

        quantity: 0,

        isChilled: false,
      };

      current.quantity = Number((current.quantity + quantity).toFixed(3));

      current.isChilled = current.isChilled || raw.isChilled === true;

      consolidated.set(raw.productId, current);
    }

    const sale = await withTransaction(async (connection) => {
      /*
       * La venta necesita caja abierta.
       */
      await requireOpenCash(connection);

      const detail = [];

      /*
       * ======================================
       * CARGAR Y BLOQUEAR PRODUCTOS
       * ======================================
       */

      for (const item of consolidated.values()) {
        const [rows] = await connection.execute(
          `
                SELECT
                  p.id,
                  p.barcode,
                  p.name,

                  p.category_id
                    AS categoryId,

                  p.sale_unit
                    AS saleUnit,

                  p.sale_price
                    AS salePrice,

                  p.unit_cost
                    AS unitCost,

                  p.stock,

                  p.expiration_date
                    AS expirationDate,

                  p.active,

                  c.name
                    AS categoryName

                FROM products p

                LEFT JOIN categories c
                  ON c.id = p.category_id

                WHERE p.id = ?

                LIMIT 1

                FOR UPDATE
                `,

          [item.productId],
        );

        const product = rows[0];

        if (!product || !product.active) {
          throw new HttpError(404, `Producto no encontrado: ${item.productId}`);
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
          throw new HttpError(409, `Stock insuficiente para ${product.name}`);
        }

        const isBeverage = normalize(product.categoryName) === "bebidas";

        if (item.isChilled && !isBeverage) {
          throw new HttpError(
            400,
            "El recargo por bebida helada solo aplica a Bebidas",
          );
        }

        const surcharge = item.isChilled ? CHILLED_SURCHARGE : 0;

        const unitPrice = roundMoney(Number(product.salePrice) + surcharge);

        const unitCost = Number(product.unitCost || 0);

        detail.push({
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

          stockBefore: Number(product.stock),
        });
      }

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
        throw new HttpError(400, "El efectivo recibido es menor al total");
      }

      const id = randomUUID();

      const number = await nextNumber("sale", "V", connection);

      const date = new Date();

      const itemCount = Number(
        detail
          .reduce(
            (sum, item) => sum + item.quantity,

            0,
          )
          .toFixed(3),
      );

      /*
       * ======================================
       * INSERT VENTA
       * ======================================
       */

      await connection.execute(
        `
            INSERT INTO sales
            (
              id,
              number,
              date,
              status,
              total,
              cost,
              gross_profit,
              payment_method,
              received,
              \`change\`,
              items,
              created_by,
              voided_at,
              voided_by,
              void_reason
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,

        [
          id,
          number,
          date,
          "completed",
          total,
          cost,
          roundMoney(total - cost),
          "Efectivo",
          roundMoney(received),
          roundMoney(received - total),
          itemCount,
          req.user.id,
          null,
          null,
          "",
        ],
      );

      /*
       * ======================================
       * ITEMS + STOCK + INVENTARIO
       * ======================================
       */

      for (const item of detail) {
        await connection.execute(
          `
              INSERT INTO sale_items
              (
                sale_id,
                product_id,
                barcode,
                product_name,
                sale_unit,
                quantity,
                base_unit_price,
                is_chilled,
                chilled_surcharge,
                unit_price,
                unit_cost,
                subtotal
              )
              VALUES
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,

          [
            id,
            item.productId,
            item.barcode,
            item.name,
            item.saleUnit,
            item.quantity,
            item.baseUnitPrice,
            item.isChilled,
            item.chilledSurcharge,
            item.unitPrice,
            item.unitCost,
            item.subtotal,
          ],
        );

        const newStock = Number((item.stockBefore - item.quantity).toFixed(3));

        await connection.execute(
          `
              UPDATE products

              SET
                stock = ?,
                updated_at = ?

              WHERE id = ?
              `,

          [newStock, date, item.productId],
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
            item.productId,
            item.name,
            "salida",
            "venta",
            `Venta ${number}`,
            "sale",
            id,
            item.quantity,
            newStock,
            date,
            req.user.id,
          ],
        );
      }

      /*
       * ======================================
       * ENTRADA A CAJA
       * ======================================
       */

      await addCashMovement(
        {
          direction: "in",

          type: "sale",

          amount: total,

          reason: `Venta ${number}`,

          referenceType: "sale",

          referenceId: id,

          userId: req.user.id,
        },

        connection,
      );

      return {
        id,

        number,

        date,

        status: "completed",

        total,

        cost,

        grossProfit: roundMoney(total - cost),

        paymentMethod: "Efectivo",

        received: roundMoney(received),

        change: roundMoney(received - total),

        items: itemCount,

        detail: detail.map(({ stockBefore, ...item }) => item),

        createdBy: req.user.id,
      };
    });

    response(res, sale, "Venta registrada", 201);
  },
);

/*
 * ==========================================
 * ANULAR VENTA
 * ==========================================
 */

router.post(
  "/:id/void",

  requireRole("Administrador"),

  async (req, res) => {
    const sale = await withTransaction(async (connection) => {
      const [rows] = await connection.execute(
        `
              SELECT
                id,
                number,
                date,
                status,
                total,
                cost,

                gross_profit
                  AS grossProfit,

                payment_method
                  AS paymentMethod,

                received,

                \`change\`
                  AS changeAmount,

                items,

                created_by
                  AS createdBy,

                voided_at
                  AS voidedAt,

                voided_by
                  AS voidedBy,

                void_reason
                  AS voidReason

              FROM sales

              WHERE id = ?

              LIMIT 1

              FOR UPDATE
              `,

        [req.params.id],
      );

      if (!rows[0]) {
        throw new HttpError(404, "Venta no encontrada");
      }

      const current = mapSale(rows[0]);

      if (current.status === "voided") {
        throw new HttpError(409, "La venta ya está anulada");
      }

      await ensureCashAvailable(current.total, connection);

      const detail = await getSaleDetail(current.id, connection);

      const now = new Date();

      for (const item of detail) {
        const [productRows] = await connection.execute(
          `
                SELECT
                  id,
                  name,
                  stock

                FROM products

                WHERE id = ?

                LIMIT 1

                FOR UPDATE
                `,

          [item.productId],
        );

        const product = productRows[0];

        if (!product) {
          throw new HttpError(409, `Ya no existe ${item.name}`);
        }

        const newStock = Number(
          (Number(product.stock || 0) + Number(item.quantity || 0)).toFixed(3),
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
            "anulacion_venta",
            `Anulación ${current.number}`,
            "sale",
            current.id,
            item.quantity,
            newStock,
            now,
            req.user.id,
          ],
        );
      }

      await addCashMovement(
        {
          direction: "out",

          type: "sale_void",

          amount: current.total,

          reason: `Anulación ${current.number}`,

          referenceType: "sale",

          referenceId: current.id,

          userId: req.user.id,
        },

        connection,
      );

      const reason = String(req.body.reason || "Anulación de venta").trim();

      await connection.execute(
        `
            UPDATE sales

            SET
              status = 'voided',
              voided_at = ?,
              voided_by = ?,
              void_reason = ?

            WHERE id = ?
            `,

        [now, req.user.id, reason, current.id],
      );

      return {
        ...current,

        detail,

        status: "voided",

        voidedAt: now,

        voidedBy: req.user.id,

        voidReason: reason,
      };
    });

    response(res, sale, "Venta anulada correctamente");
  },
);

export default router;
