import { app } from "./app.js";

import { env } from "./config/env.js";

import { closeDatabase, testDatabaseConnection } from "./config/database.js";

/*
 * ==========================================
 * CONFIGURACIÓN DEL PUERTO
 * ==========================================
 *
 * Render proporciona automáticamente:
 *
 * process.env.PORT
 *
 * En desarrollo local seguimos usando
 * el puerto configurado en env.port.
 */

const PORT = Number(process.env.PORT) || Number(env.port) || 4000;

const HOST = "0.0.0.0";

let server = null;

/*
 * ==========================================
 * INICIO DEL SERVIDOR
 * ==========================================
 */

async function startServer() {
  try {
    console.log("🔄 Verificando conexión con MySQL...");

    /*
     * Antes de aceptar solicitudes HTTP,
     * comprobamos que MySQL esté disponible.
     *
     * Esto es especialmente importante
     * en Render + Aiven.
     */
    await testDatabaseConnection();

    console.log("✅ MySQL conectado correctamente");

    server = app.listen(PORT, HOST, () => {
      console.log("");
      console.log("=====================================");
      console.log("✅ MINIMARKET MAMÁ API");
      console.log("=====================================");
      console.log(`✅ Puerto: ${PORT}`);
      console.log(`✅ Host: ${HOST}`);
      console.log(`✅ Entorno: ${env.nodeEnv}`);
      console.log("✅ Backend iniciado correctamente");
      console.log("=====================================");
      console.log("");
    });
  } catch (error) {
    console.error("");
    console.error("=====================================");
    console.error("❌ ERROR INICIANDO EL BACKEND");
    console.error("=====================================");

    console.error(error?.message || error);

    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }

    console.error("=====================================");
    console.error("");

    process.exit(1);
  }
}

/*
 * ==========================================
 * CIERRE CORRECTO DEL SERVIDOR
 * ==========================================
 */

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log("");
  console.log(`⚠️ ${signal} recibido. Cerrando servidor...`);

  try {
    /*
     * Primero dejamos de aceptar
     * nuevas conexiones HTTP.
     */
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    /*
     * Después cerramos el pool MySQL.
     */
    await closeDatabase();

    console.log("✅ Servidor cerrado correctamente");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error cerrando servidor:", error);

    process.exit(1);
  }
}

/*
 * ==========================================
 * SEÑALES DEL SISTEMA
 * ==========================================
 *
 * SIGTERM es particularmente importante
 * porque Render la utiliza cuando reinicia
 * o reemplaza una instancia.
 */

process.on("SIGINT", () => shutdown("SIGINT"));

process.on("SIGTERM", () => shutdown("SIGTERM"));

/*
 * Errores inesperados.
 */

process.on("unhandledRejection", (reason) => {
  console.error("❌ Promesa no controlada:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Excepción no controlada:", error);

  shutdown("uncaughtException");
});

/*
 * ==========================================
 * ARRANCAR BACKEND
 * ==========================================
 */

startServer();
