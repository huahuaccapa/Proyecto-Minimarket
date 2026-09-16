import mysql from "mysql2/promise";

const {
  AIVEN_DB_HOST,
  AIVEN_DB_PORT,
  AIVEN_DB_USER,
  AIVEN_DB_PASSWORD,
  AIVEN_DB_NAME,
} = process.env;

async function main() {
  const connection = await mysql.createConnection({
    host: AIVEN_DB_HOST,
    port: Number(AIVEN_DB_PORT),
    user: AIVEN_DB_USER,
    password: AIVEN_DB_PASSWORD,
    database: AIVEN_DB_NAME,

    ssl: {
      rejectUnauthorized: false,
    },
  });

  console.log("✅ Conectado a Aiven");

  const [[users]] = await connection.query(`
    SELECT COUNT(*) AS total
    FROM users
  `);

  const [[products]] = await connection.query(`
    SELECT COUNT(*) AS total
    FROM products
  `);

  const [[categories]] = await connection.query(`
    SELECT COUNT(*) AS total
    FROM categories
  `);

  const [[suppliers]] = await connection.query(`
    SELECT COUNT(*) AS total
    FROM suppliers
  `);

  console.log("");
  console.log("=== DATOS EN AIVEN ===");
  console.log("Usuarios:", users.total);
  console.log("Productos:", products.total);
  console.log("Categorías:", categories.total);
  console.log("Proveedores:", suppliers.total);

  await connection.end();
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});