import { Router } from "express";

import { HttpError, required, response } from "../../utils/http.js";

import { authenticate } from "../../middlewares/auth.js";

import {
  createSession,
  revokeAllUserSessions,
  revokeSession,
} from "../../services/sessions.service.js";

import {
  findActiveUserByUsername,
  findUserById,
  safeUser,
  updatePasswordHash,
} from "../../services/users.service.js";

import {
  hashPassword,
  isLegacyPasswordHash,
  verifyPassword,
} from "../../utils/password.js";

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

    attempts.set(
      key,

      fresh,
    );

    return fresh;
  }

  return current;
}

function validateNewPassword(password) {
  const value = String(password || "");

  if (value.length < 8) {
    throw new HttpError(
      400,

      "La nueva contraseña debe tener al menos 8 caracteres",
    );
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw new HttpError(
      400,

      "La nueva contraseña debe incluir al menos una letra y un número",
    );
  }

  return value;
}

router.post(
  "/login",

  async (req, res) => {
    required(
      req.body,

      ["username", "password"],
    );

    const username = String(req.body.username).trim().toLowerCase();

    const password = String(req.body.password);

    if (!username) {
      throw new HttpError(
        400,

        "Ingresa un usuario",
      );
    }

    const key = loginKey(
      req,

      username,
    );

    const state = getAttemptState(key);

    if (state.count >= MAX_ATTEMPTS) {
      const elapsed = Date.now() - state.startedAt;

      const remaining = Math.max(
        0,

        WINDOW_MS - elapsed,
      );

      const minutes = Math.max(
        1,

        Math.ceil(remaining / 60000),
      );

      throw new HttpError(
        429,

        `Demasiados intentos fallidos. Intenta nuevamente en ${minutes} minuto${
          minutes === 1 ? "" : "s"
        }`,
      );
    }

    const user = await findActiveUserByUsername(username);

    if (
      !user ||
      !verifyPassword(
        password,

        user.passwordHash,
      )
    ) {
      state.count += 1;

      attempts.set(
        key,

        state,
      );

      throw new HttpError(
        401,

        "Usuario o contraseña incorrectos",
      );
    }

    attempts.delete(key);

    if (isLegacyPasswordHash(user.passwordHash)) {
      await updatePasswordHash(
        user.id,

        hashPassword(password),

        {
          mustChangePassword: user.mustChangePassword,
        },
      );
    }

    const refreshedUser = (await findUserById(user.id)) || user;

    const session = await createSession(user.id);

    response(
      res,

      {
        user: safeUser(refreshedUser),

        token: session.token,

        expiresAt: session.expiresAt,
      },

      "Sesión iniciada",
    );
  },
);

router.get(
  "/me",

  authenticate,

  (req, res) => {
    response(
      res,

      req.user,
    );
  },
);

router.post(
  "/change-password",

  authenticate,

  async (req, res) => {
    required(
      req.body,

      ["currentPassword", "newPassword"],
    );

    const currentPassword = String(req.body.currentPassword);

    const newPassword = validateNewPassword(req.body.newPassword);

    if (currentPassword === newPassword) {
      throw new HttpError(
        400,

        "La nueva contraseña debe ser diferente de la actual",
      );
    }

    const user = await findUserById(req.user.id);

    if (
      !user ||
      !verifyPassword(
        currentPassword,

        user.passwordHash,
      )
    ) {
      throw new HttpError(
        400,

        "La contraseña actual no es correcta",
      );
    }

    await updatePasswordHash(
      user.id,

      hashPassword(newPassword),

      {
        mustChangePassword: false,
      },
    );

    await revokeAllUserSessions(user.id);

    const session = await createSession(user.id);

    const refreshedUser = await findUserById(user.id);

    response(
      res,

      {
        user: safeUser(refreshedUser),

        token: session.token,

        expiresAt: session.expiresAt,
      },

      "Contraseña actualizada correctamente",
    );
  },
);

router.post(
  "/logout",

  authenticate,

  async (req, res) => {
    await revokeSession(req.authToken);

    response(
      res,

      null,

      "Sesión cerrada",
    );
  },
);

export default router;
