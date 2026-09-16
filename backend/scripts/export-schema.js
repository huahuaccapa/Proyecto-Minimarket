import fs from "node:fs/promises";

import path from "node:path";

import { fileURLToPath } from "node:url";

import { pool, closeDatabase } from "../src/config/database.js";

import { env } from "../src/config/env.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const outputDir = path.resolve(
  __dirname,

  "../database",
);

const outputFile = path.join(
  outputDir,

  "schema.sql",
);

async function main() {
  const [rows] = await pool.query(
    `
      SHOW FULL TABLES

      WHERE Table_type =
        'BASE TABLE'
      `,
  );

  const tableKey = `Tables_in_${env.db.name}`;

  const tables = rows
    .map((row) => row[tableKey])
    .filter(Boolean)
    .sort();

  if (!tables.length) {
    throw new Error(`No se encontraron tablas en ${env.db.name}`);
  }

  const chunks = [
    "-- Esquema generado automáticamente desde la base real del Minimarket Mamá.",

    `-- Base origen: ${env.db.name}`,

    `-- Fecha: ${new Date().toISOString()}`,

    "",

    "SET NAMES utf8mb4;",

    "SET FOREIGN_KEY_CHECKS = 0;",

    "",
  ];

  for (const table of tables) {
    const escaped = table.replace(
      /`/g,

      "``",
    );

    const [createRows] = await pool.query(
      `
        SHOW CREATE TABLE
        \`${escaped}\`
        `,
    );

    const statement = createRows[0]?.["Create Table"];

    if (!statement) {
      continue;
    }

    chunks.push(`DROP TABLE IF EXISTS \`${escaped}\`;`);

    chunks.push(`${statement};`);

    chunks.push("");
  }

  chunks.push("SET FOREIGN_KEY_CHECKS = 1;");

  chunks.push("");

  await fs.mkdir(
    outputDir,

    {
      recursive: true,
    },
  );

  await fs.writeFile(
    outputFile,

    chunks.join("\n"),

    "utf8",
  );

  console.log(`✅ Esquema exportado a: ${outputFile}`);
}

main()
  .catch((error) => {
    console.error(
      "❌ No se pudo exportar el esquema:",

      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
