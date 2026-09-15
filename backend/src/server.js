import { app } from "./app.js";

import { env } from "./config/env.js";

import { closeDatabase, testDatabaseConnection } from "./config/database.js";

let server = null;

async function startServer() {
  try {
    /*
     * Antes de aceptar tráfico,
     * verificamos MySQL.
     */
    await testDatabaseConnection();

    server = app.listen(
      env.port,

      "0.0.0.0",

      () => {
        console.log(`✅ API del minimarket disponible en puerto ${env.port}`);

        console.log(`✅ Entorno: ${env.nodeEnv}`);
      },
    );
  } catch (error) {
    console.error("❌ No se pudo iniciar el backend:");

    console.error(error);

    process.exit(1);
  }
}

/*
 * ==========================================
 * CIERRE CORRECTO
 * ==========================================
 */

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(`\n${signal} recibido. Cerrando servidor...`);

  try {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }

    await closeDatabase();

    console.log("✅ Servidor cerrado correctamente");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error cerrando servidor:", error);

    process.exit(1);
  }
}

process.on(
  "SIGINT",

  () => shutdown("SIGINT"),
);

process.on(
  "SIGTERM",

  () => shutdown("SIGTERM"),
);

startServer();
