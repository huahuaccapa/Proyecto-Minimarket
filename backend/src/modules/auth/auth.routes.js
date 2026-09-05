import { Router } from "express";

import { store, hashPassword } from "../../data/store.js";

import { HttpError, required, response } from "../../utils/http.js";

import {
  authenticate,
  createSession,
  revokeSession,
} from "../../middlewares/auth.js";

const router = Router();

router.post("/login", (req, res) => {
  required(req.body, ["username", "password"]);

  const username = String(req.body.username).trim().toLowerCase();

  const user = store.users.find(
    (item) => item.username.toLowerCase() === username && item.active,
  );

  if (!user || user.passwordHash !== hashPassword(req.body.password)) {
    throw new HttpError(401, "Usuario o contraseña incorrectos");
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
});

router.get("/me", authenticate, (req, res) => {
  response(res, req.user);
});

router.post("/logout", authenticate, (req, res) => {
  revokeSession(req.authToken);

  response(res, null, "Sesión cerrada");
});

export default router;
