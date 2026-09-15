import { HttpError } from "../utils/http.js";

import {
  cleanupExpiredSessions,
  findSessionWithUser,
  revokeSession,
} from "../services/sessions.service.js";

/*
 * ==========================================
 * OBTENER TOKEN
 * ==========================================
 */

function extractBearerToken(req) {
  const header = String(req.headers.authorization || "").trim();

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

/*
 * ==========================================
 * AUTENTICACIÓN MYSQL
 * ==========================================
 */

export async function authenticate(req, res, next) {
  /*
   * Express 5 puede manejar correctamente
   * una función async y enviar el error al
   * errorHandler.
   */

  const token = extractBearerToken(req);

  if (!token) {
    throw new HttpError(401, "Debes iniciar sesión");
  }

  /*
   * Limpiamos sesiones antiguas de forma
   * periódica. No se ejecutará un DELETE
   * en cada solicitud.
   */
  await cleanupExpiredSessions();

  const session = await findSessionWithUser(token);

  if (!session) {
    throw new HttpError(401, "Sesión inválida o expirada");
  }

  /*
   * mysql2 normalmente devuelve DATETIME
   * como objeto Date.
   *
   * También contemplamos string por
   * compatibilidad.
   */
  const expiresAt =
    session.expiresAt instanceof Date
      ? session.expiresAt
      : new Date(session.expiresAt);

  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    await revokeSession(token);

    throw new HttpError(401, "Tu sesión expiró. Inicia sesión nuevamente");
  }

  /*
   * Si un administrador desactiva al
   * usuario, sus tokens dejan de ser útiles.
   */
  if (!session.user || !session.user.active) {
    await revokeSession(token);

    throw new HttpError(401, "El usuario ya no está disponible");
  }

  /*
   * Datos disponibles para todas las
   * rutas posteriores.
   */

  req.authToken = token;

  req.session = {
    token: session.token,

    userId: session.userId,

    createdAt: session.createdAt,

    expiresAt: session.expiresAt,
  };

  req.user = {
    id: session.user.id,

    username: session.user.username,

    name: session.user.name,

    role: session.user.role,

    active: Boolean(session.user.active),
  };

  next();
}

/*
 * ==========================================
 * ROLES
 * ==========================================
 */

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new HttpError(
        403,
        "No tienes permisos para realizar esta operación",
      );
    }

    next();
  };
