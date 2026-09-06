import { Router } from "express";

import {
  hashPassword,
  isLegacyPasswordHash,
  persistStore,
  store,
  verifyPassword,
} from "../../data/store.js";

import { HttpError, required, response } from "../../utils/http.js";

import {
  authenticate,
  createSession,
  revokeSession,
} from "../../middlewares/auth.js";

const router = Router();

const attempts = new Map();

const MAX_ATTEMPTS = 5;

const WINDOW_MS = 15 * 60 * 1000;

function loginKey(req, username) {
  return `${req.ip || "unknown"}:${username}`;
}

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

router.post(
  "/login",

  (req, res) => {
    required(req.body, ["username", "password"]);

    const username = String(req.body.username).trim().toLowerCase();

    const key = loginKey(req, username);

    const state = getAttemptState(key);

    if (state.count >= MAX_ATTEMPTS) {
      throw new HttpError(
        429,

        "Demasiados intentos fallidos. Intenta nuevamente en unos minutos",
      );
    }

    const user = store.users.find(
      (item) => item.username.toLowerCase() === username && item.active,
    );

    if (
      !user ||
      !verifyPassword(
        req.body.password,

        user.passwordHash,
      )
    ) {
      state.count += 1;

      attempts.set(key, state);

      throw new HttpError(
        401,

        "Usuario o contraseña incorrectos",
      );
    }

    attempts.delete(key);

    if (isLegacyPasswordHash(user.passwordHash)) {
      user.passwordHash = hashPassword(req.body.password);

      user.passwordUpdatedAt = new Date().toISOString();

      persistStore();
    }

    const safeUser = {
      id: user.id,

      username: user.username,

      name: user.name,

      role: user.role,

      active: user.active,
    };

    response(
      res,

      {
        user: safeUser,

        token: createSession(user.id),
      },

      "Sesión iniciada",
    );
  },
);

router.get(
  "/me",

  authenticate,

  (req, res) => response(res, req.user),
);

router.post(
  "/logout",

  authenticate,

  (req, res) => {
    revokeSession(req.authToken);

    response(res, null, "Sesión cerrada");
  },
);

export default router;
