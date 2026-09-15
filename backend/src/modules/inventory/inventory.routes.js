import {
  Router,
} from "express";

import {
  randomUUID,
} from "node:crypto";

import {
  pool,
  withTransaction,
} from "../../config/database.js";

import {
  requireRole,
} from "../../middlewares/auth.js";

import {
  HttpError,
  required,
  response,
} from "../../utils/http.js";

const router =
  Router();

const FRACTIONAL_UNITS =
  new Set([
    "kg",
    "kilogramo",
    "litro",
    "l",
  ]);

const normalize =
  (
    value = "",
  ) =>
    String(
      value,
    )
      .normalize(
        "NFD",
      )
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .trim()
      .toLowerCase();

const allowsFraction =
  (
    product,
  ) =>
    FRACTIONAL_UNITS.has(
      normalize(
        product.saleUnit,
      ),
    );

function dateOnly(
  value,
) {
  if (
    !value
  ) {
    return "";
  }

  if (
    value instanceof
    Date
  ) {
    return value
      .toISOString()
      .slice(
        0,
        10,
      );
  }

  return String(
    value,
  ).slice(
    0,
    10,
  );
}

function mapProduct(
  row,
) {
  return {
    id:
      row.id,

    barcode:
      row.barcode,

    name:
      row.name,

    description:
      row.description ||
      "",

    categoryId:
      row.categoryId,

    brandId:
      row.brandId ||
      "",

    purchasePrice:
      Number(
        row.purchasePrice ||
        0,
      ),

    contentQuantity:
      Number(
        row.contentQuantity ||
        0,
      ),

    purchaseQuantity:
      Number(
        row.purchaseQuantity ||
        0,
      ),

    unitCost:
      Number(
        row.unitCost ||
        0,
      ),

    salePrice:
      Number(
        row.salePrice ||
        0,
      ),

    stock:
      Number(
        row.stock ||
        0,
      ),

    minStock:
      Number(
        row.minStock ||
        0,
      ),

    saleUnit:
      row.saleUnit,

    expirationDate:
      dateOnly(
        row.expirationDate,
      ),

    lot:
      row.lot ||
      "",

    active:
      Boolean(
        row.active,
      ),
  };
}

/*
 * ==========================================
 * MOVIMIENTOS
 * ==========================================
 */

router.get(
  "/movements",

  async (
    req,
    res,
  ) => {
    const [
      rows,
    ] =
      await pool.execute(
        `
        SELECT
          id,

          product_id
            AS productId,

          product_name
            AS productName,

          movement_type
            AS type,

          reason_type
            AS reasonType,

          reason,

          reference_type
            AS referenceType,

          reference_id
            AS referenceId,

          quantity,

          stock_after
            AS stockAfter,

          movement_date
            AS date,

          created_by
            AS createdBy

        FROM inventory_movements

        ORDER BY movement_date DESC
        `,
      );

    response(
      res,

      rows.map(
        (
          row,
        ) => ({
          ...row,

          quantity:
            Number(
              row.quantity ||
              0,
            ),

          stockAfter:
            Number(
              row.stockAfter ||
              0,
            ),
        }),
      ),
    );
  },
);

/*
 * ==========================================
 * STOCK BAJO
 * ==========================================
 */

router.get(
  "/low-stock",

  async (
    req,
    res,
  ) => {
    const [
      rows,
    ] =
      await pool.execute(
        `
        SELECT
          id,
          barcode,
          name,
          description,

          category_id
            AS categoryId,

          brand_id
            AS brandId,

          purchase_price
            AS purchasePrice,

          content_quantity
            AS contentQuantity,

          purchase_quantity
            AS purchaseQuantity,

          unit_cost
            AS unitCost,

          sale_price
            AS salePrice,

          stock,

          min_stock
            AS minStock,

          sale_unit
            AS saleUnit,

          expiration_date
            AS expirationDate,

          lot,
          active

        FROM products

        WHERE
          active = 1
          AND stock <= min_stock

        ORDER BY stock ASC
        `,
      );

    response(
      res,
      rows.map(
        mapProduct,
      ),
    );
  },
);

/*
 * ==========================================
 * PRÓXIMOS A VENCER
 * ==========================================
 */

router.get(
  "/expiring",

  async (
    req,
    res,
  ) => {
    const days =
      Math.max(
        1,
        Number(
          req.query.days,
        ) ||
        60,
      );

    const [
      rows,
    ] =
      await pool.execute(
        `
        SELECT
          id,
          barcode,
          name,
          description,

          category_id
            AS categoryId,

          brand_id
            AS brandId,

          purchase_price
            AS purchasePrice,

          content_quantity
            AS contentQuantity,

          purchase_quantity
            AS purchaseQuantity,

          unit_cost
            AS unitCost,

          sale_price
            AS salePrice,

          stock,

          min_stock
            AS minStock,

          sale_unit
            AS saleUnit,

          expiration_date
            AS expirationDate,

          lot,
          active

        FROM products

        WHERE
          active = 1
          AND expiration_date IS NOT NULL
          AND expiration_date <= DATE_ADD(
            CURRENT_DATE(),
            INTERVAL ? DAY
          )

        ORDER BY expiration_date ASC
        `,

        [
          days,
        ],
      );

    const today =
      new Date();

    const data =
      rows.map(
        (
          row,
        ) => {
          const product =
            mapProduct(
              row,
            );

          const expiry =
            new Date(
              `${product.expirationDate}T23:59:59-05:00`,
            );

          return {
            ...product,

            expiryStatus:
              expiry <
              today
                ? "expired"
                : "expiring",

            daysRemaining:
              Math.ceil(
                (
                  expiry -
                  today
                ) /
                  86400000,
              ),
          };
        },
      );

    response(
      res,
      data,
    );
  },
);

/*
 * ==========================================
 * AJUSTE MANUAL
 * ==========================================
 */

router.post(
  "/adjust",

  requireRole(
    "Administrador",
  ),

  async (
    req,
    res,
  ) => {
    required(
      req.body,
      [
        "productId",
        "type",
        "quantity",
        "reason",
      ],
    );

    if (
      ![
        "entrada",
        "salida",
      ].includes(
        req.body.type,
      )
    ) {
      throw new HttpError(
        400,
        "El tipo debe ser entrada o salida",
      );
    }

    const quantity =
      Number(
        req.body.quantity,
      );

    if (
      !Number.isFinite(
        quantity,
      ) ||
      quantity <=
        0
    ) {
      throw new HttpError(
        400,
        "La cantidad debe ser mayor que cero",
      );
    }

    const result =
      await withTransaction(
        async (
          connection,
        ) => {
          /*
           * FOR UPDATE evita que una venta
           * modifique el mismo producto
           * simultáneamente.
           */
          const [
            rows,
          ] =
            await connection.execute(
              `
              SELECT
                id,
                barcode,
                name,
                stock,

                sale_unit
                  AS saleUnit

              FROM products

              WHERE id = ?

              LIMIT 1

              FOR UPDATE
              `,

              [
                req.body.productId,
              ],
            );

          const product =
            rows[0];

          if (
            !product
          ) {
            throw new HttpError(
              404,
              "Producto no encontrado",
            );
          }

          product.stock =
            Number(
              product.stock ||
              0,
            );

          if (
            !allowsFraction(
              product,
            ) &&
            !Number.isInteger(
              quantity,
            )
          ) {
            throw new HttpError(
              400,
              `${product.name} solo admite cantidades enteras`,
            );
          }

          if (
            req.body.type ===
              "salida" &&
            product.stock <
              quantity
          ) {
            throw new HttpError(
              409,
              "Stock insuficiente",
            );
          }

          const newStock =
            Number(
              (
                product.stock +
                (
                  req.body.type ===
                  "entrada"
                    ? quantity
                    : -quantity
                )
              ).toFixed(
                3,
              ),
            );

          await connection.execute(
            `
            UPDATE products

            SET
              stock = ?,
              updated_at = ?

            WHERE id = ?
            `,

            [
              newStock,
              new Date(),
              product.id,
            ],
          );

          const movement = {
            id:
              randomUUID(),

            productId:
              product.id,

            productName:
              product.name,

            type:
              req.body.type,

            reasonType:
              String(
                req.body.reasonType ||
                "ajuste_manual",
              ),

            reason:
              String(
                req.body.reason,
              ).trim(),

            referenceType:
              "",

            referenceId:
              "",

            quantity,

            stockAfter:
              newStock,

            date:
              new Date(),

            createdBy:
              req.user.id,
          };

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
              movement.id,
              movement.productId,
              movement.productName,
              movement.type,
              movement.reasonType,
              movement.reason,
              movement.referenceType,
              movement.referenceId,
              movement.quantity,
              movement.stockAfter,
              movement.date,
              movement.createdBy,
            ],
          );

          return {
            product: {
              ...product,

              stock:
                newStock,
            },

            movement,
          };
        },
      );

    response(
      res,
      result,
      "Inventario actualizado",
      201,
    );
  },
);

export default router;