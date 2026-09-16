import "dotenv/config";
import mysql from "mysql2/promise";

const LOCAL_CONFIG = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "minimarket_mama",
};

const AIVEN_CONFIG = {
  host: process.env.AIVEN_DB_HOST,
  port: Number(process.env.AIVEN_DB_PORT),
  user: process.env.AIVEN_DB_USER,
  password: process.env.AIVEN_DB_PASSWORD,
  database: process.env.AIVEN_DB_NAME,

  ssl: {
    rejectUnauthorized: false,
  },
};

function validateAivenEnv() {
  const required = [
    "AIVEN_DB_HOST",
    "AIVEN_DB_PORT",
    "AIVEN_DB_USER",
    "AIVEN_DB_PASSWORD",
    "AIVEN_DB_NAME",
  ];

  const missing = required.filter(
    (name) => !process.env[name],
  );

  if (missing.length) {
    throw new Error(
      `Faltan variables de Aiven: ${missing.join(", ")}`,
    );
  }
}

async function getTables(connection) {
  const [rows] = await connection.query(`
    SHOW FULL TABLES
    WHERE Table_type = 'BASE TABLE'
  `);

  return rows.map(
    (row) => Object.values(row)[0],
  );
}

async function main() {
  validateAivenEnv();

  console.log("🔌 Conectando a MySQL local...");

  const local = await mysql.createConnection(
    LOCAL_CONFIG,
  );

  console.log("✅ MySQL local conectado");

  console.log("🔌 Conectando a Aiven...");

  const remote = await mysql.createConnection(
    AIVEN_CONFIG,
  );

  console.log("✅ Aiven conectado");

  const tables = await getTables(local);

  console.log(`📦 Tablas encontradas: ${tables.length}`);

  await remote.query(
    "SET FOREIGN_KEY_CHECKS = 0",
  );

  try {
    for (const table of tables) {
      console.log(`\n➡️ Migrando: ${table}`);

      const [rows] = await local.query(
        `SELECT * FROM \`${table}\``,
      );

      console.log(
        `   Registros locales: ${rows.length}`,
      );

      await remote.query(
        `DELETE FROM \`${table}\``,
      );

      if (!rows.length) {
        console.log("   Sin datos para migrar");
        continue;
      }

      const columns = Object.keys(rows[0]);

      const escapedColumns = columns
        .map((column) => `\`${column}\``)
        .join(", ");

      const placeholders = columns
        .map(() => "?")
        .join(", ");

      const sql = `
        INSERT INTO \`${table}\`
        (${escapedColumns})
        VALUES (${placeholders})
      `;

      for (const row of rows) {
        const values = columns.map(
          (column) => row[column],
        );

        await remote.execute(
          sql,
          values,
        );
      }

      console.log(
        `   ✅ ${rows.length} registros migrados`,
      );
    }
  } finally {
    await remote.query(
      "SET FOREIGN_KEY_CHECKS = 1",
    );
  }

  console.log("\n==============================");
  console.log("✅ MIGRACIÓN FINALIZADA");
  console.log("==============================");

  await local.end();
  await remote.end();
}

main().catch((error) => {
  console.error("\n❌ Error durante la migración:");
  console.error(error.message);

  process.exit(1);
});