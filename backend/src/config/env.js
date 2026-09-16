import "dotenv/config";

/*
 * ==========================================
 * HELPERS
 * ==========================================
 */

function numberEnv(value, fallback) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanEnv(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["true", "1", "yes", "si", "sí"].includes(
    String(value).trim().toLowerCase(),
  );
}

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(`Falta la variable de entorno ${name}`);
  }

  return value;
}

/*
 * ==========================================
 * FRONTEND / CORS
 * ==========================================
 */

const frontendUrls = String(process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

/*
 * ==========================================
 * SSL CA
 * ==========================================
 *
 * Permite guardar el certificado de Aiven
 * como variable de entorno.
 *
 * Render puede almacenar texto multilínea.
 *
 * También soportamos certificados escritos
 * con \n en una sola línea.
 */

function normalizeCertificate(value) {
  if (!value) {
    return "";
  }

  return String(value).replace(/\\n/g, "\n").trim();
}

/*
 * ==========================================
 * CONFIGURACIÓN
 * ==========================================
 */

export const env = {
  /*
   * Render establece PORT automáticamente.
   *
   * Localmente usamos 4000.
   */
  port: numberEnv(process.env.PORT, 4000),

  nodeEnv: process.env.NODE_ENV || "development",

  /*
   * URL principal del frontend.
   */
  frontendUrl: frontendUrls[0] || "http://localhost:3000",

  /*
   * Lista de frontends permitidos.
   *
   * Ejemplo:
   *
   * FRONTEND_URL=
   * http://localhost:3000,
   * https://minimarket.vercel.app
   */
  frontendUrls,

  /*
   * ========================================
   * MYSQL
   * ========================================
   */

  db: {
    host: required("DB_HOST", "127.0.0.1"),

    port: numberEnv(process.env.DB_PORT, 3306),

    name: required("DB_NAME", "minimarket_mama"),

    user: required("DB_USER", "root"),

    password: process.env.DB_PASSWORD || "",

    connectionLimit: Math.max(
      1,

      numberEnv(process.env.DB_CONNECTION_LIMIT, 10),
    ),

    /*
     * LOCAL:
     * DB_SSL=false
     *
     * AIVEN:
     * DB_SSL=true
     */
    ssl: booleanEnv(process.env.DB_SSL, false),

    /*
     * Producción:
     * true + certificado CA
     *
     * Solo para una prueba temporal:
     * false
     */
    sslRejectUnauthorized: booleanEnv(
      process.env.DB_SSL_REJECT_UNAUTHORIZED,

      true,
    ),

    /*
     * Certificado CA de Aiven.
     */
    sslCa: normalizeCertificate(process.env.DB_SSL_CA),
  },
};
