import { Router } from "express";

import { randomUUID } from "node:crypto";

import { pool, withTransaction } from "../../config/database.js";

import { requireRole } from "../../middlewares/auth.js";

import { HttpError, required, response } from "../../utils/http.js";

const router = Router();

const money4 = (value) => Number(Number(value).toFixed(4));

const cleanDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
};

function mapProduct(row) {
  return {
    id: row.id,

    barcode: row.barcode,

    name: row.name,

    description: row.description || "",

    categoryId: row.categoryId,

    brandId: row.brandId || "",

    purchasePresentation: row.purchasePresentation,

    purchasePrice: Number(row.purchasePrice || 0),

    contentQuantity: Number(row.contentQuantity || 0),

    purchaseQuantity: Number(row.purchaseQuantity || 0),

    unitCost: Number(row.unitCost || 0),

    salePrice: Number(row.salePrice || 0),

    stock: Number(row.stock || 0),

    minStock: Number(row.minStock || 0),

    saleUnit: row.saleUnit || "unidad",

    unit: row.saleUnit || "unidad",

    image: row.image || "",

    expirationDate: cleanDate(row.expirationDate) || "",

    sanitaryRegistration: row.sanitaryRegistration || "",

    lot: row.lot || "",

    active: Boolean(row.active),

    createdAt: row.createdAt,

    updatedAt: row.updatedAt || null,
  };
}

const PRODUCT_SELECT = `
SELECT
  id,
  barcode,
  name,
  description,

  category_id
    AS categoryId,

  brand_id
    AS brandId,

  purchase_presentation
    AS purchasePresentation,

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

  image,

  expiration_date
    AS expirationDate,

  sanitary_registration
    AS sanitaryRegistration,

  lot,
  active,

  created_at
    AS createdAt,

  updated_at
    AS updatedAt

FROM products
`;

async function categoryExists(id, db = pool) {
  const [rows] = await db.execute(
    `
      SELECT id
      FROM categories
      WHERE
        id = ?
        AND active = 1
      LIMIT 1
      `,

    [id],
  );

  return Boolean(rows.length);
}

async function brandExists(id, db = pool) {
  if (!id) {
    return true;
  }

  const [rows] = await db.execute(
    `
      SELECT id
      FROM brands
      WHERE
        id = ?
        AND active = 1
      LIMIT 1
      `,

    [id],
  );

  return Boolean(rows.length);
}

async function validateCommon(body, current = {}, db = pool) {
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
    throw new HttpError(400, "Revisa los precios y cantidades ingresados");
  }

  if (!(await categoryExists(categoryId, db))) {
    throw new HttpError(400, "Selecciona una categoría válida");
  }

  if (!(await brandExists(brandId, db))) {
    throw new HttpError(400, "Selecciona una marca válida");
  }

  return {
    purchasePrice,
    contentQuantity,
    purchaseQuantity,
    salePrice,
    minStock,
    categoryId,
    brandId: brandId || null,
  };
}

/*
 * ==========================================
 * LISTAR
 * ==========================================
 */

router.get(
  "/",

  async (req, res) => {
    const search = `%${String(req.query.search || "")
      .trim()
      .toLowerCase()}%`;

    const [rows] = await pool.execute(
      `
        ${PRODUCT_SELECT}

        WHERE
          LOWER(name) LIKE ?
          OR LOWER(barcode) LIKE ?
          OR LOWER(
            COALESCE(
              lot,
              ''
            )
          ) LIKE ?

        ORDER BY created_at DESC
        `,

      [search, search, search],
    );

    response(res, rows.map(mapProduct));
  },
);

/*
 * ==========================================
 * POR BARCODE
 * ==========================================
 */

router.get(
  "/barcode/:barcode",

  async (req, res) => {
    const [rows] = await pool.execute(
      `
        ${PRODUCT_SELECT}

        WHERE barcode = ?

        LIMIT 1
        `,

      [req.params.barcode],
    );

    if (!rows[0]) {
      throw new HttpError(404, "Producto no encontrado");
    }

    response(res, mapProduct(rows[0]));
  },
);

/*
 * ==========================================
 * POR ID
 * ==========================================
 */

router.get(
  "/:id",

  async (req, res) => {
    const [rows] = await pool.execute(
      `
        ${PRODUCT_SELECT}

        WHERE id = ?

        LIMIT 1
        `,

      [req.params.id],
    );

    if (!rows[0]) {
      throw new HttpError(404, "Producto no encontrado");
    }

    response(res, mapProduct(rows[0]));
  },
);

/*
 * ==========================================
 * CREAR
 * ==========================================
 */

router.post(
  "/",

  requireRole("Administrador"),

  async (req, res) => {
    required(req.body, [
      "barcode",
      "name",
      "categoryId",
      "purchasePrice",
      "salePrice",
    ]);

    const barcode = String(req.body.barcode).trim();

    const name = String(req.body.name).trim();

    if (!barcode) {
      throw new HttpError(400, "Ingresa un código de barras");
    }

    if (!name) {
      throw new HttpError(400, "Ingresa el nombre del producto");
    }

    const [duplicate] = await pool.execute(
      `
        SELECT id

        FROM products

        WHERE barcode = ?

        LIMIT 1
        `,

      [barcode],
    );

    if (duplicate.length) {
      throw new HttpError(409, "El código de barras ya está registrado");
    }

    const data = await validateCommon(req.body);

    const stock = Number(
      (data.purchaseQuantity * data.contentQuantity).toFixed(3),
    );

    const unitCost = money4(data.purchasePrice / data.contentQuantity);

    const product = {
      id: randomUUID(),

      barcode,

      name,

      description: String(req.body.description || "").trim(),

      categoryId: data.categoryId,

      brandId: data.brandId,

      purchasePresentation: req.body.purchasePresentation || "unidad",

      purchasePrice: money4(data.purchasePrice),

      contentQuantity: data.contentQuantity,

      purchaseQuantity: data.purchaseQuantity,

      unitCost,

      salePrice: Number(data.salePrice.toFixed(2)),

      stock,

      minStock: data.minStock,

      saleUnit: req.body.saleUnit || req.body.unit || "unidad",

      image: String(req.body.image || ""),

      expirationDate: cleanDate(req.body.expirationDate),

      sanitaryRegistration: String(req.body.sanitaryRegistration || "").trim(),

      lot: String(req.body.lot || "").trim(),

      active: req.body.active ?? true,

      createdAt: new Date(),
    };

    await withTransaction(async (connection) => {
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
          `,

        [
          product.id,
          product.barcode,
          product.name,
          product.description,
          product.categoryId,
          product.brandId,
          product.purchasePresentation,
          product.purchasePrice,
          product.contentQuantity,
          product.purchaseQuantity,
          product.unitCost,
          product.salePrice,
          product.stock,
          product.minStock,
          product.saleUnit,
          product.image || null,
          product.expirationDate,
          product.sanitaryRegistration,
          product.lot,
          product.active,
          product.createdAt,
          product.createdAt,
        ],
      );

      /*
       * Movimiento inicial.
       */
      if (product.stock > 0) {
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
            "inventario_inicial",
            "Inventario inicial",
            "",
            "",
            product.stock,
            product.stock,
            product.createdAt,
            req.user.id,
          ],
        );
      }
    });

    response(res, product, "Producto creado", 201);
  },
);

/*
 * ==========================================
 * ACTUALIZAR
 * ==========================================
 */

router.put(
  "/:id",

  requireRole("Administrador"),

  async (req, res) => {
    const [rows] = await pool.execute(
      `
        ${PRODUCT_SELECT}

        WHERE id = ?

        LIMIT 1
        `,

      [req.params.id],
    );

    if (!rows[0]) {
      throw new HttpError(404, "Producto no encontrado");
    }

    const current = mapProduct(rows[0]);

    const barcode = String(req.body.barcode ?? current.barcode).trim();

    const [duplicated] = await pool.execute(
      `
        SELECT id

        FROM products

        WHERE
          barcode = ?
          AND id <> ?

        LIMIT 1
        `,

      [barcode, current.id],
    );

    if (duplicated.length) {
      throw new HttpError(409, "El código de barras ya está registrado");
    }

    const data = await validateCommon(req.body, current);

    /*
     * MUY IMPORTANTE:
     *
     * stock y unitCost NO se toman del frontend.
     */
    const updated = {
      ...current,

      barcode,

      name: String(req.body.name ?? current.name).trim(),

      description: String(
        req.body.description ?? current.description ?? "",
      ).trim(),

      categoryId: data.categoryId,

      brandId: data.brandId,

      purchasePresentation:
        req.body.purchasePresentation ??
        current.purchasePresentation ??
        "unidad",

      purchasePrice: money4(data.purchasePrice),

      contentQuantity: data.contentQuantity,

      purchaseQuantity: data.purchaseQuantity,

      unitCost: Number(current.unitCost || 0),

      stock: Number(current.stock || 0),

      salePrice: Number(data.salePrice.toFixed(2)),

      minStock: data.minStock,

      saleUnit:
        req.body.saleUnit ?? req.body.unit ?? current.saleUnit ?? "unidad",

      image: String(req.body.image ?? current.image ?? ""),

      expirationDate: cleanDate(
        req.body.expirationDate ?? current.expirationDate,
      ),

      sanitaryRegistration: String(
        req.body.sanitaryRegistration ?? current.sanitaryRegistration ?? "",
      ).trim(),

      lot: String(req.body.lot ?? current.lot ?? "").trim(),

      active: req.body.active ?? current.active,

      updatedAt: new Date(),
    };

    await pool.execute(
      `
      UPDATE products

      SET
        barcode = ?,
        name = ?,
        description = ?,
        category_id = ?,
        brand_id = ?,
        purchase_presentation = ?,
        purchase_price = ?,
        content_quantity = ?,
        purchase_quantity = ?,
        sale_price = ?,
        min_stock = ?,
        sale_unit = ?,
        image = ?,
        expiration_date = ?,
        sanitary_registration = ?,
        lot = ?,
        active = ?,
        updated_at = ?

      WHERE id = ?
      `,

      [
        updated.barcode,
        updated.name,
        updated.description,
        updated.categoryId,
        updated.brandId,
        updated.purchasePresentation,
        updated.purchasePrice,
        updated.contentQuantity,
        updated.purchaseQuantity,
        updated.salePrice,
        updated.minStock,
        updated.saleUnit,
        updated.image || null,
        updated.expirationDate,
        updated.sanitaryRegistration,
        updated.lot,
        updated.active,
        updated.updatedAt,
        updated.id,
      ],
    );

    response(res, updated, "Producto actualizado");
  },
);

export default router;
