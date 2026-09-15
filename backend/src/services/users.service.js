import {
  pool,
} from "../config/database.js";

/*
 * ==========================================
 * CONVERTIR FILA MYSQL → USUARIO JS
 * ==========================================
 */

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id:
      row.id,

    username:
      row.username,

    name:
      row.name,

    passwordHash:
      row.passwordHash,

    role:
      row.role,

    active:
      Boolean(
        row.active,
      ),

    passwordUpdatedAt:
      row.passwordUpdatedAt ||
      null,

    createdAt:
      row.createdAt ||
      null,

    updatedAt:
      row.updatedAt ||
      null,
  };
}

/*
 * ==========================================
 * BUSCAR USUARIO POR USERNAME
 * ==========================================
 */

export async function findUserByUsername(
  username,
) {
  const normalized =
    String(
      username || "",
    )
      .trim()
      .toLowerCase();

  if (!normalized) {
    return null;
  }

  const [
    rows,
  ] =
    await pool.execute(
      `
      SELECT
        id,
        username,
        name,

        password_hash
          AS passwordHash,

        role,
        active,

        password_updated_at
          AS passwordUpdatedAt,

        created_at
          AS createdAt,

        updated_at
          AS updatedAt

      FROM users

      WHERE LOWER(username) = ?

      LIMIT 1
      `,

      [
        normalized,
      ],
    );

  return mapUser(
    rows[0],
  );
}

/*
 * ==========================================
 * BUSCAR USUARIO ACTIVO POR USERNAME
 * ==========================================
 */

export async function findActiveUserByUsername(
  username,
) {
  const user =
    await findUserByUsername(
      username,
    );

  if (
    !user ||
    !user.active
  ) {
    return null;
  }

  return user;
}

/*
 * ==========================================
 * BUSCAR USUARIO POR ID
 * ==========================================
 */

export async function findUserById(
  id,
) {
  if (!id) {
    return null;
  }

  const [
    rows,
  ] =
    await pool.execute(
      `
      SELECT
        id,
        username,
        name,

        password_hash
          AS passwordHash,

        role,
        active,

        password_updated_at
          AS passwordUpdatedAt,

        created_at
          AS createdAt,

        updated_at
          AS updatedAt

      FROM users

      WHERE id = ?

      LIMIT 1
      `,

      [
        id,
      ],
    );

  return mapUser(
    rows[0],
  );
}

/*
 * ==========================================
 * BUSCAR USUARIO ACTIVO POR ID
 * ==========================================
 */

export async function findActiveUserById(
  id,
) {
  const user =
    await findUserById(
      id,
    );

  if (
    !user ||
    !user.active
  ) {
    return null;
  }

  return user;
}

/*
 * ==========================================
 * ACTUALIZAR CONTRASEÑA
 * ==========================================
 *
 * Se usa principalmente cuando encontramos
 * una contraseña SHA-256 antigua y queremos
 * migrarla automáticamente a scrypt.
 */

export async function updatePasswordHash(
  userId,
  passwordHash,
) {
  const now =
    new Date();

  const [
    result,
  ] =
    await pool.execute(
      `
      UPDATE users

      SET
        password_hash = ?,
        password_updated_at = ?,
        updated_at = ?

      WHERE id = ?
      `,

      [
        passwordHash,
        now,
        now,
        userId,
      ],
    );

  return (
    result.affectedRows >
    0
  );
}

/*
 * ==========================================
 * USUARIO SEGURO PARA FRONTEND
 * ==========================================
 *
 * Nunca enviamos passwordHash.
 */

export function safeUser(
  user,
) {
  if (!user) {
    return null;
  }

  return {
    id:
      user.id,

    username:
      user.username,

    name:
      user.name,

    role:
      user.role,

    active:
      Boolean(
        user.active,
      ),
  };
}