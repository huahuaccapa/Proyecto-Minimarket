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

const money4 =
  (value) =>
    Number(
      Number(
        value,
      ).toFixed(
        4,
      ),
    );

const quantity3 =
  (value) =>
    Number(
      Number(
        value,
      ).toFixed(
        3,
      ),
    );

const cleanDate =
  (value) => {
    if (!value) {
      return null;
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
  };

const cleanBarcode =
  (value) => {
    const barcode =
      String(
        value ??
          "",
      ).trim();

    return barcode ||
      null;
  };

const cleanImage =
  (value) => {
    const image =
      String(
        value ??
          "",
      ).trim();

    if (!image) {
      return null;
    }

    if (
      !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(
        image,
      )
    ) {
      throw new HttpError(
        400,

        "La imagen debe ser JPG, PNG o WebP",
      );
    }

    if (
      image.length >
      2_500_000
    ) {
      throw new HttpError(
        400,

        "La imagen es demasiado grande. Vuelve a seleccionarla para que sea comprimida",
      );
    }

    return image;
  };

function mapProduct(
  row,
) {
  return {
    id:
      row.id,

    barcode:
      row.barcode ||
      "",

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

    purchasePresentation:
      row.purchasePresentation ||
      "unidad",

    purchasePrice:
      Number(
        row.purchasePrice ||
          0,
      ),

    contentQuantity:
      Number(
        row.contentQuantity ||
          1,
      ),

    purchaseQuantity:
      Number(
        row.purchaseQuantity ||
          1,
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
      row.saleUnit ||
      "unidad",

    unit:
      row.saleUnit ||
      "unidad",

    image:
      row.image ||
      "",

    expirationDate:
      cleanDate(
        row.expirationDate,
      ) ||
      "",

    sanitaryRegistration:
      row.sanitaryRegistration ||
      "",

    lot:
      row.lot ||
      "",

    active:
      Boolean(
        row.active,
      ),

    createdAt:
      row.createdAt,

    updatedAt:
      row.updatedAt ||
      null,
  };
}

const PRODUCT_SELECT = `
SELECT
  id,
  barcode,
  name,
  description,
  category_id AS categoryId,
  brand_id AS brandId,
  purchase_presentation AS purchasePresentation,
  purchase_price AS purchasePrice,
  content_quantity AS contentQuantity,
  purchase_quantity AS purchaseQuantity,
  unit_cost AS unitCost,
  sale_price AS salePrice,
  stock,
  min_stock AS minStock,
  sale_unit AS saleUnit,
  image,
  expiration_date AS expirationDate,
  sanitary_registration AS sanitaryRegistration,
  lot,
  active,
  created_at AS createdAt,
  updated_at AS updatedAt
FROM products
`;

async function categoryExists(
  id,
  db = pool,
) {
  const [
    rows,
  ] =
    await db.execute(
      `
      SELECT id
      FROM categories
      WHERE id = ?
        AND active = 1
      LIMIT 1
      `,

      [
        id,
      ],
    );

  return Boolean(
    rows.length,
  );
}

async function brandExists(
  id,
  db = pool,
) {
  if (!id) {
    return true;
  }

  const [
    rows,
  ] =
    await db.execute(
      `
      SELECT id
      FROM brands
      WHERE id = ?
        AND active = 1
      LIMIT 1
      `,

      [
        id,
      ],
    );

  return Boolean(
    rows.length,
  );
}

async function ensureUniqueBarcode(
  barcode,
  excludedId = null,
  db = pool,
) {
  if (!barcode) {
    return;
  }

  const params = [
    barcode,
  ];

  let sql = `
    SELECT id
    FROM products
    WHERE barcode = ?
  `;

  if (
    excludedId
  ) {
    sql +=
      ` AND id <> ?`;

    params.push(
      excludedId,
    );
  }

  sql +=
    ` LIMIT 1`;

  const [
    rows,
  ] =
    await db.execute(
      sql,
      params,
    );

  if (
    rows.length
  ) {
    throw new HttpError(
      409,

      "El código de barras ya está registrado",
    );
  }
}

async function validateCatalogData(
  body,
  current = {},
  db = pool,
) {
  const categoryId =
    String(
      body.categoryId ??
        current.categoryId ??
        "",
    ).trim();

  const brandId =
    String(
      body.brandId ??
        current.brandId ??
        "",
    ).trim();

  const salePrice =
    Number(
      body.salePrice ??
        current.salePrice ??
        0,
    );

  const minStock =
    Number(
      body.minStock ??
        current.minStock ??
        0,
    );

  if (
    !categoryId ||
    !(
      await categoryExists(
        categoryId,
        db,
      )
    )
  ) {
    throw new HttpError(
      400,

      "Selecciona una categoría válida",
    );
  }

  if (
    !(
      await brandExists(
        brandId,
        db,
      )
    )
  ) {
    throw new HttpError(
      400,

      "Selecciona una marca válida",
    );
  }

  if (
    !Number.isFinite(
      salePrice,
    ) ||
    salePrice <= 0
  ) {
    throw new HttpError(
      400,

      "Ingresa un precio de venta válido",
    );
  }

  if (
    !Number.isFinite(
      minStock,
    ) ||
    minStock < 0
  ) {
    throw new HttpError(
      400,

      "Ingresa un stock mínimo válido",
    );
  }

  return {
    categoryId,

    brandId:
      brandId ||
      null,

    salePrice,

    minStock,
  };
}

async function validateInitialPurchase(
  body,
) {
  const purchasePresentation =
    String(
      body.purchasePresentation ||
        "unidad",
    ).trim();

  const purchasePrice =
    Number(
      body.purchasePrice,
    );

  const purchaseQuantity =
    Number(
      body.purchaseQuantity ??
        1,
    );

  const contentQuantity =
    purchasePresentation ===
    "unidad"
      ? 1
      : Number(
          body.contentQuantity ??
            1,
        );

  if (
    !Number.isFinite(
      purchasePrice,
    ) ||
    purchasePrice <= 0
  ) {
    throw new HttpError(
      400,

      "Ingresa el costo de compra de la presentación",
    );
  }

  if (
    !Number.isFinite(
      purchaseQuantity,
    ) ||
    purchaseQuantity <= 0
  ) {
    throw new HttpError(
      400,

      "Ingresa cuántas presentaciones compraste",
    );
  }

  if (
    !Number.isFinite(
      contentQuantity,
    ) ||
    contentQuantity <= 0
  ) {
    throw new HttpError(
      400,

      "Indica cuántas unidades contiene cada presentación",
    );
  }

  const stock =
    quantity3(
      purchaseQuantity *
        contentQuantity,
    );

  const unitCost =
    money4(
      purchasePrice /
        contentQuantity,
    );

  return {
    purchasePresentation,

    purchasePrice:
      money4(
        purchasePrice,
      ),

    purchaseQuantity:
      quantity3(
        purchaseQuantity,
      ),

    contentQuantity:
      quantity3(
        contentQuantity,
      ),

    stock,

    unitCost,
  };
}

/*
 * ==========================================
 * LISTAR PRODUCTOS
 * ==========================================
 */

router.get(
  "/",

  async (
    req,
    res,
  ) => {
    const search =
      `%${String(
        req.query.search ||
          "",
      )
        .trim()
        .toLowerCase()}%`;

    const [
      rows,
    ] =
      await pool.execute(
        `
        ${PRODUCT_SELECT}

        WHERE
          LOWER(name) LIKE ?
          OR LOWER(COALESCE(barcode, '')) LIKE ?
          OR LOWER(COALESCE(lot, '')) LIKE ?

        ORDER BY created_at DESC
        `,

        [
          search,
          search,
          search,
        ],
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
 * BUSCAR POR CÓDIGO
 * ==========================================
 */

router.get(
  "/barcode/:barcode",

  async (
    req,
    res,
  ) => {
    const barcode =
      cleanBarcode(
        req.params
          .barcode,
      );

    if (
      !barcode
    ) {
      throw new HttpError(
        400,

        "Código de barras vacío",
      );
    }

    const [
      rows,
    ] =
      await pool.execute(
        `
        ${PRODUCT_SELECT}

        WHERE barcode = ?

        LIMIT 1
        `,

        [
          barcode,
        ],
      );

    if (
      !rows[0]
    ) {
      throw new HttpError(
        404,

        "Producto no encontrado",
      );
    }

    response(
      res,

      mapProduct(
        rows[0],
      ),
    );
  },
);

/*
 * ==========================================
 * BUSCAR POR ID
 * ==========================================
 */

router.get(
  "/:id",

  async (
    req,
    res,
  ) => {
    const [
      rows,
    ] =
      await pool.execute(
        `
        ${PRODUCT_SELECT}

        WHERE id = ?

        LIMIT 1
        `,

        [
          req.params.id,
        ],
      );

    if (
      !rows[0]
    ) {
      throw new HttpError(
        404,

        "Producto no encontrado",
      );
    }

    response(
      res,

      mapProduct(
        rows[0],
      ),
    );
  },
);

/*
 * ==========================================
 * CREAR PRODUCTO
 * ==========================================
 */

router.post(
  "/",

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
        "name",
        "categoryId",
        "purchasePrice",
        "salePrice",
      ],
    );

    const name =
      String(
        req.body.name ||
          "",
      ).trim();

    const barcode =
      cleanBarcode(
        req.body
          .barcode,
      );

    if (!name) {
      throw new HttpError(
        400,

        "Ingresa el nombre del producto",
      );
    }

    await ensureUniqueBarcode(
      barcode,
    );

    const catalog =
      await validateCatalogData(
        req.body,
      );

    const purchase =
      await validateInitialPurchase(
        req.body,
      );

    const image =
      cleanImage(
        req.body
          .image,
      );

    const now =
      new Date();

    const product = {
      id:
        randomUUID(),

      barcode:
        barcode ||
        "",

      name,

      description:
        String(
          req.body
            .description ||
            "",
        ).trim(),

      categoryId:
        catalog
          .categoryId,

      brandId:
        catalog
          .brandId,

      purchasePresentation:
        purchase
          .purchasePresentation,

      purchasePrice:
        purchase
          .purchasePrice,

      contentQuantity:
        purchase
          .contentQuantity,

      purchaseQuantity:
        purchase
          .purchaseQuantity,

      unitCost:
        purchase
          .unitCost,

      salePrice:
        Number(
          catalog
            .salePrice
            .toFixed(
              2,
            ),
        ),

      stock:
        purchase
          .stock,

      minStock:
        quantity3(
          catalog
            .minStock,
        ),

      saleUnit:
        String(
          req.body
            .saleUnit ||
            req.body
              .unit ||
            "unidad",
        ).trim(),

      image:
        image ||
        "",

      expirationDate:
        cleanDate(
          req.body
            .expirationDate,
        ),

      sanitaryRegistration:
        String(
          req.body
            .sanitaryRegistration ||
            "",
        ).trim(),

      lot:
        String(
          req.body.lot ||
            "",
        ).trim(),

      active:
        req.body
          .active ??
        true,

      createdAt:
        now,
    };

    await withTransaction(
      async (
        connection,
      ) => {
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
            barcode,
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
            image,
            product.expirationDate,
            product.sanitaryRegistration,
            product.lot,
            product.active,
            now,
            now,
          ],
        );

        if (
          product.stock >
          0
        ) {
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

              `Inventario inicial: ${product.purchaseQuantity} ${product.purchasePresentation}(s) × ${product.contentQuantity} ${product.saleUnit}(es)`,

              "",
              "",
              product.stock,
              product.stock,
              now,
              req.user.id,
            ],
          );
        }
      },
    );

    response(
      res,

      product,

      "Producto creado",

      201,
    );
  },
);

/*
 * ==========================================
 * ACTUALIZAR PRODUCTO
 * ==========================================
 */

router.put(
  "/:id",

  requireRole(
    "Administrador",
  ),

  async (
    req,
    res,
  ) => {
    const [
      rows,
    ] =
      await pool.execute(
        `
        ${PRODUCT_SELECT}

        WHERE id = ?

        LIMIT 1
        `,

        [
          req.params.id,
        ],
      );

    if (
      !rows[0]
    ) {
      throw new HttpError(
        404,

        "Producto no encontrado",
      );
    }

    const current =
      mapProduct(
        rows[0],
      );

    const barcode =
      cleanBarcode(
        req.body
          .barcode ??
          current.barcode,
      );

    const name =
      String(
        req.body.name ??
          current.name,
      ).trim();

    if (!name) {
      throw new HttpError(
        400,

        "Ingresa el nombre del producto",
      );
    }

    await ensureUniqueBarcode(
      barcode,
      current.id,
    );

    const catalog =
      await validateCatalogData(
        req.body,
        current,
      );

    const image =
      cleanImage(
        req.body.image ??
          current.image,
      );

    const updated = {
      ...current,

      barcode:
        barcode ||
        "",

      name,

      description:
        String(
          req.body
            .description ??
            current.description ??
            "",
        ).trim(),

      categoryId:
        catalog
          .categoryId,

      brandId:
        catalog
          .brandId,

      salePrice:
        Number(
          catalog
            .salePrice
            .toFixed(
              2,
            ),
        ),

      minStock:
        quantity3(
          catalog
            .minStock,
        ),

      saleUnit:
        String(
          req.body
            .saleUnit ??
            req.body
              .unit ??
            current.saleUnit ??
            "unidad",
        ).trim(),

      image:
        image ||
        "",

      expirationDate:
        cleanDate(
          req.body
            .expirationDate ??
            current
              .expirationDate,
        ),

      sanitaryRegistration:
        String(
          req.body
            .sanitaryRegistration ??
            current
              .sanitaryRegistration ??
            "",
        ).trim(),

      lot:
        String(
          req.body.lot ??
            current.lot ??
            "",
        ).trim(),

      active:
        req.body.active ??
        current.active,

      updatedAt:
        new Date(),
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
        barcode,
        updated.name,
        updated.description,
        updated.categoryId,
        updated.brandId,
        updated.salePrice,
        updated.minStock,
        updated.saleUnit,
        image,
        updated.expirationDate,
        updated.sanitaryRegistration,
        updated.lot,
        updated.active,
        updated.updatedAt,
        updated.id,
      ],
    );

    response(
      res,

      updated,

      "Producto actualizado",
    );
  },
);

export default router;