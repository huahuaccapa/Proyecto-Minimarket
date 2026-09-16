import express from "express";

import cors from "cors";

import helmet from "helmet";

import morgan from "morgan";

import { env } from "./config/env.js";

import routes from "./routes.js";

import { errorHandler, notFound } from "./middlewares/errors.js";

export const app = express();

/*
 * ==========================================
 * SEGURIDAD BÁSICA
 * ==========================================
 */

app.disable("x-powered-by");

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },

    contentSecurityPolicy: false,
  }),
);

/*
 * ==========================================
 * CORS
 * ==========================================
 */

app.use(
  cors({
    origin: (origin, callback) => {
      /*
       * Permitimos solicitudes sin Origin.
       *
       * Ejemplos:
       * - Postman
       * - Thunder Client
       * - curl
       * - llamadas servidor a servidor
       */
      if (!origin) {
        callback(null, true);
        return;
      }

      /*
       * Permitimos URLs configuradas
       * explícitamente en FRONTEND_URL.
       */
      if (env.frontendUrls.includes(origin)) {
        callback(null, true);
        return;
      }

      /*
       * Permitimos previews y dominios
       * generados por Vercel.
       *
       * Ejemplos:
       *
       * https://proyecto.vercel.app
       * https://proyecto-git-main-usuario.vercel.app
       */
      if (/^https:\/\/[a-z0-9.-]+\.vercel\.app$/i.test(origin)) {
        callback(null, true);
        return;
      }

      console.warn(`⚠️ Origen bloqueado por CORS: ${origin}`);

      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],

    optionsSuccessStatus: 204,
  }),
);

/*
 * ==========================================
 * BODY
 * ==========================================
 */

app.use(
  express.json({
    limit: "3mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,

    limit: "3mb",
  }),
);

/*
 * ==========================================
 * LOGS
 * ==========================================
 */

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

/*
 * ==========================================
 * RUTA PRINCIPAL
 * ==========================================
 *
 * Evita que:
 *
 * GET /
 *
 * devuelva 404 en Render.
 */

app.get(
  "/",

  (req, res) => {
    res.status(200).json({
      success: true,

      message: "API de Minimarket Mamá funcionando correctamente",

      data: {
        service: "minimarket-mama-api",

        environment: env.nodeEnv,

        status: "online",

        health: "/api/health",

        timestamp: new Date().toISOString(),
      },
    });
  },
);

/*
 * ==========================================
 * API
 * ==========================================
 */

app.use(
  "/api",

  routes,
);

/*
 * ==========================================
 * ERRORES
 * ==========================================
 */

app.use(notFound);

app.use(errorHandler);
