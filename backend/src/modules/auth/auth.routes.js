import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { store } from '../../data/store.js';
import { HttpError, required, response } from '../../utils/http.js';

const router = Router();

router.post('/login', (req, res) => {
  required(req.body, ['username', 'password']);
  const username = String(req.body.username).trim().toLowerCase();
  const user = store.users.find((item) => item.username.toLowerCase() === username && item.password === req.body.password && item.active);
  if (!user) throw new HttpError(401, 'Usuario o contraseña incorrectos');
  const { password, ...safeUser } = user;
  response(res, { user: safeUser, token: `demo-${randomUUID()}` }, 'Sesión iniciada');
});

export default router;