import { Router } from "express";

import { pool } from "../../config/database.js";

import { requireRole } from "../../middlewares/auth.js";

import { HttpError, response } from "../../utils/http.js";

const router = Router();

function mapSettings(row) {
  return {
    businessName: row?.businessName || "Minimarket Mamá",

    documentNumber: row?.documentNumber || "",

    phone: row?.phone || "",

    address: row?.address || "",

    updatedAt: row?.updatedAt || null,
  };
}

async function getSettings() {
  const [rows] = await pool.execute(
    `
      SELECT
        business_name
          AS businessName,

        document_number
          AS documentNumber,

        phone,

        address,

        updated_at
          AS updatedAt

      FROM business_settings

      WHERE id = 1

      LIMIT 1
      `,
  );

  return mapSettings(rows[0]);
}

router.get(
  "/",

  async (req, res) => {
    response(
      res,

      await getSettings(),
    );
  },
);

router.put(
  "/",

  requireRole("Administrador"),

  async (req, res) => {
    const businessName = String(req.body.businessName || "").trim();

    const documentNumber = String(req.body.documentNumber || "").trim();

    const phone = String(req.body.phone || "").trim();

    const address = String(req.body.address || "").trim();

    if (businessName.length < 2 || businessName.length > 120) {
      throw new HttpError(
        400,

        "El nombre comercial debe tener entre 2 y 120 caracteres",
      );
    }

    if (documentNumber.length > 20) {
      throw new HttpError(
        400,

        "El RUC o DNI no puede superar 20 caracteres",
      );
    }

    if (phone.length > 30) {
      throw new HttpError(
        400,

        "El teléfono no puede superar 30 caracteres",
      );
    }

    if (address.length > 255) {
      throw new HttpError(
        400,

        "La dirección no puede superar 255 caracteres",
      );
    }

    const now = new Date();

    await pool.execute(
      `
      INSERT INTO business_settings
      (
        id,

        business_name,

        document_number,

        phone,

        address,

        created_at,

        updated_at
      )

      VALUES
      (
        1,
        ?, ?, ?, ?,
        ?, ?
      )

      ON DUPLICATE KEY UPDATE

        business_name =
          VALUES(
            business_name
          ),

        document_number =
          VALUES(
            document_number
          ),

        phone =
          VALUES(
            phone
          ),

        address =
          VALUES(
            address
          ),

        updated_at =
          VALUES(
            updated_at
          )
      `,

      [businessName, documentNumber, phone, address, now, now],
    );

    response(
      res,

      await getSettings(),

      "Configuración guardada",
    );
  },
);

export default router;
