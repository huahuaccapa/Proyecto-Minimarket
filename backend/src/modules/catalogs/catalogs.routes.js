import {
  Router,
} from "express";

import {
  randomUUID,
} from "node:crypto";

import {
  pool,
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

const catalogConfig = {
  categories: {
    table:
      "categories",

    singular:
      "categoría",

    plural:
      "categorías",
  },

  brands: {
    table:
      "brands",

    singular:
      "marca",

    plural:
      "marcas",
  },
};

function mapCatalog(
  row,
) {
  if (!row) {
    return null;
  }

  return {
    id:
      row.id,

    name:
      row.name,

    description:
      row.description ||
      "",

    active:
      Boolean(
        row.active,
      ),

    createdAt:
      row.createdAt ||
      null,

    updatedAt:
      row.updatedAt ||
      null,
  };
}

/*
 * ==========================================
 * GENERAR RUTAS PARA CATEGORÍAS Y MARCAS
 * ==========================================
 */

for (
  const [
    routeName,
    config,
  ] of Object.entries(
    catalogConfig,
  )
) {
  /*
   * ========================================
   * LISTAR
   * ========================================
   */

  router.get(
    `/${routeName}`,

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
            name,
            description,
            active,

            created_at
              AS createdAt,

            updated_at
              AS updatedAt

          FROM ${config.table}

          ORDER BY
            active DESC,
            name ASC
          `,
        );

      response(
        res,
        rows.map(
          mapCatalog,
        ),
      );
    },
  );

  /*
   * ========================================
   * CREAR
   * ========================================
   */

  router.post(
    `/${routeName}`,

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
        ],
      );

      const name =
        String(
          req.body.name ||
          "",
        ).trim();

      const description =
        String(
          req.body.description ||
          "",
        ).trim();

      if (!name) {
        throw new HttpError(
          400,
          "El nombre es obligatorio",
        );
      }

      /*
       * Evitar duplicados.
       */
      const [
        duplicated,
      ] =
        await pool.execute(
          `
          SELECT id

          FROM ${config.table}

          WHERE LOWER(name) =
                LOWER(?)

          LIMIT 1
          `,

          [
            name,
          ],
        );

      if (
        duplicated.length >
        0
      ) {
        throw new HttpError(
          409,
          `La ${config.singular} ya existe`,
        );
      }

      const item = {
        id:
          randomUUID(),

        name,

        description,

        active:
          req.body.active ===
          undefined
            ? true
            : Boolean(
                req.body.active,
              ),

        createdAt:
          new Date(),

        updatedAt:
          new Date(),
      };

      await pool.execute(
        `
        INSERT INTO ${config.table}
        (
          id,
          name,
          description,
          active,
          created_at,
          updated_at
        )

        VALUES
        (?, ?, ?, ?, ?, ?)
        `,

        [
          item.id,
          item.name,
          item.description,
          item.active,
          item.createdAt,
          item.updatedAt,
        ],
      );

      response(
        res,
        item,
        `${
          config.singular
            .charAt(0)
            .toUpperCase() +
          config.singular.slice(
            1,
          )
        } creada correctamente`,
        201,
      );
    },
  );

  /*
   * ========================================
   * ACTUALIZAR
   * ========================================
   */

  router.put(
    `/${routeName}/:id`,

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
          SELECT
            id,
            name,
            description,
            active,

            created_at
              AS createdAt,

            updated_at
              AS updatedAt

          FROM ${config.table}

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
          `${
            config.singular
              .charAt(0)
              .toUpperCase() +
            config.singular.slice(
              1,
            )
          } no encontrada`,
        );
      }

      const current =
        mapCatalog(
          rows[0],
        );

      const name =
        String(
          req.body.name ??
          current.name,
        ).trim();

      if (!name) {
        throw new HttpError(
          400,
          "El nombre es obligatorio",
        );
      }

      /*
       * Verificar que otro registro
       * no tenga el mismo nombre.
       */
      const [
        duplicated,
      ] =
        await pool.execute(
          `
          SELECT id

          FROM ${config.table}

          WHERE
            LOWER(name) =
              LOWER(?)

            AND id <> ?

          LIMIT 1
          `,

          [
            name,
            current.id,
          ],
        );

      if (
        duplicated.length >
        0
      ) {
        throw new HttpError(
          409,
          `Ya existe otra ${config.singular} con ese nombre`,
        );
      }

      const updated = {
        ...current,

        name,

        description:
          String(
            req.body.description ??
            current.description ??
            "",
          ).trim(),

        active:
          req.body.active ===
          undefined
            ? current.active
            : Boolean(
                req.body.active,
              ),

        updatedAt:
          new Date(),
      };

      await pool.execute(
        `
        UPDATE ${config.table}

        SET
          name = ?,
          description = ?,
          active = ?,
          updated_at = ?

        WHERE id = ?
        `,

        [
          updated.name,
          updated.description,
          updated.active,
          updated.updatedAt,
          updated.id,
        ],
      );

      response(
        res,
        updated,
        `${
          config.singular
            .charAt(0)
            .toUpperCase() +
          config.singular.slice(
            1,
          )
        } actualizada correctamente`,
      );
    },
  );

  /*
   * ========================================
   * ACTIVAR / DESACTIVAR
   * ========================================
   */

  router.patch(
    `/${routeName}/:id/status`,

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
          "active",
        ],
      );

      const [
        rows,
      ] =
        await pool.execute(
          `
          SELECT
            id,
            name,
            description,
            active,

            created_at
              AS createdAt,

            updated_at
              AS updatedAt

          FROM ${config.table}

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
          `${
            config.singular
              .charAt(0)
              .toUpperCase() +
            config.singular.slice(
              1,
            )
          } no encontrada`,
        );
      }

      const active =
        Boolean(
          req.body.active,
        );

      const updatedAt =
        new Date();

      await pool.execute(
        `
        UPDATE ${config.table}

        SET
          active = ?,
          updated_at = ?

        WHERE id = ?
        `,

        [
          active,
          updatedAt,
          req.params.id,
        ],
      );

      response(
        res,

        {
          ...mapCatalog(
            rows[0],
          ),

          active,

          updatedAt,
        },

        active
          ? `${config.singular} activada correctamente`
          : `${config.singular} desactivada correctamente`,
      );
    },
  );
}

export default router;