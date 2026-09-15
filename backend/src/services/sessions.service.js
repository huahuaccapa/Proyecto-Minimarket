import {
  randomBytes,
} from "node:crypto";

import {
  pool,
} from "../config/database.js";

/*
 * ==========================================
 * DURACIÓN DE LA SESIÓN
 * ==========================================
 *
 * 12 horas.
 */

export const SESSION_MS =
  12 *
  60 *
  60 *
  1000;

/*
 * No necesitamos borrar sesiones expiradas
 * en cada petición.
 *
 * Cada 15 minutos hacemos una limpieza.
 */

const CLEANUP_INTERVAL_MS =
  15 *
  60 *
  1000;

let lastCleanup =
  0;

/*
 * ==========================================
 * TOKEN
 * ==========================================
 */

function generateToken() {
  /*
   * 32 bytes en hexadecimal
   * producen exactamente 64 caracteres.
   *
   * Coincide con:
   *
   * sessions.token CHAR(64)
   */
  return randomBytes(32)
    .toString("hex");
}

/*
 * ==========================================
 * LIMPIAR SESIONES EXPIRADAS
 * ==========================================
 */

export async function cleanupExpiredSessions(
  force = false,
) {
  const now =
    Date.now();

  if (
    !force &&
    now - lastCleanup <
      CLEANUP_INTERVAL_MS
  ) {
    return;
  }

  lastCleanup =
    now;

  await pool.execute(
    `
    DELETE FROM sessions

    WHERE expires_at <= ?
    `,

    [
      new Date(now),
    ],
  );
}

/*
 * ==========================================
 * CREAR SESIÓN
 * ==========================================
 */

export async function createSession(
  userId,
) {
  await cleanupExpiredSessions(
    true,
  );

  const token =
    generateToken();

  const createdAt =
    new Date();

  const expiresAt =
    new Date(
      createdAt.getTime() +
        SESSION_MS,
    );

  await pool.execute(
    `
    INSERT INTO sessions
    (
      token,
      user_id,
      created_at,
      expires_at
    )

    VALUES (?, ?, ?, ?)
    `,

    [
      token,
      userId,
      createdAt,
      expiresAt,
    ],
  );

  return {
    token,
    userId,
    createdAt,
    expiresAt,
  };
}

/*
 * ==========================================
 * BUSCAR SESIÓN
 * ==========================================
 *
 * También recuperamos los datos del usuario
 * para evitar hacer dos consultas cada vez
 * que llega una petición autenticada.
 */

export async function findSessionWithUser(
  token,
) {
  if (!token) {
    return null;
  }

  const [
    rows,
  ] =
    await pool.execute(
      `
      SELECT
        s.token,

        s.user_id
          AS userId,

        s.created_at
          AS sessionCreatedAt,

        s.expires_at
          AS expiresAt,

        u.id,

        u.username,

        u.name,

        u.role,

        u.active

      FROM sessions s

      INNER JOIN users u
        ON u.id = s.user_id

      WHERE s.token = ?

      LIMIT 1
      `,

      [
        token,
      ],
    );

  const row =
    rows[0];

  if (!row) {
    return null;
  }

  return {
    token:
      row.token,

    userId:
      row.userId,

    createdAt:
      row.sessionCreatedAt,

    expiresAt:
      row.expiresAt,

    user: {
      id:
        row.id,

      username:
        row.username,

      name:
        row.name,

      role:
        row.role,

      active:
        Boolean(
          row.active,
        ),
    },
  };
}

/*
 * ==========================================
 * ELIMINAR SESIÓN
 * ==========================================
 */

export async function revokeSession(
  token,
) {
  if (!token) {
    return false;
  }

  const [
    result,
  ] =
    await pool.execute(
      `
      DELETE FROM sessions

      WHERE token = ?
      `,

      [
        token,
      ],
    );

  return (
    result.affectedRows >
    0
  );
}

/*
 * ==========================================
 * CERRAR TODAS LAS SESIONES DE UN USUARIO
 * ==========================================
 *
 * No se usa todavía desde la interfaz,
 * pero queda correctamente preparado para
 * cambio de contraseña / cierre global.
 */

export async function revokeAllUserSessions(
  userId,
) {
  if (!userId) {
    return 0;
  }

  const [
    result,
  ] =
    await pool.execute(
      `
      DELETE FROM sessions

      WHERE user_id = ?
      `,

      [
        userId,
      ],
    );

  return Number(
    result.affectedRows ||
      0,
  );
}