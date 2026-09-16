import mysql from "mysql2/promise";

import { env } from "./env.js";

/*
 * ==========================================
 * CONFIGURACIÓN DEL POOL MYSQL
 * ==========================================
 */

const poolOptions = {
  host: env.db.host,

  port: env.db.port,

  user: env.db.user,

  password: env.db.password,

  database: env.db.name,

  /*
   * Esperar una conexión disponible
   * en lugar de fallar inmediatamente.
   */
  waitForConnections: true,

  /*
   * Número máximo de conexiones
   * concurrentes.
   *
   * Para Aiven Free no conviene
   * utilizar un valor demasiado alto.
   */
  connectionLimit: env.db.connectionLimit,

  queueLimit: 0,

  /*
   * Devuelve DECIMAL como Number.
   *
   * Es útil para precios,
   * subtotales y montos.
   */
  decimalNumbers: true,

  charset: "utf8mb4",

  dateStrings: false,

  /*
   * Mantener viva la conexión.
   *
   * Ayuda especialmente en proveedores
   * cloud donde existen conexiones
   * de larga duración.
   */
  enableKeepAlive: true,

  keepAliveInitialDelay: 0,
};

/*
 * ==========================================
 * SSL / TLS
 * ==========================================
 */

if (env.db.ssl) {
  /*
   * Si tenemos el certificado CA de Aiven,
   * verificamos correctamente la identidad
   * del servidor.
   */

  if (env.db.sslCa) {
    poolOptions.ssl = {
      ca: env.db.sslCa,

      rejectUnauthorized: env.db.sslRejectUnauthorized,
    };
  } else {
    /*
     * Si DB_SSL=true pero no se proporcionó
     * CA, todavía podemos establecer TLS.
     *
     * Para producción definitiva recomiendo
     * añadir DB_SSL_CA.
     */

    poolOptions.ssl = {
      rejectUnauthorized: env.db.sslRejectUnauthorized,
    };
  }
}

/*
 * ==========================================
 * CREAR POOL
 * ==========================================
 */

export const pool = mysql.createPool(poolOptions);

/*
 * ==========================================
 * PROBAR CONEXIÓN
 * ==========================================
 */

export async function testDatabaseConnection() {
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(
      `
        SELECT
          1 AS ok,
          DATABASE() AS databaseName,
          VERSION() AS mysqlVersion
        `,
    );

    const result = rows[0];

    console.log(
      `✅ MySQL conectado correctamente: ${env.db.host}:${env.db.port}/${env.db.name}`,
    );

    console.log(`✅ Base activa: ${result.databaseName}`);

    console.log(`✅ MySQL: ${result.mysqlVersion}`);

    console.log(`✅ SSL: ${env.db.ssl ? "activado" : "desactivado"}`);

    return true;
  } catch (error) {
    console.error("❌ Error conectando con MySQL");

    console.error(`Host: ${env.db.host}`);

    console.error(`Puerto: ${env.db.port}`);

    console.error(`Base: ${env.db.name}`);

    console.error(`SSL: ${env.db.ssl ? "sí" : "no"}`);

    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/*
 * ==========================================
 * TRANSACCIONES
 * ==========================================
 */

export async function withTransaction(callback) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await callback(connection);

    await connection.commit();

    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("❌ Error haciendo rollback:", rollbackError);
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
  try {
    await pool.end();

    console.log("✅ Pool MySQL cerrado");
  } catch (error) {
    console.error("❌ Error cerrando pool MySQL:", error);

    throw error;
  }
}
