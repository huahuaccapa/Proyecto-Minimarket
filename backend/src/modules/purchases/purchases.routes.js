import { Router } from "express";

import { randomUUID } from "node:crypto";

import { pool, withTransaction } from "../../config/database.js";

import { requireRole } from "../../middlewares/auth.js";

import {
  addCashMovement,
  ensureCashAvailable,
  roundMoney,
} from "../../services/business.js";

import { nextNumber } from "../../services/sequence.service.js";

import { HttpError, required, response } from "../../utils/http.js";

const router = Router();

const clean = (value = "") => String(value ?? "").trim();

function dateOnly(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

/*
 * ==========================================
 * PROVEEDORES
 * ==========================================
 */

function mapRepresentative(row) {
  return {
    id: row.id,

    name: row.name,

    position: row.position || "",

    phone: row.phone || "",

    email: row.email || "",

    notes: row.notes || "",

    createdAt: row.createdAt,
  };
}

function mapSupplier(row) {
  return {
    id: row.id,

    businessName: row.businessName,

    ruc: row.ruc || "",

    phone: row.phone || "",

    email: row.email || "",

    address: row.address || "",

    notes: row.notes || "",

    active: Boolean(row.active),

    createdAt: row.createdAt,

    updatedAt: row.updatedAt,

    representatives: [],
  };
}

async function getRepresentatives(supplierId, connection = null) {
  const db = connection || pool;

  const [rows] = await db.execute(
    `
      SELECT
        id,
        name,
        position,
        phone,
        email,
        notes,

        created_at
          AS createdAt

      FROM supplier_representatives

      WHERE supplier_id = ?

      ORDER BY created_at ASC
      `,

    [supplierId],
  );

  return rows.map(mapRepresentative);
}

async function getSupplierById(id, connection = null) {
  const db = connection || pool;

  const [rows] = await db.execute(
    `
      SELECT
        id,

        business_name
          AS businessName,

        ruc,
        phone,
        email,
        address,
        notes,
        active,

        created_at
          AS createdAt,

        updated_at
          AS updatedAt

      FROM suppliers

      WHERE id = ?

      LIMIT 1
      `,

    [id],
  );

  if (!rows[0]) {
    return null;
  }

  const supplier = mapSupplier(rows[0]);

  supplier.representatives = await getRepresentatives(id, connection);

  return supplier;
}

/*
 * ==========================================
 * COMPRAS
 * ==========================================
 */

function mapPurchase(row) {
  return {
    id: row.id,

    number: row.number,

    supplierId: row.supplierId,

    supplier: row.supplier,

    documentType: row.documentType,

    documentNumber: row.documentNumber,

    date: dateOnly(row.date),

    total: Number(row.total || 0),

    items: Number(row.items || 0),

    currency: row.currency,

    paymentMethod: row.paymentMethod,

    paymentStatus: row.paymentStatus,

    status: row.status,

    notes: row.notes || "",

    documentName: row.documentName || "",

    documentMimeType: row.documentMimeType || "",

    documentDataUrl: row.documentDataUrl || "",

    createdAt: row.createdAt,

    createdBy: row.createdBy,

    voidedAt: row.voidedAt,

    voidedBy: row.voidedBy,

    voidReason: row.voidReason || "",

    detail: [],
  };
}

function mapPurchaseItem(row) {
  return {
    productId: row.productId,

    productName: row.productName,

    packages: Number(row.packages || 0),

    contentQuantity: Number(row.contentQuantity || 0),

    units: Number(row.units || 0),

    purchasePrice: Number(row.purchasePrice || 0),

    unitCost: Number(row.unitCost || 0),

    subtotal: Number(row.subtotal || 0),

    lot: row.lot || "",

    expirationDate: dateOnly(row.expirationDate) || "",

    stockBefore: row.stockBefore === null ? null : Number(row.stockBefore),

    unitCostBefore:
      row.unitCostBefore === null ? null : Number(row.unitCostBefore),

    purchasePriceBefore:
      row.purchasePriceBefore === null ? null : Number(row.purchasePriceBefore),

    contentQuantityBefore:
      row.contentQuantityBefore === null
        ? null
        : Number(row.contentQuantityBefore),

    purchaseQuantityBefore:
      row.purchaseQuantityBefore === null
        ? null
        : Number(row.purchaseQuantityBefore),

    lotBefore: row.lotBefore || "",

    expirationDateBefore: dateOnly(row.expirationDateBefore) || "",
  };
}

async function getPurchaseDetail(purchaseId, connection = null) {
  const db = connection || pool;

  const [rows] = await db.execute(
    `
      SELECT
        product_id
          AS productId,

        product_name
          AS productName,

        packages,

        content_quantity
          AS contentQuantity,

        units,

        purchase_price
          AS purchasePrice,

        unit_cost
          AS unitCost,

        subtotal,
        lot,

        expiration_date
          AS expirationDate,

        stock_before
          AS stockBefore,

        unit_cost_before
          AS unitCostBefore,

        purchase_price_before
          AS purchasePriceBefore,

        content_quantity_before
          AS contentQuantityBefore,

        purchase_quantity_before
          AS purchaseQuantityBefore,

        lot_before
          AS lotBefore,

        expiration_date_before
          AS expirationDateBefore

      FROM purchase_items

      WHERE purchase_id = ?

      ORDER BY id ASC
      `,

    [purchaseId],
  );

  return rows.map(mapPurchaseItem);
}

async function getPurchaseById(id, connection = null) {
  const db = connection || pool;

  const [rows] = await db.execute(
    `
      SELECT
        id,
        number,

        supplier_id
          AS supplierId,

        supplier_name
          AS supplier,

        document_type
          AS documentType,

        document_number
          AS documentNumber,

        purchase_date
          AS date,

        total,
        items,
        currency,

        payment_method
          AS paymentMethod,

        payment_status
          AS paymentStatus,

        status,
        notes,

        document_name
          AS documentName,

        document_mime_type
          AS documentMimeType,

        document_data_url
          AS documentDataUrl,

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

      FROM purchases

      WHERE id = ?

      LIMIT 1
      `,

    [id],
  );

  if (!rows[0]) {
    return null;
  }

  const purchase = mapPurchase(rows[0]);

  purchase.detail = await getPurchaseDetail(purchase.id, connection);

  return purchase;
}

/*
 * ==========================================
 * LISTAR COMPRAS
 * ==========================================
 */

router.get(
  "/",

  requireRole("Administrador"),

  async (req, res) => {
    const [rows] = await pool.execute(
      `
        SELECT
          id,
          number,

          supplier_id
            AS supplierId,

          supplier_name
            AS supplier,

          document_type
            AS documentType,

          document_number
            AS documentNumber,

          purchase_date
            AS date,

          total,
          items,
          currency,

          payment_method
            AS paymentMethod,

          payment_status
            AS paymentStatus,

          status,
          notes,

          document_name
            AS documentName,

          document_mime_type
            AS documentMimeType,

          document_data_url
            AS documentDataUrl,

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

        FROM purchases

        ORDER BY created_at DESC
        `,
    );

    const purchases = [];

    for (const row of rows) {
      const purchase = mapPurchase(row);

      purchase.detail = await getPurchaseDetail(purchase.id);

      purchases.push(purchase);
    }

    response(res, purchases);
  },
);

/*
 * ==========================================
 * LISTAR PROVEEDORES
 * ==========================================
 */

router.get(
  "/suppliers",

  async (req, res) => {
    const [rows] = await pool.execute(
      `
        SELECT
          id,

          business_name
            AS businessName,

          ruc,
          phone,
          email,
          address,
          notes,
          active,

          created_at
            AS createdAt,

          updated_at
            AS updatedAt

        FROM suppliers

        ORDER BY business_name ASC
        `,
    );

    const suppliers = [];

    for (const row of rows) {
      const supplier = mapSupplier(row);

      supplier.representatives = await getRepresentatives(supplier.id);

      suppliers.push(supplier);
    }

    response(res, suppliers);
  },
);

/*
 * ==========================================
 * CREAR PROVEEDOR
 * ==========================================
 */

router.post(
  "/suppliers",

  requireRole("Administrador"),

  async (req, res) => {
    required(req.body, ["businessName"]);

    const businessName = clean(req.body.businessName);

    if (!businessName) {
      throw new HttpError(400, "La razón social es obligatoria");
    }

    const ruc = clean(req.body.ruc);

    if (ruc) {
      const [duplicated] = await pool.execute(
        `
          SELECT id
          FROM suppliers
          WHERE ruc = ?
          LIMIT 1
          `,

        [ruc],
      );

      if (duplicated.length) {
        throw new HttpError(409, "Ya existe un proveedor con ese RUC");
      }
    }

    const supplier = await withTransaction(async (connection) => {
      const id = randomUUID();

      const now = new Date();

      await connection.execute(
        `
            INSERT INTO suppliers
            (
              id,
              business_name,
              ruc,
              phone,
              email,
              address,
              notes,
              active,
              created_at,
              updated_at
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,

        [
          id,
          businessName,
          ruc,
          clean(req.body.phone),
          clean(req.body.email),
          clean(req.body.address),
          clean(req.body.notes),
          true,
          now,
          now,
        ],
      );

      for (const rep of Array.isArray(req.body.representatives)
        ? req.body.representatives
        : []) {
        if (!clean(rep.name)) {
          continue;
        }

        await connection.execute(
          `
              INSERT INTO supplier_representatives
              (
                id,
                supplier_id,
                name,
                position,
                phone,
                email,
                notes,
                created_at
              )
              VALUES
              (?, ?, ?, ?, ?, ?, ?, ?)
              `,

          [
            rep.id || randomUUID(),

            id,

            clean(rep.name),

            clean(rep.position),

            clean(rep.phone),

            clean(rep.email),

            clean(rep.notes),

            now,
          ],
        );
      }

      return getSupplierById(id, connection);
    });

    response(res, supplier, "Proveedor registrado", 201);
  },
);

/*
 * ==========================================
 * ACTUALIZAR PROVEEDOR
 * ==========================================
 */

router.put(
  "/suppliers/:id",

  requireRole("Administrador"),

  async (req, res) => {
    const supplier = await withTransaction(async (connection) => {
      const current = await getSupplierById(req.params.id, connection);

      if (!current) {
        throw new HttpError(404, "Proveedor no encontrado");
      }

      const businessName = clean(req.body.businessName ?? current.businessName);

      const ruc = clean(req.body.ruc ?? current.ruc);

      if (ruc) {
        const [duplicated] = await connection.execute(
          `
                SELECT id

                FROM suppliers

                WHERE
                  ruc = ?
                  AND id <> ?

                LIMIT 1
                `,

          [ruc, current.id],
        );

        if (duplicated.length) {
          throw new HttpError(409, "Ya existe un proveedor con ese RUC");
        }
      }

      await connection.execute(
        `
            UPDATE suppliers

            SET
              business_name = ?,
              ruc = ?,
              phone = ?,
              email = ?,
              address = ?,
              notes = ?,
              active = ?,
              updated_at = ?

            WHERE id = ?
            `,

        [
          businessName,
          ruc,
          clean(req.body.phone ?? current.phone),
          clean(req.body.email ?? current.email),
          clean(req.body.address ?? current.address),
          clean(req.body.notes ?? current.notes),
          req.body.active ?? current.active,
          new Date(),
          current.id,
        ],
      );

      /*
       * Reemplazamos representantes
       * solamente si el frontend los envía.
       */
      if (Array.isArray(req.body.representatives)) {
        await connection.execute(
          `
              DELETE FROM supplier_representatives

              WHERE supplier_id = ?
              `,

          [current.id],
        );

        const now = new Date();

        for (const rep of req.body.representatives) {
          if (!clean(rep.name)) {
            continue;
          }

          await connection.execute(
            `
                INSERT INTO supplier_representatives
                (
                  id,
                  supplier_id,
                  name,
                  position,
                  phone,
                  email,
                  notes,
                  created_at
                )
                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?)
                `,

            [
              rep.id || randomUUID(),

              current.id,

              clean(rep.name),

              clean(rep.position),

              clean(rep.phone),

              clean(rep.email),

              clean(rep.notes),

              now,
            ],
          );
        }
      }

      return getSupplierById(current.id, connection);
    });

    response(res, supplier, "Proveedor actualizado");
  },
);

/*
 * ==========================================
 * COMPRA POR ID
 * ==========================================
 */

router.get(
  "/:id",

  requireRole("Administrador"),

  async (req, res) => {
    const purchase = await getPurchaseById(req.params.id);

    if (!purchase) {
      throw new HttpError(404, "Compra no encontrada");
    }

    response(res, purchase);
  },
);

/*
 * ==========================================
 * REGISTRAR COMPRA
 * ==========================================
 */

router.post(
  "/",

  requireRole("Administrador"),

  async (req, res) => {
    required(req.body, [
      "supplierId",
      "documentType",
      "documentNumber",
      "date",
      "detail",
    ]);

    if (!Array.isArray(req.body.detail) || !req.body.detail.length) {
      throw new HttpError(400, "La compra debe incluir productos");
    }

    const documentType = clean(req.body.documentType);

    const documentNumber = clean(req.body.documentNumber);

    if (!documentType || !documentNumber) {
      throw new HttpError(400, "Completa los datos del comprobante");
    }

    const paymentMethod = clean(req.body.paymentMethod || "Efectivo");

    if (paymentMethod !== "Efectivo") {
      throw new HttpError(
        400,
        "Por ahora las compras a proveedores solo se pagan en efectivo",
      );
    }

    const documentDataUrl = clean(req.body.documentDataUrl);

    if (documentDataUrl.length > 2_500_000) {
      throw new HttpError(413, "La imagen del documento es demasiado grande");
    }

    const purchase = await withTransaction(async (connection) => {
      /*
       * ======================================
       * PROVEEDOR
       * ======================================
       */

      const [supplierRows] = await connection.execute(
        `
              SELECT
                id,

                business_name
                  AS businessName,

                active

              FROM suppliers

              WHERE id = ?

              LIMIT 1
              `,

        [req.body.supplierId],
      );

      const supplier = supplierRows[0];

      if (!supplier || !supplier.active) {
        throw new HttpError(404, "Proveedor no encontrado");
      }

      /*
       * ======================================
       * COMPROBANTE DUPLICADO
       * ======================================
       */

      const [duplicateRows] = await connection.execute(
        `
              SELECT id

              FROM purchases

              WHERE
                supplier_id = ?
                AND LOWER(document_type) = LOWER(?)
                AND LOWER(document_number) = LOWER(?)
                AND status <> 'voided'

              LIMIT 1
              `,

        [supplier.id, documentType, documentNumber],
      );

      if (duplicateRows.length) {
        throw new HttpError(
          409,
          "Ese comprobante ya fue registrado para este proveedor",
        );
      }

      const seenProducts = new Set();

      const detail = [];

      /*
       * ======================================
       * PRODUCTOS
       * ======================================
       */

      for (const line of req.body.detail) {
        if (seenProducts.has(line.productId)) {
          throw new HttpError(
            400,
            "No repitas un producto en la compra. Usa una sola fila y aumenta la cantidad",
          );
        }

        seenProducts.add(line.productId);

        const [productRows] = await connection.execute(
          `
                SELECT
                  id,
                  name,
                  stock,

                  unit_cost
                    AS unitCost,

                  purchase_price
                    AS purchasePrice,

                  content_quantity
                    AS contentQuantity,

                  purchase_quantity
                    AS purchaseQuantity,

                  lot,

                  expiration_date
                    AS expirationDate,

                  active

                FROM products

                WHERE id = ?

                LIMIT 1

                FOR UPDATE
                `,

          [line.productId],
        );

        const product = productRows[0];

        if (!product || !product.active) {
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
          throw new HttpError(
            400,
            `Revisa cantidades y costo de ${product.name}`,
          );
        }

        const units = Number((packages * contentQuantity).toFixed(3));

        const unitCost = Number((purchasePrice / contentQuantity).toFixed(4));

        detail.push({
          productId: product.id,

          productName: product.name,

          packages,

          contentQuantity,

          units,

          purchasePrice: roundMoney(purchasePrice),

          unitCost,

          subtotal: roundMoney(packages * purchasePrice),

          lot: clean(line.lot),

          expirationDate: dateOnly(line.expirationDate),

          stockBefore: Number(product.stock || 0),

          unitCostBefore: Number(product.unitCost || 0),

          purchasePriceBefore: Number(product.purchasePrice || 0),

          contentQuantityBefore: Number(product.contentQuantity || 1),

          purchaseQuantityBefore: Number(product.purchaseQuantity || 1),

          lotBefore: clean(product.lot),

          expirationDateBefore: dateOnly(product.expirationDate),
        });
      }

      const total = roundMoney(
        detail.reduce(
          (sum, line) => sum + line.subtotal,

          0,
        ),
      );

      /*
       * CAJA SE VALIDA ANTES
       * DE CAMBIAR STOCK.
       */
      await ensureCashAvailable(total, connection);

      const id = randomUUID();

      const number = await nextNumber("purchase", "C", connection);

      const createdAt = new Date();

      const items = Number(
        detail
          .reduce(
            (sum, line) => sum + line.units,

            0,
          )
          .toFixed(3),
      );

      await connection.execute(
        `
            INSERT INTO purchases
            (
              id,
              number,
              supplier_id,
              supplier_name,
              document_type,
              document_number,
              purchase_date,
              total,
              items,
              currency,
              payment_method,
              payment_status,
              status,
              notes,
              document_name,
              document_mime_type,
              document_data_url,
              created_at,
              created_by,
              voided_at,
              voided_by,
              void_reason
            )
            VALUES
            (
              ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?
            )
            `,

        [
          id,
          number,
          supplier.id,
          supplier.businessName,
          documentType,
          documentNumber,
          dateOnly(req.body.date),
          total,
          items,
          "PEN",
          "Efectivo",
          "Pagado",
          "completed",
          clean(req.body.notes),
          clean(req.body.documentName),
          clean(req.body.documentMimeType),
          documentDataUrl || null,
          createdAt,
          req.user.id,
          null,
          null,
          "",
        ],
      );

      /*
       * ======================================
       * ACTUALIZAR PRODUCTOS
       * ======================================
       */

      for (const line of detail) {
        const oldStock = line.stockBefore;

        const newStock = Number((oldStock + line.units).toFixed(3));

        const oldValue = oldStock * line.unitCostBefore;

        const newValue = line.units * line.unitCost;

        const weightedCost =
          newStock > 0
            ? Number(((oldValue + newValue) / newStock).toFixed(4))
            : line.unitCost;

        await connection.execute(
          `
              UPDATE products

              SET
                stock = ?,
                unit_cost = ?,
                purchase_price = ?,
                content_quantity = ?,
                purchase_quantity = ?,

                lot =
                  CASE
                    WHEN ? <> ''
                    THEN ?
                    ELSE lot
                  END,

                expiration_date =
                  CASE
                    WHEN ? IS NOT NULL
                    THEN ?
                    ELSE expiration_date
                  END,

                updated_at = ?

              WHERE id = ?
              `,

          [
            newStock,
            weightedCost,
            line.purchasePrice,
            line.contentQuantity,
            line.packages,

            line.lot,
            line.lot,

            line.expirationDate,
            line.expirationDate,

            createdAt,
            line.productId,
          ],
        );

        await connection.execute(
          `
              INSERT INTO purchase_items
              (
                purchase_id,
                product_id,
                product_name,
                packages,
                content_quantity,
                units,
                purchase_price,
                unit_cost,
                subtotal,
                lot,
                expiration_date,
                stock_before,
                unit_cost_before,
                purchase_price_before,
                content_quantity_before,
                purchase_quantity_before,
                lot_before,
                expiration_date_before
              )
              VALUES
              (
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?
              )
              `,

          [
            id,
            line.productId,
            line.productName,
            line.packages,
            line.contentQuantity,
            line.units,
            line.purchasePrice,
            line.unitCost,
            line.subtotal,
            line.lot,
            line.expirationDate,
            line.stockBefore,
            line.unitCostBefore,
            line.purchasePriceBefore,
            line.contentQuantityBefore,
            line.purchaseQuantityBefore,
            line.lotBefore,
            line.expirationDateBefore,
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
            line.productId,
            line.productName,
            "entrada",
            "compra",
            `Compra ${number}`,
            "purchase",
            id,
            line.units,
            newStock,
            createdAt,
            req.user.id,
          ],
        );
      }

      /*
       * ======================================
       * DESCONTAR CAJA
       * ======================================
       */

      await addCashMovement(
        {
          direction: "out",

          type: "purchase",

          amount: total,

          reason: `Compra ${number} - ${supplier.businessName}`,

          referenceType: "purchase",

          referenceId: id,

          userId: req.user.id,
        },

        connection,
      );

      return {
        id,

        number,

        supplierId: supplier.id,

        supplier: supplier.businessName,

        documentType,

        documentNumber,

        date: dateOnly(req.body.date),

        total,

        items,

        currency: "PEN",

        paymentMethod: "Efectivo",

        paymentStatus: "Pagado",

        status: "completed",

        notes: clean(req.body.notes),

        documentName: clean(req.body.documentName),

        documentMimeType: clean(req.body.documentMimeType),

        documentDataUrl,

        detail,

        createdAt,

        createdBy: req.user.id,
      };
    });

    response(
      res,
      purchase,
      `Compra registrada. Se descontaron S/ ${purchase.total.toFixed(
        2,
      )} de la caja`,
      201,
    );
  },
);

/*
 * ==========================================
 * ANULAR COMPRA
 * ==========================================
 */

router.post(
  "/:id/void",

  requireRole("Administrador"),

  async (req, res) => {
    const purchase = await withTransaction(async (connection) => {
      const current = await getPurchaseById(req.params.id, connection);

      if (!current) {
        throw new HttpError(404, "Compra no encontrada");
      }

      if (current.status === "voided") {
        throw new HttpError(409, "La compra ya está anulada");
      }

      /*
       * ======================================
       * VALIDACIONES DE SEGURIDAD
       * ======================================
       */

      for (const line of current.detail) {
        if (line.stockBefore === null || line.unitCostBefore === null) {
          throw new HttpError(
            409,
            "Esta compra pertenece a una versión anterior y no tiene datos suficientes para anularla automáticamente",
          );
        }

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

          [line.productId],
        );

        const product = productRows[0];

        if (!product) {
          throw new HttpError(409, `Ya no existe ${line.productName}`);
        }

        /*
         * No permitimos anular si hubo
         * movimientos posteriores.
         */
        const [laterRows] = await connection.execute(
          `
                SELECT id

                FROM inventory_movements

                WHERE
                  product_id = ?
                  AND reference_id <> ?
                  AND movement_date > ?

                LIMIT 1
                `,

          [line.productId, current.id, current.createdAt],
        );

        if (laterRows.length) {
          throw new HttpError(
            409,
            `No se puede anular ${current.number}: ${line.productName} tuvo movimientos posteriores`,
          );
        }

        if (Number(product.stock || 0) < Number(line.units || 0)) {
          throw new HttpError(
            409,
            `No hay stock suficiente de ${line.productName} para revertir la compra`,
          );
        }
      }

      const now = new Date();

      /*
       * ======================================
       * RESTAURAR PRODUCTOS
       * ======================================
       */

      for (const line of current.detail) {
        await connection.execute(
          `
              UPDATE products

              SET
                stock = ?,
                unit_cost = ?,
                purchase_price = ?,
                content_quantity = ?,
                purchase_quantity = ?,
                lot = ?,
                expiration_date = ?,
                updated_at = ?

              WHERE id = ?
              `,

          [
            Number(Number(line.stockBefore || 0).toFixed(3)),

            Number(Number(line.unitCostBefore || 0).toFixed(4)),

            line.purchasePriceBefore,

            line.contentQuantityBefore,

            line.purchaseQuantityBefore,

            clean(line.lotBefore),

            line.expirationDateBefore || null,

            now,

            line.productId,
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
            line.productId,
            line.productName,
            "salida",
            "anulacion_compra",
            `Anulación ${current.number}`,
            "purchase",
            current.id,
            line.units,
            line.stockBefore,
            now,
            req.user.id,
          ],
        );
      }

      /*
       * Devolver dinero a caja.
       */
      await addCashMovement(
        {
          direction: "in",

          type: "purchase_void",

          amount: current.total,

          reason: `Anulación ${current.number}`,

          referenceType: "purchase",

          referenceId: current.id,

          userId: req.user.id,
        },

        connection,
      );

      const reason = clean(req.body.reason || "Anulación de compra");

      await connection.execute(
        `
            UPDATE purchases

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

        status: "voided",

        voidedAt: now,

        voidedBy: req.user.id,

        voidReason: reason,
      };
    });

    response(res, purchase, "Compra anulada y efectivo reintegrado a caja");
  },
);

export default router;
