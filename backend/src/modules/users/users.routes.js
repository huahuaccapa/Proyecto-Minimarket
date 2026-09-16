import { Router } from "express";

import { requireRole } from "../../middlewares/auth.js";

import { nextNumber } from "../../services/sequence.service.js";

import {
  createUser,
  findUserById,
  findUserByUsername,
  listUsers,
  safeUser,
  updatePasswordHash,
  updateUser,
} from "../../services/users.service.js";

import { hashPassword } from "../../utils/password.js";

import { HttpError, required, response } from "../../utils/http.js";

const router = Router();

const ALLOWED_ROLES = new Set(["Administrador", "Vendedora"]);

router.use(requireRole("Administrador"));

function validateUsername(value) {
  const username = String(value || "")
    .trim()
    .toLowerCase();

  if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
    throw new HttpError(
      400,

      "El usuario debe tener entre 3 y 40 caracteres y solo puede usar letras, números, punto, guion y guion bajo",
    );
  }

  return username;
}

function validatePassword(value) {
  const password = String(value || "");

  if (password.length < 8) {
    throw new HttpError(
      400,

      "La contraseña debe tener al menos 8 caracteres",
    );
  }

  return password;
}

function validateRole(value) {
  const role = String(value || "").trim();

  if (!ALLOWED_ROLES.has(role)) {
    throw new HttpError(
      400,

      "Rol no válido",
    );
  }

  return role;
}

router.get(
  "/",

  async (req, res) => {
    response(
      res,

      await listUsers(),
    );
  },
);

router.post(
  "/",

  async (req, res) => {
    required(
      req.body,

      ["username", "name", "password", "role"],
    );

    const username = validateUsername(req.body.username);

    const name = String(req.body.name || "").trim();

    const password = validatePassword(req.body.password);

    const role = validateRole(req.body.role);

    if (name.length < 2 || name.length > 120) {
      throw new HttpError(
        400,

        "El nombre debe tener entre 2 y 120 caracteres",
      );
    }

    if (await findUserByUsername(username)) {
      throw new HttpError(
        409,

        "Ese nombre de usuario ya existe",
      );
    }

    const id = await nextNumber(
      "user",

      "USR",
    );

    const user = await createUser({
      id,

      username,

      name,

      passwordHash: hashPassword(password),

      role,

      active: true,

      mustChangePassword: true,
    });

    response(
      res,

      safeUser(user),

      "Usuario creado. Deberá cambiar su contraseña en el primer ingreso",

      201,
    );
  },
);

router.put(
  "/:id",

  async (req, res) => {
    const current = await findUserById(req.params.id);

    if (!current) {
      throw new HttpError(
        404,

        "Usuario no encontrado",
      );
    }

    const changes = {};

    if (req.body.username !== undefined) {
      const username = validateUsername(req.body.username);

      const existing = await findUserByUsername(username);

      if (existing && existing.id !== current.id) {
        throw new HttpError(
          409,

          "Ese nombre de usuario ya existe",
        );
      }

      changes.username = username;
    }

    if (req.body.name !== undefined) {
      const name = String(req.body.name || "").trim();

      if (name.length < 2 || name.length > 120) {
        throw new HttpError(
          400,

          "El nombre debe tener entre 2 y 120 caracteres",
        );
      }

      changes.name = name;
    }

    if (req.body.role !== undefined) {
      changes.role = validateRole(req.body.role);
    }

    if (req.body.active !== undefined) {
      changes.active = Boolean(req.body.active);
    }

    if (current.id === req.user.id && changes.active === false) {
      throw new HttpError(
        400,

        "No puedes desactivar tu propia cuenta",
      );
    }

    if (
      current.id === req.user.id &&
      changes.role &&
      changes.role !== "Administrador"
    ) {
      throw new HttpError(
        400,

        "No puedes quitarte tu propio rol de administrador",
      );
    }

    const updated = await updateUser(
      current.id,

      changes,
    );

    response(
      res,

      safeUser(updated),

      "Usuario actualizado",
    );
  },
);

router.post(
  "/:id/reset-password",

  async (req, res) => {
    required(
      req.body,

      ["password"],
    );

    const user = await findUserById(req.params.id);

    if (!user) {
      throw new HttpError(
        404,

        "Usuario no encontrado",
      );
    }

    const password = validatePassword(req.body.password);

    await updatePasswordHash(
      user.id,

      hashPassword(password),

      {
        mustChangePassword: true,
      },
    );

    response(
      res,

      null,

      "Contraseña temporal actualizada. El usuario deberá cambiarla al ingresar",
    );
  },
);

export default router;
