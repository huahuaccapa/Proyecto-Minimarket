import mysql from "mysql2/promise";

import {
  env,
} from "./env.js";

/*
 * ==========================================
 * CONFIGURACIÓN DEL POOL MYSQL
 * ==========================================
 */

const poolOptions = {
  host:
    env.db.host,

  port:
    env.db.port,

  user:
    env.db.user,

  password:
    env.db.password,

  database:
    env.db.name,

  waitForConnections:
    true,

  connectionLimit:
    env.db.connectionLimit,

  queueLimit:
    0,

  decimalNumbers:
    true,

  charset:
    "utf8mb4",

  dateStrings:
    false,
};

/*
 * ==========================================
 * SSL
 * ==========================================
 *
 * Para desarrollo local normalmente:
 *
 * DB_SSL=false
 *
 * Para algunos proveedores cloud:
 *
 * DB_SSL=true
 */

if (
  env.db.ssl
) {
  poolOptions.ssl = {
    rejectUnauthorized:
      env.db.sslRejectUnauthorized,
  };
}

export const pool =
  mysql.createPool(
    poolOptions,
  );

/*
 * ==========================================
 * PROBAR CONEXIÓN
 * ==========================================
 */

export async function testDatabaseConnection() {
  const connection =
    await pool.getConnection();

  try {
    await connection.query(
      "SELECT 1 AS ok",
    );

    console.log(
      `✅ MySQL conectado correctamente: ${env.db.host}:${env.db.port}/${env.db.name}`,
    );
  } finally {
    connection.release();
  }
}

/*
 * ==========================================
 * TRANSACCIONES
 * ==========================================
 */

export async function withTransaction(
  callback,
) {
  const connection =
    await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result =
      await callback(
        connection,
      );

    await connection.commit();

    return result;
  } catch (
    error
  ) {
    try {
      await connection.rollback();
    } catch (
      rollbackError
    ) {
      console.error(
        "Error haciendo rollback:",
        rollbackError,
      );
    }

    throw error;
  } finally {
    connection.release();
  }
}

/*
 * ==========================================
 * CERRAR POOL
 * ==========================================
 */

export async function closeDatabase() {
  await pool.end();
}