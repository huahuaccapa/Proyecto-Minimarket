import { Router } from "express";

import { HttpError, required, response } from "../../utils/http.js";

import { authenticate } from "../../middlewares/auth.js";

import {
  createSession,
  revokeSession,
} from "../../services/sessions.service.js";

import {
  findActiveUserByUsername,
  safeUser,
  updatePasswordHash,
} from "../../services/users.service.js";

import {
  hashPassword,
  isLegacyPasswordHash,
  verifyPassword,
} from "../../utils/password.js";

const router = Router();

/*
 * ==========================================
 * PROTECCIÓN CONTRA FUERZA BRUTA
 * ==========================================
 *
 * Todavía se mantiene en memoria porque
 * es simplemente una protección temporal.
 *
 * Las sesiones reales sí están en MySQL.
 */

const attempts = new Map();

const MAX_ATTEMPTS = 5;

const WINDOW_MS = 15 * 60 * 1000;

/*
 * ==========================================
 * CLAVE PARA RATE LIMIT
 * ==========================================
 */

function loginKey(req, username) {
  return `${req.ip || "unknown"}:${username}`;
}

/*
 * ==========================================
 * OBTENER ESTADO DE INTENTOS
 * ==========================================
 */

function getAttemptState(key) {
  const current = attempts.get(key);

  if (!current || Date.now() - current.startedAt >= WINDOW_MS) {
    const fresh = {
      count: 0,

      startedAt: Date.now(),
    };

    attempts.set(key, fresh);

    return fresh;
  }

  return current;
}

/*
 * ==========================================
 * LOGIN
 * ==========================================
 */

router.post(
  "/login",

  async (req, res) => {
    required(req.body, ["username", "password"]);

    const username = String(req.body.username).trim().toLowerCase();

    const password = String(req.body.password);

    /*
     * Evitamos username vacío después
     * de aplicar trim().
     */
    if (!username) {
      throw new HttpError(400, "Ingresa un usuario");
    }

    const key = loginKey(req, username);

    const state = getAttemptState(key);

    /*
     * Bloqueo temporal.
     */
    if (state.count >= MAX_ATTEMPTS) {
      const elapsed = Date.now() - state.startedAt;

      const remaining = Math.max(0, WINDOW_MS - elapsed);

      const minutes = Math.max(1, Math.ceil(remaining / 60000));

      throw new HttpError(
        429,
        `Demasiados intentos fallidos. Intenta nuevamente en ${minutes} minuto${minutes === 1 ? "" : "s"}`,
      );
    }

    /*
     * ======================================
     * AQUÍ YA CONSULTAMOS MYSQL
     * ======================================
     */

    const user = await findActiveUserByUsername(username);

    /*
     * Utilizamos el mismo mensaje para
     * usuario inexistente y contraseña
     * incorrecta.
     *
     * Así no revelamos qué usuarios
     * existen.
     */
    if (!user || !verifyPassword(password, user.passwordHash)) {
      state.count += 1;

      attempts.set(key, state);

      throw new HttpError(401, "Usuario o contraseña incorrectos");
    }

    /*
     * Login correcto:
     * eliminamos los intentos fallidos.
     */
    attempts.delete(key);

    /*
     * ======================================
     * MIGRACIÓN AUTOMÁTICA SHA256 → SCRYPT
     * ======================================
     */

    if (isLegacyPasswordHash(user.passwordHash)) {
      const newHash = hashPassword(password);

      await updatePasswordHash(user.id, newHash);

      /*
       * No necesitamos modificar db.json.
       *
       * La contraseña ya queda actualizada
       * directamente en MySQL.
       */
    }

    /*
     * ======================================
     * CREAR SESIÓN EN MYSQL
     * ======================================
     */

    const session = await createSession(user.id);

    response(
      res,

      {
        user: safeUser(user),

        token: session.token,

        /*
         * Información útil para futuras
         * versiones del frontend.
         */
        expiresAt: session.expiresAt,
      },

      "Sesión iniciada",
    );
  },
);

/*
 * ==========================================
 * USUARIO ACTUAL
 * ==========================================
 */

router.get(
  "/me",

  authenticate,

  (req, res) => {
    response(res, req.user);
  },
);

/*
 * ==========================================
 * LOGOUT
 * ==========================================
 */

router.post(
  "/logout",

  authenticate,

  async (req, res) => {
    await revokeSession(req.authToken);

    response(res, null, "Sesión cerrada");
  },
);

export default router;
