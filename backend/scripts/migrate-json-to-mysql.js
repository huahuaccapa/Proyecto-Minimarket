import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pool, withTransaction } from "../src/config/database.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, "../data/db.json");

function toDateTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function dateOnly(value) {
  if (!value) {
    return null;
  }

  const text = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function numberValue(value, fallback = 0) {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : fallback;
}

function stringValue(value, fallback = "") {
  return value === undefined || value === null ? fallback : String(value);
}

async function migrate() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`No se encontró ${DATA_FILE}`);
  }

  const db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  console.log("======================================");

  console.log(" MIGRACIÓN JSON → MYSQL");

  console.log("======================================");

  console.log("Archivo:", DATA_FILE);

  await withTransaction(async (connection) => {
    /*
     * ==========================================
     * SECUENCIAS
     * ==========================================
     */

    const sequences = db.meta?.sequences || {};

    for (const [name, value] of Object.entries(sequences)) {
      await connection.execute(
        `
          INSERT INTO sequences
          (
            name,
            current_value
          )
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE
            current_value =
              VALUES(current_value)
          `,

        [name, numberValue(value)],
      );
    }

    /*
     * ==========================================
     * USUARIOS
     * ==========================================
     */

    for (const user of db.users || []) {
      await connection.execute(
        `
          INSERT INTO users
          (
            id,
            username,
            name,
            password_hash,
            role,
            active,
            password_updated_at,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            username =
              VALUES(username),
            name =
              VALUES(name),
            password_hash =
              VALUES(password_hash),
            role =
              VALUES(role),
            active =
              VALUES(active),
            password_updated_at =
              VALUES(password_updated_at),
            updated_at =
              VALUES(updated_at)
          `,

        [
          user.id,

          user.username,

          user.name,

          user.passwordHash,

          user.role,

          user.active !== false,

          toDateTime(user.passwordUpdatedAt),

          toDateTime(user.createdAt) || new Date(),

          toDateTime(user.updatedAt) || new Date(),
        ],
      );
    }

    /*
     * ==========================================
     * CATEGORÍAS
     * ==========================================
     */

    for (const item of db.categories || []) {
      await connection.execute(
        `
          INSERT INTO categories
          (
            id,
            name,
            description,
            active,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name =
              VALUES(name),
            description =
              VALUES(description),
            active =
              VALUES(active),
            updated_at =
              VALUES(updated_at)
          `,

        [
          item.id,

          item.name,

          stringValue(item.description),

          item.active !== false,

          toDateTime(item.createdAt) || new Date(),

          toDateTime(item.updatedAt) || new Date(),
        ],
      );
    }

    /*
     * ==========================================
     * MARCAS
     * ==========================================
     */

    for (const item of db.brands || []) {
      await connection.execute(
        `
          INSERT INTO brands
          (
            id,
            name,
            description,
            active,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name =
              VALUES(name),
            description =
              VALUES(description),
            active =
              VALUES(active),
            updated_at =
              VALUES(updated_at)
          `,

        [
          item.id,

          item.name,

          stringValue(item.description),

          item.active !== false,

          toDateTime(item.createdAt) || new Date(),

          toDateTime(item.updatedAt) || new Date(),
        ],
      );
    }

    /*
     * ==========================================
     * PRODUCTOS
     * ==========================================
     */

    for (const item of db.products || []) {
      await connection.execute(
        `
          INSERT INTO products
          (
            id,
            barcode,
            name,
            description,
            category_id,
            brand_id,
            purchase_presentation,
            purchase_price,
            content_quantity,
            purchase_quantity,
            unit_cost,
            sale_price,
            stock,
            min_stock,
            sale_unit,
            image,
            expiration_date,
            sanitary_registration,
            lot,
            active,
            created_at,
            updated_at
          )
          VALUES
          (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?
          )
          ON DUPLICATE KEY UPDATE
            barcode =
              VALUES(barcode),
            name =
              VALUES(name),
            description =
              VALUES(description),
            category_id =
              VALUES(category_id),
            brand_id =
              VALUES(brand_id),
            purchase_presentation =
              VALUES(purchase_presentation),
            purchase_price =
              VALUES(purchase_price),
            content_quantity =
              VALUES(content_quantity),
            purchase_quantity =
              VALUES(purchase_quantity),
            unit_cost =
              VALUES(unit_cost),
            sale_price =
              VALUES(sale_price),
            stock =
              VALUES(stock),
            min_stock =
              VALUES(min_stock),
            sale_unit =
              VALUES(sale_unit),
            image =
              VALUES(image),
            expiration_date =
              VALUES(expiration_date),
            sanitary_registration =
              VALUES(sanitary_registration),
            lot =
              VALUES(lot),
            active =
              VALUES(active),
            updated_at =
              VALUES(updated_at)
          `,

        [
          item.id,

          item.barcode,

          item.name,

          stringValue(item.description),

          item.categoryId,

          item.brandId || null,

          item.purchasePresentation || "unidad",

          numberValue(item.purchasePrice),

          numberValue(item.contentQuantity, 1),

          numberValue(item.purchaseQuantity, 1),

          numberValue(item.unitCost),

          numberValue(item.salePrice),

          numberValue(item.stock),

          numberValue(item.minStock),

          item.saleUnit || item.unit || "unidad",

          item.image || null,

          dateOnly(item.expirationDate),

          stringValue(item.sanitaryRegistration),

          stringValue(item.lot),

          item.active !== false,

          toDateTime(item.createdAt) || new Date(),

          toDateTime(item.updatedAt) || new Date(),
        ],
      );
    }

    /*
     * ==========================================
     * PROVEEDORES
     * ==========================================
     */

    for (const item of db.suppliers || []) {
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
          (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?
          )
          ON DUPLICATE KEY UPDATE
            business_name =
              VALUES(business_name),
            ruc =
              VALUES(ruc),
            phone =
              VALUES(phone),
            email =
              VALUES(email),
            address =
              VALUES(address),
            notes =
              VALUES(notes),
            active =
              VALUES(active),
            updated_at =
              VALUES(updated_at)
          `,

        [
          item.id,

          item.businessName,

          stringValue(item.ruc),

          stringValue(item.phone),

          stringValue(item.email),

          stringValue(item.address),

          item.notes || null,

          item.active !== false,

          toDateTime(item.createdAt) || new Date(),

          toDateTime(item.updatedAt) || new Date(),
        ],
      );

      await connection.execute(
        `
          DELETE FROM supplier_representatives
          WHERE supplier_id = ?
          `,

        [item.id],
      );

      for (const rep of item.representatives || []) {
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
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,

          [
            rep.id,

            item.id,

            stringValue(rep.name),

            stringValue(rep.position),

            stringValue(rep.phone),

            stringValue(rep.email),

            rep.notes || null,

            toDateTime(rep.createdAt) || new Date(),
          ],
        );
      }
    }

    /*
     * ==========================================
     * CLIENTES
     * ==========================================
     */

    for (const item of db.customers || []) {
      await connection.execute(
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
          (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?
          )
          ON DUPLICATE KEY UPDATE
            name =
              VALUES(name),
            dni =
              VALUES(dni),
            phone =
              VALUES(phone),
            address =
              VALUES(address),
            notes =
              VALUES(notes),
            active =
              VALUES(active),
            updated_by =
              VALUES(updated_by),
            updated_at =
              VALUES(updated_at),
            deleted_by =
              VALUES(deleted_by),
            deleted_at =
              VALUES(deleted_at)
          `,

        [
          item.id,

          item.name,

          stringValue(item.dni),

          stringValue(item.phone),

          stringValue(item.address),

          item.notes || null,

          item.active !== false,

          item.createdBy || null,

          toDateTime(item.createdAt) || new Date(),

          item.updatedBy || null,

          toDateTime(item.updatedAt) || new Date(),

          item.deletedBy || null,

          toDateTime(item.deletedAt),
        ],
      );
    }

    /*
     * ==========================================
     * SESIONES
     * ==========================================
     */

    await connection.execute(
      `
        DELETE FROM sessions
        `,
    );

    for (const session of db.sessions || []) {
      await connection.execute(
        `
          INSERT INTO sessions
          (
            token,
            user_id,
            created_at,
            expires_at
          )
          VALUES (?, ?, ?, ?)
          `,

        [
          session.token,

          session.userId,

          toDateTime(session.createdAt) || new Date(),

          new Date(Number(session.expiresAt)),
        ],
      );
    }

    /*
     * ==========================================
     * VENTAS
     * ==========================================
     */

    for (const sale of db.sales || []) {
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
          (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?
          )
          ON DUPLICATE KEY UPDATE
            status =
              VALUES(status),
            total =
              VALUES(total),
            cost =
              VALUES(cost),
            gross_profit =
              VALUES(gross_profit),
            payment_method =
              VALUES(payment_method),
            received =
              VALUES(received),
            \`change\` =
              VALUES(\`change\`),
            items =
              VALUES(items),
            voided_at =
              VALUES(voided_at),
            voided_by =
              VALUES(voided_by),
            void_reason =
              VALUES(void_reason)
          `,

        [
          sale.id,

          sale.number,

          toDateTime(sale.date) || new Date(),

          sale.status || "completed",

          numberValue(sale.total),

          numberValue(sale.cost),

          numberValue(sale.grossProfit),

          sale.paymentMethod || "Efectivo",

          numberValue(sale.received),

          numberValue(sale.change),

          numberValue(sale.items),

          sale.createdBy || null,

          toDateTime(sale.voidedAt),

          sale.voidedBy || null,

          stringValue(sale.voidReason),
        ],
      );

      await connection.execute(
        `
          DELETE FROM sale_items
          WHERE sale_id = ?
          `,

        [sale.id],
      );

      for (const line of sale.detail || []) {
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
            (
              ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?
            )
            `,

          [
            sale.id,

            line.productId,

            stringValue(line.barcode),

            line.name,

            line.saleUnit || "unidad",

            numberValue(line.quantity),

            numberValue(line.baseUnitPrice),

            Boolean(line.isChilled),

            numberValue(line.chilledSurcharge),

            numberValue(line.unitPrice),

            numberValue(line.unitCost),

            numberValue(line.subtotal),
          ],
        );
      }
    }

    /*
     * ==========================================
     * COMPRAS
     * ==========================================
     */

    for (const purchase of db.purchases || []) {
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
          ON DUPLICATE KEY UPDATE
            supplier_id =
              VALUES(supplier_id),
            supplier_name =
              VALUES(supplier_name),
            document_type =
              VALUES(document_type),
            document_number =
              VALUES(document_number),
            purchase_date =
              VALUES(purchase_date),
            total =
              VALUES(total),
            items =
              VALUES(items),
            status =
              VALUES(status),
            notes =
              VALUES(notes),
            voided_at =
              VALUES(voided_at),
            voided_by =
              VALUES(voided_by),
            void_reason =
              VALUES(void_reason)
          `,

        [
          purchase.id,

          purchase.number,

          purchase.supplierId,

          purchase.supplier,

          purchase.documentType,

          purchase.documentNumber,

          dateOnly(purchase.date),

          numberValue(purchase.total),

          numberValue(purchase.items),

          purchase.currency || "PEN",

          purchase.paymentMethod || "Efectivo",

          purchase.paymentStatus || "Pagado",

          purchase.status || "completed",

          purchase.notes || null,

          stringValue(purchase.documentName),

          stringValue(purchase.documentMimeType),

          purchase.documentDataUrl || null,

          toDateTime(purchase.createdAt) || new Date(),

          purchase.createdBy || null,

          toDateTime(purchase.voidedAt),

          purchase.voidedBy || null,

          stringValue(purchase.voidReason),
        ],
      );

      await connection.execute(
        `
          DELETE FROM purchase_items
          WHERE purchase_id = ?
          `,

        [purchase.id],
      );

      for (const line of purchase.detail || []) {
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
            purchase.id,

            line.productId,

            line.productName,

            numberValue(line.packages),

            numberValue(line.contentQuantity),

            numberValue(line.units),

            numberValue(line.purchasePrice),

            numberValue(line.unitCost),

            numberValue(line.subtotal),

            stringValue(line.lot),

            dateOnly(line.expirationDate),

            line.stockBefore ?? null,

            line.unitCostBefore ?? null,

            line.purchasePriceBefore ?? null,

            line.contentQuantityBefore ?? null,

            line.purchaseQuantityBefore ?? null,

            stringValue(line.lotBefore),

            dateOnly(line.expirationDateBefore),
          ],
        );
      }
    }

    /*
     * ==========================================
     * CRÉDITOS CLIENTES
     * ==========================================
     */

    for (const item of db.customerCredits || []) {
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
          ON DUPLICATE KEY UPDATE
            product_id =
              VALUES(product_id),
            product_name =
              VALUES(product_name),
            quantity =
              VALUES(quantity),
            unit_price =
              VALUES(unit_price),
            unit_cost =
              VALUES(unit_cost),
            total =
              VALUES(total),
            status =
              VALUES(status),
            notes =
              VALUES(notes),
            updated_at =
              VALUES(updated_at),
            updated_by =
              VALUES(updated_by),
            voided_at =
              VALUES(voided_at),
            voided_by =
              VALUES(voided_by),
            void_reason =
              VALUES(void_reason)
          `,

        [
          item.id,

          item.customerId,

          item.productId,

          item.productName,

          stringValue(item.barcode),

          item.saleUnit || "unidad",

          numberValue(item.quantity),

          numberValue(item.unitPrice),

          numberValue(item.unitCost),

          numberValue(item.total),

          item.status || "active",

          item.notes || null,

          toDateTime(item.createdAt) || new Date(),

          item.createdBy || null,

          toDateTime(item.updatedAt),

          item.updatedBy || null,

          toDateTime(item.voidedAt),

          item.voidedBy || null,

          stringValue(item.voidReason),
        ],
      );
    }

    /*
     * ==========================================
     * PAGOS CLIENTES
     * ==========================================
     */

    for (const item of db.customerPayments || []) {
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
          (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?
          )
          ON DUPLICATE KEY UPDATE
            amount =
              VALUES(amount),
            status =
              VALUES(status),
            notes =
              VALUES(notes),
            voided_at =
              VALUES(voided_at),
            voided_by =
              VALUES(voided_by),
            void_reason =
              VALUES(void_reason)
          `,

        [
          item.id,

          item.customerId,

          numberValue(item.amount),

          item.status || "active",

          item.notes || null,

          toDateTime(item.createdAt) || new Date(),

          item.createdBy || null,

          toDateTime(item.voidedAt),

          item.voidedBy || null,

          stringValue(item.voidReason),
        ],
      );
    }

    /*
     * ==========================================
     * GASTOS
     * ==========================================
     */

    for (const item of db.expenses || []) {
      await connection.execute(
        `
          INSERT INTO expenses
          (
            id,
            expense_date,
            description,
            category,
            amount,
            payment_method,
            status,
            created_at,
            created_by,
            voided_at,
            voided_by,
            void_reason
          )
          VALUES
          (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?
          )
          ON DUPLICATE KEY UPDATE
            expense_date =
              VALUES(expense_date),
            description =
              VALUES(description),
            category =
              VALUES(category),
            amount =
              VALUES(amount),
            payment_method =
              VALUES(payment_method),
            status =
              VALUES(status),
            voided_at =
              VALUES(voided_at),
            voided_by =
              VALUES(voided_by),
            void_reason =
              VALUES(void_reason)
          `,

        [
          item.id,

          dateOnly(item.date),

          item.description,

          item.category,

          numberValue(item.amount),

          item.paymentMethod || "Efectivo",

          item.status || "active",

          toDateTime(item.createdAt) || new Date(),

          item.createdBy || null,

          toDateTime(item.voidedAt),

          item.voidedBy || null,

          stringValue(item.voidReason),
        ],
      );
    }

    /*
     * ==========================================
     * CAJAS
     * ==========================================
     */

    for (const item of db.cashSessions || []) {
      await connection.execute(
        `
          INSERT INTO cash_sessions
          (
            id,
            number,
            status,
            opening_amount,
            opened_at,
            opened_by,
            closing_amount,
            expected_amount,
            difference,
            closed_at,
            closed_by
          )
          VALUES
          (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?
          )
          ON DUPLICATE KEY UPDATE
            status =
              VALUES(status),
            opening_amount =
              VALUES(opening_amount),
            closing_amount =
              VALUES(closing_amount),
            expected_amount =
              VALUES(expected_amount),
            difference =
              VALUES(difference),
            closed_at =
              VALUES(closed_at),
            closed_by =
              VALUES(closed_by)
          `,

        [
          item.id,

          item.number,

          item.status || "open",

          numberValue(item.openingAmount),

          toDateTime(item.openedAt) || new Date(),

          item.openedBy || null,

          item.closingAmount ?? null,

          item.expectedAmount ?? null,

          item.difference ?? null,

          toDateTime(item.closedAt),

          item.closedBy || null,
        ],
      );
    }

    /*
     * ==========================================
     * MOVIMIENTOS INVENTARIO
     * ==========================================
     */

    for (const item of db.inventoryMovements || []) {
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
          (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?
          )
          ON DUPLICATE KEY UPDATE
            product_name =
              VALUES(product_name),
            movement_type =
              VALUES(movement_type),
            reason_type =
              VALUES(reason_type),
            reason =
              VALUES(reason),
            quantity =
              VALUES(quantity),
            stock_after =
              VALUES(stock_after),
            movement_date =
              VALUES(movement_date)
          `,

        [
          item.id,

          item.productId,

          item.productName,

          item.type,

          stringValue(item.reasonType),

          stringValue(item.reason),

          stringValue(item.referenceType),

          stringValue(item.referenceId),

          numberValue(item.quantity),

          numberValue(item.stockAfter),

          toDateTime(item.date) || new Date(),

          item.createdBy || null,
        ],
      );
    }

    /*
     * ==========================================
     * MOVIMIENTOS CAJA
     * ==========================================
     */

    for (const item of db.cashMovements || []) {
      await connection.execute(
        `
          INSERT INTO cash_movements
          (
            id,
            session_id,
            direction,
            movement_type,
            amount,
            reason,
            notes,
            reference_type,
            reference_id,
            user_id,
            status,
            movement_date
          )
          VALUES
          (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?
          )
          ON DUPLICATE KEY UPDATE
            direction =
              VALUES(direction),
            movement_type =
              VALUES(movement_type),
            amount =
              VALUES(amount),
            reason =
              VALUES(reason),
            notes =
              VALUES(notes),
            status =
              VALUES(status),
            movement_date =
              VALUES(movement_date)
          `,

        [
          item.id,

          item.sessionId,

          item.direction,

          item.type,

          numberValue(item.amount),

          stringValue(item.reason),

          item.notes || null,

          stringValue(item.referenceType),

          stringValue(item.referenceId),

          item.userId || null,

          item.status || "active",

          toDateTime(item.date) || new Date(),
        ],
      );
    }
  });

  console.log("");

  console.log("✅ Migración terminada correctamente");

  console.log("");

  console.log("Ahora verifica en MySQL:");

  console.log("SELECT COUNT(*) FROM users;");

  console.log("SELECT COUNT(*) FROM products;");

  console.log("SELECT COUNT(*) FROM customers;");

  console.log("SELECT COUNT(*) FROM cash_sessions;");
}

try {
  await migrate();
} catch (error) {
  console.error("");

  console.error("❌ Error durante la migración:");

  console.error(error);

  process.exitCode = 1;
} finally {
  await pool.end();
}
