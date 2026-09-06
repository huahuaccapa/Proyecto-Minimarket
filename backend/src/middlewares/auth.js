import {
  randomBytes,
} from "node:crypto";

import {
  persistStore,
  store,
} from "../data/store.js";

import {
  HttpError,
} from "../utils/http.js";

/*
 * ==========================================
 * CONFIGURACIÓN DE SESIÓN
 * ==========================================
 *
 * 12 horas.
 */
const SESSION_MS =
  12 *
  60 *
  60 *
  1000;

/*
 * Cada cuánto se realiza una
 * limpieza general de sesiones
 * expiradas.
 */
const CLEANUP_INTERVAL_MS =
  15 *
  60 *
  1000;

let lastCleanup =
  0;

/*
 * ==========================================
 * GENERAR TOKEN
 * ==========================================
 *
 * Usamos 32 bytes aleatorios.
 *
 * Mucho más robusto que
 * mantener únicamente un UUID.
 */
function generateToken() {
  return randomBytes(
    32,
  ).toString(
    "hex",
  );
}

/*
 * ==========================================
 * LIMPIEZA DE SESIONES
 * ==========================================
 */

function cleanupExpiredSessions(
  force = false,
) {
  const currentTime =
    Date.now();

  if (
    !force &&
    currentTime -
      lastCleanup <
      CLEANUP_INTERVAL_MS
  ) {
    return;
  }

  lastCleanup =
    currentTime;

  const before =
    store.sessions.length;

  store.sessions =
    store.sessions.filter(
      (
        session,
      ) =>
        Number(
          session.expiresAt,
        ) >
        currentTime,
    );

  /*
   * Solo escribimos db.json
   * cuando realmente eliminamos
   * alguna sesión.
   */
  if (
    store.sessions.length !==
    before
  ) {
    persistStore();
  }
}

/*
 * ==========================================
 * CREAR SESIÓN
 * ==========================================
 */

export function createSession(
  userId,
) {
  cleanupExpiredSessions(
    true,
  );

  /*
   * Evitamos acumular muchas
   * sesiones antiguas para
   * el mismo usuario.
   *
   * Conservaremos solamente
   * sesiones todavía válidas.
   */
  store.sessions =
    store.sessions.filter(
      (
        session,
      ) =>
        !(
          session.userId ===
            userId &&
          Number(
            session.expiresAt,
          ) <=
            Date.now()
        ),
    );

  const token =
    generateToken();

  const session = {
    token,

    userId,

    createdAt:
      new Date()
        .toISOString(),

    expiresAt:
      Date.now() +
      SESSION_MS,
  };

  store.sessions.push(
    session,
  );

  /*
   * FUNDAMENTAL:
   *
   * La sesión queda guardada
   * físicamente en db.json.
   */
  persistStore();

  return token;
}

/*
 * ==========================================
 * CERRAR SESIÓN
 * ==========================================
 */

export function revokeSession(
  token,
) {
  if (
    !token
  ) {
    return;
  }

  const before =
    store.sessions.length;

  store.sessions =
    store.sessions.filter(
      (
        session,
      ) =>
        session.token !==
        token,
    );

  if (
    store.sessions.length !==
    before
  ) {
    persistStore();
  }
}

/*
 * ==========================================
 * AUTENTICAR
 * ==========================================
 */

export function authenticate(
  req,
  res,
  next,
) {
  cleanupExpiredSessions();

  const header =
    String(
      req.headers
        .authorization ||
        "",
    );

  const token =
    header.startsWith(
      "Bearer ",
    )
      ? header
          .slice(
            7,
          )
          .trim()
      : "";

  if (
    !token
  ) {
    throw new HttpError(
      401,

      "Debes iniciar sesión",
    );
  }

  const session =
    store.sessions.find(
      (
        item,
      ) =>
        item.token ===
        token,
    );

  if (
    !session
  ) {
    throw new HttpError(
      401,

      "Sesión inválida o expirada",
    );
  }

  /*
   * Comprobación adicional
   * por seguridad.
   */
  if (
    Number(
      session.expiresAt,
    ) <=
    Date.now()
  ) {
    revokeSession(
      token,
    );

    throw new HttpError(
      401,

      "Tu sesión expiró. Inicia sesión nuevamente",
    );
  }

  const user =
    store.users.find(
      (
        item,
      ) =>
        item.id ===
          session.userId &&
        item.active,
    );

  if (
    !user
  ) {
    revokeSession(
      token,
    );

    throw new HttpError(
      401,

      "El usuario ya no está disponible",
    );
  }

  req.authToken =
    token;

  req.session =
    session;

  req.user = {
    id:
      user.id,

    username:
      user.username,

    name:
      user.name,

    role:
      user.role,

    active:
      user.active,
  };

  next();
}

/*
 * ==========================================
 * ROLES
 * ==========================================
 */

export const requireRole =
  (
    ...roles
  ) =>
  (
    req,
    res,
    next,
  ) => {
    if (
      !req.user ||
      !roles.includes(
        req.user
          .role,
      )
    ) {
      throw new HttpError(
        403,

        "No tienes permisos para realizar esta operación",
      );
    }

    next();
  };