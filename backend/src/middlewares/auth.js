import { randomUUID } from 'node:crypto';

import { store } from '../data/store.js';

import {
  HttpError,
} from '../utils/http.js';

const sessions = new Map();

const SESSION_MS =
  12 * 60 * 60 * 1000;

export function createSession(userId) {
  const token = randomUUID();

  sessions.set(token, {
    userId,
    expiresAt:
      Date.now() + SESSION_MS,
  });

  return token;
}

export function revokeSession(token) {
  sessions.delete(token);
}

export function authenticate(
  req,
  res,
  next,
) {
  const header = String(
    req.headers.authorization || '',
  );

  const token =
    header.startsWith('Bearer ')
      ? header.slice(7).trim()
      : '';

  const session =
    sessions.get(token);

  if (
    !session ||
    session.expiresAt <= Date.now()
  ) {
    if (token) {
      sessions.delete(token);
    }

    throw new HttpError(
      401,
      'Sesión inválida o expirada',
    );
  }

  const user =
    store.users.find(
      (item) =>
        item.id === session.userId &&
        item.active,
    );

  if (!user) {
    throw new HttpError(
      401,
      'Usuario no disponible',
    );
  }

  req.authToken = token;

  req.user = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };

  next();
}

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (
      !req.user ||
      !roles.includes(
        req.user.role,
      )
    ) {
      throw new HttpError(
        403,
        'No tienes permisos para realizar esta operación',
      );
    }

    next();
  };