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
       * Herramientas como Postman,
       * aplicaciones móviles nativas,
       * pruebas internas, etc. pueden
       * no enviar Origin.
       */
      if (!origin) {
        callback(null, true);

        return;
      }

      if (env.frontendUrls.includes(origin)) {
        callback(null, true);

        return;
      }

      /*
       * Permitimos Vercel previews
       * únicamente cuando están bajo
       * *.vercel.app.
       *
       * Esto será útil durante el deploy.
       */
      if (
        env.nodeEnv !== "production" &&
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
      ) {
        callback(null, true);

        return;
      }

      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
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
 * API
 * ==========================================
 */

app.use("/api", routes);

/*
 * ==========================================
 * ERRORES
 * ==========================================
 */

app.use(notFound);

app.use(errorHandler);
