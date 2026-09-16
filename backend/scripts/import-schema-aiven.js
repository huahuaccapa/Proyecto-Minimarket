import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.resolve(__dirname, "../database/schema.sql");

const {
  AIVEN_DB_HOST,
  AIVEN_DB_PORT,
  AIVEN_DB_USER,
  AIVEN_DB_PASSWORD,
  AIVEN_DB_NAME,
} = process.env;

if (
  !AIVEN_DB_HOST ||
  !AIVEN_DB_PORT ||
  !AIVEN_DB_USER ||
  !AIVEN_DB_PASSWORD ||
  !AIVEN_DB_NAME
) {
  console.error("❌ Faltan variables de entorno de Aiven.");

  process.exit(1);
}

async function main() {
  const sql = await fs.readFile(schemaPath, "utf8");

  const connection = await mysql.createConnection({
    host: AIVEN_DB_HOST,
    port: Number(AIVEN_DB_PORT),
    user: AIVEN_DB_USER,
    password: AIVEN_DB_PASSWORD,
    database: AIVEN_DB_NAME,

    ssl: {
      rejectUnauthorized: false,
    },

    multipleStatements: true,
  });

  console.log("✅ Conectado correctamente a Aiven MySQL");

  await connection.query(sql);

  console.log("✅ schema.sql importado correctamente en Aiven");

  const [tables] = await connection.query("SHOW TABLES");

  console.log(`✅ Tablas encontradas: ${tables.length}`);

  console.table(tables);

  await connection.end();
}

main().catch((error) => {
  console.error("❌ Error importando schema.sql:", error.message);

  process.exit(1);
});
