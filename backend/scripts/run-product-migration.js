import fs from "node:fs/promises";

import path from "node:path";

import {
  fileURLToPath,
} from "node:url";

import mysql from "mysql2/promise";

import "dotenv/config";

const __filename =
  fileURLToPath(
    import.meta.url,
  );

const __dirname =
  path.dirname(
    __filename,
  );

const migrationPath =
  path.resolve(
    __dirname,

    "../database/002_product_purchase_logic.sql",
  );

const config = {
  host:
    process.env.DB_HOST ||
    "127.0.0.1",

  port:
    Number(
      process.env.DB_PORT ||
        3306,
    ),

  user:
    process.env.DB_USER ||
    "root",

  password:
    process.env.DB_PASSWORD ||
    "",

  database:
    process.env.DB_NAME ||
    "minimarket_mama",

  multipleStatements:
    true,
};

if (
  String(
    process.env.DB_SSL ||
      "",
  ).toLowerCase() ===
  "true"
) {
  config.ssl = {
    rejectUnauthorized:
      String(
        process.env
          .DB_SSL_REJECT_UNAUTHORIZED ||
          "true",
      ).toLowerCase() !==
      "false",
  };
}

async function main() {
  const sql =
    await fs.readFile(
      migrationPath,

      "utf8",
    );

  const connection =
    await mysql.createConnection(
      config,
    );

  try {
    console.log(
      `🔄 Aplicando migración en ${config.host}:${config.port}/${config.database}...`,
    );

    await connection.query(
      sql,
    );

    const [
      productColumns,
    ] =
      await connection.query(
        `
        SHOW COLUMNS
        FROM products
        LIKE 'barcode'
        `,
      );

    console.log(
      "✅ Migración aplicada correctamente",
    );

    console.table(
      productColumns,
    );
  } finally {
    await connection.end();
  }
}

main().catch(
  (
    error,
  ) => {
    console.error(
      "❌ No se pudo aplicar la migración:",
    );

    console.error(
      error.message,
    );

    process.exit(
      1,
    );
  },
);